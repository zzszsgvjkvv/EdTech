"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStickFigureImage = exports.generateVocabWithStickFigures = void 0;
const genai_1 = require("@google/genai");
const axios_1 = __importDefault(require("axios"));
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const generateVocabWithStickFigures = async (req, res) => {
    try {
        const { category, targetLanguage, count = 10, imageStyle = 'stick figure drawing' } = req.body;
        // 1. Tell Gemini to generate prompts suitable for simple stick-figure / doodle artwork
        const prompt = `Generate ${count} vocabulary items for learning ${targetLanguage} in category "${category}". Provide a simple 1-3 word English subject for stick-figure drawing search.`;
        const aiResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: genai_1.Type.ARRAY,
                    items: {
                        type: genai_1.Type.OBJECT,
                        properties: {
                            word: { type: genai_1.Type.STRING },
                            translation: { type: genai_1.Type.STRING },
                            exampleSentence: { type: genai_1.Type.STRING },
                            englishImageKeyword: { type: genai_1.Type.STRING, description: 'Subject word, e.g. "person waiting"' }
                        },
                        required: ['word', 'translation', 'exampleSentence', 'englishImageKeyword'],
                    },
                },
            },
        });
        const vocabList = JSON.parse(aiResponse.text || '[]');
        // 2. Fetch Unsplash images appending your preferred character / doodle style
        const vocabWithImages = await Promise.all(vocabList.map(async (item) => {
            try {
                // Combine the keyword with style modifiers: e.g., "person waiting stick figure drawing illustration"
                const searchQuery = `${item.englishImageKeyword} ${imageStyle} illustration doodle minimal`;
                const unsplashRes = await axios_1.default.get('https://api.unsplash.com/search/photos', {
                    params: {
                        query: searchQuery,
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
                return { ...item, imageUrl: null };
            }
        }));
        res.status(200).json({
            category,
            targetLanguage,
            style: imageStyle,
            data: vocabWithImages,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.generateVocabWithStickFigures = generateVocabWithStickFigures;
// Helper to generate a stick-figure illustration for a specific word
const generateStickFigureImage = async (wordKeyword) => {
    try {
        const prompt = `A cute simple stick figure stickman doodle character depicting "${wordKeyword}". Black line art on plain white background, minimal kid-friendly cartoon illustration style.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash', // Gemini Image Generation model
            contents: prompt,
            config: {
                // Request image output modality
                responseModalities: ['image'],
            },
        });
        // Extract base64 image data from response
        const candidate = response.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find((p) => p.inlineData);
        if (imagePart?.inlineData) {
            const mimeType = imagePart.inlineData.mimeType || 'image/png';
            const base64Data = imagePart.inlineData.data;
            return `data:${mimeType};base64,${base64Data}`;
        }
        return null;
    }
    catch (error) {
        console.error('Image generation error:', error);
        return null;
    }
};
exports.generateStickFigureImage = generateStickFigureImage;
//# sourceMappingURL=aiVocab.controller.js.map