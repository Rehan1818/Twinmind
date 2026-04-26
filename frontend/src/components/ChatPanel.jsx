import { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage.jsx";

function ChatPanel({ messages, isStreaming, onSend }) {
  const [value, setValue] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const submit = () => {
    const content = value.trim();
    if (!content || isStreaming) return;
    onSend(content);
    setValue("");
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <section className="panel chat-panel">
      <div className="panel-header">
        <span className="panel-label">3. CHAT (DETAILED ANSWERS)</span>
        <span className="panel-badge badge-neutral">SESSION-ONLY</span>
      </div>

      <div className="scroll-area chat-list" ref={listRef}>
        {messages.length === 0 ? (
          <>
            <div className="info-card info-card-chat">
              <p>
                Clicking a suggestion adds it to this chat and streams a detailed answer (separate
                prompt, more context). User can also type questions directly. One continuous chat
                per session — no login, no persistence.
              </p>
            </div>
            <p className="empty-state chat-empty-state">
              Click a suggestion or type a question below.
            </p>
          </>
        ) : (
          messages.map((message, index) => (
            <ChatMessage
              key={`${index}-${message.timestamp ?? index}`}
              message={message}
              isStreaming={isStreaming}
            />
          ))
        )}
      </div>

      <div className="chat-input-wrap">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask anything…"
          disabled={isStreaming}
        />
        <button type="button" onClick={submit} disabled={isStreaming || !value.trim()}>
          Send
        </button>
      </div>
    </section>
  );
}

export default ChatPanel;