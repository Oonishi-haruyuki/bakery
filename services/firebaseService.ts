import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { 
  initializeFirestore,
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { GameState } from '../types';

const app = initializeApp(firebaseConfig);

// Use initializeFirestore with long polling to bypass potential proxy issues
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function testConnection() {
  console.log("Checking Firestore connection...");
  try {
    // Attempt a real server read to verify connectivity
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test: SUCCESS");
    return true;
  } catch (error) {
    console.warn("Firestore connection test: FAILED", error);
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.error("Diagnostic: Client reported as offline.");
      }
      if (error.message.includes('unavailable')) {
        console.error("Diagnostic: Service unavailable. This is often a network/proxy issue.");
      }
    }
    return false;
  }
}

export async function saveGameState(userId: string, state: GameState) {
  const path = `gameStates/${userId}`;
  try {
    await setDoc(doc(db, path), {
      ...state,
      userId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadGameState(userId: string): Promise<GameState | null> {
  const path = `gameStates/${userId}`;
  try {
    const snap = await getDoc(doc(db, path));
    return snap.exists() ? (snap.data() as GameState) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export function subscribeToGameState(userId: string, callback: (state: GameState) => void) {
  const path = `gameStates/${userId}`;
  return onSnapshot(doc(db, path), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as GameState);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}
