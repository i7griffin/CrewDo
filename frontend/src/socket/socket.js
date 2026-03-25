import { io } from "socket.io-client";

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io("/", {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () =>
    console.log("🔌 Socket connected:", socket.id)
  );
  socket.on("disconnect", (reason) =>
    console.log("🔌 Socket disconnected:", reason)
  );
  socket.on("connect_error", (err) =>
    console.error("Socket error:", err.message)
  );

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// ─── GENERIC EMIT ─────────────────────────
export const emit = (event, data) => {
  if (socket?.connected) socket.emit(event, data);
};

// ─── CLAN EVENTS ─────────────────────────
export const joinClanRoom = (clanId) =>
  emit("join_clan", clanId);

export const leaveClanRoom = (clanId) =>
  emit("leave_clan", clanId);

export const startActivity = (data) =>
  emit("activity:started", data);

// ─── ✅ CHAT FUNCTIONS (THIS WAS MISSING) ─────────────

// Send message
export const sendChatMessage = (clanId, message) => {
  emit("chat:send", { clanId, message });
};

// Listen for messages
export const onChatMessage = (callback) => {
  if (!socket) return;
  socket.on("chat:message", callback);
};

// Remove listener (cleanup)
export const offChatMessage = () => {
  if (!socket) return;
  socket.off("chat:message");
};