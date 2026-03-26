import { useState } from 'react'

function ChatBox({ onlineUsers, messages, onSendMessage }) {
  const [text, setText] = useState('')

  const handleSend = () => {
    const clean = text.trim()
    if (!clean) return
    onSendMessage(clean)
    setText('')
  }

  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-4 rounded-xl bg-black/25 p-3">
        <h3 className="mb-2 text-center text-xl font-bold text-gray-100">ONLINE USERS</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-sm">
              <span className="h-2 w-2 rounded-full bg-lime-400" />
              {user.name}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-3 rounded-xl bg-black/25 p-3">
        <h3 className="mb-3 text-center text-xl font-bold text-gray-100">CHAT ROOM</h3>
        <div className="mb-3 max-h-56 space-y-3 overflow-y-auto">
          {messages.map((message) => (
            <p key={message.id} className="text-sm text-gray-100">
              <span className="font-semibold text-emerald-200">{message.author}:</span> {message.text}
            </p>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Type message..."
            className="flex-1 rounded-lg border border-emerald-300/40 bg-slate-900/70 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button type="button" onClick={handleSend} className="neon-btn rounded-lg px-4">
            Send
          </button>
        </div>
      </div>
    </section>
  )
}

export default ChatBox
