import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ChatBox from '../components/ChatBox'
import MemberList from '../components/MemberList'
import ProgressDisplay from '../components/ProgressDisplay'
import Toast from '../components/Toast'
import { getClanStreak, getTodayCompletions, submitProof } from '../services/proofService'
import { getClan, leaveClan, transferOwnership, getClanTasks, createClanTask } from '../services/clanService'
import { connectSocket, getSocket } from '../socket/socketClient'

// Removed seed members - will load real members from backend

function ClanPage() {
  const { clanId } = useParams()
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [progress, setProgress] = useState(40)
  const [streak, setStreak] = useState(6)
  const [clanData, setClanData] = useState(null)
  const [isCreator, setIsCreator] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [completedTaskIds, setCompletedTaskIds] = useState([])
  const [toast, setToast] = useState(null)
  const [messages, setMessages] = useState([])
  const [tasks, setTasks] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskValue, setNewTaskValue] = useState(10)

  useEffect(() => {
    const loadClanData = async () => {
      try {
        const data = await getClan(clanId)
        setClanData(data.clan)
        
        // Load clan members
        if (data.clan?.members) {
          setMembers(data.clan.members)
        }
        
        // Load chat messages
        if (data.clan?.messages) {
          setMessages(data.clan.messages)
        }
        
        // Load progress from clan data
        if (typeof data.clan?.progress === 'number') {
          setProgress(data.clan.progress)
        }
        
        // Check if current user is the creator
        const raw = localStorage.getItem('crewdo-user')
        if (raw) {
          const user = JSON.parse(raw)
          const userId = user.id || user._id
          setCurrentUserId(userId)
          
          if (data.clan?.creator) {
            setIsCreator(String(userId) === String(data.clan.creator))
          }
        }
      } catch (error) {
        console.error('Failed to load clan data:', error)
      }
    }
    loadClanData()
  }, [clanId])

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await getClanTasks(clanId)
        if (data?.tasks) {
          setTasks(data.tasks)
        }
      } catch (error) {
        console.error('Failed to load tasks:', error)
      }
    }
    loadTasks()
  }, [clanId])

  useEffect(() => {
    const loadStreak = async () => {
      try {
        const data = await getClanStreak(clanId)
        if (typeof data?.streak === 'number') setStreak(data.streak)
      } catch {
        // Keep fallback value in offline/dev mode.
      }
    }
    loadStreak()
  }, [clanId])

  useEffect(() => {
    const loadCompletions = async () => {
      try {
        const taskIds = await getTodayCompletions(clanId)
        setCompletedTaskIds(taskIds)
      } catch (error) {
        console.error('Failed to load today\'s completions:', error)
      }
    }
    loadCompletions()
  }, [clanId])

  useEffect(() => {
    const token = localStorage.getItem('crewdo-token') || 'demo-token'
    const socket = connectSocket(token)

    socket.emit('clan:join', { clanId })

    socket.on('user:online', (payload) => {
      setMembers((prev) =>
        prev.map((member) =>
          member.id === payload.userId ? { ...member, online: payload.online } : member
        )
      )
    })

    socket.on('progress:update', (payload) => {
      if (payload.clanId === clanId) {
        setProgress(payload.progress)
        if (typeof payload.streak === 'number') setStreak(payload.streak)
      }
    })

    socket.on('chat:message', (payload) => {
      setMessages((prev) => [...prev, payload])
    })

    return () => {
      socket.off('user:online')
      socket.off('progress:update')
      socket.off('chat:message')
    }
  }, [clanId])

  const onlineUsers = useMemo(
    () => members.filter((member) => member.online).map((member) => ({ id: member.id, name: member.name })),
    [members]
  )

  const onTaskComplete = async (task) => {
    try {
      // For now, we're not requiring file upload for task completion
      // This will be enhanced in future iterations
      setProgress((prev) => Math.min(prev + task.value, 100))
      const socket = getSocket()
      socket?.emit('progress:update', { clanId, taskId: task.id })
      
      // Add task to completed list
      setCompletedTaskIds((prev) => [...prev, task.id])
    } catch (error) {
      // Handle 409 Conflict error (duplicate completion)
      if (error.response?.status === 409) {
        setToast({
          message: 'You have already completed this task today. Try again tomorrow!',
          type: 'error',
        })
      } else {
        setToast({
          message: 'Failed to complete task. Please try again.',
          type: 'error',
        })
      }
    }
  }

  const onSendMessage = (text) => {
    const raw = localStorage.getItem('crewdo-user')
    const parsed = raw ? JSON.parse(raw) : { name: 'Liam' }
    const chatPayload = {
      id: String(Date.now()),
      author: parsed.name || 'Liam',
      text,
      clanId,
    }

    setMessages((prev) => [...prev, chatPayload])
    const socket = getSocket()
    socket?.emit('chat:message', chatPayload)
  }

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) {
      return
    }

    try {
      await leaveClan(clanId)
      setToast({
        message: 'Left group successfully',
        type: 'success',
      })
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to leave group',
        type: 'error',
      })
    }
  }

  const handleTransferOwnership = async (newOwnerId) => {
    if (!confirm('Are you sure you want to transfer ownership to this member? You will no longer be the group leader.')) {
      return
    }

    try {
      await transferOwnership(clanId, newOwnerId)
      setToast({
        message: 'Ownership transferred successfully',
        type: 'success',
      })
      
      // Reload clan data to reflect the change
      const data = await getClan(clanId)
      setClanData(data.clan)
      if (data.clan?.members) {
        setMembers(data.clan.members)
      }
      setIsCreator(false)
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to transfer ownership',
        type: 'error',
      })
    }
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      setToast({
        message: 'Task title is required',
        type: 'error',
      })
      return
    }

    try {
      const taskData = {
        title: newTaskTitle.trim(),
        value: newTaskValue || 10,
      }
      
      await createClanTask(clanId, taskData)
      
      setToast({
        message: 'Task added successfully',
        type: 'success',
      })
      
      // Reload tasks
      const data = await getClanTasks(clanId)
      if (data?.tasks) {
        setTasks(data.tasks)
      }
      
      // Clear inputs
      setNewTaskTitle('')
      setNewTaskValue(10)
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to add task',
        type: 'error',
      })
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <header className="mb-5 flex items-center justify-between border-b border-emerald-300/20 pb-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="rounded-lg border border-emerald-300/40 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-300/10 transition-colors"
        >
          ← Dashboard
        </button>
        <h1 className="text-center flex-1 text-4xl font-bold text-emerald-300">CrewDo</h1>
        <button
          onClick={handleLeaveGroup}
          className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30 transition-colors"
        >
          Leave Group
        </button>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.25fr_1fr]">
        <MemberList 
          members={members} 
          creatorId={clanData?.creator} 
          currentUserId={currentUserId}
          onTransferOwnership={handleTransferOwnership}
        />
        <div className="space-y-4">
          {isCreator && (
            <div className="glass-panel rounded-2xl p-4">
              <h3 className="mb-3 text-lg font-semibold text-emerald-300">Add Task (Creator Only)</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Task title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 rounded-lg border border-emerald-300/40 bg-black/25 px-3 py-2 text-emerald-100 placeholder-emerald-300/50 focus:border-emerald-300 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Points"
                  value={newTaskValue}
                  onChange={(e) => setNewTaskValue(Number(e.target.value) || 10)}
                  className="w-24 rounded-lg border border-emerald-300/40 bg-black/25 px-3 py-2 text-emerald-100 placeholder-emerald-300/50 focus:border-emerald-300 focus:outline-none"
                  min="1"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600"
                >
                  Add
                </button>
              </div>
            </div>
          )}
          <ProgressDisplay progress={progress} streak={streak} tasks={tasks} onTaskComplete={onTaskComplete} completedTaskIds={completedTaskIds} />
        </div>
        <ChatBox onlineUsers={onlineUsers} messages={messages} onSendMessage={onSendMessage} />
      </section>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  )
}

export default ClanPage
