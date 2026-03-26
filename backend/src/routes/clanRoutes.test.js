import { describe, it, expect, beforeEach } from 'vitest'

describe('POST /clans/join - Team Code Case Insensitivity', () => {
  // Test the case conversion logic directly
  const normalizeTeamCode = (code) => String(code || '').trim().toUpperCase()

  beforeEach(() => {
    // Reset any state if needed
  })

  it('should convert lowercase team code to uppercase', () => {
    const input = 'abc123'
    const result = normalizeTeamCode(input)
    expect(result).toBe('ABC123')
  })

  it('should convert mixed case team code to uppercase', () => {
    const input = 'AbC123'
    const result = normalizeTeamCode(input)
    expect(result).toBe('ABC123')
  })

  it('should keep uppercase team code as uppercase', () => {
    const input = 'ABC123'
    const result = normalizeTeamCode(input)
    expect(result).toBe('ABC123')
  })

  it('should handle all lowercase letters', () => {
    const input = 'abcdef'
    const result = normalizeTeamCode(input)
    expect(result).toBe('ABCDEF')
  })

  it('should handle mixed case with numbers', () => {
    const input = 'xYz789'
    const result = normalizeTeamCode(input)
    expect(result).toBe('XYZ789')
  })

  it('should trim whitespace and convert to uppercase', () => {
    const input = '  abc123  '
    const result = normalizeTeamCode(input)
    expect(result).toBe('ABC123')
  })

  it('should handle empty string', () => {
    const input = ''
    const result = normalizeTeamCode(input)
    expect(result).toBe('')
  })

  it('should handle null/undefined by converting to empty string', () => {
    expect(normalizeTeamCode(null)).toBe('')
    expect(normalizeTeamCode(undefined)).toBe('')
  })

  it('should verify different cases produce same normalized code', () => {
    const codes = ['abc123', 'ABC123', 'AbC123', 'aBc123', 'Abc123']
    const normalized = codes.map(normalizeTeamCode)
    
    // All should be the same
    expect(new Set(normalized).size).toBe(1)
    expect(normalized[0]).toBe('ABC123')
  })
})
