const ALLOWED_TYPES = new Set([
  "question",
  "talking_point",
  "answer",
  "fact_check",
  "clarify",
]);

function normalizeType(type) {
  const normalized = String(type || "").trim().toLowerCase();
  return ALLOWED_TYPES.has(normalized) ? normalized : "talking_point";
}

/**
 * Parse model JSON into exactly 3 suggestions.
 * Handles markdown fences, bold markers, and other LLM formatting noise.
 * @param {string} raw
 * @returns {Array<{id: string, type: string, title: string, preview: string, detail: string}>}
 */
export function parseSuggestionsJson(raw) {
  let cleaned = String(raw || "").trim();

  // Strip markdown code fences ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/```json\s*/gi, "").replace(/```\s*/gi, "");

  // Strip bold/italic markdown markers ** and *
  cleaned = cleaned.replace(/\*\*/g, "").replace(/\*/g, "");

  // Strip leading prose before the JSON object (e.g. "Here are suggestions:\n{...")
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let jsonStart = -1;

  if (firstBrace === -1 && firstBracket === -1) {
    throw new Error(`No JSON found in model response: ${raw.slice(0, 200)}`);
  } else if (firstBrace === -1) {
    jsonStart = firstBracket;
  } else if (firstBracket === -1) {
    jsonStart = firstBrace;
  } else {
    jsonStart = Math.min(firstBrace, firstBracket);
  }

  // Find matching end — last } or ]
  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");
  const jsonEnd = Math.max(lastBrace, lastBracket);

  if (jsonEnd < jsonStart) {
    throw new Error(`Malformed JSON in model response: ${raw.slice(0, 200)}`);
  }

  const slice = cleaned.slice(jsonStart, jsonEnd + 1);
  const parsed = JSON.parse(slice);

  // Handle both { suggestions: [] } and bare []
  const rawSuggestions = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.suggestions)
    ? parsed.suggestions
    : null;

  if (!rawSuggestions) {
    throw new Error("Model response missing suggestions array");
  }

  const out = rawSuggestions.slice(0, 3).map((item, index) => ({
    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id.trim()
        : `s-${Date.now()}-${index}`,
    type: normalizeType(item.type),
    title: String(item.title || "Suggestion").slice(0, 120),
    preview: String(item.preview || "").slice(0, 400),
    detail: String(item.detail || "").slice(0, 4000),
  }));

  // Pad to 3 if model returned fewer
  while (out.length < 3) {
    out.push({
      id: `placeholder-${out.length}`,
      type: "clarify",
      title: "Continue listening",
      preview: "Not enough signal in the last chunk; keep speaking and refresh again.",
      detail:
        "The model returned fewer than 3 items; prompt can be tuned or retried.",
    });
  }

  return out.slice(0, 3);
}