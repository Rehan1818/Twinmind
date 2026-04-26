# TwinMind backend

Express API that proxies **Groq** for:

- **Whisper Large V3** — `POST /api/transcribe`
- **openai/gpt-oss-120b** — `POST /api/suggestions` (3 JSON cards) and `POST /api/chat` (SSE stream)

## Setup

```bash
cd backend
npm install
npm run dev
```

Optional `.env`:

- `PORT` — default `5001`
- `GROQ_BASE_URL` — default `https://api.groq.com/openai/v1`
- `CORS_ORIGIN` — e.g. `http://localhost:5173` (default: reflect request origin)

## Auth

Every Groq route expects:

```http
Authorization: Bearer <GROQ_API_KEY>
```

Do not commit API keys.

## Routes

### `POST /api/transcribe`

- **Body:** `multipart/form-data` with field **`audio`** (file).
- **Response:** `{ "text": "...", "model": "whisper-large-v3" }`

### `POST /api/suggestions`

- **JSON:** `{ "transcript": "...", "systemPrompt?": "...", "contextChars?": 12000, "temperature?": 0.55, "maxTokens?": 1024 }`
- **Response:** `{ "model": "openai/gpt-oss-120b", "suggestions": [ { id, type, title, preview, detail }, x3 ], "metadata": { createdAt, latencyMs, contextCharsUsed, temperature, maxTokens } }`

### `POST /api/chat`

- **JSON:** `{ "mode": "chat" | "expanded", "transcript": "...", "messages": [...], "systemPrompt?": "...", "contextChars?": number, "temperature?": number, "maxTokens?": number }`
- **Response:** `text/event-stream` — first event is `meta`, then token events `data: {"text":"..."}` until `data: [DONE]`

### `GET /api/settings/defaults`

- Returns default prompt text, model IDs, context windows, and generation defaults for initializing your frontend settings screen.

### `GET /health`

Liveness check.
