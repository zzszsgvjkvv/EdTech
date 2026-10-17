import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// This will load serviceAccountKey.json from the root directory locally 
// and from Render's injected Secret File during production.
import serviceAccount from './serviceAccountKey.json';

export const firebaseApp = initializeApp({
  credential: cert(serviceAccount as any),
});

export const messaging = getMessaging(firebaseApp);