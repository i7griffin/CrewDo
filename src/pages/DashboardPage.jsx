import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GroupCard from '../components/GroupCard'
import { createClan, getUserClans, joinClan } from '../services/clanService'
import { logout, updateAvatar } from '../services/authService'

const fallbackClans = [
  { id: '1', name: 'Study Squad', avatar: 'SS', color: '#3cf86e', habit: 'Study' },
  { id: '2', name: 'Workout Buddies', avatar: 'WB', color: '#7af6ff', habit: 'Workout' },
  { id: '3', name: 'LeetCode Circle', avatar: 'LC', color: '#71ff8f', habit: 'LeetCode' },
]

function DashboardPage() {
  const navigate = useNavigate()
  const [teamCode, setTeamCode] = useState('')
  const [clans, setClans] = useState([])
  const [newClanName, setNewClanName] = useState('')
  const [message, setMessage] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [customTasks, setCustomTasks] = useState([{ title: '', value: 10 }])
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [currentAvatar, setCurrentAvatar] = useState('')

  const avatarOptions = ['😀', '😎', '🤓', '🥳', '🤩', '😇', '🤠', '🥷', '👨‍💻', '👩‍💻', '🦸', '🦹', '🧙', '🧚', '🐱', '🐶', '🦊', '🐼', '🐨', '🦁']

  useEffect(() => {
    const fetchClans = async () => {
      try {
        const data = await getUserClans()
        setClans(data?.clans?.length ? data.clans : fallbackClans)
      } catch {
        setClans(fallbackClans)
      }
    }

    fetchClans()
    
    // Load current avatar
    const raw = localStorage.getItem('crewdo-user')
    if (raw) {
      try {
        const user = JSON.parse(raw)
        setCurrentAvatar(user.avatar || '')
      } catch {
        setCurrentAvatar('')
      }
    }
  }, [])

  const currentUser = useMemo(() => {
    const raw = localStorage.getItem('crewdo-user')
    if (!raw) return { name: 'Liam' }
    try {
      return JSON.parse(raw)
    } catch {
      return { name: 'Liam' }
    }
  }, [])

  const handleJoin = async () => {
    if (!teamCode.trim()) return
    setIsBusy(true)
    setMessage('')
    try {
      await joinClan({ teamCode: teamCode.trim() })
      setMessage('Joined group successfully.')
      setTeamCode('')
    } catch {
      setMessage('Unable to join right now. Please verify the code.')
    } finally {
      setIsBusy(false)
    }
  }

  const handleCreate = async () => {
    const cleanName = newClanName.trim() || `Crew ${Math.floor(Math.random() * 900 + 100)}`
    const validTasks = customTasks.filter(task => task.title.trim())
    
    setIsBusy(true)
    setMessage('')
    try {
      await createClan({ name: cleanName, habit: 'Workout', tasks: validTasks })
      setMessage('Group created successfully.')
      setNewClanName('')
      setCustomTasks([{ title: '', value: 10 }])
    } catch {
      setMessage('Group created locally (backend unavailable).')
    } finally {
      setClans((prev) => [
        {
          id: String(Date.now()),
          name: cleanName,
          avatar: cleanName.slice(0, 2).toUpperCase(),
          color: '#3cf86e',
          habit: 'Workout',
        },
        ...prev,
      ])
      setIsBusy(false)
    }
  }

  const addTaskField = () => {
    setCustomTasks([...customTasks, { title: '', value: 10 }])
  }

  const removeTaskField = (index) => {
    setCustomTasks(customTasks.filter((_, i) => i !== index))
  }

  const updateTaskField = (index, field, value) => {
    const updated = [...customTasks]
    updated[index][field] = field === 'value' ? Number(value) || 10 : value
    setCustomTasks(updated)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleAvatarChange = async (emoji) => {
    try {
      const data = await updateAvatar(emoji)
      setCurrentAvatar(emoji)
      
      // Update localStorage
      const raw = localStorage.getItem('crewdo-user')
      if (raw) {
        const user = JSON.parse(raw)
        user.avatar = emoji
        localStorage.setItem('crewdo-user', JSON.stringify(user))
      }
      
      setShowAvatarPicker(false)
    } catch (error) {
      console.error('Failed to update avatar:', error)
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <header className="mb-8 flex items-center justify-between border-b border-emerald-300/25 pb-4">
        <h1 className="text-5xl font-bold text-emerald-300">CrewDo</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="flex items-center gap-2 rounded-lg border border-emerald-300/40 bg-slate-900/70 px-3 py-2 text-lg text-white transition-colors hover:bg-emerald-300/10"
            >
              <span className="text-2xl">{currentAvatar || '👤'}</span>
              <span>{currentUser.name || 'Liam'}</span>
            </button>
            
            {showAvatarPicker && (
              <div className="absolute right-0 top-full mt-2 z-10 w-64 rounded-lg border border-emerald-300/40 bg-slate-900 p-4 shadow-xl">
                <p className="mb-3 text-sm font-semibold text-emerald-200">Choose your avatar</p>
                <div className="grid grid-cols-5 gap-2">
                  {avatarOptions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleAvatarChange(emoji)}
                      className={`rounded-lg p-2 text-2xl transition-colors hover:bg-emerald-300/20 ${
                        currentAvatar === emoji ? 'bg-emerald-300/30' : 'bg-slate-800/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-emerald-300/40 bg-slate-900/70 px-4 py-2 text-sm text-emerald-200 transition-colors hover:bg-emerald-300/10 hover:text-emerald-100"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl space-y-6">
        <div className="glass-panel rounded-2xl p-5">
          <p className="mb-3 text-center text-lg font-semibold text-emerald-200">ENTER TEAM CODE</p>
          <div className="space-y-3">
            <input
              value={teamCode}
              onChange={(event) => setTeamCode(event.target.value)}
              className="w-full rounded-lg border border-emerald-300/40 bg-slate-900/70 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Enter code"
            />
            <button type="button" disabled={isBusy} onClick={handleJoin} className="neon-btn w-full rounded-lg py-3">
              JOIN GROUP
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <input
            value={newClanName}
            onChange={(event) => setNewClanName(event.target.value)}
            className="mb-3 w-full rounded-lg border border-emerald-300/40 bg-slate-900/70 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="New group name (optional)"
          />
          
          <div className="mb-3 space-y-2">
            <p className="text-sm font-semibold text-emerald-200">Custom Tasks (optional)</p>
            {customTasks.map((task, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={task.title}
                  onChange={(e) => updateTaskField(index, 'title', e.target.value)}
                  className="flex-1 rounded-lg border border-emerald-300/40 bg-slate-900/70 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Task name"
                />
                <input
                  type="number"
                  value={task.value}
                  onChange={(e) => updateTaskField(index, 'value', e.target.value)}
                  className="w-20 rounded-lg border border-emerald-300/40 bg-slate-900/70 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Points"
                  min="1"
                />
                {customTasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTaskField(index)}
                    className="rounded-lg bg-red-500/20 px-3 py-2 text-red-300 hover:bg-red-500/30"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTaskField}
              className="text-sm text-emerald-300 hover:text-emerald-200"
            >
              + Add another task
            </button>
          </div>
          
          <button type="button" disabled={isBusy} onClick={handleCreate} className="neon-btn w-full rounded-lg py-3">
            CREATE GROUP
          </button>
          {message ? <p className="mt-3 text-sm text-emerald-200">{message}</p> : null}
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <h2 className="mb-4 text-center text-2xl font-semibold text-gray-100">YOUR GROUPS</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {clans.map((clan) => (
              <GroupCard key={clan.id} clan={clan} currentUserId={currentUser.id} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default DashboardPage
