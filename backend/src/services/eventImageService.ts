import OpenAI from 'openai';
import http from 'http';
import https from 'https';

interface EventImageInput {
  title: string;
  description: string;
  location: string;
  date: Date | string;
  maxAttendees: number;
}

interface EventImageResult {
  bannerImage: string;
  imageSource: 'ai' | 'local' | 'fallback';
  imagePrompt: string;
}

type EventTheme = 'gala' | 'tech' | 'business' | 'community' | 'academic' | 'default';

type ThemeStyle = {
  backgroundStart: string;
  backgroundMid: string;
  backgroundEnd: string;
  accent: string;
  glow: string;
};

const escapeSvgText = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const buildPrompt = (input: EventImageInput): string => {
  const eventDate = new Date(input.date);
  const formattedDate = Number.isNaN(eventDate.getTime()) ? String(input.date) : eventDate.toDateString();

  return [
    'Create a themed event hero banner image with a realistic, premium visual style.',
    'No text, no logos, no watermarks, no typography in the image.',
    'Use a cinematic composition that clearly matches the event purpose and mood.',
    `Event title: ${input.title}`,
    `Description: ${input.description}`,
    `Venue: ${input.location}`,
    `Date: ${formattedDate}`,
    `Expected attendees: ${input.maxAttendees}`,
    'Aspect ratio: wide landscape (about 3:2).',
    'Make this suitable as a web event card hero banner.'
  ].join(' ');
};

const inferTheme = (input: EventImageInput): EventTheme => {
  const text = `${input.title} ${input.description} ${input.location}`.toLowerCase();

  if (/(ball|gala|awards|banquet|dinner|celebration|formal)/.test(text)) {
    return 'gala';
  }

  if (/(tech|ai|software|coding|developer|hackathon|data)/.test(text)) {
    return 'tech';
  }

  if (/(career|network|business|entrepreneur|leadership|summit|conference)/.test(text)) {
    return 'business';
  }

  if (/(service|volunteer|outreach|charity|community|social)/.test(text)) {
    return 'community';
  }

  if (/(lecture|seminar|workshop|research|education|academic|training)/.test(text)) {
    return 'academic';
  }

  return 'default';
};

const themeStyle: Record<EventTheme, ThemeStyle> = {
  gala: {
    backgroundStart: '#14213d',
    backgroundMid: '#5a189a',
    backgroundEnd: '#264653',
    accent: '#f4d35e',
    glow: 'rgba(244,211,94,0.22)'
  },
  tech: {
    backgroundStart: '#0b132b',
    backgroundMid: '#1c2541',
    backgroundEnd: '#3a86ff',
    accent: '#00f5d4',
    glow: 'rgba(0,245,212,0.2)'
  },
  business: {
    backgroundStart: '#1f2937',
    backgroundMid: '#374151',
    backgroundEnd: '#4b5563',
    accent: '#f59e0b',
    glow: 'rgba(245,158,11,0.2)'
  },
  community: {
    backgroundStart: '#064e3b',
    backgroundMid: '#0f766e',
    backgroundEnd: '#155e75',
    accent: '#34d399',
    glow: 'rgba(52,211,153,0.2)'
  },
  academic: {
    backgroundStart: '#1e3a8a',
    backgroundMid: '#4338ca',
    backgroundEnd: '#1d4ed8',
    accent: '#93c5fd',
    glow: 'rgba(147,197,253,0.2)'
  },
  default: {
    backgroundStart: '#1f6feb',
    backgroundMid: '#5f2c82',
    backgroundEnd: '#49a09d',
    accent: '#e5e7eb',
    glow: 'rgba(229,231,235,0.2)'
  }
};

