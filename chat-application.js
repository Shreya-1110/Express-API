// server.js
// Single-file Socket.io chat server + client page
// Usage:
//   1) npm init -y
//   2) npm install express socket.io
//   3) node server.js
// Open http://localhost:3000 in multiple browser tabs to test.

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// In-memory user storage: socketId -> { username }
const users = new Map();

// Serve single client HTML from root
app.get("/", (req, res) => {
  res.type("html").send(`
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Single-file Chat (Socket.io)</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    :root { --bg:#f7f9fc; --card:#ffffff; --accent:#1976d2; --muted:#666; }
    body{font-family:Inter,system-ui,Arial;margin:0;background:var(--bg);color:#111}
    .wrap{max-width:980px;margin:28px auto;padding:12px}
    .card{background:var(--card);border-radius:10px;padding:16px;box-shadow:0 1px 6px rgba(0,0,0,0.04);border:1px solid #eee}
    .status{color:green;margin-top:6px}
    .row{display:flex;gap:12px}
    .messages{height:360px;overflow:auto;background:#fafafa;padding:12px;border-radius:8px;border:1px solid #f0f0f0;display:flex;flex-direction:column;gap:8px}
    .msg{align-self:flex-start;background:#fff;padding:8px;border-radius:8px;border:1px solid #eee;max-width:85%}
    .my{align-self:flex-end;background:#e3f2fd;padding:8px;border-radius:8px;border:1px solid #bbdefb;max-width:85%}
    .sys{align-self:center;color:var(--muted);font-size:13px}
    .controls{display:flex;gap:8px;margin-top:8px}
    input[type=text]{padding:8px;border-radius:8px;border:1px solid #ddd;flex:1}
    button{background:var(--accent);color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer}
    .sidebar{border:1px solid #eee;border-radius:8px;padding:8px;width:220px}
    ul{margin:0;padding-left:18px}
    .meta{font-size:13px;color:var(--muted);margin-top:8px}
    @media(max-width:800px){ .row{flex-direction:column} .sidebar{width:100%} }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h2 style="margin:0">Realtime Chat — Single-file App</h2>
      <div id="status" class="meta">Connecting…</div>

      <div id="joinArea" style="margin-top:12px">
        <form id="joinForm" style="display:flex;gap:8px">
          <input id="nameInput" type="text" placeholder="Enter your name" required />
          <button type="submit">Join Chat</button>
        </form>
        <div class="meta">Open this page in multiple tabs to test real-time messaging.</div>
      </div>

      <div id="chatArea" style="display:none;margin-top:12px">
        <div style="display:grid;grid-template-columns:1fr 220px;gap:12px">
          <div style="display:flex;flex-direction:column">
            <div id="messages" class="messages" aria-live="polite"></div>

            <form id="msgForm" class="controls" onsubmit="return false;">
              <input id="msgInput" type="text" placeholder="Type a message…" autocomplete="off" />
              <button id="sendBtn">Send</button>
            </form>
          </div>

          <div class="sidebar">
            <div style="font-weight:700;margin-bottom:8px">Participants</div>
            <ul id="usersList"><li style="color:var(--muted)">No one yet</li></ul>
            <div class="meta">Username shown to all participants.</div>
          </div>
        </div>
        <div style="margin-top:8px;color:var(--muted);font-size:13px">
          Messages are broadcast to all connected clients.
        </div>
      </div>
    </div>
  </div>

  <!-- socket.io client served by server at /socket.io/socket.io.js -->
  <script src="/socket.io/socket.io.js"></script>
  <script>
    (function(){
      const socket = io();

      const statusEl = document.getElementById("status");
      const joinArea = document.getElementById("joinArea");
      const joinForm = document.getElementById("joinForm");
      const nameInput = document.getElementById("nameInput");
      const chatArea = document.getElementById("chatArea");
      const messagesEl = document.getElementById("messages");
      const msgForm = document.getElementById("msgForm");
      const msgInput = document.getElementById("msgInput");
      const sendBtn = document.getElementById("sendBtn");
      const usersList = document.getElementById("usersList");

      let myName = "";

      function appendSys(text){
        const div = document.createElement("div");
        div.className = "sys";
        div.textContent = text;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      function appendMsg(obj){
        // obj: { id, user, text, time }
        const d = document.createElement("div");
        d.className = (obj.user === myName) ? "my" : "msg";
        const meta = document.createElement("div");
        meta.style.fontSize = "12px";
        meta.style.color = "#555";
        meta.innerHTML = "<strong>"+escapeHtml(obj.user)+"</strong> • " + new Date(obj.time).toLocaleTimeString();
        const body = document.createElement("div");
        body.style.marginTop = "6px";
        body.textContent = obj.text;
        d.appendChild(meta);
        d.appendChild(body);
        messagesEl.appendChild(d);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      function updateUsers(list){
        usersList.innerHTML = "";
        if(!list || list.length === 0){
          const li = document.createElement("li"); li.style.color = "#666"; li.textContent = "No one yet"; usersList.appendChild(li); return;
        }
        list.forEach(u => {
          const li = document.createElement("li"); li.textContent = u; usersList.appendChild(li);
        });
      }

      function escapeHtml(str){
        return String(str).replace(/[&<>"]/g, function(s){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]);});
      }

      socket.on("connect", () => {
        statusEl.textContent = "Connected";
        statusEl.style.color = "green";
      });

      socket.on("disconnect", () => {
        statusEl.textContent = "Disconnected";
        statusEl.style.color = "crimson";
      });

      socket.on("message", (m) => {
        appendMsg(m);
      });

      socket.on("systemMessage", (m) => {
        appendSys(m.text + " — " + new Date(m.time).toLocaleTimeString());
      });

      socket.on("users", (list) => {
        updateUsers(list);
      });

      joinForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        if(!name) return;
        myName = name;
        socket.emit("join", name);
        joinArea.style.display = "none";
        chatArea.style.display = "block";
        appendSys("You joined as " + name);
        msgInput.focus();
      });

      msgForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = msgInput.value.trim();
        if(!text) return;
        socket.emit("message", { text: text });
        msgInput.value = "";
        msgInput.focus();
      });

      // allow send button click
      sendBtn.addEventListener("click", () => {
        const text = msgInput.value.trim();
        if(!text) return;
        socket.emit("message", { text: text });
        msgInput.value = "";
        msgInput.focus();
      });

      // Optional: announce presence again on reconnect
      socket.on("connect", () => {
        if(myName) socket.emit("join", myName);
      });

      // small accessibility: press Enter in name input to join
      nameInput.addEventListener("keydown", (e) => { if(e.key === "Enter") joinForm.dispatchEvent(new Event('submit')) });

    })();
  </script>
</body>
</html>
  `);
});

