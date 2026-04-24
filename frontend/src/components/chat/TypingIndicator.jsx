function TypingIndicator() {
  return (
    <div className="flex justify-start items-end gap-2 mb-1">
      <div className="w-6 h-6 flex-shrink-0"></div>
      <div className="chat-bubble chat-bubble-received">
        <div className="flex items-center gap-1 px-1">
          <div className="flex gap-1">
            <div
              className="w-2 h-2 bg-secondary rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></div>
            <div
              className="w-2 h-2 bg-secondary rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></div>
            <div
              className="w-2 h-2 bg-secondary rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;

