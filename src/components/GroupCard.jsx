import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function GroupCard({ clan, currentUserId }) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const isCreator = clan.creator && currentUserId && String(clan.creator) === String(currentUserId)

  const handleCopyTeamCode = async (event) => {
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(clan.teamCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy team code:', error)
    }
  }

  return (
    <button
      type="button"
      onClick={() => navigate(`/clan/${clan.id}`)}
      className="glass-panel flex items-center justify-between rounded-xl p-4 text-left"
    >
      <div className="flex-1">
        <p className="text-lg font-semibold text-white">{clan.name}</p>
        <p className="text-sm text-emerald-200/80">Habit: {clan.habit}</p>
        {isCreator && clan.teamCode && (
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-emerald-300/90">
              Team Code: <span className="font-mono font-semibold">{clan.teamCode}</span>
            </p>
            <button
              type="button"
              onClick={handleCopyTeamCode}
              className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300 transition-colors hover:bg-emerald-500/30"
              title="Copy team code"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-black"
        style={{ background: clan.color }}
      >
        {clan.avatar}
      </div>
    </button>
  )
}

export default GroupCard
