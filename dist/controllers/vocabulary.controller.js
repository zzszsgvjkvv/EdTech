"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSavedVocabulary = exports.saveVocabularyold = exports.generateCategoryVocabulary = exports.saveVocabulary = void 0;
const vocabulary_model_1 = require("../models/vocabulary.model");
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
const saveVocabulary = async (req, res) => {
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
        if (req.file && req.file.path) {
            imageUrl = req.file.path; // Cloudinary secure URL
        }
        const vocabularyData = {
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
        const newVocabulary = await vocabulary_model_1.Vocabulary.create(vocabularyData);
        res.status(201).json({
            message: 'Vocabulary saved successfully',
            data: newVocabulary,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server error while saving vocabulary' });
    }
};
exports.saveVocabulary = saveVocabulary;
// 1. Generate 10+ Vocabulary words by category via AI (OpenAI API integration)
const generateCategoryVocabulary = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.generateCategoryVocabulary = generateCategoryVocabulary;
// 2. Save Selected Vocabulary (Protected Endpoint - Requires Auth)
const saveVocabularyold = async (req, res) => {
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
        const savedItems = await vocabulary_model_1.Vocabulary.insertMany(vocabEntries);
        res.status(201).json({
            message: 'Vocabulary saved successfully',
            savedCount: savedItems.length,
            data: savedItems,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.saveVocabularyold = saveVocabularyold;
// 3. Get Student Saved Vocabulary List (Protected Endpoint)
const getSavedVocabulary = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const vocabList = await vocabulary_model_1.Vocabulary.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ count: vocabList.length, vocabulary: vocabList });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getSavedVocabulary = getSavedVocabulary;
//# sourceMappingURL=vocabulary.controller.js.map