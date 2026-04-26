import { useCallback, useMemo, useState } from "react";
import { streamChat } from "../utils/api.js";

function parseSseChunk(chunk, onEvent) {
  const lines = chunk.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();

    if (payload === "[DONE]") {
      onEvent({ done: true });
      continue;
    }

    try {
      onEvent(JSON.parse(payload));
    } catch {
      // Ignore malformed event lines.
    }
  }
}

export function useChat({ apiKey, transcript, settings }) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const transcriptText = useMemo(() => {
    const contextLines = settings?.chatContextLines ?? 80;
    return transcript.slice(-contextLines).join("\n");
  }, [settings?.chatContextLines, transcript]);

  const sendMessage = useCallback(async (content, options = {}) => {
    const trimmed = content.trim();
    if (!trimmed || !apiKey || isStreaming) return;
    const showInChat = options.showInChat !== false;
    const mode = options.mode === "expanded" ? "expanded" : "chat";

    const userMessage = {
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    const assistantId = `assistant-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      ...(showInChat ? [userMessage] : []),
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        streaming: true,
      },
    ]);
    setIsStreaming(true);

    try {
      const nextMessages = [...messages, userMessage].map(({ role, content: text }) => ({
        role,
        content: text,
      }));
      const response = await streamChat(nextMessages, transcriptText, settings, apiKey, { mode });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let doneSeen = false;

      while (!doneSeen) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          parseSseChunk(chunk, (event) => {
            if (event.done === true) {
              doneSeen = true;
              return;
            }

            const token = event.token || event.text || "";
            if (!token) return;

            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? { ...message, content: `${message.content}${token}` }
                  : message,
              ),
            );
          });
        }
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? { ...message, streaming: false, timestamp: Date.now() }
            : message,
        ),
      );
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Chat stream failed. Please retry.",
          timestamp: Date.now(),
        },
      ]);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId ? { ...message, streaming: false } : message,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }, [apiKey, isStreaming, messages, settings, transcriptText]);

  const pushAssistantMessage = useCallback((content) => {
    if (!content?.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: content.trim(),
        timestamp: Date.now(),
      },
    ]);
  }, []);

  return { messages, sendMessage, isStreaming, pushAssistantMessage };
}
