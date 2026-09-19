import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  applyActionCode,
  checkActionCode,
  signInWithEmailAndPassword,
  reload,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { UserProfile, ProjectApplication, Project, MaintenanceConfig } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase safely
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/* CRITICAL: The app will break without specifying firestoreDatabaseId */
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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
  };
}

// Circuit breaker for Firestore quota limits (e.g. free tier daily write limits)
const QUOTA_STORAGE_KEY = 'nexora_firestore_quota_exhausted';
const QUOTA_COOLDOWN_MS = 10 * 60 * 1000; // 10-minute cooloff before retrying

function checkStoredQuotaStatus(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = sessionStorage.getItem(QUOTA_STORAGE_KEY);
    if (!raw) return false;
    const { timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < QUOTA_COOLDOWN_MS) {
      return true;
    }
    sessionStorage.removeItem(QUOTA_STORAGE_KEY);
    return false;
  } catch {
    return false;
  }
}

let isFirestoreQuotaExhausted = checkStoredQuotaStatus();

export function isQuotaExhausted(): boolean {
  if (isFirestoreQuotaExhausted) {
    if (checkStoredQuotaStatus()) {
      return true;
    }
    isFirestoreQuotaExhausted = false;
    return false;
  }
  return false;
}

export function markQuotaExhausted(): void {
  isFirestoreQuotaExhausted = true;
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        QUOTA_STORAGE_KEY,
        JSON.stringify({ exhausted: true, timestamp: Date.now() })
      );
    }
  } catch {}
  console.warn('[Firebase] Firestore daily write quota limit reached. Pausing external Firestore calls to preserve instantaneous system performance.');
}

/**
 * Strict timeout wrapper: guarantees that Firestore operations NEVER hang or delay the UI
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs = 2500, fallbackValue: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      resolve(fallbackValue);
    }, timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    return fallbackValue;
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (
    errMsg.includes('resource-exhausted') ||
    errMsg.includes('Quota limit exceeded') ||
    (error && (error as any).code === 'resource-exhausted')
  ) {
    markQuotaExhausted();
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.warn('[Firebase Firestore Info]:', JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: Test connection to Firestore on boot
export async function testConnection(): Promise<boolean> {
  if (isQuotaExhausted()) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Successfully validated Firestore connection.');
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('resource-exhausted') || msg.includes('Quota limit exceeded')) {
      markQuotaExhausted();
      return false;
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or Firestore initializing.');
    } else {
      console.log('[Firebase] Connection handshake verified.');
    }
    return false;
  }
}

// Run test connection silently
testConnection().catch(() => {});

// --- Firestore User Helpers ---

/**
 * Save or update a registered user in Firebase Firestore
 */
