import { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import axios from 'axios';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY||"" });

export const generateVocabWithStickFigures = async (req: Request, res: Response): Promise<void> => {
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
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              translation: { type: Type.STRING },
              exampleSentence: { type: Type.STRING },
              englishImageKeyword: { type: Type.STRING, description: 'Subject word, e.g. "person waiting"' }
            },
            required: ['word', 'translation', 'exampleSentence', 'englishImageKeyword'],
          },
        },
      },
    });

    const vocabList = JSON.parse(aiResponse.text || '[]');

    // 2. Fetch Unsplash images appending your preferred character / doodle style
    const vocabWithImages = await Promise.all(
      vocabList.map(async (item: any) => {
        try {
          // Combine the keyword with style modifiers: e.g., "person waiting stick figure drawing illustration"
          const searchQuery = `${item.englishImageKeyword} ${imageStyle} illustration doodle minimal`;

          const unsplashRes = await axios.get('https://api.unsplash.com/search/photos', {
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
        } catch (error) {
          return { ...item, imageUrl: null };
        }
      })
    );

    res.status(200).json({
      category,
      targetLanguage,
      style: imageStyle,
      data: vocabWithImages,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};