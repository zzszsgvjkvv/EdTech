import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import publicRoutes from './routes/public.routes';
import authRoutes from './routes/auth.routes';
import teacherRoutes from './routes/teacher.routes';
import studentRoutes from './routes/student.routes';
import postRoutes from './routes/post.routes'; // <-- Don't forget to mount your post routes!
import notification from './routes/notification.routes';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Routes
app.use('/notification', notification); 
app.use('/api/public', publicRoutes);   
app.use('/api/auth', authRoutes);       
app.use('/api/teacher', teacherRoutes); 
app.use('/api/student', studentRoutes);
app.use('/api/posts', postRoutes);       // <-- Added Class Feed Post routes

export default app; 