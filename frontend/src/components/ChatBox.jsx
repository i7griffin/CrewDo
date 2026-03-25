import { useState, useEffect, useRef } from 'react';
import { sendChatMessage, onChatMessage, offChatMessage } from '../socket/socket';

export default function ChatBox({ clanId, onlineUsers = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    onChatMessage((msg) => {
      setMessages((prev) => [...prev.slice(-99), msg]);
    });
    return () => offChatMessage();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendChatMessage(clanId, text);
    // Optimistic update
    setMessages((prev) => [
      ...prev,
      {
        _id: Date.now(),
        sender: { username: user.username, _id: user._id },
        message: text,
        createdAt: new Date().toISOString(),
        self: true,
      },
    ]);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-box">
      {/* Online users strip */}
      <div className="online-users-panel">
        <h3 className="panel-title">ONLINE USERS</h3>
        <div className="online-avatars">
          {onlineUsers.slice(0, 6).map((u) => (
            <div key={u._id || u.userId} className="online-user-item">
              <div className="online-user-avatar">
                {(u.username || 'U')[0].toUpperCase()}
                <span className="online-dot dot-online" />
              </div>
              <span className="online-user-name">{u.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="chat-panel">
        <h3 className="panel-title">CHAT ROOM</h3>
        <div className="chat-messages">
          {messages.map((msg, i) => {
            const name = msg.sender?.username || 'Unknown';
            const isSelf = msg.self || msg.sender?._id === user._id;
            return (
              <div key={msg._id || i} className={`chat-msg ${isSelf ? 'chat-msg-self' : ''}`}>
                <div className="chat-msg-avatar">{name[0]?.toUpperCase()}</div>
                <div className="chat-msg-body">
                  <span className="chat-msg-name">
                    {name}
                    <span className="chat-dot dot-online" />
                  </span>
                  <p className="chat-msg-text">{msg.message || msg.text}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-row">
          <input
            className="chat-input"
            placeholder="Type message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={300}
          />
          <button className="chat-send-btn" onClick={handleSend}>
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}