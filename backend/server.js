require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

// Middleware
const corsOptions = {
  origin: "https://collab-space-liart.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));
app.use(express.json());
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// DB Config
const db = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collabspace';

// Connect to MongoDB
mongoose
  .connect(db)
  .then(async () => {
    console.log('MongoDB Connected');
    // Drop corrupted unique index if it exists (for deployment)
    try {
      await mongoose.connection.collection('notifications').dropIndex('_id_str_1');
      console.log('Dropped legacy index _id_str_1 from notifications collection');
    } catch (err) {
      // Ignore error if index doesn't exist
    }
  })
  .catch(err => console.log(err));

// Sockets
require('./sockets/socketManager')(io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/teams', require('./routes/teams'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
