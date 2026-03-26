import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    _id: '60c72b2f9b1d8b001c8e4b52',
    id: '60c72b2f9b1d8b001c8e4b52',
    username: 'Guest User',
    email: 'guest@example.com',
    clan: '60c72b2f9b1d8b001c8e4b53'
  })
  const [token, setToken] = useState('mocked_access_token')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [token])

  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me')
      if (res.data?.data?.user) {
        setUser(res.data.data.user)
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false)
    }
  }

  const login = (accessToken, userData) => {
    localStorage.setItem('crewdo_token', accessToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    setToken(accessToken)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('crewdo_token')
    localStorage.removeItem('crewdo_refresh')
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)