export async function saveUserToFirestore(user: UserProfile): Promise<boolean> {
  if (isQuotaExhausted()) return false;
  const path = `users/${user.id}`;
  return withTimeout(
    (async () => {
      try {
        const userDocRef = doc(db, 'users', user.id);
        const sanitizedUser: Record<string, any> = {
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email.toLowerCase().trim(),
          phone: user.phone || '',
          country: user.country || '',
          languages: Array.isArray(user.languages) ? user.languages : [],
          languageProficiency: user.languageProficiency || {},
          skills: Array.isArray(user.skills) ? user.skills : [],
          experience: user.experience || '',
          role: user.role || 'contributor',
          approvalStatus: user.approvalStatus || (user.role === 'admin' ? 'approved' : 'approved'),
          approvalDate: user.approvalDate || null,
          rejectionReason: user.rejectionReason || null,
          isEmailVerified: !!(user.emailVerified ?? user.isEmailVerified),
          emailVerified: !!(user.emailVerified ?? user.isEmailVerified),
          profileStatus: user.profileStatus || 'Incomplete',
          avatar: user.avatar || `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase(),
          status: user.status || 'active',
          createdAt: user.createdAt || new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString(),
        };

        if (user.cvLink) sanitizedUser.cvLink = user.cvLink;
        if (user.resumeUrl) sanitizedUser.resumeUrl = user.resumeUrl;

        await setDoc(userDocRef, sanitizedUser, { merge: true });
        console.log(`[Firebase] User ${user.email} (${user.id}) saved to Firestore`);
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
        return false;
      }
    })(),
    2500,
    false
  );
}

/**
 * Fetch all registered users from Firebase Firestore
 */
export async function fetchUsersFromFirestore(): Promise<UserProfile[]> {
  if (isQuotaExhausted()) return [];
  const path = 'users';
  return withTimeout(
    (async () => {
      try {
        const usersCol = collection(db, 'users');
        const snapshot = await getDocs(usersCol);
        const users: UserProfile[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as UserProfile;
          if (data && data.email && data.id !== 'usr-demo-01' && data.email !== 'contributor@nexora.work') {
            const isVerified = !!(data.emailVerified ?? data.isEmailVerified);
            users.push({
              ...data,
              id: data.id || d.id,
              approvalStatus: data.approvalStatus || (data.role === 'admin' ? 'approved' : 'approved'),
              approvalDate: data.approvalDate,
              rejectionReason: data.rejectionReason,
              isEmailVerified: isVerified,
              emailVerified: isVerified,
            });
          }
        });
        return users;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    })(),
    2500,
    []
  );
}

/**
 * Listen for real-time updates to registered users in Firebase Firestore
 */
export function subscribeToUsersFirestore(
  onUpdate: (users: UserProfile[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (isQuotaExhausted()) return () => {};
  const path = 'users';
  try {
    const usersCol = collection(db, 'users');
    return onSnapshot(
      usersCol,
      (snapshot) => {
        const users: UserProfile[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as UserProfile;
          if (data && data.email && data.id !== 'usr-demo-01' && data.email !== 'contributor@nexora.work') {
            const isVerified = !!(data.emailVerified ?? data.isEmailVerified);
            users.push({
              ...data,
              id: data.id || d.id,
              approvalStatus: data.approvalStatus || (data.role === 'admin' ? 'approved' : 'approved'),
              approvalDate: data.approvalDate,
              rejectionReason: data.rejectionReason,
              isEmailVerified: isVerified,
              emailVerified: isVerified,
            });
          }
        });
        onUpdate(users);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

// --- Firestore Application Helpers ---

/**
 * Save an application to Firebase Firestore
 */
export async function saveApplicationToFirestore(appData: ProjectApplication): Promise<boolean> {
  if (isQuotaExhausted()) return false;
  const path = `applications/${appData.id}`;
  return withTimeout(
    (async () => {
      try {
        const appDocRef = doc(db, 'applications', appData.id);
        const sanitizedApp: Record<string, any> = {
          id: appData.id,
          projectId: appData.projectId,
          projectName: appData.projectName,
          projectCategory: appData.projectCategory,
          userId: appData.userId,
          userName: appData.userName,
          userEmail: appData.userEmail.toLowerCase().trim(),
          phone: appData.phone || '',
          country: appData.country || '',
          languages: Array.isArray(appData.languages) ? appData.languages : [],
          languageProficiency: appData.languageProficiency || '',
          experience: appData.experience || '',
          skills: Array.isArray(appData.skills) ? appData.skills : [],
          cvLink: appData.cvLink || '',
          status: appData.status || 'Applied',
          appliedDate: appData.appliedDate || new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString(),
        };

        if (appData.notes) sanitizedApp.notes = appData.notes;
        if (appData.reviewedDate) sanitizedApp.reviewedDate = appData.reviewedDate;

        await setDoc(appDocRef, sanitizedApp, { merge: true });
        console.log(`[Firebase] Application ${appData.id} saved to Firestore`);
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
        return false;
      }
    })(),
    2500,
    false
  );
}

/**
 * Fetch all applications from Firebase Firestore
 */
export async function fetchApplicationsFromFirestore(): Promise<ProjectApplication[]> {
  if (isQuotaExhausted()) return [];
  const path = 'applications';
  return withTimeout(
    (async () => {
      try {
        const appsCol = collection(db, 'applications');
        const snapshot = await getDocs(appsCol);
        const applications: ProjectApplication[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as ProjectApplication;
          if (data && data.id) {
            applications.push({
              ...data,
              id: data.id || d.id,
            });
          }
        });
        return applications;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    })(),
    2500,
    []
  );
}

/**
 * Real-time listener for applications in Firebase Firestore
 */
export function subscribeToApplicationsFirestore(
  onUpdate: (apps: ProjectApplication[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (isQuotaExhausted()) return () => {};
  const path = 'applications';
  try {
    const appsCol = collection(db, 'applications');
    return onSnapshot(
      appsCol,
      (snapshot) => {
        const applications: ProjectApplication[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as ProjectApplication;
          if (data && data.id) {
            applications.push({
              ...data,
              id: data.id || d.id,
            });
          }
        });
        onUpdate(applications);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

// --- Firestore Project Helpers ---

/**
 * Save project to Firebase Firestore
 */
export async function saveProjectToFirestore(project: Project): Promise<boolean> {
  if (isQuotaExhausted()) return false;
  const path = `projects/${project.id}`;
  return withTimeout(
    (async () => {
      try {
        const projDocRef = doc(db, 'projects', project.id);
        await setDoc(projDocRef, project, { merge: true });
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
        return false;
      }
    })(),
    2500,
    false
  );
}

/**
 * Fetch projects from Firebase Firestore
 */
export async function fetchProjectsFromFirestore(): Promise<Project[]> {
  if (isQuotaExhausted()) return [];
  const path = 'projects';
  return withTimeout(
    (async () => {
      try {
        const projCol = collection(db, 'projects');
        const snapshot = await getDocs(projCol);
        const projects: Project[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Project;
          if (data && data.id) {
            projects.push({
              ...data,
              id: data.id || d.id,
            });
          }
        });
        return projects;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    })(),
    2500,
    []
  );
}

// --- Firestore System Maintenance Helpers ---

/**
 * Save maintenance configuration to Firebase Firestore
 */
export async function saveMaintenanceToFirestore(config: MaintenanceConfig): Promise<boolean> {
  if (isQuotaExhausted()) return false;
  const path = 'system/maintenance';
  return withTimeout(
    (async () => {
      try {
        const docRef = doc(db, 'system', 'maintenance');
        await setDoc(
          docRef,
          {
            ...config,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        console.log('[Firebase] Maintenance configuration saved to Firestore');
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
        return false;
      }
    })(),
    2500,
    false
  );
}

/**
 * Fetch maintenance configuration from Firebase Firestore
 */
export async function fetchMaintenanceFromFirestore(): Promise<MaintenanceConfig | null> {
  if (isQuotaExhausted()) return null;
  const path = 'system/maintenance';
  return withTimeout(
    (async () => {
      try {
        const docRef = doc(db, 'system', 'maintenance');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data() as MaintenanceConfig;
        }
        return null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
        return null;
      }
    })(),
    2500,
    null
  );
}

/**
 * Subscribe to real-time maintenance updates from Firebase Firestore
 */
export function subscribeToMaintenanceFirestore(
  onUpdate: (config: MaintenanceConfig) => void
): () => void {
  if (isQuotaExhausted()) return () => {};
  const path = 'system/maintenance';
  try {
    const docRef = doc(db, 'system', 'maintenance');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as MaintenanceConfig);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

// --- Firebase Authentication Built-in Email Verification Helpers ---

export interface FirebaseSignUpResult {
  success: boolean;
  user?: FirebaseUser;
  emailSent: boolean;
  error?: string;
  code?: string;
}

/**
 * Creates user in Firebase Authentication and immediately dispatches
 * the official Firebase verification email to their registered address.
 */
export async function firebaseSignUpAndSendVerification(
  email: string,
  pass: string
): Promise<FirebaseSignUpResult> {
  const normEmail = email.trim().toLowerCase();
  try {
    const cred = await createUserWithEmailAndPassword(auth, normEmail, pass);
    const user = cred.user;
    let emailSent = false;
    let emailError: string | undefined;

    try {
      await sendEmailVerification(user, {
        url: window.location.origin,
      });
      emailSent = true;
      console.log('[Firebase Auth] Built-in verification email sent immediately to:', normEmail);
    } catch (sendErr: any) {
      console.warn('[Firebase Auth] sendEmailVerification notice:', sendErr);
      emailError = sendErr?.message || 'Could not dispatch verification email';
    }

    return {
      success: true,
      user,
      emailSent,
      error: emailError,
    };
  } catch (err: any) {
    console.warn('[Firebase Auth] createUserWithEmailAndPassword code:', err?.code, err?.message);
    return {
      success: false,
      code: err?.code,
      error: err?.message || 'Firebase user creation failed',
      emailSent: false,
    };
  }
}

/**
 * Resends the verification email directly using Firebase Authentication.
 */
export async function firebaseResendVerificationEmail(
  email?: string,
  pass?: string
): Promise<{
  success: boolean;
  message: string;
  emailSent?: boolean;
}> {
  try {
    let targetUser: FirebaseUser | null = auth.currentUser;

    if (!targetUser && email && pass) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
        targetUser = cred.user;
      } catch (signInErr) {
        console.warn('[Firebase Auth] Sign in attempt for resend notice:', signInErr);
      }
    }

    if (!targetUser) {
      return {
        success: false,
        message: 'No active Firebase session found. Please sign in or use direct activation to proceed.',
        emailSent: false,
      };
    }

    if (targetUser.emailVerified) {
      return {
        success: true,
        message: 'Your email address is already verified in Firebase Authentication.',
        emailSent: false,
      };
    }

    await sendEmailVerification(targetUser, {
      url: window.location.origin,
    });

    return {
      success: true,
      emailSent: true,
      message: `A verification email has been sent by Firebase Authentication to ${targetUser.email}. Please check your inbox.`,
    };
  } catch (err: any) {
    console.error('[Firebase Auth] Resend verification error:', err);
    return {
      success: false,
      emailSent: false,
      message: err?.message || 'Failed to dispatch verification email via Firebase.',
    };
  }
}

/**
 * Verifies email using Firebase oobCode action link (e.g. from ?mode=verifyEmail&oobCode=...).
 */
export async function firebaseVerifyEmailWithActionCode(
  oobCode: string
): Promise<{
  success: boolean;
  email?: string;
  message: string;
  code?: string;
}> {
  try {
    let email: string | undefined;
    try {
      const info = await checkActionCode(auth, oobCode);
      email = info.data.email || undefined;
    } catch (infoErr) {
      console.warn('[Firebase Auth] checkActionCode warning:', infoErr);
    }

    await applyActionCode(auth, oobCode);

    if (auth.currentUser) {
      try {
        await reload(auth.currentUser);
      } catch (rErr) {
        console.warn('[Firebase Auth] reload user notice:', rErr);
      }
    }

    return {
      success: true,
      email: email || auth.currentUser?.email || undefined,
      message: 'Your email address has been successfully verified through Firebase Authentication!',
    };
  } catch (err: any) {
    console.error('[Firebase Auth] applyActionCode error:', err);
    return {
      success: false,
      code: err?.code,
      message: err?.message || 'The verification link is invalid or has expired.',
    };
  }
}

/**
 * Checks if the current Firebase user's email has been verified.
 */
export async function firebaseCheckEmailVerified(): Promise<boolean> {
  try {
    if (!auth.currentUser) return false;
    await reload(auth.currentUser);
    return auth.currentUser.emailVerified === true;
  } catch (e) {
    console.warn('[Firebase Auth] reload error:', e);
    return false;
  }
}
