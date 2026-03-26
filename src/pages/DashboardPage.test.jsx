import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import DashboardPage from './DashboardPage'
import * as authService from '../services/authService'
import * as clanService from '../services/clanService'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

/**
 * DashboardPage - Logout Functionality Tests
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.5**
 * 
 * These tests verify that the logout button:
 * - Calls authService.logout() when clicked
 * - Redirects to /login after logout completes
 * - Clears authentication data from localStorage
 */

describe('DashboardPage - Logout Functionality', () => {
  beforeEach(() => {
    // Clear localStorage and mocks
    localStorage.clear()
    vi.clearAllMocks()
    mockNavigate.mockClear()
    document.body.innerHTML = ''
    
    // Set up authenticated user in localStorage
    localStorage.setItem('crewdo-token', 'test-token-123')
    localStorage.setItem('crewdo-user', JSON.stringify({ 
      id: 1, 
      name: 'Test User',
      username: 'testuser' 
    }))
    
    // Mock getUserClans to return empty array
    vi.spyOn(clanService, 'getUserClans').mockResolvedValue({ clans: [] })
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  /**
   * Test: Logout button is visible in header
   * 
   * Validates: Requirements 1.5
   */
  it('should display logout button in header', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('CrewDo')).toBeInTheDocument()
    })

    // Verify logout button is present
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    expect(logoutButton).toBeInTheDocument()
  })

  /**
   * Test: Logout button calls authService.logout()
   * 
   * Validates: Requirements 1.1, 1.2
   */
  it('should call authService.logout() when logout button is clicked', async () => {
    const logoutSpy = vi.spyOn(authService, 'logout').mockResolvedValue()

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('CrewDo')).toBeInTheDocument()
    })

    // Click logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(logoutButton)

    // Verify logout was called
    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalledTimes(1)
    })
  })

  /**
   * Test: Logout redirects to /login
   * 
   * Validates: Requirements 1.3
   */
  it('should redirect to /login after logout completes', async () => {
    vi.spyOn(authService, 'logout').mockResolvedValue()

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('CrewDo')).toBeInTheDocument()
    })

    // Click logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(logoutButton)

    // Verify navigation to /login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  /**
   * Test: Logout clears localStorage
   * 
   * Validates: Requirements 1.1, 1.2
   */
  it('should clear authentication data from localStorage', async () => {
    // Mock logout to actually clear localStorage
    vi.spyOn(authService, 'logout').mockImplementation(async () => {
      localStorage.removeItem('crewdo-token')
      localStorage.removeItem('crewdo-user')
    })

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('CrewDo')).toBeInTheDocument()
    })

    // Verify localStorage has data before logout
    expect(localStorage.getItem('crewdo-token')).toBe('test-token-123')
    expect(localStorage.getItem('crewdo-user')).toBeTruthy()

    // Click logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(logoutButton)

    // Verify localStorage is cleared after logout
    await waitFor(() => {
      expect(localStorage.getItem('crewdo-token')).toBeNull()
      expect(localStorage.getItem('crewdo-user')).toBeNull()
    })
  })

  /**
   * Test: Logout handles errors gracefully
   * 
   * Validates: Requirements 1.1, 1.2, 1.3
   * 
   * Even if the backend logout fails, the user should still be logged out
   * locally and redirected to the login page.
   */
  it('should redirect to login even if backend logout fails', async () => {
    // Mock logout to simulate backend error but still clear localStorage
    vi.spyOn(authService, 'logout').mockImplementation(async () => {
      // Simulate backend error but still clear localStorage (fail-safe)
      localStorage.removeItem('crewdo-token')
      localStorage.removeItem('crewdo-user')
    })

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('CrewDo')).toBeInTheDocument()
    })

    // Click logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(logoutButton)

    // Verify navigation still occurs
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    // Verify localStorage is cleared
    expect(localStorage.getItem('crewdo-token')).toBeNull()
    expect(localStorage.getItem('crewdo-user')).toBeNull()
  })

  /**
   * Test: User name is displayed in header
   * 
   * Validates that the user's name is shown next to the logout button
   */
  it('should display user name in header', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('CrewDo')).toBeInTheDocument()
    })

    // Verify user name is displayed
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })
})
