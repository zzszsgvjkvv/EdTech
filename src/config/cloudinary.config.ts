import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary credentials from your .env file
import dotenv from 'dotenv';
dotenv.config(); 
const cloudName= process.env.CLOUDINARY_CLOUD_NAME;

 const apiKey=process.env.CLOUDINARY_API_KEY;
 const apiSecret=process.env.CLOUDINARY_API_SECRET ;
if (!cloudName || !apiKey || !apiSecret) {
  throw new Error(
    'Missing Cloudinary environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// Configure Multer storage engine for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: 'talis-vocabulary',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  }),
});

export const upload = multer({ storage });