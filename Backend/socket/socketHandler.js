const { getRedisClient } = require("../config/redis");
const { randomUUID } = require("crypto");

// In-memory fallback for tracking room participants
const memoryRooms = {};

const addParticipant = async (roomId, socketId, name) => {
  const redis = getRedisClient();
  if (redis) {
    await redis.hSet(`room:${roomId}`, socketId, name || "Guest");
    await redis.expire(`room:${roomId}`, 86400); // 24-hour expiration safety
  } else {
    if (!memoryRooms[roomId]) {
      memoryRooms[roomId] = {};
    }
    memoryRooms[roomId][socketId] = name || "Guest";
  }
};

const removeParticipant = async (roomId, socketId) => {
  const redis = getRedisClient();
  if (redis) {
    await redis.hDel(`room:${roomId}`, socketId);
  } else {
    if (memoryRooms[roomId]) {
      delete memoryRooms[roomId][socketId];
      if (Object.keys(memoryRooms[roomId]).length === 0) {
        delete memoryRooms[roomId];
      }
    }
  }
};

const getParticipants = async (roomId) => {
  const redis = getRedisClient();
  if (redis) {
    return await redis.hGetAll(`room:${roomId}`) || {};
  } else {
    return memoryRooms[roomId] || {};
  }
};

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    // Track active rooms for this socket to clean up on disconnect
    const joinedRooms = new Set();

    // 1. Room Join
    socket.on("room:join", async ({ roomId, userName }) => {
      if (!roomId || typeof roomId !== "string") return;
      
      socket.join(roomId);
      joinedRooms.add(roomId);
      
      const name = userName || "Guest";
      await addParticipant(roomId, socket.id, name);
      console.log(`Socket ${socket.id} (${name}) joined room ${roomId}`);

      // Fetch all participants currently in the room
      const participants = await getParticipants(roomId);

      // Tell the newcomer who is already in the room
      socket.emit("room:participants", { participants });

      // Tell existing participants that a new user joined
      socket.to(roomId).emit("user:joined", {
        socketId: socket.id,
        userName: name
      });
    });

    // 2. Room Leave
    socket.on("room:leave", async ({ roomId }) => {
      if (!roomId || typeof roomId !== "string") return;

      socket.leave(roomId);
      joinedRooms.delete(roomId);
      await removeParticipant(roomId, socket.id);
      console.log(`Socket ${socket.id} left room ${roomId}`);

      // Notify other participants
      socket.to(roomId).emit("user:left", { socketId: socket.id });
    });

    // 3. Chat Message
    socket.on("chat:message", (payload) => {
      if (!payload || typeof payload !== "object") return;
      const { roomId, author, text } = payload;
      if (typeof roomId !== "string" || typeof author !== "string" || typeof text !== "string") return;

      const trimmed = text.trim().slice(0, 2000);
      if (!trimmed) return;

      const id = typeof payload.id === "string" ? payload.id : randomUUID();
      const ts = Date.now();

      // Broadcast message to everyone in the room
      io.to(roomId).emit("chat:message", { roomId, id, author, text: trimmed, ts });
    });

    // 4. Chat Typing Indicators
    socket.on("chat:typing", (payload) => {
      if (!payload || typeof payload !== "object") return;
      const { roomId, author, typing } = payload;
      if (typeof roomId !== "string" || typeof author !== "string" || typeof typing !== "boolean") return;

      // Broadcast typing state to everyone in the room EXCEPT the sender
      socket.to(roomId).emit("chat:typing", { roomId, author, typing, socketId: socket.id });
    });

    // 5. WebRTC Signaling Relays
    const SIGNAL_EVENTS = ["signal:offer", "signal:answer", "signal:ice"];
    for (const ev of SIGNAL_EVENTS) {
      socket.on(ev, (payload) => {
        if (!payload || typeof payload !== "object") return;
        const { roomId, targetSocketId } = payload;
        if (typeof roomId !== "string" || !roomId) return;

        // If targeted, relay specifically to the target socket
        if (targetSocketId) {
          io.to(targetSocketId).emit(ev, {
            ...payload,
            fromSocketId: socket.id
          });
        } else {
          // Fallback: broadcast to other sockets in the room
          socket.to(roomId).emit(ev, {
            ...payload,
            fromSocketId: socket.id
          });
        }
      });
    }

    // 6. Disconnect Cleanup
    socket.on("disconnecting", async () => {
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          await removeParticipant(roomId, socket.id);
          socket.to(roomId).emit("user:left", { socketId: socket.id });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("User Disconnected:", socket.id);
    });
  });
};

module.exports = socketHandler;