require("dotenv").config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const sessionRoutes = require('./routes/session');
const messageRoutes = require('./routes/message');
const redisDebugRouter = require("./routes/redisDebug");
const redisService = require('./services/redisService');
const mysqlService = require('./services/mysqlService');
const config = require('./config');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json());
app.use('/api/session', sessionRoutes);
app.use('/api', messageRoutes);
app.use("/api", redisDebugRouter);

app.get('/health', (req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);
  socket.on('join', (sessionId) => {
    socket.join(sessionId);
  });
});

async function start() {
  await redisService.connectRedis();
  await mysqlService.init();
  server.listen(config.port, () => {
    console.log(`Server listening on ${config.port}`);
  });
}

start();
