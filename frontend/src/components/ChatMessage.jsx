function ChatMessage({ message, isStreaming }) {
  const isUser = message.role === "user";
  const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : "";

  return (
    <div className={`chat-message ${isUser ? "user" : "assistant"}`}>
      <div className="chat-bubble">
        <p>
          {message.content}
          {!isUser && isStreaming && message.streaming && <span className="cursor">|</span>}
        </p>
        <span className="message-time">{timestamp}</span>
      </div>
    </div>
  );
}

export default ChatMessage;
