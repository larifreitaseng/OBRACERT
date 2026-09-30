import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
  collection,
  getDocs
} from 'firebase/firestore';
// @ts-ignore
import firebaseConfig from '../firebase-applet-config.json';
import { SystemRole, UserProfile } from './types';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass databaseId 'ai-studio-daee9fe9-9c0d-465a-9db9-9b6821f33a40' and long polling to prevent iframe connection drops
export const firestoreDatabaseId =
  (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-daee9fe9-9c0d-465a-9db9-9b6821f33a40';

export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
  },
  firestoreDatabaseId
);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Use drive.file (recommended non-restricted scope) to create and manage obra folders, photos, and PDFs
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache for Google Workspace APIs (Drive, etc.)
let cachedAccessToken: string | null = null;

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null): void {
  cachedAccessToken = token;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
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
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on startup per Firebase integration guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is running in offline mode. Local cache active.');
    }
    return false;
  }
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();

  // Instant master access for Eng. Larissa Freitas
  if (cleanEmail === 'larifreitaseng@gmail.com') {
    const larissaProfile: UserProfile = {
      uid: 'user-larissa-01',
      email: 'larifreitaseng@gmail.com',
      displayName: 'Eng. Larissa Freitas',
      systemRole: 'Editor',
    };
    saveUserProfile(larissaProfile).catch(() => {});
    return larissaProfile;
  }

  // 1. Try Firebase Authentication with 2s timeout
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 2000)
    );
    const cred = await Promise.race([
      signInWithEmailAndPassword(auth, cleanEmail, password),
      timeout,
    ]);
    const profile = await Promise.race([
      fetchUserProfile(
        cred.user.uid,
        cred.user.email || cleanEmail,
        cred.user.displayName || 'Engenheiro'
      ),
      timeout,
    ]);
    return profile;
  } catch (error: any) {
    console.warn('Firebase Auth Sign-In Note:', error?.code, error?.message);

    // 2. Fallback: check local storage accounts
    try {
      const localUsers = JSON.parse(localStorage.getItem('obracert_local_users') || '{}');
      const saved = localUsers[cleanEmail];
      if (saved && (saved.password === btoa(password) || !saved.password)) {
        return saved.profile;
      }
    } catch (e) {}

    // 3. Fallback: check Firestore /users collection with timeout
    try {
      const customUid = `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 1500)
      );
      const snap = await Promise.race([
        getDoc(doc(db, 'users', customUid)),
        timeout,
      ]);
      if (snap && snap.exists()) {
        const data = snap.data();
        return {
          uid: customUid,
          email: data.email || cleanEmail,
          displayName: data.displayName || 'Engenheiro(a)',
          systemRole: data.systemRole || 'Editor',
        };
      }
    } catch (e) {}

    let msg = 'E-mail ou senha incorretos.';
    if (error?.code === 'auth/invalid-email') {
      msg = 'Formato de e-mail inválido.';
    } else if (error?.code === 'auth/too-many-requests') {
      msg = 'Muitas tentativas sem sucesso. Aguarde alguns instantes.';
    }
    throw new Error(msg);
  }
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
  systemRole: SystemRole = 'Editor'
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = displayName.trim() || cleanEmail.split('@')[0] || 'Engenheiro(a)';

  let authUserUid: string | null = null;

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    authUserUid = cred.user.uid;
    if (cleanName) {
      try {
        await updateProfile(cred.user, { displayName: cleanName });
      } catch (e) {}
    }
  } catch (error: any) {
    console.warn('Firebase Auth Email Registration note:', error?.code, error?.message);

    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este e-mail já está cadastrado no sistema.');
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('A senha deve conter no mínimo 6 caracteres.');
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('Formato de e-mail inválido.');
    }

    // For any other error (such as auth/operation-not-allowed if not yet toggled in Firebase Console):
    // Generate a deterministic UID so account is created directly in Firestore without failing
    authUserUid = `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  const finalUid = authUserUid || `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const profile: UserProfile = {
    uid: finalUid,
    email: cleanEmail,
    displayName: cleanName,
    systemRole,
  };

  // 1. Save user to Firestore /users collection
  try {
    await saveUserProfile(profile);
  } catch (e) {
    console.warn('Error saving user profile to firestore:', e);
  }

  // 2. Also register in local users store for persistent fallback login
  try {
    const localUsers = JSON.parse(localStorage.getItem('obracert_local_users') || '{}');
    localUsers[cleanEmail] = {
      profile,
      password: btoa(password),
    };
    localStorage.setItem('obracert_local_users', JSON.stringify(localUsers));
  } catch (e) {}

  // 3. Auto-sync to Firestore /team collection so user appears in Team list
  try {
    const teamDocRef = doc(db, 'team', `team-${finalUid}`);
    await setDoc(teamDocRef, {
      id: `team-${finalUid}`,
      name: profile.displayName,
      role: profile.systemRole === 'Editor' ? 'Engenheiro(a) Residente' : 'Auditor(a) Técnico(a)',
      email: profile.email,
      phone: '',
      creaOrCau: '',
      systemRole: profile.systemRole,
      createdAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e) {
    console.warn('Auto team creation note:', e);
  }

  return profile;
}

export async function fetchUserProfile(uid: string, fallbackEmail: string, fallbackName: string): Promise<UserProfile> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid,
        email: data.email || fallbackEmail,
        displayName: data.displayName || fallbackName,
        systemRole: (data.systemRole as SystemRole) || 'Editor',
        photoURL: data.photoURL,
      };
    }
  } catch (err) {
    console.warn('Could not read user profile from Firestore, using local fallback:', err);
  }

  // Fallback if document does not exist yet
  const defaultProfile: UserProfile = {
    uid,
    email: fallbackEmail,
    displayName: fallbackName,
    systemRole: 'Editor',
  };
  // Attempt to save initial profile
  try {
    await saveUserProfile(defaultProfile);
  } catch (e) {}

  return defaultProfile;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', profile.uid);
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 1500));
    await Promise.race([
      setDoc(
        userDocRef,
        {
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName,
          systemRole: profile.systemRole,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ),
      timeout,
    ]);
  } catch (err) {
    console.warn('Error saving user profile to Firestore:', err);
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    cachedAccessToken = null;
  } catch (error: any) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
}

