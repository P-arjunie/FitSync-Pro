require("dotenv").config();
const WebSocket = require("ws");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// === ✅ Connect to MongoDB ===
const MONGODB_URI = process.env.MONGODB_URI;
mongoose
  .connect(MONGODB_URI, { dbName: "fit-sync" })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Error", err));

// === ✅ Load Mongoose Models ===
const User = require("./models/User");     // Adjust path if needed
const Message = require("./models/Message"); // MongoDB model for messages

// === 🧠 In-Memory WebSocket Users ===
const users = new Map(); // userId -> { ws, userType, userName, isOnline }

const wss = new WebSocket.Server({ port: 3001 }, () => {
  console.log("🚀 WebSocket server running on ws://localhost:3001");
});

// === 🔌 Handle Client Connection ===
wss.on("connection", (ws) => {
  console.log("📥 New client connected");

  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "register":
          await handleRegister(ws, message);
          break;
        case "send_message":
          await handleSendMessage(ws, message);
          break;
        case "get_chat_history":
          await handleGetChatHistory(ws, message);
          break;
        default:
          console.log("❓ Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("❌ Error parsing message:", error);
    }
  });

  ws.on("close", () => {
    handleDisconnect(ws);
    console.log("❌ Client disconnected");
  });
});

// === 👤 Register Trainer or Member ===
async function handleRegister(ws, { userId, userType, userName }) {
  users.set(userId, {
    ws,
    userType,
    userName,
    isOnline: true,
  });

  console.log(`✅ ${userType} ${userName} (${userId}) registered`);

  try {
    if (userType === "trainer") {
      const members = await User.find({ role: "member" });
      const membersWithStatus = members.map((m) => ({
        id: m._id.toString(),
        name: m.name,
        isOnline: users.has(m._id.toString()) && users.get(m._id.toString()).isOnline,
        unreadCount: 0,
      }));

      ws.send(JSON.stringify({ type: "members_list", members: membersWithStatus }));
    } else if (userType === "member") {
      const trainers = await User.find({ role: "trainer" });
      const trainersWithStatus = trainers.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        specialty: t.specialization || "Trainer",
        isOnline: users.has(t._id.toString()) && users.get(t._id.toString()).isOnline,
        unreadCount: 0,
      }));

      ws.send(JSON.stringify({ type: "trainers_list", trainers: trainersWithStatus }));
    }
  } catch (err) {
    console.error("❌ DB error during registration:", err);
  }

  broadcastUserStatus(userId, true);
}

// === 💬 Handle Send Message ===
async function handleSendMessage(ws, { message, recipientId }) {
  const fullMessage = {
    ...message,
    id: uuidv4(),
    timestamp: new Date(),
  };

  try {
    await Message.create(fullMessage); // Save to MongoDB
  } catch (err) {
    console.error("❌ Failed to save message to DB:", err);
  }

  // Send to sender
  ws.send(JSON.stringify({ type: "message", message: fullMessage }));

  // Send to recipient
  const recipient = users.get(recipientId);
  if (recipient && recipient.isOnline && recipient.ws.readyState === WebSocket.OPEN) {
    recipient.ws.send(JSON.stringify({ type: "message", message: fullMessage }));
  }

  console.log(`📤 ${fullMessage.senderName} -> ${recipientId}: ${fullMessage.text}`);
}

// === 📜 Handle Chat History ===
async function handleGetChatHistory(ws, { roomId }) {
  try {
    const chat = await Message.find({ roomId }).sort({ timestamp: 1 });
    ws.send(JSON.stringify({ type: "chat_history", messages: chat }));
  } catch (err) {
    console.error("❌ Failed to fetch chat history:", err);
  }
}

// === 🔌 Handle Disconnect ===
function handleDisconnect(ws) {
  for (const [userId, userData] of users.entries()) {
    if (userData.ws === ws) {
      userData.isOnline = false;
      users.delete(userId);
      broadcastUserStatus(userId, false);
      break;
    }
  }
}

// === 📡 Broadcast Online/Offline Status ===
function broadcastUserStatus(userId, isOnline) {
  const statusMessage = JSON.stringify({
    type: "user_status",
    userId,
    isOnline,
    lastSeen: isOnline ? null : new Date(),
  });

  users.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(statusMessage);
    }
  });
}
