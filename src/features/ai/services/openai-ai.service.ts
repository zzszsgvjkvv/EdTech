import { GoogleGenAI } from '@google/genai';
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
  // تهيئة عميل جيميناي الرسمي باستخدام الحزمة المحدثة @google/genai
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

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
    return [{
      word: item.word.trim().slice(0, 120),
      translation: item.translation.trim().slice(0, 500),
      exampleSentence: typeof item.exampleSentence === 'string' ? item.exampleSentence.slice(0, 1000) : null,
      category: typeof item.category === 'string' ? item.category.slice(0, 80) : null,
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
  const model = process.env.GEMINI_TEXT_MODEL || 'gemini-3.8-flash';

  const history = input.history.slice(-MAX_MESSAGES_PER_CONTEXT);
  const instructions = [
    'You are Talis, a patient and encouraging personal language tutor.',
    `The student's target language is ${input.targetLanguage}.`,
    input.nativeLanguage ? `The student's native language is ${input.nativeLanguage}. Use it for translations when useful: ${input.nativeLanguage}.` : 'Use simple explanations and include a translation when the student asks for one.',
    `The current learning topic is ${input.categoryName}. Keep examples relevant to this topic when appropriate.`,
    'Correct the student gently. Explain why a correction is useful without shaming the learner.',
    'Return at most three vocabulary items in vocabularyToSave, and only when the student explicitly asks to learn, define, translate, explain, or save a word or expression. Do not extract random words from ordinary chat.',
    'If the student is practicing a role-play, continue the role-play naturally rather than turning every reply into a lesson.',
    'If no vocabulary should be saved, return an empty vocabularyToSave array.',
    'Do not claim a vocabulary item has been saved. The app will save candidates after this response.',
  ].join('\n');

  try {
    // استدعاء جيميناي لتوليد المحتوى المهيكل
    const response = await getGeminiClient().models.generateContent({
      model,
      contents: [
        // في جيميناي يتم تحويل دور المساعد من assistant إلى model
        ...history.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        })),
      ],
      config: {
        // تمرير التعليمات الصارمة للنظام كـ systemInstruction منفصل ومستقل عن مصفوفة الـ contents
        systemInstruction: instructions,
        // إجبار الموديل على إخراج النتيجة بصيغة JSON متوافقة مع الـ validation الخاص بك
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text;

    if (!outputText) {
      throw new AIHttpError(502, 'The AI did not return a response. Please try again.', 'EMPTY_AI_RESPONSE');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(outputText);
    } catch {
      throw new AIHttpError(502, 'The AI returned an unreadable response. Please try again.', 'INVALID_AI_JSON');
    }
    
    return validateTutorReply(parsed);
  } catch (error) {
    if (error instanceof AIHttpError) throw error;
    console.error('[Talis Gemini AI text generation]', error);
    throw new AIHttpError(502, 'The AI tutor is temporarily unavailable. Your message was kept; please retry.', 'AI_PROVIDER_ERROR');
  }
}

// دالة العميل للصور إذا كنت تستخدمها لاحقاً لتوليد الرسوم التوضيحية
export function getGeminiClientForImages(): GoogleGenAI {
  return getGeminiClient();
}
