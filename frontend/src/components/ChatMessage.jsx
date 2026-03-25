// Renders a single chat message row with avatar, name, online dot, and text
const ChatMessage = ({ message }) => {
  const { username, text, isOnline, avatar } = message;
  const initial = username ? username[0].toUpperCase() : '?';

  return (
    <div className="chat-message">
      {avatar ? (
        <img src={avatar} alt={username} className="chat-message__avatar" />
      ) : (
        <div className="chat-message__avatar-placeholder">{initial}</div>
      )}
      <div className="chat-message__body">
        <div className="chat-message__header">
          <span className="chat-message__name">{username}</span>
          {isOnline && <span className="chat-message__online-dot" />}
        </div>
        <span className="chat-message__text">{text}</span>
      </div>
    </div>
  );
};

export default ChatMessage;