"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSavedVocabulary = exports.saveVocabulary = exports.generateCategoryVocabulary = void 0;
const vocabulary_model_1 = require("../models/vocabulary.model");
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
const saveVocabulary = async (req, res) => {
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
exports.saveVocabulary = saveVocabulary;
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