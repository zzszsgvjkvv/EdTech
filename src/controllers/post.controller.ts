import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Post, IPost } from '../models/post.model';

export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await Post.find()
      .populate('authorId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({ success: true, data: posts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching posts' });
  }
};

export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
      return;
    }

    const { content, mediaUrl } = req.body;

    if (!content || content.trim() === '') {
      res.status(400).json({ success: false, message: 'Post content cannot be empty.' });
      return;
    }

    // Explicitly type created post to satisfy TypeScript
    const newPost: IPost = await Post.create({
      authorId: new Types.ObjectId(req.user._id),
      authorRole: req.user.role,
      content: content.trim(),
      mediaUrl: mediaUrl?.trim(),
    });

    const populatedPost = await Post.findById(newPost._id)
      .populate('authorId', 'name email role')
      .lean();

    // Broadcast in real-time via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('new_post', populatedPost);
    }

    res.status(201).json({
      success: true,
      message: 'Post created and broadcasted successfully',
      data: populatedPost,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating post' });
  }
};