import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: 'user' | 'coach';
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ── Email / Password ──────────────────────────────────────────────────────────

export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return toAuthUserWithRole(credential.user);
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
  role: 'user' | 'coach' = 'user'
): Promise<AuthUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  
  // Save role to Firestore
  await setDoc(doc(db, 'users', credential.user.uid), {
    uid: credential.user.uid,
    email: credential.user.email,
    displayName: name,
    role,
    createdAt: serverTimestamp(),
  });
  
  return { ...toAuthUser(credential.user), role };
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ── Google Sign-In (Web Popup) ─────────────────────────────────────────────

export async function loginWithGoogle(role?: 'user' | 'coach'): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  if (role) {
    // Save role to DB right away since popup doesn't lose state
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      role,
      createdAt: serverTimestamp(),
    }, { merge: true });
  }
  return result.user;
}
export async function checkGoogleRedirectResult(): Promise<AuthUser | null> {
  const result = await getRedirectResult(auth);
  if (result?.user) {
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    
    // Check if we saved a pending role before redirect
    let role: 'user' | 'coach' = 'user';
    if (!userDoc.exists() && typeof window !== 'undefined') {
      const pendingRole = localStorage.getItem('pendingGoogleRole');
      if (pendingRole === 'coach' || pendingRole === 'user') {
        role = pendingRole;
      }
      localStorage.removeItem('pendingGoogleRole');
      
      // Save new Google user to DB
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        role,
        createdAt: serverTimestamp(),
      });
      
      return { ...toAuthUser(result.user), role };
    }
    
    return { ...toAuthUser(result.user), role: userDoc.data()?.role || 'user' };
  }
  return null;
}

// ── Sign Out ──────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
}

async function toAuthUserWithRole(user: User): Promise<AuthUser> {
  const base = toAuthUser(user);
  try {
    const docSnap = await getDoc(doc(db, 'users', user.uid));
    if (docSnap.exists() && docSnap.data().role) {
      base.role = docSnap.data().role;
    } else {
      base.role = 'user'; // default fallback
    }
  } catch (e) {
    console.warn("Could not fetch user role", e);
    base.role = 'user';
  }
  return base;
}

/** Map Firebase error codes to human-readable messages */
export function firebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
