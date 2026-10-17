import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import bcrypt from 'bcryptjs';
import { Tutor } from '../models/tutor.model';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, nativeLanguage, targetLanguage } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }
    
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email,   password: hashedPassword, // Use the hashed password
 role, nativeLanguage, targetLanguage });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // 1. Find user by email and explicitly pull the hidden password
    const user = await User.findOne({ email }).select('+password'); 
    
    // 2. Safely verify credentials using your schema's instance method
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        _id: user._id,
        id: user._id,
        role: user.role, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // If user is a teacher, fetch their tutor profile & availability details
    let profileData = null;
    if (user.role === 'teacher') {
      console.log(`teacher ${user._id}`);
      profileData = await Tutor.findOne({ userId: user._id.toString() });
      console.log("teacher profile data:", profileData);
    }

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      profile: profileData || null,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

