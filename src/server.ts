import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app'; // Import default app correctly

dotenv.config();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Save io instance in app so controllers can trigger real-time broadcasts via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Client connected to Real-Time Feed: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/talis-db';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => console.log(`Server running on port ${PORT} with WebSockets enabled`));
  })
  .catch((err) => console.error('Database connection failed:', err));