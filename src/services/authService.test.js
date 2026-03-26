import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logout } from './authService'
import apiClient from './apiClient'

vi.mock('./apiClient')

describe('authService - logout', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should clear crewdo-token from localStorage', async () => {
    localStorage.setItem('crewdo-token', 'test-token')
    localStorage.setItem('crewdo-user', JSON.stringify({ id: '123' }))
    
    apiClient.post.mockResolvedValue({ data: { message: 'Logged out successfully' } })

    await logout()

    expect(localStorage.getItem('crewdo-token')).toBeNull()
  })

  it('should clear crewdo-user from localStorage', async () => {
    localStorage.setItem('crewdo-token', 'test-token')
    localStorage.setItem('crewdo-user', JSON.stringify({ id: '123' }))
    
    apiClient.post.mockResolvedValue({ data: { message: 'Logged out successfully' } })

    await logout()

    expect(localStorage.getItem('crewdo-user')).toBeNull()
  })

  it('should call backend logout endpoint with token', async () => {
    localStorage.setItem('crewdo-token', 'test-token')
    
    apiClient.post.mockResolvedValue({ data: { message: 'Logged out successfully' } })

    await logout()

    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout')
  })

  it('should clear localStorage even if backend call fails', async () => {
    localStorage.setItem('crewdo-token', 'test-token')
    localStorage.setItem('crewdo-user', JSON.stringify({ id: '123' }))
    
    apiClient.post.mockRejectedValue(new Error('Network error'))

    // Should not throw error
    await expect(logout()).resolves.toBeUndefined()

    expect(localStorage.getItem('crewdo-token')).toBeNull()
    expect(localStorage.getItem('crewdo-user')).toBeNull()
  })

  it('should not call backend if no token exists', async () => {
    // No token in localStorage
    apiClient.post.mockResolvedValue({ data: { message: 'Logged out successfully' } })

    await logout()

    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('should clear localStorage even if no token exists', async () => {
    localStorage.setItem('crewdo-user', JSON.stringify({ id: '123' }))
    
    await logout()

    expect(localStorage.getItem('crewdo-user')).toBeNull()
  })
})
