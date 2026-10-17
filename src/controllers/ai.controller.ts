import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AICategory } from '../models/ai-category.model';
import { AIConversation } from '../models/ai-conversation.model';
import { AIMessage } from '../models/ai-message.model';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize GenAI SDK (picks up GEMINI_API_KEY from environment)
const ai = new GoogleGenAI();

// Define strict JSON Schema for structured output
const aiResponseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        reply: {
            type: Type.STRING,
            description: 'The conversational response to the student, encouraging language practice.',
        },
        vocabularyItems: {
            type: Type.ARRAY,
            description: 'List of key vocabulary words introduced or discussed in this turn.',
            items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING, description: 'The word in the target language' },
                    translation: { type: Type.STRING, description: 'Translation in English' },
                    exampleSentence: { type: Type.STRING, description: 'Example sentence using the word' },
                },
                required: ['word', 'translation', 'exampleSentence'],
            },
        },
    },
    required: ['reply', 'vocabularyItems'],
};

/**
 * @desc    Get all AI learning categories
 * @route   GET /api/student/ai/categories

*/
export const getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const categories = await AICategory.find().lean();
        res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error fetching categories' });
    }
};

/**
 * @desc    Get student conversations (optional category filter)
 * @route   GET /api/student/ai/conversations?categoryId=...
 */
export const getConversations = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = new Types.ObjectId(req.user?._id);
        const { categoryId } = req.query;

        const filter: any = { studentId };
        if (categoryId && typeof categoryId === 'string') {
            filter.categoryId = new Types.ObjectId(categoryId);
        }

        const conversations = await AIConversation.find(filter).sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, data: conversations });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error fetching conversations' });
    }
};

/**
 * @desc    Create a new AI conversation
 * @route   POST /api/student/ai/conversations
 */
export const createConversation = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = new Types.ObjectId(req.user?._id);
        const { categoryId, title } = req.body;

        if (!categoryId || !title) {
            res.status(400).json({ message: 'categoryId and title are required.' });
            return;
        }

        const newConversation = await AIConversation.create({
            studentId,
            categoryId: new Types.ObjectId(categoryId),
            title,
        });

        res.status(201).json({ success: true, data: newConversation });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error creating conversation' });
    }
};

/**
 * @desc    Get message history for a specific conversation
 * @route   GET /api/student/ai/conversations/:id/messages
 */
export const getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = new Types.ObjectId(req.user?._id);
        const conversationIdParam = req.params.id;

        if (!conversationIdParam || Array.isArray(conversationIdParam)) {
            res.status(400).json({ message: 'A valid conversation id is required.' });
            return;
        }

        const conversationId = new Types.ObjectId(conversationIdParam);

        // Verify ownership
        const conversation = await AIConversation.findOne({ _id: conversationId, studentId }).lean();
        if (!conversation) {
            res.status(403).json({ message: 'Conversation not found or unauthorized.' });
            return;
        }

        const messages = await AIMessage.find({ conversationId }).sort({ createdAt: 1 }).lean();
        res.status(200).json({ success: true, data: messages });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error fetching messages' });
    }
};

/**
 * @desc    Send a message and receive Gemini Structured Output reply
 * @route   POST /api/student/ai/conversations/:id/messages
 */
  export const sendAiMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = new Types.ObjectId(req.user?._id);
        const conversationIdParam = req.params.id;

        if (!conversationIdParam || Array.isArray(conversationIdParam)) {
            res.status(400).json({ message: 'A valid conversation id is required.' });
            return;
        }

        const conversationId = new Types.ObjectId(conversationIdParam);
        const { messageText } = req.body;

        if (!messageText) {
            res.status(400).json({ message: 'Message text is required.' });
            return;
        }

        // Verify conversation ownership with explicit ObjectId
        const conversation = await AIConversation.findOne({ _id: conversationId, studentId }).lean();
        if (!conversation) {
            res.status(403).json({ message: 'Conversation not found or unauthorized.' });
            return;
        }

        // Save student message
        await AIMessage.create({
            conversationId,
            sender: 'user',
            text: messageText,
        });

        // Load recent history using .lean() so properties are cleanly typed as JS objects
        const history = await AIMessage.find({ conversationId }).sort({ createdAt: 1 }).limit(10).lean();
        const formattedHistory = history.map((msg: any) => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
        }));

        // Generate content using Gemini with Structured Outputs
        const geminiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: formattedHistory,
            config: {
                systemInstruction: 'You are a friendly language tutor. Naturally extract 1-3 useful vocabulary words from the conversation context and return them in the required structured JSON format.',
                responseMimeType: 'application/json',
                responseSchema: aiResponseSchema,
            },
        });

        const parsedData = JSON.parse(geminiResponse.text || '{}');
        const aiReplyText = parsedData.reply || "Let's keep practicing!";
        const vocabItems = parsedData.vocabularyItems || [];

        // Save AI reply and structured vocabulary items to database
        const savedAiMessage = await AIMessage.create({
            conversationId,
            sender: 'ai',
            text: aiReplyText,
            vocabularyItems: vocabItems,
        });

        res.status(200).json({
            success: true,
            data: {
                message: savedAiMessage,
            },
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error processing AI conversation' });
    }
};