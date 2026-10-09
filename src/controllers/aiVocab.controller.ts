import { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import axios from 'axios';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Helper function to retry Google Gen AI calls if a 503 error is thrown
const callWithRetry = async (fn: () => Promise<any>, retries = 3, delayMs = 1500): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      // If it's a 503 Service Unavailable and we have retries left, wait and try again
      if (error.status === 503 && i < retries - 1) {
        console.warn(`Google Gen AI overloaded (503). Retrying in ${delayMs}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
        continue;
      }
      throw error; // Rethrow original error if not a 503 or max retries reached
    }
  }
};

export const generateVocabWithStickFigures = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, targetLanguage, count = 10, imageStyle = 'stick figure drawing' } = req.body;

    const prompt = `Generate ${count} vocabulary items for learning ${targetLanguage} in category "${category}". Provide a simple 1-3 word English subject for stick-figure drawing search.`;

    // Wrap the text generation call with our retry helper
    const aiResponse = await callWithRetry(() => 
      ai.models.generateContent({
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
      })
    );

    const vocabList = JSON.parse(aiResponse.text || '[]');

    const vocabWithImages = await Promise.all(
      vocabList.map(async (item: any) => {
        try {
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

// Helper to generate a stick-figure illustration for a specific word


// Helper to generate a stick-figure illustration for a specific word
export const generateStickFigureImage = async (wordKeyword: string): Promise<string | null> => {
  try {
    const prompt = `A cute simple stick figure stickman doodle character depicting "${wordKeyword}". Black line art on plain white background, minimal kid-friendly cartoon illustration style.`;

    // Use .generateImages instead of .generateContent for Imagen models
    const response = await callWithRetry(() => 
      ai.models.generateImages({
        model: 'imagen-3.0-generate-002', 
        prompt: prompt, // Change 'contents' to 'prompt' for the image endpoint
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
      })
    );

    // Extract the image from the dedicated image response array
    const base64Image = response.generatedImages?.[0]?.image?.imageBytes;

    if (base64Image) {
      return `data:image/png;base64,${base64Image}`;
    }

    return null;
  } catch (error) {
    console.error('Image generation error after retries:', error);
    return null; // Gracefully handle failures so the backend keeps running safely
  }
};

