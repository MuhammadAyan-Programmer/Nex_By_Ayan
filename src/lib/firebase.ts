import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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
import type { UserProfile, ProjectApplication, Project } from '../types';
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
let isFirestoreQuotaExhausted = false;
let quotaExhaustedTimestamp = 0;
const QUOTA_COOLDOWN_MS = 5 * 60 * 1000; // 5-minute cooloff before retrying

export function isQuotaExhausted(): boolean {
  if (isFirestoreQuotaExhausted) {
    if (Date.now() - quotaExhaustedTimestamp > QUOTA_COOLDOWN_MS) {
      isFirestoreQuotaExhausted = false;
      return false;
    }
    return true;
  }
  return false;
}

export function markQuotaExhausted(): void {
  if (!isFirestoreQuotaExhausted) {
    isFirestoreQuotaExhausted = true;
    quotaExhaustedTimestamp = Date.now();
    console.warn('[Firebase] Firestore daily write quota limit reached. Pausing external Firestore writes to prevent error loop.');
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
      isEmailVerified: !!user.isEmailVerified,
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
}

/**
 * Fetch all registered users from Firebase Firestore
 */
export async function fetchUsersFromFirestore(): Promise<UserProfile[]> {
  if (isQuotaExhausted()) return [];
  const path = 'users';
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    const users: UserProfile[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as UserProfile;
      if (data && data.email && data.id !== 'usr-demo-01' && data.email !== 'contributor@nexora.work') {
        users.push({
          ...data,
          id: data.id || d.id,
        });
      }
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
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
            users.push({
              ...data,
              id: data.id || d.id,
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
}

/**
 * Fetch all applications from Firebase Firestore
 */
export async function fetchApplicationsFromFirestore(): Promise<ProjectApplication[]> {
  if (isQuotaExhausted()) return [];
  const path = 'applications';
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
  try {
    const projDocRef = doc(db, 'projects', project.id);
    await setDoc(projDocRef, project, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Fetch projects from Firebase Firestore
 */
export async function fetchProjectsFromFirestore(): Promise<Project[]> {
  if (isQuotaExhausted()) return [];
  const path = 'projects';
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
}
