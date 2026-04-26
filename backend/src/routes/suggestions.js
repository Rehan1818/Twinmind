import express from "express";
import { getBearerApiKey, createGroqJsonClient } from "../lib/groqClient.js";
import {
  MODEL_CHAT,
  DEFAULT_SUGGESTIONS_SYSTEM,
  DEFAULT_SUGGESTIONS_CONTEXT_CHARS,
  clipTranscript,
} from "../lib/prompts.js";
import { parseSuggestionsJson } from "../lib/responseParsers.js";

const router = express.Router();

/**
 * POST /api/suggestions
 * JSON body: { transcript: string | string[], systemPrompt?: string, contextChars?: number }
 */
router.post("/", express.json({ limit: "2mb" }), async (req, res, next) => {
  try {
    const apiKey = getBearerApiKey(req);

    // Accept array or string from frontend
    const rawTranscript = req.body.transcript;
    const transcript = Array.isArray(rawTranscript)
      ? rawTranscript.join("\n")
      : typeof rawTranscript === "string"
      ? rawTranscript
      : "";

    const systemPrompt =
      typeof req.body.systemPrompt === "string" && req.body.systemPrompt.trim()
        ? req.body.systemPrompt.trim()
        : DEFAULT_SUGGESTIONS_SYSTEM;
    const contextChars = Number.isFinite(Number(req.body.contextChars))
      ? Math.min(Math.max(Number(req.body.contextChars), 500), 100_000)
      : DEFAULT_SUGGESTIONS_CONTEXT_CHARS;
    const temperature = Number.isFinite(Number(req.body.temperature))
      ? Math.min(Math.max(Number(req.body.temperature), 0), 1.5)
      : 0.55;
    const maxTokens = Number.isFinite(Number(req.body.maxTokens))
      ? Math.min(Math.max(Number(req.body.maxTokens), 128), 2048)
      : 1024;

    const clipped = clipTranscript(transcript, contextChars);
    if (!clipped.trim()) {
      const err = new Error("transcript is required (non-empty string).");
      err.statusCode = 400;
      err.code = "MISSING_TRANSCRIPT";
      throw err;
    }

    const client = createGroqJsonClient(apiKey);
    const startedAt = Date.now();

    const completion = await client.post("/chat/completions", {
      model: MODEL_CHAT,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" }, // ← forces pure JSON, no markdown
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user", 
          content: `Return a JSON object with a suggestions array.\n\nTranscript (most recent last):\n\n${clipped}`,
        },
      ],
    });

    if (completion.status >= 400) {
      const msg =
        (completion.data && (completion.data.error?.message || completion.data.message)) ||
        `Groq chat failed (${completion.status})`;
      const err = new Error(msg);
      err.statusCode = 400;
      err.code = "GROQ_CHAT_ERROR";
      err.details = completion.data;
      throw err;
    }

    const raw =
      completion.data?.choices?.[0]?.message?.content ||
      completion.data?.choices?.[0]?.delta?.content ||
      "";
    if (!raw || typeof raw !== "string") {
      const err = new Error("Empty completion from Groq.");
      err.statusCode = 502;
      err.code = "EMPTY_COMPLETION";
      throw err;
    }

    let suggestions;
    try {
      suggestions = parseSuggestionsJson(raw);
    } catch (parseErr) {
      const err = new Error(`Failed to parse model JSON: ${parseErr.message}`);
      err.statusCode = 502;
      err.code = "SUGGESTIONS_PARSE_ERROR";
      err.raw = raw.slice(0, 8000);
      throw err;
    }

    res.json({
      model: MODEL_CHAT,
      suggestions,
      metadata: {
        createdAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
        contextCharsUsed: clipped.length,
        temperature,
        maxTokens,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;