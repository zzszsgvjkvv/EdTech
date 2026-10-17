import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import * as fs from 'fs';
import * as path from 'path';

let credential: any;

// Check possible locations for serviceAccountKey.json (Local vs Render Secret File)
const possiblePaths = [
  path.resolve(__dirname, 'serviceAccountKey.json'),      // src/config/serviceAccountKey.json
  path.resolve(__dirname, '../serviceAccountKey.json'),     // src/serviceAccountKey.json
  path.resolve(process.cwd(), 'serviceAccountKey.json'),    // Root directory (Render Secret File location)
];

let foundKey = false;
for (const filePath of possiblePaths) {
  if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const serviceAccount = JSON.parse(fileContent);
      credential = cert(serviceAccount);
      foundKey = true;
      console.log(`Firebase initialized successfully using config file at: ${filePath}`);
      break;
    } catch (e) {
      console.error('Error parsing serviceAccountKey.json:', e);
    }
  }
}

// Fallback to environment variables if no file is found
if (!foundKey) {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('Service account file not found, falling back to environment variables.');
    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  } else {
    throw new Error('Firebase credentials missing! Provide either serviceAccountKey.json or Render environment variables.');
  }
}


export const firebaseApp = initializeApp({ credential });
export const messaging = getMessaging(firebaseApp);