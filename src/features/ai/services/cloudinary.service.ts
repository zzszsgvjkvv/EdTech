import { v2 as cloudinary } from 'cloudinary';
import { AIHttpError } from '../ai.errors';

export interface CloudinaryImageResult {
  publicId: string;
  secureUrl: string;
}

function configureCloudinary(): void {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new AIHttpError(
      500,
      'Image storage is not configured on the server.',
      'CLOUDINARY_CONFIGURATION_ERROR',
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/** Uploads generated image bytes to Cloudinary; no local disk is required. */
export async function uploadAIImageToCloudinary(pngBuffer: Buffer): Promise<CloudinaryImageResult> {
  configureCloudinary();

  try {
    const dataUri = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: process.env.CLOUDINARY_AI_FOLDER?.trim() || 'talis-ai-illustrations',
      resource_type: 'image',
      format: 'png',
      unique_filename: true,
      overwrite: false,
    });

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
    };
  } catch (error) {
    // Do not log credentials or the full upload payload.
    console.error('[Talis AI] Cloudinary illustration upload failed.');
    throw new AIHttpError(
      502,
      'The generated illustration could not be stored. Please try again.',
      'IMAGE_STORAGE_ERROR',
    );
  }
}
