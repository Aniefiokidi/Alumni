from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
import os

app = FastAPI(title="Alumni Local Classifier")

intent_labels = ["greeting", "question", "request", "follow-up", "complaint", "general"]
tone_labels = ["casual", "neutral", "formal", "urgent"]

# Zero-shot is simple to plug in and works reasonably well without custom training.
# Use a lighter model by default for faster startup on local machines.
CLASSIFIER_MODEL = os.getenv("CLASSIFIER_MODEL", "valhalla/distilbart-mnli-12-1")
ENABLE_TRANSFORMERS = os.getenv("ENABLE_TRANSFORMERS", "true").lower() == "true"
_zero_shot = None


def _get_pipeline():
    global _zero_shot
    if not ENABLE_TRANSFORMERS:
        return None
    if _zero_shot is None:
        _zero_shot = pipeline("zero-shot-classification", model=CLASSIFIER_MODEL)
    return _zero_shot


def _rule_intent(text: str) -> str:
    t = text.lower().strip()
    if t in {"hi", "hello", "hey", "whats up", "what's up", "yo", "sup"}:
        return "greeting"
    if "?" in t or any(x in t for x in ["can you", "could you", "would you", "how", "why", "what", "when"]):
        return "question"
    if any(x in t for x in ["please", "kindly", "need", "help", "send", "share", "review", "provide"]):
        return "request"
    if any(x in t for x in ["follow up", "following up", "any update", "just checking"]):
        return "follow-up"
    if any(x in t for x in ["issue", "problem", "error", "not working", "complain", "frustrated"]):
        return "complaint"
    return "general"


def _rule_tone(text: str) -> str:
    t = text.lower().strip()
    if any(x in t for x in ["asap", "urgent", "immediately", "right away", "!!!"]):
        return "urgent"
    if any(x in t for x in ["hey", "yo", "sup", "what's up", "whats up", "lol", "pls", "thx"]):
        return "casual"
    if any(x in t for x in ["dear", "kindly", "sincerely", "regards", "please be informed"]):
        return "formal"
    return "neutral"


class ClassifyInput(BaseModel):
    text: str


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.post("/classify")
def classify(payload: ClassifyInput) -> dict:
    text = (payload.text or "").strip()

    if not text:
        return {
            "intent": "general",
            "tone": "neutral",
            "intent_score": 0.0,
            "tone_score": 0.0,
        }

    try:
        zero_shot = _get_pipeline()
        if zero_shot is None:
            raise RuntimeError("Transformer classifier disabled")

        intent_result = zero_shot(text, candidate_labels=intent_labels, multi_label=False)
        tone_result = zero_shot(text, candidate_labels=tone_labels, multi_label=False)

        intent = intent_result["labels"][0]
        tone = tone_result["labels"][0]
        intent_score = float(intent_result["scores"][0])
        tone_score = float(tone_result["scores"][0])
    except Exception:
        intent = _rule_intent(text)
        tone = _rule_tone(text)
        intent_score = 0.6
        tone_score = 0.6

    return {
        "intent": intent,
        "tone": tone,
        "intent_score": intent_score,
        "tone_score": tone_score,
    }