// Socket.io server logic
io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join", (username) => {
    username = String(username || "").trim().slice(0, 40) || "Anonymous";
    users.set(socket.id, { username });
    // Broadcast updated user list and a system message
    io.emit("users", Array.from(users.values()).map(u => u.username));
    io.emit("systemMessage", { text: \`\${username} joined the chat\`, time: Date.now() });
    console.log(\`[\${socket.id}] JOIN as \${username}\`);
  });

  socket.on("message", (payload) => {
    const info = users.get(socket.id);
    const username = info?.username || "Anonymous";
    const text = String(payload?.text || "").slice(0, 1000); // limit length
    if(text.trim() === "") return;
    const message = { id: \`\${Date.now()}_\${Math.random().toString(36).slice(2,8)}\`, user: username, text, time: Date.now() };
    io.emit("message", message);
    console.log(\`MSG from \${username}: \${text}\`);
  });

  socket.on("disconnect", (reason) => {
    const info = users.get(socket.id);
    if(info){
      users.delete(socket.id);
      io.emit("users", Array.from(users.values()).map(u => u.username));
      io.emit("systemMessage", { text: \`\${info.username} left the chat\`, time: Date.now() });
      console.log(\`[\${socket.id}] \${info.username} disconnected: \${reason}\`);
    } else {
      console.log(\`[\${socket.id}] disconnected (no user): \${reason}\`);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(\`Single-file chat server running: http://localhost:\${PORT}\`);
});
