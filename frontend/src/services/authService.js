import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

/**
 * Register a new user.
 * @param {{ username: string, password: string }} credentials
 */
export const register = async ({ username, password }) => {
  const res = await axios.post(`${API_URL}/auth/register`, { username, password });
  return res.data;
};

/**
 * Log in an existing user.
 * Stores the JWT token in localStorage.
 * @param {{ username: string, password: string }} credentials
 */
export const login = async ({ username, password }) => {
  const res = await axios.post(`${API_URL}/auth/login`, { username, password });
  const { token, user } = res.data;
  if (token) localStorage.setItem('crewdo_token', token);
  return { token, user };
};

/**
 * Log out the current user by clearing the stored token.
 */
export const logout = () => {
  localStorage.removeItem('crewdo_token');
};

/**
 * Return the stored auth token (or null if not logged in).
 */
export const getToken = () => localStorage.getItem('crewdo_token');

/**
 * Return an axios config object with the Authorization header pre-filled.
 */
export const authHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

/**
 * Fetch the current logged-in user's profile.
 */
export const getMe = async () => {
  const res = await axios.get(`${API_URL}/auth/me`, authHeader());
  return res.data;
};