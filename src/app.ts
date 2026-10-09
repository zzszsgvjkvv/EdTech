import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import publicRoutes from './routes/public.routes';
import authRoutes from './routes/auth.routes';
import teacherRoutes from './routes/teacher.routes';
import studentRoutes from './routes/student.routes';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Route Registrations
app.use('/api/public', publicRoutes);   // Unprotected
app.use('/api/auth', authRoutes);       // Login / Register
app.use('/api/teacher', teacherRoutes); // Authenticated + Authorized ('teacher')
app.use('/api/student', studentRoutes);
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/talis-db';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('Database connection failed:', err));