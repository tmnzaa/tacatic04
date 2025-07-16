const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

let botProcess = null;

app.use(express.static(__dirname));
app.use(express.json());

let sessions = {};
const userFile = path.join(__dirname, 'users.json');

// === PAGE ===
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/panel.html');
});

// === AUTH ===
function loadUsers() {
  if (!fs.existsSync(userFile)) return {};
  return JSON.parse(fs.readFileSync(userFile));
}

function saveUsers(data) {
  fs.writeFileSync(userFile, JSON.stringify(data, null, 2));
}

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  if (users[username]) return res.send('❌ Username sudah terdaftar.');
  users[username] = { password };
  saveUsers(users);
  res.send('✅ Registrasi berhasil.');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  if (!users[username] || users[username].password !== password)
    return res.send('❌ Username atau password salah.');
  sessions[username] = true;
  res.send('success');
});

// === BOT CONTROL ===
app.post('/start', (req, res) => {
  if (botProcess) return res.send('❌ Bot sudah berjalan.');

  botProcess = spawn('node', ['index.js']);

  botProcess.stdout.on('data', (data) => {
    io.emit('terminal', data.toString());
  });

  botProcess.stderr.on('data', (data) => {
    io.emit('terminal', `❗ ERROR: ${data.toString()}`);
  });

  botProcess.on('exit', (code) => {
    io.emit('terminal', `🛑 Bot keluar dengan kode: ${code}`);
    botProcess = null;
  });

  res.send('✅ Bot dimulai.');
});

app.post('/stop', (req, res) => {
  if (!botProcess) return res.send('⚠️ Bot belum berjalan.');
  botProcess.kill('SIGTERM');
  botProcess = null;
  res.send('⛔ Bot dihentikan.');
});

app.get('/status', (req, res) => {
  res.send(botProcess ? '🟢 Bot sedang aktif/terhubung.' : '🔴 Bot tidak berjalan.');
});

// === EXEC
app.post('/exec', (req, res) => {
  const { cmd } = req.body;
  if (!cmd) return res.status(400).send('⛔ Perintah kosong.');

  const child = spawn(cmd, { shell: true });
  let output = '';
  child.stdout.on('data', (data) => output += data);
  child.stderr.on('data', (data) => output += data);
  child.on('close', () => res.send(output || '(Tidak ada output)'));
});

server.listen(port, () => {
  console.log(`🔧 Panel aktif di: http://localhost:${port}`);
});
