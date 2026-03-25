import axios from "axios";

// Create instance
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// ─── REQUEST INTERCEPTOR ─────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("crewdo_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("crewdo_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── AUTH API ────────────────────────────────────────
export const authAPI = {
  register: async (data) => (await api.post("/auth/register", data)).data,

  login: async (data) => {
    const res = await api.post("/auth/login", data);

    if (res.data?.token) {
      localStorage.setItem("crewdo_token", res.data.token);
    }

    return res.data;
  },

  logout: async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("crewdo_token");
  },

  me: async () => (await api.get("/auth/me")).data,
};

// ✅ BACKWARD COMPATIBILITY EXPORTS
export const loginUser = authAPI.login;
export const registerUser = authAPI.register;

// ─── CLAN API ────────────────────────────────────────
export const clanAPI = {
  getMyClans: async () => (await api.get("/clans/my")).data,
  getClan: async (id) => (await api.get(`/clans/${id}`)).data,
  createClan: async (data) => (await api.post("/clans", data)).data,
  joinClan: async (inviteCode) =>
    (await api.post("/clans/join", { inviteCode })).data,
  leaveClan: async () => (await api.delete("/clans/leave")).data,
  getLeaderboard: async () =>
    (await api.get("/clans/leaderboard")).data,
  getStreakHistory: async (id) =>
    (await api.get(`/clans/${id}/streak-history`)).data,
  updateTask: async (id, data) =>
    (await api.patch(`/clans/${id}/task`, data)).data,
};

// ✅ BACKWARD COMPATIBILITY EXPORT
export const createClan = clanAPI.createClan;

// ─── PROOF API ───────────────────────────────────────
export const proofAPI = {
  submit: async (formData) =>
    (
      await api.post("/proof/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ).data,

  myProofs: async () => (await api.get("/proof/my")).data,
  todayFeed: async () => (await api.get("/proof/today")).data,
  pending: async () => (await api.get("/proof/pending")).data,
  clanProofs: async (clanId) =>
    (await api.get(`/proof/clan/${clanId}`)).data,
  approve: async (id) =>
    (await api.post(`/proof/${id}/approve`)).data,
  reject: async (id) =>
    (await api.post(`/proof/${id}/reject`)).data,
  delete: async (id) =>
    (await api.delete(`/proof/${id}`)).data,
};

export default api;