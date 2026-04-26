import express from "express";
import {
  MODEL_CHAT,
  MODEL_WHISPER,
  DEFAULT_SUGGESTIONS_CONTEXT_CHARS,
  DEFAULT_EXPANDED_ANSWER_CONTEXT_CHARS,
  DEFAULT_CHAT_CONTEXT_CHARS,
  DEFAULT_SUGGESTIONS_SYSTEM,
  DEFAULT_EXPANDED_ANSWER_SYSTEM,
  DEFAULT_CHAT_SYSTEM,
} from "../lib/prompts.js";

const router = express.Router();

router.get("/defaults", (req, res) => {
  res.json({
    models: {
      transcription: MODEL_WHISPER,
      generation: MODEL_CHAT,
    },
    contextWindows: {
      suggestionsChars: DEFAULT_SUGGESTIONS_CONTEXT_CHARS,
      expandedAnswerChars: DEFAULT_EXPANDED_ANSWER_CONTEXT_CHARS,
      chatChars: DEFAULT_CHAT_CONTEXT_CHARS,
    },
    prompts: {
      suggestions: DEFAULT_SUGGESTIONS_SYSTEM,
      expandedAnswer: DEFAULT_EXPANDED_ANSWER_SYSTEM,
      chat: DEFAULT_CHAT_SYSTEM,
    },
    generationDefaults: {
      suggestions: { temperature: 0.55, maxTokens: 1024 },
      chat: { temperature: 0.5, maxTokens: 2048 },
      expanded: { temperature: 0.45, maxTokens: 2048 },
    },
  });
});

export default router;
