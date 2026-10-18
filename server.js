const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e4
});

const PORT = process.env.PORT || 10000;
const waiting = [];
const partnerOf = new Map();
const blockedPairs = new Set();
const messageTimes = new Map();

app.use(express.static("public"));
app.get("/health", (_req, res) => res.json({ ok: true }));

function pairKey(a, b) {
  return [a, b].sort().join(":");
}
function removeFromQueue(id) {
  const index = waiting.indexOf(id);
  if (index !== -1) waiting.splice(index, 1);
}
function endChat(id, notice = "Your chat has ended.") {
  const partner = partnerOf.get(id);
  partnerOf.delete(id);
  removeFromQueue(id);
  if (partner) {
    partnerOf.delete(partner);
    const peer = io.sockets.sockets.get(partner);
    if (peer) peer.emit("chat-ended", { message: notice });
  }
}
function findPartner(id) {
  removeFromQueue(id);
  const socket = io.sockets.sockets.get(id);
  if (!socket) return;

  for (let i = 0; i < waiting.length; i++) {
    const candidateId = waiting[i];
    const candidate = io.sockets.sockets.get(candidateId);
    if (!candidate || candidateId === id) {
      waiting.splice(i--, 1);
      continue;
    }
    if (blockedPairs.has(pairKey(id, candidateId))) continue;

    waiting.splice(i, 1);
    partnerOf.set(id, candidateId);
    partnerOf.set(candidateId, id);
    socket.emit("matched");
    candidate.emit("matched");
    return;
  }
  waiting.push(id);
  socket.emit("waiting");
}

io.on("connection", (socket) => {
  socket.emit("welcome", { message: "Welcome. Be respectful and protect your privacy." });

  socket.on("find-stranger", () => {
    endChat(socket.id, "The other person has left the chat.");
    findPartner(socket.id);
  });

  socket.on("send-message", (raw) => {
    const partnerId = partnerOf.get(socket.id);
    if (!partnerId) return;
    const text = typeof raw === "string" ? raw.trim() : "";
    if (!text || text.length > 500) return;

    // Basic anti-spam limit: at most one message every 700 ms per connection.
    const now = Date.now();
    const last = messageTimes.get(socket.id) || 0;
    if (now - last < 700) {
      socket.emit("chat-warning", { message: "Please slow down a little." });
      return;
    }
    messageTimes.set(socket.id, now);

    const peer = io.sockets.sockets.get(partnerId);
    if (peer) peer.emit("new-message", { text, sender: "stranger", time: now });
    socket.emit("new-message", { text, sender: "you", time: now });
  });

  socket.on("next-stranger", () => {
    endChat(socket.id, "The other person moved to a new chat.");
    findPartner(socket.id);
  });

  socket.on("report-stranger", (reason) => {
    const partnerId = partnerOf.get(socket.id);
    if (!partnerId) {
      socket.emit("chat-warning", { message: "You are not currently in a chat." });
      return;
    }
    // Starter implementation: report events are logged on the server only.
    // Add a persistent moderation queue and admin review before public launch.
    console.log("REPORT", {
      reporterSocket: socket.id,
      reportedSocket: partnerId,
      reason: typeof reason === "string" ? reason.slice(0, 80) : "unspecified",
      at: new Date().toISOString()
    });
    blockedPairs.add(pairKey(socket.id, partnerId));
    endChat(socket.id, "This chat has ended.");
    socket.emit("chat-warning", { message: "Report submitted for this session. You have been disconnected." });
    findPartner(socket.id);
  });

  socket.on("disconnect", () => {
    endChat(socket.id, "The other person disconnected.");
    messageTimes.delete(socket.id);
    removeFromQueue(socket.id);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Stranger chat server listening on port ${PORT}`);
});
