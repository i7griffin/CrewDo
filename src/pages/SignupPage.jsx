import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../services/authService'
import { connectSocket } from '../socket/socketClient'

function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ displayName: '', username: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await signup(form)
      localStorage.setItem('crewdo-token', data.token)
      localStorage.setItem('crewdo-user', JSON.stringify(data.user))
      connectSocket(data.token)
      navigate('/dashboard')
    } catch (submitError) {
      // Check for network/connection errors
      const isNetworkError = submitError.code === 'ERR_NETWORK' || 
                            submitError.code === 'ERR_CONNECTION_REFUSED' ||
                            !submitError.response
      
      if (isNetworkError) {
        setError('Cannot connect to server. Please ensure the backend is running.')
        // Log full error object for debugging
        console.error('Connection error:', submitError)
        // Provide helpful developer guidance
        console.log('Backend server may not be running. Start it with: npm run dev:backend')
      } else {
        setError(submitError?.response?.data?.message || 'Unable to create account. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="glass-panel w-full max-w-md rounded-2xl p-8">
        <h1 className="mb-8 text-center text-5xl font-semibold text-emerald-200">Create Account</h1>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm text-emerald-100">Display Name</span>
            <input
              name="displayName"
              value={form.displayName}
              onChange={onChange}
              placeholder="Liam"
              className="w-full rounded-md border border-emerald-300/40 bg-slate-900/70 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-emerald-100">Username</span>
            <input
              name="username"
              value={form.username}
              onChange={onChange}
              placeholder="liam24"
              className="w-full rounded-md border border-emerald-300/40 bg-slate-900/70 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-emerald-100">Password</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              placeholder="At least 6 characters"
              className="w-full rounded-md border border-emerald-300/40 bg-slate-900/70 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button type="submit" disabled={isLoading} className="neon-btn w-full rounded-md py-2">
            {isLoading ? 'CREATING...' : 'SIGN UP'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-200">
          already have an account?{' '}
          <Link to="/login" className="text-emerald-300 underline">
            [login]
          </Link>
        </p>
      </section>
    </main>
  )
}

export default SignupPage
