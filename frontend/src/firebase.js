import { initializeApp } from 'firebase/app';
import { getAuth, useDeviceLanguage } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const apiKey = String(firebaseConfig.apiKey ?? '');
const looksLikeFirebasePlaceholder =
  !apiKey ||
  /your-web-api-key|^your-[a-z-]+$/i.test(apiKey.trim()) ||
  /^<.*>$/.test(apiKey);

if (import.meta.env.DEV && looksLikeFirebasePlaceholder) {
  console.warn(
    '[Firebase] VITE_FIREBASE_* is missing. Auth features disabled. ' +
      'Set up Firebase keys to enable login.'
  );
}

let app = null;
let auth = null;

if (!looksLikeFirebasePlaceholder) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    useDeviceLanguage(auth);
  } catch (e) {
    console.warn('[Firebase] Auth initialization skipped — running without Firebase.');
    app = null;
    auth = null;
  }
} else {
  console.warn('[Firebase] Skipping — no valid API key found.');
}

export { auth };
export default app;