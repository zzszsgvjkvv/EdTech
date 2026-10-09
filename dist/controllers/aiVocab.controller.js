"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVocabWithImages = exports.ai = void 0;
const genai_1 = require("@google/genai");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
// Initialize Gemini SDK
dotenv_1.default.config();
const apiKey = process.env.GEMINI_API_KEY;
console.log('apiKey ${apiKey}');
console.log(apiKey);
if (!apiKey) {
    throw new Error(' ${process.env.GEMINI_API_KEY } GEMINI_API_KEY is not defined in environment variables.');
}
exports.ai = new genai_1.GoogleGenAI({ apiKey });
const generateVocabWithImages = async (req, res) => {
    try {
        const { category, targetLanguage, count = 10 } = req.body;
        if (!category || !targetLanguage) {
            res.status(400).json({ message: 'Category and targetLanguage are required' });
            return;
        }
        // 1. Call Gemini with Structured JSON Schema output
        const prompt = `Generate ${count} essential vocabulary items for a student learning ${targetLanguage} in the category "${category}". For each word, provide an English keyword suitable for searching an image.`;
        const aiResponse = await exports.ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: genai_1.Type.ARRAY,
                    description: 'List of vocabulary items',
                    items: {
                        type: genai_1.Type.OBJECT,
                        properties: {
                            word: { type: genai_1.Type.STRING, description: 'Word or phrase in target language' },
                            translation: { type: genai_1.Type.STRING, description: 'Translation in English' },
                            exampleSentence: { type: genai_1.Type.STRING, description: 'Example sentence in target language' },
                            englishImageKeyword: { type: genai_1.Type.STRING, description: 'Simple 1-2 word English query for image search (e.g. "red apple")' }
                        },
                        required: ['word', 'translation', 'exampleSentence', 'englishImageKeyword'],
                    },
                },
            },
        });
        const rawText = aiResponse.text;
        if (!rawText) {
            res.status(500).json({ message: 'Failed to receive response from Gemini AI' });
            return;
        }
        const vocabList = JSON.parse(rawText);
        // 2. Fetch Unsplash images in parallel for each generated word
        const vocabWithImages = await Promise.all(vocabList.map(async (item) => {
            try {
                const unsplashRes = await axios_1.default.get('https://api.unsplash.com/search/photos', {
                    params: {
                        query: item.englishImageKeyword,
                        per_page: 1,
                        orientation: 'squarish',
                    },
                    headers: {
                        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
                    },
                });
                const imageUrl = unsplashRes.data.results[0]?.urls?.small || null;
                return { ...item, imageUrl };
            }
            catch (error) {
                // Fallback if Unsplash fails or rate limit is reached
                return { ...item, imageUrl: null };
            }
        }));
        res.status(200).json({
            category,
            targetLanguage,
            total: vocabWithImages.length,
            data: vocabWithImages,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server error' });
    }
};
exports.generateVocabWithImages = generateVocabWithImages;
//# sourceMappingURL=aiVocab.controller.js.map