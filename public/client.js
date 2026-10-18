const socket = io();
const messages = document.getElementById("messages");
const emptyState = document.getElementById("emptyState");
const chatTitle = document.getElementById("chatTitle");
const chatSubtitle = document.getElementById("chatSubtitle");
const statusPill = document.getElementById("statusPill");
const notice = document.getElementById("notice");
const messageInput = document.getElementById("messageInput");
const chatForm = document.getElementById("chatForm");
const sendButton = document.getElementById("sendButton");
const findButton = document.getElementById("findButton");
const nextButton = document.getElementById("nextButton");
const reportButton = document.getElementById("reportButton");

let connectedToStranger = false;
document.getElementById("year").textContent = new Date().getFullYear();

function setNotice(text, alert = false) {
  notice.textContent = text;
  notice.classList.toggle("alert", alert);
}
function setStatus(status, subtitle) {
  statusPill.textContent = status;
  statusPill.classList.toggle("live", status === "CONNECTED");
  chatSubtitle.textContent = subtitle;
}
function clearMessages() {
  messages.innerHTML = "";
  messages.appendChild(emptyState);
  emptyState.style.display = "block";
}
function addMessage(text, sender) {
  emptyState.style.display = "none";
  const bubble = document.createElement("div");
  bubble.className = `message ${sender}`;
  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = sender === "you" ? "YOU" : "STRANGER";
  const body = document.createElement("span");
  body.textContent = text;
  bubble.append(label, body);
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
}
function enableChat(enabled) {
  connectedToStranger = enabled;
  messageInput.disabled = !enabled;
  sendButton.disabled = !enabled;
  nextButton.disabled = !enabled;
  reportButton.disabled = !enabled;
  findButton.disabled = enabled;
  messageInput.placeholder = enabled ? "Write a message…" : "Find a stranger to start chatting…";
  if (enabled) messageInput.focus();
}

socket.on("welcome", () => setNotice("Connected to server. Be respectful and protect your privacy."));
socket.on("waiting", () => {
  enableChat(false);
  clearMessages();
  setStatus("SEARCHING", "Looking for someone to chat with…");
  setNotice("Waiting for another person. Keep this page open.");
  findButton.disabled = true;
});
socket.on("matched", () => {
  enableChat(true);
  clearMessages();
  setStatus("CONNECTED", "You are chatting one-to-one");
  setNotice("You're connected. Never share private or identifying information.");
});
socket.on("new-message", (data) => {
  if (typeof data.text === "string") addMessage(data.text, data.sender === "you" ? "you" : "stranger");
});
socket.on("chat-ended", (data) => {
  enableChat(false);
  setStatus("DISCONNECTED", "You are not connected");
  setNotice(data.message || "Chat ended. Find another stranger when you're ready.");
  findButton.disabled = false;
});
socket.on("chat-warning", (data) => setNotice(data.message, true));
socket.on("disconnect", () => {
  enableChat(false);
  setStatus("RECONNECTING", "Connection lost");
  setNotice("Connection lost. Trying to reconnect…", true);
  findButton.disabled = true;
});
socket.on("connect", () => {
  findButton.disabled = false;
  if (!connectedToStranger) setStatus("ONLINE", "Ready to find a stranger");
});

findButton.addEventListener("click", () => {
  clearMessages();
  setNotice("Searching for another person…");
  socket.emit("find-stranger");
});
nextButton.addEventListener("click", () => {
  clearMessages();
  setNotice("Leaving this chat and looking for someone new…");
  socket.emit("next-stranger");
});
reportButton.addEventListener("click", () => {
  const confirmed = window.confirm("Report this chat and leave? Use this if the person is inappropriate or makes you uncomfortable.");
  if (confirmed) {
    enableChat(false);
    socket.emit("report-stranger", "User selected report / leave");
  }
});
chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !connectedToStranger) return;
  socket.emit("send-message", text);
  messageInput.value = "";
  messageInput.focus();
});
