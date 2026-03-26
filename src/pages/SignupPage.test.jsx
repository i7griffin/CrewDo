import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import * as fc from 'fast-check'
import SignupPage from './SignupPage'
import * as authService from '../services/authService'

// Mock react-router-dom at the top level
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock socket connection at the top level
vi.mock('../socket/socketClient', () => ({
  connectSocket: vi.fn(),
}))

/**
 * Bug Condition Exploration Test
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * **Property 1: Bug Condition** - Connection Error Messaging
 * 
 * This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * DO NOT attempt to fix the test or the code when it fails.
 * 
 * GOAL: Surface counterexamples that demonstrate poor error messaging for connection errors.
 * 
 * Expected behavior (what the test checks for):
 * - Connection errors should display helpful messages like "Cannot connect to server"
 * - Error messages should mention "backend is running" or similar guidance
 * - Console should provide developer guidance about starting the backend
 * 
 * Current behavior (on unfixed code):
 * - Connection errors display generic "Unable to create account" message
 * - No distinction between connection errors and validation errors
 * - No developer guidance in console
 */

describe('SignupPage - Bug Condition Exploration', () => {
  let consoleLogSpy
  let consoleErrorSpy

  beforeEach(() => {
    // Spy on console methods to check for developer guidance
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.clearAllMocks()
    // Clear the document body to prevent multiple elements
    document.body.innerHTML = ''
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    vi.restoreAllMocks()
    // Clean up the DOM
    document.body.innerHTML = ''
  })

  /**
   * Property-Based Test: Connection Error Messaging
   * 
   * Generates random valid signup data and simulates connection errors
   * to verify that helpful error messages are displayed.
   */
  it('Property 1: should display helpful connection error messages when backend is not running', async () => {
    // Generator for valid signup data
    const signupDataArbitrary = fc.record({
      displayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      username: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
      password: fc.string({ minLength: 6, maxLength: 100 }),
    })

    // Generator for connection error types
    const connectionErrorArbitrary = fc.constantFrom(
      'ERR_CONNECTION_REFUSED',
      'ERR_NETWORK',
      'ECONNREFUSED'
    )

    await fc.assert(
      fc.asyncProperty(signupDataArbitrary, connectionErrorArbitrary, async (formData, errorCode) => {
        // Mock signup to simulate connection error (backend not running)
        const connectionError = new Error('Network Error')
        connectionError.code = errorCode
        connectionError.response = undefined // No response means connection failed
        
        vi.spyOn(authService, 'signup').mockRejectedValue(connectionError)

        // Render the signup page in a container
        const container = document.createElement('div')
        document.body.appendChild(container)
        
        const { unmount } = render(
          <BrowserRouter>
            <SignupPage />
          </BrowserRouter>,
          { container }
        )

        try {
          // Fill in the form using name attribute
          const displayNameInput = container.querySelector('input[name="displayName"]')
          const usernameInput = container.querySelector('input[name="username"]')
          const passwordInput = container.querySelector('input[name="password"]')
          const submitButton = container.querySelector('button[type="submit"]')

          fireEvent.change(displayNameInput, { target: { value: formData.displayName } })
          fireEvent.change(usernameInput, { target: { value: formData.username } })
          fireEvent.change(passwordInput, { target: { value: formData.password } })

          // Submit the form
          fireEvent.click(submitButton)

          // Wait for error to be displayed
          await waitFor(() => {
            const errorElement = container.querySelector('.text-red-300')
            expect(errorElement).not.toBeNull()
          })

          // EXPECTED BEHAVIOR (what should happen after fix):
          // The error message should be helpful and mention server/backend/connection
          const errorText = container.querySelector('.text-red-300').textContent

          // Check 1: Error message should mention connection/server issues
          const hasHelpfulMessage = 
            errorText.toLowerCase().includes('connect') ||
            errorText.toLowerCase().includes('server') ||
            errorText.toLowerCase().includes('backend') ||
            errorText.toLowerCase().includes('unavailable') ||
            errorText.toLowerCase().includes('running')

          // Check 2: Console should provide developer guidance
          const consoleHasGuidance = 
            consoleLogSpy.mock.calls.some(call => 
              call.some(arg => 
                typeof arg === 'string' && 
                (arg.includes('backend') || arg.includes('server') || arg.includes('npm run'))
              )
            ) ||
            consoleErrorSpy.mock.calls.some(call => 
              call.some(arg => 
                typeof arg === 'string' && 
                (arg.includes('backend') || arg.includes('server') || arg.includes('npm run'))
              )
            )

          // ASSERTION: These should be true after the fix
          // On unfixed code, these will be false, causing the test to fail
          expect(hasHelpfulMessage).toBe(true) // Will fail on unfixed code
          expect(consoleHasGuidance).toBe(true) // Will fail on unfixed code
        } finally {
          unmount()
          document.body.removeChild(container)
        }
      }),
      { numRuns: 5 } // Run 5 test cases with different data
    )
  })

  /**
   * Concrete Test Case: Backend Not Running
   * 
   * Specific test case that simulates the exact bug condition:
   * backend server is not running, connection is refused.
   */
  it('should display helpful error when backend is not running (ERR_CONNECTION_REFUSED)', async () => {
    // Mock signup to simulate ERR_CONNECTION_REFUSED
    const connectionError = new Error('connect ECONNREFUSED 127.0.0.1:5000')
    connectionError.code = 'ERR_CONNECTION_REFUSED'
    connectionError.response = undefined
    
    vi.spyOn(authService, 'signup').mockRejectedValue(connectionError)

    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    )

    // Fill in valid signup data using label selectors
    fireEvent.change(screen.getByLabelText(/display name/i), { 
      target: { value: 'John Doe' } 
    })
    fireEvent.change(screen.getByLabelText(/username/i), { 
      target: { value: 'john123' } 
    })
    fireEvent.change(screen.getByLabelText(/password/i), { 
      target: { value: 'password123' } 
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

    // Wait for error message - should now show helpful connection error
    await waitFor(() => {
      expect(screen.getByText(/cannot connect to server/i)).toBeInTheDocument()
    })

    const errorMessage = screen.getByText(/cannot connect to server/i).textContent

    // EXPECTED: Error message should be helpful (will fail on unfixed code)
    expect(
      errorMessage.toLowerCase().includes('connect') ||
      errorMessage.toLowerCase().includes('server') ||
      errorMessage.toLowerCase().includes('backend')
    ).toBe(true)

    // EXPECTED: Console should have developer guidance (will fail on unfixed code)
    const hasConsoleGuidance = 
      consoleLogSpy.mock.calls.some(call => 
        call.some(arg => typeof arg === 'string' && arg.includes('backend'))
      ) ||
      consoleErrorSpy.mock.calls.some(call => 
        call.some(arg => typeof arg === 'string' && arg.includes('backend'))
      )

    expect(hasConsoleGuidance).toBe(true)
  })

  /**
   * Concrete Test Case: Network Timeout
   * 
   * Tests that network timeout errors also produce helpful messages.
   */
  it('should display helpful error when network timeout occurs', async () => {
    // Mock signup to simulate network timeout
    const timeoutError = new Error('timeout of 5000ms exceeded')
    timeoutError.code = 'ECONNABORTED'
    timeoutError.response = undefined
    
    vi.spyOn(authService, 'signup').mockRejectedValue(timeoutError)

    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    )

    // Fill in valid signup data using label selectors
    fireEvent.change(screen.getByLabelText(/display name/i), { 
      target: { value: 'Jane Smith' } 
    })
    fireEvent.change(screen.getByLabelText(/username/i), { 
      target: { value: 'jane456' } 
    })
    fireEvent.change(screen.getByLabelText(/password/i), { 
      target: { value: 'securepass' } 
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

    // Wait for error message - should now show helpful connection error
    await waitFor(() => {
      expect(screen.getByText(/cannot connect to server/i)).toBeInTheDocument()
    })

    const errorMessage = screen.getByText(/cannot connect to server/i).textContent

    // EXPECTED: Error message should indicate connection/server issue
    expect(
      errorMessage.toLowerCase().includes('connect') ||
      errorMessage.toLowerCase().includes('server') ||
      errorMessage.toLowerCase().includes('network')
    ).toBe(true)
  })
})


/**
 * Preservation Property Tests
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * **Property 2: Preservation** - Existing Signup Behavior
 * 
 * These tests verify that existing signup behavior works correctly on UNFIXED code.
 * They should PASS on the current code to establish the baseline behavior to preserve.
 * 
 * After implementing the fix, these tests should still PASS to confirm no regressions.
 */

describe('SignupPage - Preservation Properties', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    vi.clearAllMocks()
    mockNavigate.mockClear()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  /**
   * Property 3: Preservation - Successful Signup Flow
   * 
   * Validates: Requirements 3.1, 3.4
   * 
   * For any valid unique credentials, the system should:
   * - Create an account and return a JWT token
   * - Store the token in localStorage
   * - Navigate to the dashboard
   */
  it('Property 3: should successfully create account with valid unique credentials', async () => {
    // Generator for valid signup data
    const validSignupDataArbitrary = fc.record({
      displayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      username: fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length > 0 && !/\s/.test(s)),
      password: fc.string({ minLength: 6, maxLength: 100 }),
    })

    await fc.assert(
      fc.asyncProperty(validSignupDataArbitrary, async (formData) => {
        // Mock successful signup response
        const mockToken = `jwt-token-${Math.random()}`
        const mockUser = {
          id: Math.floor(Math.random() * 10000),
          username: formData.username,
          displayName: formData.displayName,
        }

        vi.spyOn(authService, 'signup').mockResolvedValue({
          token: mockToken,
          user: mockUser,
        })

        const container = document.createElement('div')
        document.body.appendChild(container)

        const { unmount } = render(
          <BrowserRouter>
            <SignupPage />
          </BrowserRouter>,
          { container }
        )

        try {
          // Fill in the form
          const displayNameInput = container.querySelector('input[name="displayName"]')
          const usernameInput = container.querySelector('input[name="username"]')
          const passwordInput = container.querySelector('input[name="password"]')
          const submitButton = container.querySelector('button[type="submit"]')

          fireEvent.change(displayNameInput, { target: { value: formData.displayName } })
          fireEvent.change(usernameInput, { target: { value: formData.username } })
          fireEvent.change(passwordInput, { target: { value: formData.password } })

          // Submit the form
          fireEvent.click(submitButton)

          // Wait for signup to complete
          await waitFor(() => {
            expect(authService.signup).toHaveBeenCalledWith({
              displayName: formData.displayName,
              username: formData.username,
              password: formData.password,
            })
          })

          // Verify token is stored in localStorage
          expect(localStorage.getItem('crewdo-token')).toBe(mockToken)
          
          // Verify user is stored in localStorage
          const storedUser = JSON.parse(localStorage.getItem('crewdo-user'))
          expect(storedUser).toEqual(mockUser)

          // Verify navigation to dashboard
          expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
        } finally {
          unmount()
          document.body.removeChild(container)
        }
      }),
      { numRuns: 10 } // Run 10 test cases with different valid data
    )
  })

  /**
   * Property 4: Preservation - Duplicate Username Error
   * 
   * Validates: Requirements 3.2
   * 
   * For any duplicate username, the system should return "Username already taken" error.
   */
  it('Property 4: should return "Username already taken" error for duplicate usernames', async () => {
    // Generator for signup data
    const signupDataArbitrary = fc.record({
      displayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      username: fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length > 0 && !/\s/.test(s)),
      password: fc.string({ minLength: 6, maxLength: 100 }),
    })

    await fc.assert(
      fc.asyncProperty(signupDataArbitrary, async (formData) => {
        // Mock duplicate username error response
        const duplicateError = new Error('Username already taken')
        duplicateError.response = {
          data: {
            message: 'Username already taken',
          },
        }

        vi.spyOn(authService, 'signup').mockRejectedValue(duplicateError)

        const container = document.createElement('div')
        document.body.appendChild(container)

        const { unmount } = render(
          <BrowserRouter>
            <SignupPage />
          </BrowserRouter>,
          { container }
        )

        try {
          // Fill in the form
          const displayNameInput = container.querySelector('input[name="displayName"]')
          const usernameInput = container.querySelector('input[name="username"]')
          const passwordInput = container.querySelector('input[name="password"]')
          const submitButton = container.querySelector('button[type="submit"]')

          fireEvent.change(displayNameInput, { target: { value: formData.displayName } })
          fireEvent.change(usernameInput, { target: { value: formData.username } })
          fireEvent.change(passwordInput, { target: { value: formData.password } })

          // Submit the form
          fireEvent.click(submitButton)

          // Wait for error to be displayed
          await waitFor(() => {
            const errorElement = container.querySelector('.text-red-300')
            expect(errorElement).not.toBeNull()
          })

          // Verify error message
          const errorText = container.querySelector('.text-red-300').textContent
          expect(errorText).toBe('Username already taken')

          // Verify no token is stored
          expect(localStorage.getItem('crewdo-token')).toBeNull()

          // Verify no navigation occurred
          expect(mockNavigate).not.toHaveBeenCalled()
        } finally {
          unmount()
          document.body.removeChild(container)
        }
      }),
      { numRuns: 10 }
    )
  })

  /**
   * Property 5: Preservation - Validation Error Handling
   * 
   * Validates: Requirements 3.3
   * 
   * For any invalid data (missing fields, short passwords), the system should
   * return appropriate validation error messages.
   */
  it('Property 5: should return validation errors for invalid data', async () => {
    // Generator for validation error scenarios
    const validationErrorArbitrary = fc.oneof(
      // Missing displayName
      fc.record({
        displayName: fc.constant(''),
        username: fc.string({ minLength: 3, maxLength: 30 }),
        password: fc.string({ minLength: 6, maxLength: 100 }),
        expectedError: fc.constant('Display name is required'),
      }),
      // Missing username
      fc.record({
        displayName: fc.string({ minLength: 1, maxLength: 50 }),
        username: fc.constant(''),
        password: fc.string({ minLength: 6, maxLength: 100 }),
        expectedError: fc.constant('Username is required'),
      }),
      // Short password
      fc.record({
        displayName: fc.string({ minLength: 1, maxLength: 50 }),
        username: fc.string({ minLength: 3, maxLength: 30 }),
        password: fc.string({ minLength: 1, maxLength: 5 }),
        expectedError: fc.constant('Password must be at least 6 characters'),
      })
    )

    await fc.assert(
      fc.asyncProperty(validationErrorArbitrary, async (testCase) => {
        // Mock validation error response
        const validationError = new Error(testCase.expectedError)
        validationError.response = {
          data: {
            message: testCase.expectedError,
          },
        }

        vi.spyOn(authService, 'signup').mockRejectedValue(validationError)

        const container = document.createElement('div')
        document.body.appendChild(container)

        const { unmount } = render(
          <BrowserRouter>
            <SignupPage />
          </BrowserRouter>,
          { container }
        )

        try {
          // Fill in the form
          const displayNameInput = container.querySelector('input[name="displayName"]')
          const usernameInput = container.querySelector('input[name="username"]')
          const passwordInput = container.querySelector('input[name="password"]')
          const submitButton = container.querySelector('button[type="submit"]')

          fireEvent.change(displayNameInput, { target: { value: testCase.displayName } })
          fireEvent.change(usernameInput, { target: { value: testCase.username } })
          fireEvent.change(passwordInput, { target: { value: testCase.password } })

          // Submit the form
          fireEvent.click(submitButton)

          // Wait for error to be displayed
          await waitFor(() => {
            const errorElement = container.querySelector('.text-red-300')
            expect(errorElement).not.toBeNull()
          })

          // Verify error message is displayed
          const errorText = container.querySelector('.text-red-300').textContent
          expect(errorText).toBe(testCase.expectedError)

          // Verify no token is stored
          expect(localStorage.getItem('crewdo-token')).toBeNull()

          // Verify no navigation occurred
          expect(mockNavigate).not.toHaveBeenCalled()
        } finally {
          unmount()
          document.body.removeChild(container)
        }
      }),
      { numRuns: 10 }
    )
  })

  /**
   * Concrete Test: Successful Signup with Specific Data
   * 
   * Validates: Requirements 3.1, 3.4
   */
  it('should successfully create account and navigate to dashboard', async () => {
    const mockToken = 'test-jwt-token-123'
    const mockUser = {
      id: 1,
      username: 'testuser',
      displayName: 'Test User',
    }

    vi.spyOn(authService, 'signup').mockResolvedValue({
      token: mockToken,
      user: mockUser,
    })

    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    )

    // Fill in valid signup data
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

    // Wait for signup to complete
    await waitFor(() => {
      expect(authService.signup).toHaveBeenCalledWith({
        displayName: 'Test User',
        username: 'testuser',
        password: 'password123',
      })
    })

    // Verify token is stored
    expect(localStorage.getItem('crewdo-token')).toBe(mockToken)

    // Verify user is stored
    const storedUser = JSON.parse(localStorage.getItem('crewdo-user'))
    expect(storedUser).toEqual(mockUser)

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  /**
   * Concrete Test: Duplicate Username Error
   * 
   * Validates: Requirements 3.2
   */
  it('should display "Username already taken" error for duplicate username', async () => {
    const duplicateError = new Error('Username already taken')
    duplicateError.response = {
      data: {
        message: 'Username already taken',
      },
    }

    vi.spyOn(authService, 'signup').mockRejectedValue(duplicateError)

    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    )

    // Fill in signup data
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'existinguser' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Username already taken')).toBeInTheDocument()
    })

    // Verify no token is stored
    expect(localStorage.getItem('crewdo-token')).toBeNull()

    // Verify no navigation occurred
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  /**
   * Concrete Test: Validation Error for Short Password
   * 
   * Validates: Requirements 3.3
   */
  it('should display validation error for short password', async () => {
    const validationError = new Error('Password must be at least 6 characters')
    validationError.response = {
      data: {
        message: 'Password must be at least 6 characters',
      },
    }

    vi.spyOn(authService, 'signup').mockRejectedValue(validationError)

    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    )

    // Fill in signup data with short password
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Jane Doe' },
    })
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'janedoe' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '12345' },
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })

    // Verify no token is stored
    expect(localStorage.getItem('crewdo-token')).toBeNull()

    // Verify no navigation occurred
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
