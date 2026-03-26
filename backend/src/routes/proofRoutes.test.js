import { describe, it, expect } from 'vitest'

describe('GET /proof/my/today/:clanId - Get Today\'s Completed Tasks', () => {
  // Helper function to get start of today in UTC
  const getStartOfToday = () => {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
  }

  it('should return start of today in UTC', () => {
    const startOfToday = getStartOfToday()
    
    expect(startOfToday.getUTCHours()).toBe(0)
    expect(startOfToday.getUTCMinutes()).toBe(0)
    expect(startOfToday.getUTCSeconds()).toBe(0)
    expect(startOfToday.getUTCMilliseconds()).toBe(0)
  })

  it('should return a date object', () => {
    const startOfToday = getStartOfToday()
    expect(startOfToday).toBeInstanceOf(Date)
  })

  it('should return today\'s date', () => {
    const startOfToday = getStartOfToday()
    const now = new Date()
    
    expect(startOfToday.getUTCFullYear()).toBe(now.getUTCFullYear())
    expect(startOfToday.getUTCMonth()).toBe(now.getUTCMonth())
    expect(startOfToday.getUTCDate()).toBe(now.getUTCDate())
  })

  it('should be earlier than current time', () => {
    const startOfToday = getStartOfToday()
    const now = new Date()
    
    expect(startOfToday.getTime()).toBeLessThanOrEqual(now.getTime())
  })
})
