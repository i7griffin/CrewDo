import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/authService'
import { connectSocket } from '../socket/socketClient'

function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
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
      const data = await login(form)
      const token = data?.token || 'demo-token'
      localStorage.setItem('crewdo-token', token)
      localStorage.setItem('crewdo-user', JSON.stringify(data?.user || { name: form.username }))
      connectSocket(token)
      navigate('/dashboard')
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Unable to login. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="glass-panel w-full max-w-md rounded-2xl p-8">
        <h1 className="mb-8 text-center text-5xl font-semibold text-emerald-200">CrewDo</h1>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm text-emerald-100">Username</span>
            <input
              name="username"
              value={form.username}
              onChange={onChange}
              placeholder="Username"
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
              placeholder="Password"
              className="w-full rounded-md border border-emerald-300/40 bg-slate-900/70 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button type="submit" disabled={isLoading} className="neon-btn w-full rounded-md py-2">
            {isLoading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-200">
          don't have an account?{' '}
          <Link to="/signup" className="text-emerald-300 underline">
            [sign up]
          </Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
