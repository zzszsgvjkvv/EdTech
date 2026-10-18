import { createHash } from 'node:crypto';
import { AIHttpError } from '../ai.errors';
import { getOpenAIClientForImages } from './xopenai-ai.service';
import { uploadAIImageToCloudinary } from './cloudinary.service';

export function makeIllustrationCacheKey(word: string, translation: string): string {
  return createHash('sha256')
    .update(`${word.trim().toLowerCase()}\n${translation.trim().toLowerCase()}`)
    .digest('hex');
}

export async function generateAndStoreIllustration(input: {
  word: string;
  translation: string;
  exampleSentence?: string;
}): Promise<{ publicId: string; imageUrl: string }> {
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-flare';

  let result;
  try {
    result = await getOpenAIClientForImages().images.generate({
      model,
      prompt: [
        'Create a safe, clear educational illustration for a language-learning vocabulary card.',
        `Vocabulary word: ${input.word}`,
        `Meaning: ${input.translation}`,
        input.exampleSentence ? `Example context: ${input.exampleSentence}` : '',
        'Show the meaning visually in a friendly editorial illustration style.',
        'Do not include labels, captions, letters, watermarks, logos, or readable text inside the image.',
      ].filter(Boolean).join('\n'),
      size: '1024x1024',
      quality: 'low',
    });
  } catch (error) {
    if (error instanceof AIHttpError) throw error;
    console.error('[Talis AI] Image generation request failed.');
    throw new AIHttpError(502, 'Image generation is temporarily unavailable. Please try again.', 'IMAGE_PROVIDER_ERROR');
  }

  const base64 = result.data?.[0]?.b64_json;
  if (!base64) {
    throw new AIHttpError(502, 'The image service did not return image data.', 'EMPTY_IMAGE_RESPONSE');
  }

  const uploaded = await uploadAIImageToCloudinary(Buffer.from(base64, 'base64'));
  return { publicId: uploaded.publicId, imageUrl: uploaded.secureUrl };
}
