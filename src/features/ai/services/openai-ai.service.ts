import { GoogleGenAI, Type } from '@google/genai';
import { AIHttpError } from '../ai.errors';
import { MAX_MESSAGES_PER_CONTEXT } from '../ai.constants';

export interface TutorHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface VocabularyCandidate {
  word: string;
  translation: string;
  exampleSentence: string | null;
  category: string | null;
  targetLanguage: string;
}

export interface TutorReply {
  reply: string;
  vocabularyToSave: VocabularyCandidate[];
}

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AIHttpError(503, 'AI service is not configured. Set GEMINI_API_KEY on the server.');
  }
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

const tutorResponseSchema = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING },
    vocabularyToSave: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          translation: { type: Type.STRING },
          exampleSentence: { type: Type.STRING }, 
          category: { type: Type.STRING },
          targetLanguage: { type: Type.STRING },
        },
        required: ['word', 'translation', 'exampleSentence', 'category', 'targetLanguage'],
      },
    },
  },
  required: ['reply', 'vocabularyToSave'],
};

function validateTutorReply(value: unknown): TutorReply {
  if (!value || typeof value !== 'object') {
    throw new AIHttpError(502, 'The AI returned an invalid response. Please try again.', 'INVALID_AI_RESPONSE');
  }
  const data = value as Record<string, unknown>;
  if (typeof data.reply !== 'string' || !Array.isArray(data.vocabularyToSave)) {
    throw new AIHttpError(502, 'The AI returned an invalid response. Please try again.', 'INVALID_AI_RESPONSE');
  }

  const candidates: VocabularyCandidate[] = data.vocabularyToSave.slice(0, 3).flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const item = raw as Record<string, unknown>;
    if (typeof item.word !== 'string' || !item.word.trim() || typeof item.translation !== 'string') return [];
    
    const checkNull = (val: unknown): string | null => {
      if (typeof val !== 'string') return null;
      const trimmed = val.trim();
      return (trimmed === '' || trimmed.toLowerCase() === 'null') ? null : trimmed;
    };

    return [{
      word: item.word.trim().slice(0, 120),
      translation: item.translation.trim().slice(0, 500),
      exampleSentence: checkNull(item.exampleSentence)?.slice(0, 1000) || null,
      category: checkNull(item.category)?.slice(0, 80) || null,
      targetLanguage: typeof item.targetLanguage === 'string' && item.targetLanguage.trim()
        ? item.targetLanguage.trim().slice(0, 40)
        : 'English',
    }];
  });

  return { reply: data.reply.trim(), vocabularyToSave: candidates };
}

export async function generateTutorReply(input: {
  history: TutorHistoryMessage[];
  categoryName: string;
  targetLanguage: string;
  nativeLanguage?: string | null;
}): Promise<TutorReply> {
  const model = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';

  const history = input.history.slice(-MAX_MESSAGES_PER_CONTEXT);
  const instructions = [
    'You are Talis, a patient and encouraging personal language tutor.',
    `The student's target language is ${input.targetLanguage}.`,
    input.nativeLanguage ? `The student's native language is ${input.nativeLanguage}. Use it for translations when useful.` : 'Use simple explanations and include a translation when the student asks for one.',
    `The current learning topic is ${input.categoryName}. Keep examples relevant to this topic when appropriate.`,
    'Correct the student gently. Explain why a correction is useful without shaming the learner.',
    'Return at most three vocabulary items in vocabularyToSave, and only when the student explicitly asks to learn, define, translate, explain, or save a word or expression.',
    'If no vocabulary should be saved, return an empty vocabularyToSave array.',
    'If exampleSentence or category are not available, strictly fill their values with the string "null".',
  ].join('\n');

  // 🔄 آلية إعادة المحاولة التلقائية (Retry Mechanism)
  const maxRetries = 3;
  let delay = 1500; // الانتظار لـ 1.5 ثانية قبل إعادة المحاولة

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await getGeminiClient().models.generateContent({
        model,
        contents: history.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content || '...' }],
        })),
        config: {
          systemInstruction: instructions,
          responseMimeType: 'application/json',
          responseSchema: tutorResponseSchema, 
        },
      });

      const outputText = response.text;
      if (!outputText) {
        throw new AIHttpError(502, 'The AI did not return a response.', 'EMPTY_AI_RESPONSE');
      }

      let parsed = JSON.parse(outputText);
      return validateTutorReply(parsed);

    } catch (error: any) {
      // إذا كان الخطأ بسبب الضغط الزائد (503) أو الحصة (429) ولم ننتهِ من المحاولات الـ 3
      if ((error.status === 503 || error.status === 429) && attempt < maxRetries) {
        console.warn(`⚠️ Gemini busy (Status ${error.status}). Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // مضاعفة وقت الانتظار في المحاولة التالية (Exponential Backoff)
        continue;
      }

      // إذا استمر الخطأ بعد 3 محاولات، يتم رميه رسمياً
      if (error instanceof AIHttpError) throw error;
      console.error('[Talis Gemini AI text generation]', error);
      throw new AIHttpError(502, 'The AI tutor is temporarily busy under high demand. Please try again in a moment.', 'AI_PROVIDER_ERROR');
    }
  }
  
  throw new AIHttpError(502, 'AI service unavailable');


}

export function getGeminiClientForImages(): GoogleGenAI {
  return getGeminiClient();
}
