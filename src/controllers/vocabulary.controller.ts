import { Request, Response } from 'express';
import { Vocabulary } from '../models/vocabulary.model';
import express from 'express';

const app = express();
app.use(express.json());
export const saveVocabulary = async (req: Request, res: Response): Promise<void> => {
  try {
      console.log("====== targetLanguage:", req.body);

    const { word, translation, exampleSentence, source, targetLanguage, category } = req.body;
    const userId = req.user?._id; // Attached by your auth middleware

    if (!word || !translation || !source) {
      res.status(400).json({ message: 'Word, translation, and source are required fields.' });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Determine imageUrl: prioritize uploaded file from Multer, fallback to request body (Unsplash/AI URL)
    let imageUrl = req.body.imageUrl;
    if (req.file && (req.file as any).path) {
      imageUrl = (req.file as any).path; // Cloudinary secure URL
    }

    const vocabularyData: Record<string, any> = {
      userId,
      word,
      translation,
      exampleSentence,
      imageUrl,
      source, // e.g., 'ai_chat', 'ai_generator', 'teacher', 'me'
      targetLanguage,
      category,
    };

    if (source === 'teacher') {
      vocabularyData.createdBy = userId;
    }

    const newVocabulary = await Vocabulary.create(vocabularyData);

    res.status(201).json({
      message: 'Vocabulary saved successfully',
      data: newVocabulary,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error while saving vocabulary' });
  }
};

// 1. Generate 10+ Vocabulary words by category via AI (OpenAI API integration)
export const generateCategoryVocabulary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, targetLanguage } = req.body;

    if (!category || !targetLanguage) {
      res.status(400).json({ message: 'Category and targetLanguage are required' });
      return;
    }

    const generatedWords = [
      { word: 'La manzana', translation: 'The apple', exampleSentence: 'Como una manzana roja.' },
      { word: 'El restaurante', translation: 'The restaurant', exampleSentence: 'Vamos al restaurante.' },
      { word: 'La cuenta', translation: 'The bill', exampleSentence: 'La cuenta, por favor.' },
    ];

    res.status(200).json({
      category,
      targetLanguage,
      count: generatedWords.length,
      vocabulary: generatedWords,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Save Selected Vocabulary (Protected Endpoint - Requires Auth)
export const saveVocabularyold = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { words } = req.body; // Array of vocabulary objects to save

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!Array.isArray(words) || words.length === 0) {
      res.status(400).json({ message: 'Provide an array of words to save' });
      return;
    }

    const vocabEntries = words.map((item) => ({
      ...item,
      userId,
    }));

    const savedItems = await Vocabulary.insertMany(vocabEntries);

    res.status(201).json({
      message: 'Vocabulary saved successfully',
      savedCount: savedItems.length,
      data: savedItems,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Get Student Saved Vocabulary List (Protected Endpoint)
export const getSavedVocabulary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const vocabList = await Vocabulary.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ count: vocabList.length, vocabulary: vocabList });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};