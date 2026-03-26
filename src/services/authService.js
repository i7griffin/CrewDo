import apiClient from './apiClient'

export const signup = async (payload) => {
  const { data } = await apiClient.post('/auth/signup', payload)
  return data
}

export const login = async (payload) => {
  const { data } = await apiClient.post('/auth/login', payload)
  return data
}

export const logout = async () => {
  try {
    const token = localStorage.getItem('crewdo-token')
    if (token) {
      await apiClient.post('/auth/logout')
    }
  } catch (error) {
    // Log error but don't throw - we still want to clear localStorage
    console.error('Logout error:', error)
  } finally {
    localStorage.removeItem('crewdo-token')
    localStorage.removeItem('crewdo-user')
  }
}

export const updateAvatar = async (avatar) => {
  const { data } = await apiClient.put('/auth/profile/avatar', { avatar })
  return data
}
