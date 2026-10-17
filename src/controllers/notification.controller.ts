import { Request, Response } from 'express';
import { messaging } from '../config/firebase.config';
import { User } from '../models/user.model';

/**
 * @desc    Register or update user's FCM token after login
 * @route   POST /api/notifications/register-token
 */
export const registerFcmToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id; // From authenticate middleware
    const { fcmToken } = req.body;

    if (!fcmToken) {
      res.status(400).json({ message: 'FCM token is required' });
      return;
    }

    await User.findByIdAndUpdate(userId, { fcmToken });

    res.status(200).json({ success: true, message: 'FCM token registered successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error registering token' });
  }
};

/**
 * @desc    Universal notification sender (by userId, direct token, or topic)
 * @route   POST /api/notifications/send
 */
export const sendNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetType, targetValue, title, body, data } = req.body;
    // targetType: 'userId' | 'token' | 'topic'
    // targetValue: the actual ID, token string, or topic name

    if (!targetType || !targetValue || !title || !body) {
      res.status(400).json({ message: 'targetType, targetValue, title, and body are required.' });
      return;
    }

    let message: any = {
      notification: { title, body },
      data: data || {},
    };

    if (targetType === 'userId') {
      // Find user by ID and get their saved FCM token
      const recipient = await User.findById(targetValue);
      if (!recipient || !recipient.fcmToken) {
        res.status(404).json({ message: 'User or user FCM token not found' });
        return;
      }
      message.token = recipient.fcmToken;
    } else if (targetType === 'token') {
      message.token = targetValue;
    } else if (targetType === 'topic') {
      message.topic = targetValue;
    } else {
      res.status(400).json({ message: "Invalid targetType. Use 'userId', 'token', or 'topic'." });
      return;
    }

    const responseId = await messaging.send(message);

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      messageId: responseId,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error sending notification' });
  }
};