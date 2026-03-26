import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import GroupCard from './GroupCard'

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
 * GroupCard - Team Code Display and Copy Tests
 * 
 * **Validates: Requirements 5.5, 5.6**
 * 
 * These tests verify that:
 * - Team codes are displayed only for groups where the user is the creator
 * - Copy-to-clipboard functionality works correctly
 * - Team codes are not shown for groups where the user is not the creator
 */

describe('GroupCard - Team Code Display and Copy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(),
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Test: Team code is displayed for creator
   * 
   * Validates: Requirements 5.6
   */
  it('should display team code when user is the creator', () => {
    const clan = {
      id: '1',
      name: 'Study Squad',
      habit: 'Study',
      avatar: 'SS',
      color: '#3cf86e',
      teamCode: 'ABC123',
      creator: 'user1',
    }

    render(
      <BrowserRouter>
        <GroupCard clan={clan} currentUserId="user1" />
      </BrowserRouter>
    )

    // Verify team code is displayed
    expect(screen.getByText(/Team Code:/i)).toBeInTheDocument()
    expect(screen.getByText('ABC123')).toBeInTheDocument()
  })

  /**
   * Test: Team code is not displayed for non-creator
   * 
   * Validates: Requirements 5.6
   */
  it('should not display team code when user is not the creator', () => {
    const clan = {
      id: '1',
      name: 'Study Squad',
      habit: 'Study',
      avatar: 'SS',
      color: '#3cf86e',
      teamCode: 'ABC123',
      creator: 'user1',
    }

    render(
      <BrowserRouter>
        <GroupCard clan={clan} currentUserId="user2" />
      </BrowserRouter>
    )

    // Verify team code is not displayed
    expect(screen.queryByText(/Team Code:/i)).not.toBeInTheDocument()
    expect(screen.queryByText('ABC123')).not.toBeInTheDocument()
  })

  /**
   * Test: Team code is not displayed when teamCode is missing
   * 
   * Validates: Requirements 5.6
   */
  it('should not display team code section when teamCode is missing', () => {
    const clan = {
      id: '1',
      name: 'Study Squad',
      habit: 'Study',
      avatar: 'SS',
      color: '#3cf86e',
      creator: 'user1',
    }

    render(
      <BrowserRouter>
        <GroupCard clan={clan} currentUserId="user1" />
      </BrowserRouter>
    )

    // Verify team code section is not displayed
    expect(screen.queryByText(/Team Code:/i)).not.toBeInTheDocument()
  })

  /**
   * Test: Copy button is displayed for creator
   * 
   * Validates: Requirements 5.6
   */
  it('should display copy button when user is the creator', () => {
    const clan = {
      id: '1',
      name: 'Study Squad',
      habit: 'Study',
      avatar: 'SS',
      color: '#3cf86e',
      teamCode: 'ABC123',
      creator: 'user1',
    }

    render(
      <BrowserRouter>
        <GroupCard clan={clan} currentUserId="user1" />
      </BrowserRouter>
    )

    // Verify copy button is displayed
    const copyButton = screen.getByTitle('Copy team code')
    expect(copyButton).toBeInTheDocument()
  })

  /**
   * Test: Copy button copies team code to clipboard
   * 
   * Validates: Requirements 5.6
   */
  it('should copy team code to clipboard when copy button is clicked', async () => {
    const clan = {
      id: '1',
      name: 'Study Squad',
      habit: 'Study',
      avatar: 'SS',
      color: '#3cf86e',
      teamCode: 'ABC123',
      creator: 'user1',
    }

    render(
      <BrowserRouter>
        <GroupCard clan={clan} currentUserId="user1" />
      </BrowserRouter>
    )

    // Click copy button
    const copyButton = screen.getByTitle('Copy team code')
    fireEvent.click(copyButton)

    // Verify clipboard.writeText was called with correct team code
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123')
    })
  })

  /**
   * Test: Copy button shows "Copied" feedback
   * 
   * Validates: Requirements 5.6
   */
  it('should show "Copied" feedback after copying', async () => {
    const clan = {
      id: '1',
      name: 'Study Squad',
      habit: 'Study',
      avatar: 'SS',
      color: '#3cf86e',
      teamCode: 'ABC123',
      creator: 'user1',
    }

    render(
      <BrowserRouter>
        <GroupCard clan={clan} currentUserId="user1" />
      </BrowserRouter>
    )

    // Click copy button
    const copyButton = screen.getByTitle('Copy team code')
    fireEvent.click(copyButton)

    // Verify "Copied" text is shown
    await waitFor(() => {
      expect(screen.getByText(/✓ Copied/i)).toBeInTheDocument()
    })
  })

  /**
   * Test: Copy button does not navigate to clan page
   * 
   * Validates: Requirements 5.6
   * 
   * Clicking the copy button should not trigger navigation to the clan page.
   * Only clicking the card itself should navigate.
   */
  it('should not navigate when copy button is clicked', async () => {
    const clan = {
      id: '1',
      name: 'Study Squad',
      habit: 'Study',
      avatar: 'SS',
      color: '#3cf86e',
      teamCode: 'ABC123',
      creator: 'user1',
    }

    render(
      <BrowserRouter>
        <GroupCard clan={clan} currentUserId="user1" />
      </BrowserRouter>
    )

    // Click copy button
    const copyButton = screen.getByTitle('Copy team code')
    fireEvent.click(copyButton)

    // Verify navigation was not called
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  /**
   * Test: Clicking card navigates to clan page
   * 
   * Validates that the main card click functionality still works
   */
  it('should navigate to clan page when card is clicked', () => {
    const clan = {
      id: '1',
      name: 'Study Squad',
      habit: 'Study',
      avatar: 'SS',
      color: '#3cf86e',
      teamCode: 'ABC123',
      creator: 'user1',
    }

    render(
      <BrowserRouter>
        <GroupCard clan={clan} currentUserId="user1" />
      </BrowserRouter>
    )

    // Click the card (not the copy button)
    const cardButton = screen.getByRole('button', { name: /Study Squad/i })
    fireEvent.click(cardButton)

    // Verify navigation was called
    expect(mockNavigate).toHaveBeenCalledWith('/clan/1')
  })

  /**
   * Test: Copy handles clipboard API errors gracefully
   * 
   * Validates: Requirements 5.6
   */
  it('should handle clipboard API errors gracefully', async () => {
    // Mock clipboard to reject
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('Clipboard error'))

    const clan = {
      id: '1',
      name: 'Study Squad',
      habit: 'Study',
      avatar: 'SS',
      color: '#3cf86e',
      teamCode: 'ABC123',
      creator: 'user1',
    }

    render(
      <BrowserRouter>
        <GroupCard clan={clan} currentUserId="user1" />
      </BrowserRouter>
    )

    // Click copy button
    const copyButton = screen.getByTitle('Copy team code')
    fireEvent.click(copyButton)

    // Verify error was logged
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    consoleErrorSpy.mockRestore()
  })

  /**
   * Test: Team code comparison handles string vs number IDs
   * 
   * Validates: Requirements 5.6
   * 
   * The creator ID might be a string or number, so the comparison
   * should handle both cases correctly.
   */
  it('should correctly identify creator when IDs are different types', () => {
    const clan = {
      id: '1',
      name: 'Study Squad',
      habit: 'Study',
      avatar: 'SS',
      color: '#3cf86e',
      teamCode: 'ABC123',
      creator: 123, // number
    }

    render(
      <BrowserRouter>
        <GroupCard clan={clan} currentUserId="123" /> {/* string */}
      </BrowserRouter>
    )

    // Verify team code is displayed (creator check should work with type coercion)
    expect(screen.getByText(/Team Code:/i)).toBeInTheDocument()
    expect(screen.getByText('ABC123')).toBeInTheDocument()
  })
})
