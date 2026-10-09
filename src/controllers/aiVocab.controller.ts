import { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import axios from 'axios';
import dotenv from 'dotenv';
// Initialize Gemini SDK
dotenv.config();
const apiKey = process.env.GEMINI_API_KEY;
console.log('apiKey ${apiKey}');
console.log(apiKey);

if (!apiKey) {
  throw new Error(' ${process.env.GEMINI_API_KEY } GEMINI_API_KEY is not defined in environment variables.');
}

export const ai = new GoogleGenAI({ apiKey });
// Correct format for Google REST API calls


//urn:ietf:wg:oauth:2.0:oob
interface GeneratedVocabItem {
  word: string;
  translation: string;
  exampleSentence: string;
  englishImageKeyword: string; // Used to search Unsplash accurately
  imageUrl?: string;
}

export const generateVocabWithImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, targetLanguage, count = 10 } = req.body;

    if (!category || !targetLanguage) {
      res.status(400).json({ message: 'Category and targetLanguage are required' });
      return;
    }

    // 1. Call Gemini with Structured JSON Schema output
    const prompt = `Generate ${count} essential vocabulary items for a student learning ${targetLanguage} in the category "${category}". For each word, provide an English keyword suitable for searching an image.`;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'List of vocabulary items',
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING, description: 'Word or phrase in target language' },
              translation: { type: Type.STRING, description: 'Translation in English' },
              exampleSentence: { type: Type.STRING, description: 'Example sentence in target language' },
              englishImageKeyword: { type: Type.STRING, description: 'Simple 1-2 word English query for image search (e.g. "red apple")' }
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

    const vocabList: GeneratedVocabItem[] = JSON.parse(rawText);

    // 2. Fetch Unsplash images in parallel for each generated word
    const vocabWithImages = await Promise.all(
      vocabList.map(async (item) => {
        try {
          const unsplashRes = await axios.get('https://api.unsplash.com/search/photos', {
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
        } catch (error) {
          // Fallback if Unsplash fails or rate limit is reached
          return { ...item, imageUrl: null };
        }
      })
    );

    res.status(200).json({
      category,
      targetLanguage,
      total: vocabWithImages.length,
      data: vocabWithImages,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};