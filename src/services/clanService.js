import apiClient from './apiClient'

export const getUserClans = async () => {
  const { data } = await apiClient.get('/clans/my')
  return data
}

export const getClan = async (clanId) => {
  const { data } = await apiClient.get(`/clans/${clanId}`)
  return data
}

export const createClan = async (payload) => {
  const { data } = await apiClient.post('/clans', payload)
  return data
}

export const joinClan = async (payload) => {
  const { data } = await apiClient.post('/clans/join', payload)
  return data
}

export const leaveClan = async (clanId) => {
  const { data } = await apiClient.post(`/clans/${clanId}/leave`)
  return data
}

export const transferOwnership = async (clanId, newOwnerId) => {
  const { data } = await apiClient.post(`/clans/${clanId}/transfer-ownership`, { newOwnerId })
  return data
}

export const getClanTasks = async (clanId) => {
  const { data } = await apiClient.get(`/clans/${clanId}/tasks`)
  return data
}

export const createClanTask = async (clanId, taskData) => {
  const { data } = await apiClient.post(`/clans/${clanId}/tasks`, taskData)
  return data
}