const buildFallbackBanner = (input: EventImageInput): string => {
  const theme = inferTheme(input);
  const style = themeStyle[theme];
  const eventDate = new Date(input.date);
  const displayDate = Number.isNaN(eventDate.getTime())
    ? String(input.date).slice(0, 40)
    : eventDate.toDateString();

  const safeTitle = escapeSvgText(input.title.slice(0, 80));
  const safeLocation = escapeSvgText(input.location.slice(0, 50));
  const safeAttendance = escapeSvgText(`${input.maxAttendees} attendees`);
  const safeTheme = escapeSvgText(theme.toUpperCase());
  const safeDate = escapeSvgText(displayDate);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="${safeTitle}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${style.backgroundStart}" />
      <stop offset="55%" stop-color="${style.backgroundMid}" />
      <stop offset="100%" stop-color="${style.backgroundEnd}" />
    </linearGradient>
    <filter id="blur">
      <feGaussianBlur stdDeviation="38" />
    </filter>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)" />
  <circle cx="980" cy="110" r="220" fill="${style.glow}" filter="url(#blur)" />
  <circle cx="200" cy="560" r="250" fill="${style.glow}" filter="url(#blur)" />
  <rect x="72" y="82" width="1056" height="510" rx="30" fill="rgba(0,0,0,0.23)" />
  <rect x="72" y="82" width="12" height="510" fill="${style.accent}" />
  <text x="118" y="180" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="2">${safeTheme} EVENT</text>
  <text x="118" y="252" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="64" font-weight="700">${safeTitle}</text>
  <text x="118" y="325" fill="#e5e7eb" font-family="Segoe UI, Arial, sans-serif" font-size="38">${safeLocation}</text>
  <text x="118" y="380" fill="#d1d5db" font-family="Segoe UI, Arial, sans-serif" font-size="28">${safeDate}</text>
  <text x="118" y="440" fill="${style.accent}" font-family="Segoe UI, Arial, sans-serif" font-size="33" font-weight="600">Capacity: ${safeAttendance}</text>
