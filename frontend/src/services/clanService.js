import axios from 'axios';
import { authHeader } from './authService';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

/**
 * Fetch all clans/groups the current user belongs to.
 */
export const getMyClan = async () => {
  const res = await axios.get(`${API_URL}/clans/mine`, authHeader());
  return res.data;
};

/**
 * Fetch a specific clan by its ID.
 * @param {string} clanId
 */
export const getClanById = async (clanId) => {
  const res = await axios.get(`${API_URL}/clans/${clanId}`, authHeader());
  return res.data;
};

/**
 * Create a new clan/group.
 * @param {{ name: string, type: string }} payload
 */
export const createClan = async ({ name, type }) => {
  const res = await axios.post(`${API_URL}/clans`, { name, type }, authHeader());
  return res.data;
};

/**
 * Join a clan using an invite code.
 * @param {string} code
 */
export const joinClan = async (code) => {
  const res = await axios.post(`${API_URL}/clans/join`, { code }, authHeader());
  return res.data;
};

/**
 * Fetch all members of a specific clan.
 * @param {string} clanId
 */
export const getClanMembers = async (clanId) => {
  const res = await axios.get(`${API_URL}/clans/${clanId}/members`, authHeader());
  return res.data;
};

/**
 * Submit a completed task for the current user in a clan.
 * @param {string} clanId
 * @param {{ taskType: string, proofUrl?: string }} payload
 */
export const submitTask = async (clanId, { taskType, proofUrl }) => {
  const res = await axios.post(
    `${API_URL}/clans/${clanId}/tasks`,
    { taskType, proofUrl },
    authHeader()
  );
  return res.data;
};

/**
 * Fetch today's progress (core energy %) for a clan.
 * @param {string} clanId
 */
export const getDailyProgress = async (clanId) => {
  const res = await axios.get(`${API_URL}/clans/${clanId}/progress`, authHeader());
  return res.data;
};

/**
 * Send a chat message to a clan's chat room.
 * @param {string} clanId
 * @param {string} text
 */
export const sendChatMessage = async (clanId, text) => {
  const res = await axios.post(
    `${API_URL}/clans/${clanId}/chat`,
    { text },
    authHeader()
  );
  return res.data;
};

/**
 * Fetch chat history for a clan.
 * @param {string} clanId
 */
export const getChatMessages = async (clanId) => {
  const res = await axios.get(`${API_URL}/clans/${clanId}/chat`, authHeader());
  return res.data;
};