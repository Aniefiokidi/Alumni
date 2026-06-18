import OpenAI from 'openai';
import { IMessage } from '../models/Message';
import Message from '../models/Message';
import http from 'http';
import https from 'https';

type ReplyTone = 'professional' | 'friendly' | 'concise';
type MessageIntent = 'greeting' | 'question' | 'request' | 'follow-up' | 'complaint' | 'general';
type MessageTone = 'casual' | 'neutral' | 'formal' | 'urgent';
type ClassificationSource = 'local' | 'rules';

export interface ReplyDraftOptions {
  tone?: ReplyTone;
  maxWords?: number;
}

interface ReplyDraftResult {
  draft: string;
  appliedTone: ReplyTone;
  detectedIntent: MessageIntent;
  detectedTone: MessageTone;
  conversationTone: MessageTone;
  classificationSource: ClassificationSource;
  styleExampleCount: number;
  source: 'openai' | 'fallback';
}

interface MessageClassification {
  intent: MessageIntent;
  tone: MessageTone;
  source: ClassificationSource;
}

interface StyleExample {
  score: number;
  text: string;
}

const VALID_INTENTS: MessageIntent[] = ['greeting', 'question', 'request', 'follow-up', 'complaint', 'general'];
const VALID_TONES: MessageTone[] = ['casual', 'neutral', 'formal', 'urgent'];

const inferIntentFromMessage = (text: string): MessageIntent => {
  const input = (text || '').trim().toLowerCase();
  if (!input) {
    return 'general';
  }

  const greetingPatterns = [
    "what's up",
    'whats up',
    'hey',
    'hello',
    'hi',
    'yo',
    'sup'
  ];

  const normalized = input.replace(/[!?.,]/g, '').trim();

  if (greetingPatterns.includes(normalized)) {
    return 'greeting';
  }

  if (greetingPatterns.some((pattern) => normalized === pattern || normalized.startsWith(`${pattern} `))) {
    return 'greeting';
  }

  if (
    normalized.includes('?') ||
    /(can you|could you|would you|do you|did you|is it|are we|when|where|what|why|how)/.test(normalized)
  ) {
    return 'question';
  }

  if (/(please|kindly|need|help|assist|send|share|review|approve|provide)/.test(normalized)) {
    return 'request';
  }

  if (/(follow up|following up|just checking|any update|update on)/.test(normalized)) {
    return 'follow-up';
  }

  if (/(issue|problem|error|not working|delay|disappointed|frustrated|complain)/.test(normalized)) {
    return 'complaint';
  }

  return 'general';
};

const inferToneFromMessage = (text: string): MessageTone => {
  const input = (text || '').trim();
  const lowered = input.toLowerCase();

  if (!lowered) {
    return 'neutral';
  }

  const urgentPattern = /(asap|urgent|immediately|right away|now|today|!!!)/;
  if (urgentPattern.test(lowered)) {
    return 'urgent';
  }

  const casualPattern = /(hey|yo|sup|what's up|whats up|lol|pls|thx|thanks!)/;
  if (casualPattern.test(lowered)) {
    return 'casual';
  }

  const formalPattern = /(dear|kindly|regards|sincerely|appreciate|would like to|please be informed)/;
  if (formalPattern.test(lowered)) {
    return 'formal';
  }

  if (input.length < 40) {
    return 'casual';
  }

  return 'neutral';
};

const classifyWithRules = (text: string): MessageClassification => {
  return {
    intent: inferIntentFromMessage(text),
    tone: inferToneFromMessage(text),
    source: 'rules'
  };
};

const postJson = (urlString: string, payload: Record<string, unknown>, timeoutMs: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlString);
    const data = JSON.stringify(payload);
    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: timeoutMs
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`Classifier returned status ${res.statusCode || 'unknown'}`));
            return;
          }

          try {
            resolve(body ? JSON.parse(body) : {});
          } catch {
            reject(new Error('Classifier returned invalid JSON'));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('Classifier request timed out'));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

