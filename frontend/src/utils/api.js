const API_BASE = "/api";

function buildHeaders(apiKey, json = true) {
  const headers = {};
  if (json) headers["Content-Type"] = "application/json";
  if (apiKey) {
    headers["x-groq-api-key"] = apiKey;
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

export async function transcribeAudio(blob, apiKey) {
  const formData = new FormData();
  formData.append("audio", blob, `chunk-${Date.now()}.webm`);

  const response = await fetch(`${API_BASE}/transcribe`, {
    method: "POST",
    headers: buildHeaders(apiKey, false),
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to transcribe audio");
  }

  return response.json();
}

export async function fetchSuggestions(transcript, settings, apiKey) {
  const response = await fetch(`${API_BASE}/suggestions`, {
    method: "POST",
    headers: buildHeaders(apiKey, true),
    body: JSON.stringify({
      transcript,
      contextChars: (settings.suggestionContextLines ?? 30) * 400, // ✅ lines → chars conversion
      systemPrompt: settings.suggestionPrompt,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to fetch suggestions");
  }

  return response.json();
}

export async function streamChat(messages, transcript, settings, apiKey, options = {}) {
  const mode = options.mode === "expanded" ? "expanded" : "chat";
  const body = {
    messages,
    transcript,
    mode,
    contextChars: (settings.chatContextLines ?? 80) * 400,
  };

  // Keep custom chat prompt for normal chat only.
  // Expanded mode uses server-side expansion prompt for consistent quality.
  if (mode === "chat" && settings?.chatPrompt) {
    body.systemPrompt = settings.chatPrompt;
  }

  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      ...buildHeaders(apiKey, true),
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    const text = await response.text();
    throw new Error(text || "Failed to stream chat");
  }

  return response;
}
