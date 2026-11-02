import http from 'http';
import { Server } from 'socket.io';
import app from './app'; // Your express app

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust for production security if needed
    methods: ['GET', 'POST'],
  },
});

// Save io instance in app so controllers can trigger real-time broadcasts
app.set('io', io);

io.on('connection', (socket:any) => {
  console.log(`🔌 Client connected to Real-Time Feed: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} with WebSockets enabled`);
});