const classifyWithLocalEndpoint = async (text: string): Promise<MessageClassification | null> => {
  const url = process.env.LOCAL_CLASSIFIER_URL;
  if (!url) {
    return null;
  }

  const timeoutMs = Number(process.env.LOCAL_CLASSIFIER_TIMEOUT_MS || '2000');

  try {
    const response = await postJson(url, { text }, timeoutMs);
    const intent = String(response?.intent || '').toLowerCase() as MessageIntent;
    const tone = String(response?.tone || '').toLowerCase() as MessageTone;

    if (!VALID_INTENTS.includes(intent) || !VALID_TONES.includes(tone)) {
      return null;
    }

    return {
      intent,
      tone,
      source: 'local'
    };
  } catch {
    return null;
  }
};

const classifyMessage = async (text: string): Promise<MessageClassification> => {
  const local = await classifyWithLocalEndpoint(text);
  if (local) {
    return local;
  }

  return classifyWithRules(text);
};

const toneToReplyTone = (tone: MessageTone, intent: MessageIntent): ReplyTone => {
  if (intent === 'greeting') {
    return 'friendly';
  }

  if (tone === 'casual') {
    return 'friendly';
  }

  if (tone === 'urgent') {
    return 'concise';
  }

  if (tone === 'formal') {
    return 'professional';
  }

  return 'professional';
};

const getObjectIdString = (value: any): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value._id) {
    return String(value._id);
  }

  return String(value);
};

const tokenize = (text: string): string[] => {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
};

