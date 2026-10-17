import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import serviceAccount from './serviceAccountKey.json';

// Initialize the Firebase Admin App cleanly
export const firebaseApp = initializeApp({
  credential: cert(serviceAccount as any),
});

// Export messaging service
export const messaging = getMessaging(firebaseApp);