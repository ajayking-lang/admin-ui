const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const dataPath = path.join(__dirname, 'data.json');
let data = JSON.parse(fs.readFileSync(dataPath));

app.use(cors({ origin: '*', credentials: true }));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'adminsecret', resave: false, saveUninitialized: false }));

app.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/login.html');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === data.admin.user && pass === data.admin.pass) {
    req.session.user = user;
    return res.redirect('/');
  }
  res.redirect('/login.html?e=1');
});

app.post('/api/devices/add', (req, res) => {
  const { id, name, version } = req.body;
  if (!id || !name || !version) return res.status(400).json({ error: 'Missing fields' });
  data.devices[id] = { name, version, status: 'offline' };
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  io.emit('update', data);
  res.json({ ok: true });
});

app.post('/api/devices/remove', (req, res) => {
  const { id } = req.body;
  delete data.devices[id];
  delete data.sms[id];
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  io.emit('update', data);
  res.json({ ok: true });
});

app.post('/api/sms/send', (req, res) => {
  const { deviceId, message } = req.body;
  const sms = { from: 'admin', message, date: Date.now(), read: false };
  if (!data.sms[deviceId]) data.sms[deviceId] = [];
  data.sms[deviceId].push(sms);
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  io.emit('sms', { deviceId, sms });
  res.json({ ok: true });
});

io.on('connection', socket => {
  console.log('UI connected via Socket.IO');
  socket.emit('update', data);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Admin Panel running at http://localhost:${PORT}`);
});