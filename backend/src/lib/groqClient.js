import axios from "axios";

export const GROQ_BASE_URL =
  process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";

/**
 * Groq API keys are non-empty strings; production keys typically start with "gsk_".
 * @param {string | undefined} apiKey
 * @returns {string}
 */
export function assertGroqApiKey(apiKey) {
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    const err = new Error("Missing or invalid Groq API key. Send Authorization: Bearer <key>.");
    err.statusCode = 401;
    err.code = "INVALID_API_KEY";
    throw err;
  }
  const trimmed = apiKey.trim();
  if (trimmed.length < 10) {
    const err = new Error("Groq API key looks too short.");
    err.statusCode = 401;
    err.code = "INVALID_API_KEY";
    throw err;
  }
  return trimmed;
}

/**
 * Read Bearer token from Authorization header.
 * @param {import('express').Request} req
 * @returns {string}
 */
export function getBearerApiKey(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== "string") {
    const err = new Error("Missing Authorization header (Bearer <GROQ_API_KEY>).");
    err.statusCode = 401;
    err.code = "MISSING_AUTH";
    throw err;
  }
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const err = new Error("Authorization must be: Bearer <GROQ_API_KEY>.");
    err.statusCode = 401;
    err.code = "INVALID_AUTH_SCHEME";
    throw err;
  }
  return assertGroqApiKey(match[1]);
}

/**
 * Axios instance for Groq JSON endpoints (non-streaming).
 * @param {string} apiKey
 */
export function createGroqJsonClient(apiKey) {
  const key = assertGroqApiKey(apiKey);
  return axios.create({
    baseURL: GROQ_BASE_URL,
    timeout: 120_000,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    validateStatus: () => true,
  });
}