</svg>`;

  const encoded = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
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
            reject(new Error(`Local image service returned status ${res.statusCode || 'unknown'}`));
            return;
          }

          try {
            resolve(body ? JSON.parse(body) : {});
          } catch {
            reject(new Error('Local image service returned invalid JSON'));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('Local image request timed out'));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

const generateWithLocalStableDiffusion = async (prompt: string): Promise<string | null> => {
  const endpoint = process.env.LOCAL_SD_API_URL || 'http://127.0.0.1:7860/sdapi/v1/txt2img';
  const timeoutMs = Number(process.env.LOCAL_SD_TIMEOUT_MS || '45000');
  const steps = Number(process.env.LOCAL_SD_STEPS || '24');
  const cfgScale = Number(process.env.LOCAL_SD_CFG_SCALE || '7');
  const width = Number(process.env.LOCAL_SD_WIDTH || '1024');
  const height = Number(process.env.LOCAL_SD_HEIGHT || '576');
  const samplerName = process.env.LOCAL_SD_SAMPLER || 'DPM++ 2M Karras';
  const modelCheckpoint = process.env.LOCAL_SD_MODEL || '';

  const payload: Record<string, unknown> = {
    prompt,
    negative_prompt: 'text, letters, words, logo, watermark, blurry, low quality, deformed',
    steps,
    cfg_scale: cfgScale,
    width,
    height,
    batch_size: 1,
    n_iter: 1
  };

  if (samplerName) {
    payload.sampler_name = samplerName;
  }

  if (modelCheckpoint) {
    payload.override_settings = {
      sd_model_checkpoint: modelCheckpoint
    };
  }

  try {
    const response = await postJson(endpoint, payload, timeoutMs);
    const b64 = response?.images?.[0];

    if (!b64 || typeof b64 !== 'string') {
      throw new Error('Missing image data');
    }

    return `data:image/png;base64,${b64}`;
  } catch (error: any) {
    console.warn('[eventImageService] Local SD primary request failed:', error?.message || error);
    // Retry with a lightweight CPU-safe request to reduce local runtime failures.
    const retryWidth = Math.min(width || 256, 192);
    const retryHeight = Math.min(height || 128, 96);
    const retryTimeoutMs = Math.min(Math.max(Math.floor(timeoutMs * 0.6), 30000), 90000);
    const retryPayload: Record<string, unknown> = {
      prompt,
      negative_prompt: 'text, letters, words, logo, watermark, blurry, low quality, deformed',
      steps: Math.min(steps || 3, 2),
      cfg_scale: Math.min(cfgScale || 5, 4),
      width: retryWidth,
      height: retryHeight,
      batch_size: 1,
      n_iter: 1,
      sampler_name: 'Euler a',
      override_settings: {
        randn_source: 'CPU'
      }
    };

    if (modelCheckpoint) {
      retryPayload.override_settings = {
        randn_source: 'CPU',
        sd_model_checkpoint: modelCheckpoint
      };
    }

    try {
      const retryResponse = await postJson(endpoint, retryPayload, retryTimeoutMs);
      const retryB64 = retryResponse?.images?.[0];
      if (retryB64 && typeof retryB64 === 'string') {
        return `data:image/png;base64,${retryB64}`;
      }
    } catch (retryError: any) {
      console.warn('[eventImageService] Local SD retry request failed:', retryError?.message || retryError);
      // Intentionally swallow and fall back to deterministic SVG.
    }

    return null;
  }
};

export const generateEventBannerImage = async (input: EventImageInput): Promise<EventImageResult> => {
  const imagePrompt = buildPrompt(input);
  const provider = (process.env.EVENT_IMAGE_PROVIDER || 'openai').toLowerCase();
  const apiKey = process.env.OPENAI_API_KEY;

  if (provider === 'fallback') {
    return {
      bannerImage: buildFallbackBanner(input),
      imageSource: 'fallback',
      imagePrompt
    };
  }

  if (provider === 'local') {
    const localImage = await generateWithLocalStableDiffusion(imagePrompt);

    if (localImage) {
      return {
        bannerImage: localImage,
        imageSource: 'local',
        imagePrompt
      };
    }

    return {
      bannerImage: buildFallbackBanner(input),
      imageSource: 'fallback',
      imagePrompt
    };
  }

  if (!apiKey) {
    return {
      bannerImage: buildFallbackBanner(input),
      imageSource: 'fallback',
      imagePrompt
    };
  }

  try {
    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
    const quality = (process.env.OPENAI_IMAGE_QUALITY || 'high') as 'low' | 'medium' | 'high' | 'auto';
    const size = (process.env.OPENAI_IMAGE_SIZE || '1536x1024') as 'auto' | '1024x1024' | '1536x1024' | '1024x1536';
    const outputFormat = (process.env.OPENAI_IMAGE_OUTPUT_FORMAT || 'png') as 'png' | 'jpeg' | 'webp';
    const background = (process.env.OPENAI_IMAGE_BACKGROUND || 'auto') as 'transparent' | 'opaque' | 'auto';
    const moderation = (process.env.OPENAI_IMAGE_MODERATION || 'auto') as 'low' | 'auto';

    const imageResult = await client.images.generate({
      model,
      prompt: imagePrompt,
      quality,
      size,
      output_format: outputFormat,
      background,
      moderation,
      n: 1
    });

    const first = imageResult.data?.[0];
    if (first?.b64_json) {
      const mime = outputFormat === 'jpeg' ? 'jpeg' : outputFormat;
      return {
        bannerImage: `data:image/${mime};base64,${first.b64_json}`,
        imageSource: 'ai',
        imagePrompt
      };
    }

    if (first?.url) {
      return {
        bannerImage: first.url,
        imageSource: 'ai',
        imagePrompt
      };
    }
  } catch {
    // Fall through to deterministic SVG fallback.
  }

  return {
    bannerImage: buildFallbackBanner(input),
    imageSource: 'fallback',
    imagePrompt
  };
};
