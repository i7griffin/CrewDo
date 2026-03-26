import apiClient from './apiClient'

export const submitProof = async (clanId, file, habitType = 'Workout', taskId) => {
  const formData = new FormData()
  formData.append('proof', file)
  formData.append('habitType', habitType)
  formData.append('taskId', taskId)

  const { data } = await apiClient.post(`/proof/${clanId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const getTodayCompletions = async (clanId) => {
  const { data } = await apiClient.get(`/proof/my/today/${clanId}`)
  return data.completedTaskIds || []
}

export const getClanStreak = async (clanId) => {
  const { data } = await apiClient.get(`/clans/${clanId}/streak`)
  return data
}
