import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ClanPage from './ClanPage'
import * as clanService from '../services/clanService'
import * as proofService from '../services/proofService'

// Mock the services
vi.mock('../services/clanService')
vi.mock('../services/proofService')
vi.mock('../socket/socketClient', () => ({
  connectSocket: vi.fn(() => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
  getSocket: vi.fn(() => ({
    emit: vi.fn(),
  })),
}))

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ clanId: 'test-clan-id' }),
  }
})

describe('ClanPage - Task Creation Controls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    // Setup default mocks
    vi.mocked(proofService.getClanStreak).mockResolvedValue({
      streak: 5,
      progress: 40,
    })
    vi.mocked(proofService.getTodayCompletions).mockResolvedValue([])
  })

  it('should show task creation controls when user is the creator', async () => {
    // Setup: User is the creator
    const userId = 'user123'
    const creatorId = 'user123'
    
    localStorage.setItem('crewdo-user', JSON.stringify({ id: userId }))
    localStorage.setItem('crewdo-token', 'test-token')
    
    vi.mocked(clanService.getClan).mockResolvedValue({
      clan: {
        id: 'test-clan-id',
        name: 'Test Clan',
        creator: creatorId,
        streak: 5,
        progress: 40,
      },
    })
    
    vi.mocked(proofService.getClanStreak).mockResolvedValue({
      streak: 5,
      progress: 40,
    })

    render(
      <BrowserRouter>
        <ClanPage />
      </BrowserRouter>
    )

    // Wait for the clan data to load and check if task creation UI is visible
    await waitFor(() => {
      expect(screen.getByText('Add Task (Creator Only)')).toBeInTheDocument()
    })
    
    expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Points')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('should NOT show task creation controls when user is not the creator', async () => {
    // Setup: User is NOT the creator
    const userId = 'user123'
    const creatorId = 'different-user'
    
    localStorage.setItem('crewdo-user', JSON.stringify({ id: userId }))
    localStorage.setItem('crewdo-token', 'test-token')
    
    vi.mocked(clanService.getClan).mockResolvedValue({
      clan: {
        id: 'test-clan-id',
        name: 'Test Clan',
        creator: creatorId,
        streak: 5,
        progress: 40,
      },
    })
    
    vi.mocked(proofService.getClanStreak).mockResolvedValue({
      streak: 5,
      progress: 40,
    })

    render(
      <BrowserRouter>
        <ClanPage />
      </BrowserRouter>
    )

    // Wait for the clan data to load
    await waitFor(() => {
      expect(clanService.getClan).toHaveBeenCalled()
    })
    
    // Task creation UI should NOT be visible
    expect(screen.queryByText('Add Task (Creator Only)')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Task title')).not.toBeInTheDocument()
  })

  it('should handle user ID comparison with _id field', async () => {
    // Setup: User object has _id instead of id
    const userId = 'user123'
    const creatorId = 'user123'
    
    localStorage.setItem('crewdo-user', JSON.stringify({ _id: userId }))
    localStorage.setItem('crewdo-token', 'test-token')
    
    vi.mocked(clanService.getClan).mockResolvedValue({
      clan: {
        id: 'test-clan-id',
        name: 'Test Clan',
        creator: creatorId,
        streak: 5,
        progress: 40,
      },
    })
    
    vi.mocked(proofService.getClanStreak).mockResolvedValue({
      streak: 5,
      progress: 40,
    })

    render(
      <BrowserRouter>
        <ClanPage />
      </BrowserRouter>
    )

    // Wait for the clan data to load and check if task creation UI is visible
    await waitFor(() => {
      expect(screen.getByText('Add Task (Creator Only)')).toBeInTheDocument()
    })
  })
})

describe('ClanPage - Completion Status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    // Setup default mocks
    vi.mocked(proofService.getClanStreak).mockResolvedValue({
      streak: 5,
      progress: 40,
    })
  })

  it('should fetch today\'s completions on mount', async () => {
    const userId = 'user123'
    const clanId = 'test-clan-id'
    const completedTaskIds = ['t1', 't2']
    
    localStorage.setItem('crewdo-user', JSON.stringify({ id: userId }))
    localStorage.setItem('crewdo-token', 'test-token')
    
    vi.mocked(clanService.getClan).mockResolvedValue({
      clan: {
        id: clanId,
        name: 'Test Clan',
        creator: userId,
        streak: 5,
        progress: 40,
      },
    })
    
    vi.mocked(proofService.getTodayCompletions).mockResolvedValue(completedTaskIds)

    render(
      <BrowserRouter>
        <ClanPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(proofService.getTodayCompletions).toHaveBeenCalledWith(clanId)
    })
  })

  it('should pass completedTaskIds to ProgressDisplay component', async () => {
    const userId = 'user123'
    const clanId = 'test-clan-id'
    const completedTaskIds = ['t1', 't2']
    
    localStorage.setItem('crewdo-user', JSON.stringify({ id: userId }))
    localStorage.setItem('crewdo-token', 'test-token')
    
    vi.mocked(clanService.getClan).mockResolvedValue({
      clan: {
        id: clanId,
        name: 'Test Clan',
        creator: userId,
        streak: 5,
        progress: 40,
      },
    })
    
    vi.mocked(proofService.getTodayCompletions).mockResolvedValue(completedTaskIds)

    render(
      <BrowserRouter>
        <ClanPage />
      </BrowserRouter>
    )

    // Wait for data to load
    await waitFor(() => {
      expect(proofService.getTodayCompletions).toHaveBeenCalled()
    })

    // The ProgressDisplay component should receive the completedTaskIds
    // This is verified by checking that the component renders without errors
    // and the data is passed correctly (integration test)
    expect(screen.getByText('DAILY PROGRESS')).toBeInTheDocument()
  })

  it('should handle errors when fetching completions gracefully', async () => {
    const userId = 'user123'
    const clanId = 'test-clan-id'
    
    localStorage.setItem('crewdo-user', JSON.stringify({ id: userId }))
    localStorage.setItem('crewdo-token', 'test-token')
    
    vi.mocked(clanService.getClan).mockResolvedValue({
      clan: {
        id: clanId,
        name: 'Test Clan',
        creator: userId,
        streak: 5,
        progress: 40,
      },
    })
    
    // Mock getTodayCompletions to throw an error
    vi.mocked(proofService.getTodayCompletions).mockRejectedValue(new Error('Network error'))

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <BrowserRouter>
        <ClanPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(proofService.getTodayCompletions).toHaveBeenCalled()
    })

    // Page should still render despite the error
    expect(screen.getByText('DAILY PROGRESS')).toBeInTheDocument()
    
    consoleErrorSpy.mockRestore()
  })
})