const lexicalCosineSimilarity = (a: string, b: string): number => {
  const vecA = new Map<string, number>();
  const vecB = new Map<string, number>();

  tokenize(a).forEach((token) => vecA.set(token, (vecA.get(token) || 0) + 1));
  tokenize(b).forEach((token) => vecB.set(token, (vecB.get(token) || 0) + 1));

  let dot = 0;
  let normA = 0;
  let normB = 0;

  vecA.forEach((value, key) => {
    normA += value * value;
    dot += value * (vecB.get(key) || 0);
  });

  vecB.forEach((value) => {
    normB += value * value;
  });

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const vectorCosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const getEmbedding = async (client: OpenAI, text: string): Promise<number[] | null> => {
  try {
    const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
    const result = await client.embeddings.create({
      model: embeddingModel,
      input: text
    });

    return result.data[0]?.embedding || null;
  } catch {
    return null;
  }
};

const buildStyleExamples = async (
  message: IMessage,
  currentUserId: string,
  client?: OpenAI
): Promise<StyleExample[]> => {
  const senderId = getObjectIdString(message.sender);
  const receiverId = getObjectIdString(message.receiver);

  if (!senderId || !receiverId || !currentUserId) {
    return [];
  }

  const otherPartyId = currentUserId === senderId ? receiverId : senderId;
  const previousReplies = await Message.find({
    sender: currentUserId,
    receiver: otherPartyId
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('message')
    .lean();

  if (previousReplies.length === 0) {
    return [];
  }

  const targetText = `${message.subject || ''} ${message.message || ''}`.trim();
  let targetEmbedding: number[] | null = null;

  if (client) {
    targetEmbedding = await getEmbedding(client, targetText);
  }

  const scored = await Promise.all(
    previousReplies.map(async (reply) => {
      const replyText = String(reply.message || '');
      let score = lexicalCosineSimilarity(targetText, replyText);

      if (client && targetEmbedding) {
        const replyEmbedding = await getEmbedding(client, replyText);
        if (replyEmbedding) {
          score = vectorCosineSimilarity(targetEmbedding, replyEmbedding);
        }
      }

      return {
        score,
        text: replyText
      };
    })
  );

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter((item) => item.score > 0.01);
};

const getConversationTone = async (message: IMessage): Promise<MessageTone> => {
  const senderId = getObjectIdString(message.sender);
  const receiverId = getObjectIdString(message.receiver);

  if (!senderId || !receiverId) {
    return 'neutral';
  }

  const recentMessages = await Message.find({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(12)
    .select('message')
    .lean();

  if (recentMessages.length === 0) {
    return 'neutral';
  }

  const counts: Record<MessageTone, number> = {
    casual: 0,
    neutral: 0,
    formal: 0,
    urgent: 0
  };

  recentMessages.forEach((msg) => {
    const tone = inferToneFromMessage(msg.message || '');
    counts[tone] += 1;
  });

  return (Object.keys(counts) as MessageTone[]).reduce((best, current) =>
    counts[current] > counts[best] ? current : best
  );
};

const buildFallbackDraft = (message: IMessage, tone: ReplyTone, intent: MessageIntent): string => {
  const senderName = (message.sender as any)?.name || 'there';
  const subject = message.subject || 'your message';

  if (intent === 'greeting') {
    if (tone === 'concise') {
      return `Hi ${senderName},\n\nI'm doing well, thanks for checking in. How are you doing?`;
    }

    return `Hi ${senderName},\n\nI'm good, thanks for checking in. What's up with you?`;
  }

  if (tone === 'concise') {
    return `Hi ${senderName},\n\nThank you for your message regarding "${subject}." I appreciate the update and will get back to you shortly with next steps.\n\nBest regards,`;
  }

  if (tone === 'friendly') {
    return `Hi ${senderName},\n\nThanks so much for reaching out about "${subject}." I appreciate you taking the time to share this. I'll review it and follow up soon.\n\nWarm regards,`;
  }

  return `Dear ${senderName},\n\nThank you for your message regarding "${subject}." I appreciate the information provided and will review it carefully. I will follow up with you shortly on the next steps.\n\nKind regards,`;
};

export const generateReplyDraft = async (
  message: IMessage,
  currentUserId: string,
  options?: ReplyDraftOptions
): Promise<ReplyDraftResult> => {
  const classification = await classifyMessage(message.message || '');
  const intent = classification.intent;
  const detectedTone = classification.tone;
  const conversationTone = await getConversationTone(message);
  const resolvedSourceTone = conversationTone !== 'neutral' ? conversationTone : detectedTone;
  const tone = options?.tone || toneToReplyTone(resolvedSourceTone, intent);
  const maxWords = options?.maxWords || 120;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return {
      draft: buildFallbackDraft(message, tone, intent),
      appliedTone: tone,
      detectedIntent: intent,
      detectedTone,
      conversationTone,
      classificationSource: classification.source,
      styleExampleCount: 0,
      source: 'fallback'
    };
  }

  try {
    const client = new OpenAI({ apiKey });
    const styleExamples = await buildStyleExamples(message, currentUserId, client);

    const senderName = (message.sender as any)?.name || 'the sender';
    const styleInstruction = intent === 'greeting'
      ? 'Write a short, natural chat-style reply (1-2 sentences) and avoid formal sign-offs.'
      : 'Write a clear email-style reply draft.';

    const styleExamplesBlock = styleExamples.length > 0
      ? [
          'Style examples from your previous replies to this person (use as style guide, do not copy verbatim):',
          ...styleExamples.map((example, index) => `${index + 1}. ${example.text.slice(0, 240)}`)
        ].join('\n')
      : 'No prior style examples available.';

    const prompt = [
      `Write a ${tone} reply.`,
      styleInstruction,
      'Match the sender\'s tone and level of formality from the original message while staying respectful.',
      `Keep it under ${maxWords} words.`,
      'Use clear, polite language suitable for alumni communication.',
      'Do not invent facts; acknowledge receipt and suggest follow-up when appropriate.',
      'If the message is casual, the reply should be warm and natural, not overly formal.',
      `Detected intent: ${intent}`,
      `Detected sender tone: ${detectedTone}`,
      `Conversation tone trend: ${conversationTone}`,
      '',
      `Original subject: ${message.subject}`,
      `From: ${senderName}`,
      `Message: ${message.message}`,
      '',
      styleExamplesBlock,
      '',
      'Important: mirror style and level of directness from the examples when appropriate.'
    ].join('\n');

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: 'You are a professional assistant writing concise, respectful alumni communication drafts.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const draft = completion.choices[0]?.message?.content?.trim();

    if (!draft) {
      return {
        draft: buildFallbackDraft(message, tone, intent),
        appliedTone: tone,
        detectedIntent: intent,
        detectedTone,
        conversationTone,
        classificationSource: classification.source,
        styleExampleCount: styleExamples.length,
        source: 'fallback'
      };
    }

    return {
      draft,
      appliedTone: tone,
      detectedIntent: intent,
      detectedTone,
      conversationTone,
      classificationSource: classification.source,
      styleExampleCount: styleExamples.length,
      source: 'openai'
    };
  } catch (error) {
    return {
      draft: buildFallbackDraft(message, tone, intent),
      appliedTone: tone,
      detectedIntent: intent,
      detectedTone,
      conversationTone,
      classificationSource: classification.source,
      styleExampleCount: 0,
      source: 'fallback'
    };
  }
};