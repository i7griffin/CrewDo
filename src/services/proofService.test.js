import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitProof, getTodayCompletions, getClanStreak } from './proofService'
import apiClient from './apiClient'

vi.mock('./apiClient')

describe('proofService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('submitProof', () => {
    it('should include taskId in FormData when submitting proof', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const clanId = 'clan123'
      const habitType = 'Workout'
      const taskId = 'task456'

      apiClient.post.mockResolvedValue({
        data: {
          proof: {
            id: 'proof789',
            clanId,
            habitType,
            taskId,
            verified: true,
          },
        },
      })

      await submitProof(clanId, mockFile, habitType, taskId)

      expect(apiClient.post).toHaveBeenCalledWith(
        `/proof/${clanId}`,
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      const formData = apiClient.post.mock.calls[0][1]
      expect(formData.get('taskId')).toBe(taskId)
      expect(formData.get('habitType')).toBe(habitType)
      expect(formData.get('proof')).toBe(mockFile)
    })

    it('should use default habitType if not provided', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const clanId = 'clan123'
      const taskId = 'task456'

      apiClient.post.mockResolvedValue({
        data: { proof: { id: 'proof789' } },
      })

      await submitProof(clanId, mockFile, undefined, taskId)

      const formData = apiClient.post.mock.calls[0][1]
      expect(formData.get('habitType')).toBe('Workout')
    })

    it('should return proof data from API response', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockResponse = {
        proof: {
          id: 'proof789',
          clanId: 'clan123',
          habitType: 'Study',
          taskId: 'task456',
          verified: true,
        },
      }

      apiClient.post.mockResolvedValue({ data: mockResponse })

      const result = await submitProof('clan123', mockFile, 'Study', 'task456')

      expect(result).toEqual(mockResponse)
    })
  })

  describe('getTodayCompletions', () => {
    it('should fetch completed task IDs for a clan', async () => {
      const clanId = 'clan123'
      const mockCompletedTaskIds = ['task1', 'task2', 'task3']

      apiClient.get.mockResolvedValue({
        data: { completedTaskIds: mockCompletedTaskIds },
      })

      const result = await getTodayCompletions(clanId)

      expect(apiClient.get).toHaveBeenCalledWith(`/proof/my/today/${clanId}`)
      expect(result).toEqual(mockCompletedTaskIds)
    })

    it('should return empty array if no completedTaskIds in response', async () => {
      const clanId = 'clan123'

      apiClient.get.mockResolvedValue({
        data: {},
      })

      const result = await getTodayCompletions(clanId)

      expect(result).toEqual([])
    })

    it('should return empty array if completedTaskIds is null', async () => {
      const clanId = 'clan123'

      apiClient.get.mockResolvedValue({
        data: { completedTaskIds: null },
      })

      const result = await getTodayCompletions(clanId)

      expect(result).toEqual([])
    })
  })

  describe('getClanStreak', () => {
    it('should fetch clan streak data', async () => {
      const clanId = 'clan123'
      const mockStreakData = { streak: 5, dailyProgress: 80 }

      apiClient.get.mockResolvedValue({
        data: mockStreakData,
      })

      const result = await getClanStreak(clanId)

      expect(apiClient.get).toHaveBeenCalledWith(`/clans/${clanId}/streak`)
      expect(result).toEqual(mockStreakData)
    })
  })
})
