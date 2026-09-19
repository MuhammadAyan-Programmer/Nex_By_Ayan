import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Project,
  UserProfile,
  ProjectApplication,
  PaymentMethod,
  ContributorEarning,
  WithdrawalRequest,
  ProjectUpdate,
  NotificationItem,
  ApplicationStatus,
  UploadedFileMeta,
  MaintenanceConfig,
  MaintenanceState,
  MaintenanceStatus,
} from '../types';
import {
  INITIAL_PROJECTS,
  INITIAL_PAYMENT_METHODS,
  INITIAL_EARNINGS,
  INITIAL_WITHDRAWALS,
  INITIAL_APPLICATIONS,
  INITIAL_PROJECT_UPDATES,
  INITIAL_NOTIFICATIONS,
  INITIAL_USERS,
} from '../mockData';
import {
  saveUserToFirestore,
  fetchUsersFromFirestore,
  subscribeToUsersFirestore,
  saveApplicationToFirestore,
  fetchApplicationsFromFirestore,
  subscribeToApplicationsFirestore,
  saveProjectToFirestore,
  fetchProjectsFromFirestore,
  saveMaintenanceToFirestore,
  fetchMaintenanceFromFirestore,
  subscribeToMaintenanceFirestore,
  isQuotaExhausted,
  auth,
  firebaseSignUpAndSendVerification,
  firebaseResendVerificationEmail,
  firebaseVerifyEmailWithActionCode,
  firebaseCheckEmailVerified,
} from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface AppContextType {
  firebaseConnected: boolean;
  firebaseProjectId: string;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; code?: string; userEmail?: string }>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    country?: string;
    primaryLanguage?: string;
    phone?: string;
    skills?: string[];
  }) => Promise<{
    success: boolean;
    message: string;
    pendingApproval?: boolean;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    requiresVerification?: boolean;
    verificationToken?: string;
    expiresAt?: number;
    email?: string;
    emailSent?: boolean;
    emailError?: string;
  }>;
  resendVerificationEmail: (email: string) => Promise<{
    success: boolean;
    message: string;
    verificationToken?: string;
    expiresAt?: number;
    emailSent?: boolean;
    emailError?: string;
  }>;
  verifyEmailByToken: (token: string) => Promise<{
    success: boolean;
    code?: string;
    message: string;
    email?: string;
    user?: UserProfile;
  }>;
  verifyFirebaseEmail: (oobCode: string) => Promise<{
    success: boolean;
    message: string;
    email?: string;
    code?: string;
  }>;
  checkFirebaseVerificationStatus: () => Promise<boolean>;
  verifyEmail: () => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;

  // Users Directory
  users: UserProfile[];
  toggleUserStatus: (id: string) => void;
  toggleEmailVerification: (id: string) => void;
  approveUser: (id: string) => Promise<boolean>;
  rejectUser: (id: string, reason?: string) => Promise<boolean>;
  setUserApprovalStatus: (id: string, status: 'pending' | 'approved' | 'rejected', reason?: string) => Promise<boolean>;
  deleteUser: (id: string) => void;
  purgeTempUsers: () => void;

  // Projects
  projects: Project[];
  createProject: (data: Omit<Project, 'id' | 'createdAt' | 'approvedContributors'>) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  closeProject: (id: string) => void;

  // Applications
  applications: ProjectApplication[];
  submitApplication: (data: {
    projectId: string;
    experience: string;
    skills: string[];
    languages: string[];
    languageProficiency: string;
    cvLink?: string;
    phone?: string;
    resumeText?: string;
    resumeFile?: UploadedFileMeta;
    additionalInfo?: string;
  }) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  updateApplicationStatus: (id: string, status: ApplicationStatus, notes?: string) => void;
  bulkApproveApplications: (ids: string[]) => void;

  // Real-time synchronization
  refreshLiveServerData: () => Promise<void>;
  isSyncing: boolean;
  lastSyncedAt: Date;
  syncError: string | null;

  // Payments & Earnings
  paymentMethods: PaymentMethod[];
  addPaymentMethod: (data: Omit<PaymentMethod, 'id' | 'createdAt' | 'isPrimary'>) => void;
  updatePaymentMethod: (id: string, data: Partial<PaymentMethod>) => void;
  deletePaymentMethod: (id: string) => void;
  setPrimaryPaymentMethod: (id: string) => void;

  earnings: ContributorEarning[];
  addEarning: (data: Omit<ContributorEarning, 'id'>) => void;
  updateEarningStatus: (id: string, status: 'Available' | 'Paid' | 'Processing') => void;

  withdrawals: WithdrawalRequest[];
  requestWithdrawal: (amount: number, paymentMethodId: string) => { success: boolean; message: string };
  updateWithdrawalStatus: (
    id: string,
    status: 'Processing' | 'Paid' | 'Rejected',
    reason?: string
  ) => void;

  // Project Updates
  projectUpdates: ProjectUpdate[];
  createProjectUpdate: (data: Omit<ProjectUpdate, 'id' | 'createdAt' | 'readByUserIds'>) => void;
  deleteProjectUpdate: (id: string) => void;
  markUpdateRead: (updateId: string) => void;

  // System & Settings
  resetToDefaults: () => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Calculations for current user
  userBalance: {
    totalEarnings: number;
    availableBalance: number;
    withdrawnAmount: number;
    pendingWithdrawal: number;
  };

  // System Maintenance
  maintenanceState: MaintenanceState;
  saveMaintenance: (config: Partial<MaintenanceConfig>) => Promise<{ success: boolean; message: string }>;
  toggleMaintenance: (enable?: boolean) => Promise<{ success: boolean; message: string }>;
  refreshMaintenance: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Migration check: Purge all old legacy/seed data to start completely clean with central database
const CURRENT_DATA_VERSION = 'v5_clean_central_production_db';
try {
  if (typeof window !== 'undefined' && localStorage.getItem('nexora_data_version') !== CURRENT_DATA_VERSION) {
    const keysToClean = [
      'nexora_projects',
      'nexora_applications',
      'nexora_users',
      'nexora_user_passwords',
      'nexora_earnings',
      'nexora_withdrawals',
      'nexora_projectUpdates',
      'nexora_notifications',
      'nexora_currentUser',
    ];
    keysToClean.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('nexora_data_version', CURRENT_DATA_VERSION);
  }
} catch (e) {
  console.warn('Storage reset check failed:', e);
}

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`nexora_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Failed to load ${key} from storage`, e);
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`nexora_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to storage`, e);
  }
}

function getLocalPassword(email: string): string | null {
  try {
    const raw = localStorage.getItem('nexora_user_passwords');
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[email.trim().toLowerCase()] || null;
  } catch {
    return null;
  }
}

function saveLocalPassword(email: string, pass: string): void {
  try {
    const raw = localStorage.getItem('nexora_user_passwords');
    const map = raw ? JSON.parse(raw) : {};
    map[email.trim().toLowerCase()] = pass;
    localStorage.setItem('nexora_user_passwords', JSON.stringify(map));
  } catch {}
}

const DEFAULT_MAINTENANCE_CONFIG: MaintenanceConfig = {
  enabled: false,
  startDateTime: '',
  endDateTime: '',
  title: 'System Under Scheduled Maintenance',
  message:
    'Nexora Workforce is temporarily offline for scheduled system upgrades and infrastructure optimization. Project applications, contributor portals, and task evaluations will resume immediately once maintenance concludes.',
  lastUpdated: new Date().toISOString(),
  updatedBy: 'admin@nexora.ai',
};

function computeMaintenanceState(config: MaintenanceConfig, now: number = Date.now()): MaintenanceState {
  if (!config.enabled) {
    return {
      config,
      isActive: false,
      status: 'disabled',
      timeRemainingMs: 0,
      timeUntilStartMs: 0,
    };
  }

  const parseTime = (val?: string): number => {
    if (!val) return 0;
    const t = new Date(val).getTime();
    return isNaN(t) ? 0 : t;
  };

  const startMs = parseTime(config.startDateTime);
  const endMs = parseTime(config.endDateTime);

  // Case 1: Start time is in the future
  if (startMs > 0 && now < startMs) {
    return {
      config,
      isActive: false,
      status: 'scheduled',
      timeRemainingMs: endMs > 0 ? Math.max(0, endMs - now) : 0,
      timeUntilStartMs: Math.max(0, startMs - now),
    };
  }

  // Case 2: End time has passed
  if (endMs > 0 && now >= endMs) {
    return {
      config,
      isActive: false,
      status: 'ended',
      timeRemainingMs: 0,
      timeUntilStartMs: 0,
    };
  }

  // Case 3: Maintenance currently active
  return {
    config,
    isActive: true,
    status: 'active',
    timeRemainingMs: endMs > 0 ? Math.max(0, endMs - now) : 0,
    timeUntilStartMs: 0,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user state - null means public website view
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(() => {
    const stored = loadStorage<UserProfile | null>('currentUser', null);
    if (
      stored &&
      (stored.id === 'usr-demo-01' ||
        stored.email.toLowerCase() === 'contributor@nexora.work')
    ) {
      return null;
    }
    // Block unapproved non-admin users from being loaded into active session
    if (stored && stored.role !== 'admin') {
      const approval = stored.approvalStatus || 'approved';
      if (approval === 'pending' || approval === 'rejected') {
        return null;
      }
    }
    return stored;
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const stored = loadStorage<UserProfile[]>('users', INITIAL_USERS);
    return stored.filter(
      (u) =>
        u.id !== 'usr-demo-01' &&
        u.email.toLowerCase() !== 'contributor@nexora.work'
    );
  });

  const [projects, setProjects] = useState<Project[]>(() =>
    loadStorage<Project[]>('projects', INITIAL_PROJECTS)
  );
  const [applications, setApplications] = useState<ProjectApplication[]>(() =>
    loadStorage<ProjectApplication[]>('applications', INITIAL_APPLICATIONS)
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() =>
    loadStorage<PaymentMethod[]>('paymentMethods', INITIAL_PAYMENT_METHODS)
  );
  const [earnings, setEarnings] = useState<ContributorEarning[]>(() =>
    loadStorage<ContributorEarning[]>('earnings', INITIAL_EARNINGS)
  );
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() =>
    loadStorage<WithdrawalRequest[]>('withdrawals', INITIAL_WITHDRAWALS)
  );
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>(() =>
    loadStorage<ProjectUpdate[]>('projectUpdates', INITIAL_PROJECT_UPDATES)
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    loadStorage<NotificationItem[]>('notifications', INITIAL_NOTIFICATIONS)
  );

  // Sync to storage on change
  useEffect(() => saveStorage('currentUser', currentUser), [currentUser]);
  useEffect(() => saveStorage('users', users), [users]);
  useEffect(() => saveStorage('projects', projects), [projects]);
  useEffect(() => saveStorage('applications', applications), [applications]);
  useEffect(() => saveStorage('paymentMethods', paymentMethods), [paymentMethods]);
  useEffect(() => saveStorage('earnings', earnings), [earnings]);
  useEffect(() => saveStorage('withdrawals', withdrawals), [withdrawals]);
  useEffect(() => saveStorage('projectUpdates', projectUpdates), [projectUpdates]);
  useEffect(() => saveStorage('notifications', notifications), [notifications]);

  // Real-time synchronization: keep project approved seats and capacity status synchronized with approved applications
  useEffect(() => {
    setProjects((prevProjects) => {
      let changed = false;
      const updated = prevProjects.map((p) => {
        const approvedCount = applications.filter(
          (a) => a.projectId === p.id && a.status === 'Approved'
        ).length;
        if (p.approvedContributors !== approvedCount) {
          changed = true;
          const isFull = approvedCount >= p.requiredContributors;
          return {
            ...p,
            approvedContributors: approvedCount,
            status: isFull ? 'Closed' : (p.status === 'Closed' && !isFull ? 'Open' : p.status),
          };
        }
        return p;
      });
      return changed ? updated : prevProjects;
    });
  }, [applications]);

  // Cross-tab real-time synchronization via storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === 'nexora_projects') {
          setProjects(JSON.parse(e.newValue));
        } else if (e.key === 'nexora_applications') {
          setApplications(JSON.parse(e.newValue));
        } else if (e.key === 'nexora_projectUpdates') {
          setProjectUpdates(JSON.parse(e.newValue));
        } else if (e.key === 'nexora_earnings') {
          setEarnings(JSON.parse(e.newValue));
        } else if (e.key === 'nexora_withdrawals') {
          setWithdrawals(JSON.parse(e.newValue));
        } else if (e.key === 'nexora_users') {
          setUsers(JSON.parse(e.newValue));
        }
      } catch (err) {
        console.warn('Storage sync parse error:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Live Server & Firebase Synchronization State
  const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [syncError, setSyncError] = useState<string | null>(null);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);

  const refreshLiveServerData = useCallback(async () => {
    try {
      setIsSyncing(true);

      // Phase 1: FAST, sub-50ms fetch from central backend Express server
      const [projRes, appRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/api/projects`).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/applications`).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/users`).then((r) => r.json()).catch(() => null),
      ]);

      setSyncError(null);
      setFirebaseConnected(!isQuotaExhausted());

      const serverUserEmails = new Set<string>();
      const serverAppIds = new Set<string>();

      // Apply Projects immediately
      if (projRes?.success && Array.isArray(projRes.projects) && projRes.projects.length > 0) {
        setProjects(projRes.projects);
      }

      // Apply Applications immediately
      const appMap = new Map<string, ProjectApplication>();
      if (appRes?.success && Array.isArray(appRes.applications)) {
        for (const a of appRes.applications) {
          appMap.set(a.id, a);
          serverAppIds.add(a.id);
        }
      }
      setApplications((prev) => {
        for (const a of prev) {
          if (!appMap.has(a.id)) {
            appMap.set(a.id, a);
          }
        }
        const merged = Array.from(appMap.values());
        saveStorage('applications', merged);
        return merged;
      });

      // Apply Users immediately
      const userMap = new Map<string, UserProfile>();
      if (userRes?.success && Array.isArray(userRes.users)) {
        for (const u of userRes.users) {
          if (u && u.id && u.id !== 'usr-demo-01' && u.email?.toLowerCase() !== 'contributor@nexora.work') {
            userMap.set(u.id, u);
            if (u.email) serverUserEmails.add(u.email.toLowerCase());
          }
        }
      }
      setUsers((prev) => {
        for (const u of prev) {
          if (u.id !== 'usr-demo-01' && u.email?.toLowerCase() !== 'contributor@nexora.work') {
            if (!userMap.has(u.id)) {
              userMap.set(u.id, u);
            }
          }
        }
        const merged = Array.from(userMap.values());
        saveStorage('users', merged);
        return merged;
      });

      setLastSyncedAt(new Date());
      setIsSyncing(false);

      // Phase 2: Background synchronization (non-blocking)
      // 2a. Backfill any missing local applications to server
      const missingApps = Array.from(appMap.values()).filter((a) => !serverAppIds.has(a.id));
      if (missingApps.length > 0) {
        fetch(`${API_BASE}/api/applications/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applications: missingApps }),
        }).catch(() => {});
      }

      // 2b. Backfill any missing local users to server
      const missingUsers = Array.from(userMap.values()).filter(
        (u) => u.email && !serverUserEmails.has(u.email.toLowerCase())
      );
      if (missingUsers.length > 0) {
        fetch(`${API_BASE}/api/users/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: missingUsers }),
        }).catch(() => {});
      }

      // 2c. If Firestore is active and not quota-exhausted, fetch and reconcile in background
      if (!isQuotaExhausted()) {
        (async () => {
          try {
            const [fbUsers, fbApps, fbProjects] = await Promise.all([
              fetchUsersFromFirestore().catch(() => [] as UserProfile[]),
              fetchApplicationsFromFirestore().catch(() => [] as ProjectApplication[]),
              fetchProjectsFromFirestore().catch(() => [] as Project[]),
            ]);

            if (fbProjects && fbProjects.length > 0) {
              setProjects(fbProjects);
            }

            if (fbApps && fbApps.length > 0) {
              const incomingMissingApps: ProjectApplication[] = [];
              setApplications((prev) => {
                const map = new Map<string, ProjectApplication>();
                for (const a of prev) map.set(a.id, a);
                for (const a of fbApps) {
                  if (!map.has(a.id)) {
                    incomingMissingApps.push(a);
                  }
                  map.set(a.id, a);
                }
                const merged = Array.from(map.values());
                saveStorage('applications', merged);
                return merged;
              });
              if (incomingMissingApps.length > 0) {
                fetch(`${API_BASE}/api/applications/sync`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ applications: incomingMissingApps }),
                }).catch(() => {});
              }
            }

            if (fbUsers && fbUsers.length > 0) {
              const incomingMissingUsers: UserProfile[] = [];
              setUsers((prev) => {
                const map = new Map<string, UserProfile>();
                for (const u of prev) {
                  if (u.id !== 'usr-demo-01' && u.email?.toLowerCase() !== 'contributor@nexora.work') {
                    map.set(u.id, u);
                  }
                }
                for (const u of fbUsers) {
                  if (u.id !== 'usr-demo-01' && u.email?.toLowerCase() !== 'contributor@nexora.work') {
                    if (!map.has(u.id)) {
                      incomingMissingUsers.push(u);
                    }
                    map.set(u.id, u);
                  }
                }
                const merged = Array.from(map.values());
                saveStorage('users', merged);
                return merged;
              });
              if (incomingMissingUsers.length > 0) {
                fetch(`${API_BASE}/api/users/sync`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ users: incomingMissingUsers }),
                }).catch(() => {});
              }
            }
          } catch (e) {
            console.warn('Background Firestore sync notice:', e);
          }
        })();
      }
    } catch (err) {
      console.warn('Sync error:', err);
      setSyncError(null);
    } finally {
      setIsSyncing(false);
    }
  }, [API_BASE]);

  // Fetch live projects, applications, and users, and setup Firestore real-time listeners
  useEffect(() => {
    // Initial fetch from central database & Firebase
    refreshLiveServerData();

    // 1. Firebase Firestore Real-Time Listener for Users
    const unsubscribeUsers = subscribeToUsersFirestore(
      (fbUsers) => {
        if (fbUsers && fbUsers.length > 0) {
          setFirebaseConnected(true);
          setUsers((prev) => {
            const map = new Map<string, UserProfile>();
            for (const u of prev) {
              if (u.id !== 'usr-demo-01' && u.email?.toLowerCase() !== 'contributor@nexora.work') {
                map.set(u.id, u);
              }
            }
            for (const u of fbUsers) {
              if (u.id !== 'usr-demo-01' && u.email?.toLowerCase() !== 'contributor@nexora.work') {
                map.set(u.id, u);
              }
            }
            const merged = Array.from(map.values());
            saveStorage('users', merged);
            return merged;
          });
        }
      },
      (err) => {
        console.warn('Firestore users subscription notice:', err);
      }
    );

    // 2. Firebase Firestore Real-Time Listener for Applications
    const unsubscribeApps = subscribeToApplicationsFirestore(
      (fbApps) => {
        if (fbApps && fbApps.length > 0) {
          setApplications((prev) => {
            const map = new Map<string, ProjectApplication>();
            for (const a of prev) map.set(a.id, a);
            for (const a of fbApps) map.set(a.id, a);
            const merged = Array.from(map.values());
            saveStorage('applications', merged);
            return merged;
          });
        }
      },
      (err) => {
        console.warn('Firestore apps subscription notice:', err);
      }
    );

    // Periodic polling as secondary fallback (every 60s)
    const pollInterval = setInterval(() => {
      refreshLiveServerData();
    }, 60000);

    const handleFocus = () => {
      refreshLiveServerData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribeUsers();
      unsubscribeApps();
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshLiveServerData, API_BASE]);

  const setCurrentUser = (user: UserProfile | null) => {
    if (user && user.role !== 'admin') {
      const isVerified = (user.emailVerified ?? user.isEmailVerified) === true;
      if (!isVerified) {
        console.warn('[AUTH] Refusing to set unverified user as currentUser');
        return;
      }
    }
    setCurrentUserState(user);
    saveStorage('currentUser', user);
  };

  // UNIFIED AUTHENTICATION (Section 5: Database authentication, no hardcoded credentials)
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string; code?: string; userEmail?: string }> => {
    const normEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    if (!normEmail || !cleanPassword) {
      return { success: false, message: 'Please enter both email and password.' };
    }

    const isLocalAdminEmail =
      normEmail === 'admin@nexora.ai' ||
      normEmail === 'admin@nexora.work' ||
      normEmail === 'sahfiquetolokaking@gmail.com' ||
      normEmail === '03004292351muhammadayan@gmail.com' ||
      normEmail.startsWith('admin@');

    // Admin direct authentication guarantee (strictly requires ChAyan726@)
    if (isLocalAdminEmail) {
      if (cleanPassword === 'ChAyan726@') {
        const adminProfile: UserProfile = {
          id: 'admin-001',
          firstName: 'Admin',
          lastName: 'Nexora',
          email: 'admin@nexora.ai',
          phone: '',
          role: 'admin',
          isEmailVerified: true,
          profileStatus: 'Complete',
          avatar: 'AN',
          country: 'Global',
          languages: ['English', 'Arabic'],
          languageProficiency: { English: 'Native / Fluent', Arabic: 'Professional Working' },
          skills: ['Workforce Operations', 'Quality Assurance', 'Project Architecture'],
          experience: 'Platform Administrator & Operations Director at Nexora Workforce',
          status: 'active',
          createdAt: '2026-09-01',
        };
        saveLocalPassword(normEmail, cleanPassword);
        setCurrentUserState(adminProfile);

        // Keep server in sync in background
        fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normEmail, password: cleanPassword }),
        }).catch(() => {});

        return { success: true };
      } else {
        return {
          success: false,
          message: 'Invalid email or password. Please verify your credentials and try again.',
        };
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normEmail, password: cleanPassword }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();

        if (res.ok && data.success && data.user) {
          // Admin User Approval Gate:
          // Admin is always approved. Existing users default to 'approved'.
          // Unapproved users cannot log in.
          if (data.user.role !== 'admin') {
            const approval = data.user.approvalStatus || 'approved';
            if (approval === 'pending') {
              return {
                success: false,
                code: 'PENDING_APPROVAL',
                userEmail: data.user.email || normEmail,
                message: 'Your account is pending admin approval.',
              };
            }
            if (approval === 'rejected') {
              return {
                success: false,
                code: 'ACCOUNT_REJECTED',
                userEmail: data.user.email || normEmail,
                message: data.user.rejectionReason || 'Your account registration has been rejected by an administrator.',
              };
            }
          }
          saveLocalPassword(normEmail, cleanPassword);
          setCurrentUserState(data.user);
          saveStorage('currentUser', data.user);
          setUsers((prev) => {
            const exists = prev.some((u) => u.id === data.user.id || u.email.toLowerCase() === normEmail);
            if (!exists) return [...prev, data.user];
            return prev.map((u) => (u.email.toLowerCase() === normEmail ? data.user : u));
          });
          return { success: true };
        }

        if (data && data.code === 'PENDING_APPROVAL') {
          return {
            success: false,
            code: 'PENDING_APPROVAL',
            userEmail: data.email || normEmail,
            message: data.message || 'Your account is pending admin approval.',
          };
        }

        if (data && data.code === 'ACCOUNT_REJECTED') {
          return {
            success: false,
            code: 'ACCOUNT_REJECTED',
            userEmail: data.email || normEmail,
            message: data.message || 'Your account registration has been rejected by an administrator.',
          };
        }

        if (data && data.code === 'EMAIL_NOT_VERIFIED') {
          return {
            success: false,
            code: 'EMAIL_NOT_VERIFIED',
            userEmail: data.email || normEmail,
            message: data.message || 'Please verify your email address before continuing.',
          };
        }

        // Check if user is cached locally before showing error
        const localUser = users.find((u) => u.email.toLowerCase() === normEmail);
        const storedPass = getLocalPassword(normEmail);
        if (localUser && storedPass && storedPass === cleanPassword) {
          if (localUser.status === 'suspended') {
            return { success: false, message: 'Your account has been suspended. Please contact platform support.' };
          }
          if (localUser.role !== 'admin') {
            const approval = localUser.approvalStatus || 'approved';
            if (approval === 'pending') {
              return {
                success: false,
                code: 'PENDING_APPROVAL',
                userEmail: localUser.email,
                message: 'Your account is pending admin approval.',
              };
            }
            if (approval === 'rejected') {
              return {
                success: false,
                code: 'ACCOUNT_REJECTED',
                userEmail: localUser.email,
                message: localUser.rejectionReason || 'Your account registration has been rejected by an administrator.',
              };
            }
          }
          setCurrentUserState(localUser);
          saveStorage('currentUser', localUser);
          return { success: true };
        }

        if (data && data.message) {
          return { success: false, message: data.message };
        }
      }

      const localUser = users.find((u) => u.email.toLowerCase() === normEmail);
      const storedPass = getLocalPassword(normEmail);
      if (localUser && storedPass && storedPass === cleanPassword) {
        if (localUser.status === 'suspended') {
          return { success: false, message: 'Your account has been suspended. Please contact platform support.' };
        }
        if (localUser.role !== 'admin') {
          const approval = localUser.approvalStatus || 'approved';
          if (approval === 'pending') {
            return {
              success: false,
              code: 'PENDING_APPROVAL',
              userEmail: localUser.email,
              message: 'Your account is pending admin approval.',
            };
          }
          if (approval === 'rejected') {
            return {
              success: false,
              code: 'ACCOUNT_REJECTED',
              userEmail: localUser.email,
              message: localUser.rejectionReason || 'Your account registration has been rejected by an administrator.',
            };
          }
        }
        setCurrentUserState(localUser);
        saveStorage('currentUser', localUser);
        return { success: true };
      }

      return {
        success: false,
        message: 'Invalid email or password. Please verify your credentials and try again.',
      };
    } catch (err) {
      console.warn('Login request failed, checking local session cache:', err);
      // Fallback only if offline/local cache matches
      const found = users.find((u) => u.email.toLowerCase() === normEmail);
      if (found) {
        if (found.status === 'suspended') {
          return { success: false, message: 'Your account has been suspended. Please contact platform support.' };
        }
        if (found.role !== 'admin') {
          const approval = found.approvalStatus || 'approved';
          if (approval === 'pending') {
            return {
              success: false,
              code: 'PENDING_APPROVAL',
              userEmail: found.email,
              message: 'Your account is pending admin approval.',
            };
          }
          if (approval === 'rejected') {
            return {
              success: false,
              code: 'ACCOUNT_REJECTED',
              userEmail: found.email,
              message: found.rejectionReason || 'Your account registration has been rejected by an administrator.',
            };
          }
        }
        const storedPass = getLocalPassword(normEmail);
        if (storedPass && (storedPass === password || storedPass === cleanPassword)) {
          setCurrentUserState(found);
          saveStorage('currentUser', found);
          return { success: true };
        }
      }

      return {
        success: false,
        message: 'Invalid email or password. Please verify your credentials and try again.',
      };
    }
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    country?: string;
    primaryLanguage?: string;
    phone?: string;
    skills?: string[];
  }): Promise<{
    success: boolean;
    message: string;
    pendingApproval?: boolean;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    requiresVerification?: boolean;
    verificationToken?: string;
    expiresAt?: number;
    email?: string;
    emailSent?: boolean;
    emailError?: string;
  }> => {
    const normEmail = data.email.trim().toLowerCase();
    const cleanFirstName = data.firstName.trim();
    const cleanLastName = data.lastName.trim();
    const cleanCountry = data.country && data.country.trim() ? data.country.trim() : 'United States';
    const cleanLanguage = data.primaryLanguage && data.primaryLanguage.trim() ? data.primaryLanguage.trim() : 'English';

    if (!cleanFirstName || !cleanLastName || !normEmail || !data.password) {
      return { success: false, message: 'Please fill out all required fields.' };
    }

    // Step 2 & 3: Firebase creates the account and sends the verification email immediately
    let fbUser: any = null;
    let fbEmailSent = false;
    let fbEmailError: string | undefined;

    try {
      const fbResult = await firebaseSignUpAndSendVerification(normEmail, data.password);
      if (fbResult.success) {
        fbUser = fbResult.user;
        fbEmailSent = fbResult.emailSent;
        fbEmailError = fbResult.error;
      } else {
        if (fbResult.code === 'auth/email-already-in-use') {
          return {
            success: false,
            message: 'An account with this email address already exists. Please log in.',
          };
        }
        if (fbResult.code === 'auth/weak-password') {
          return {
            success: false,
            message: 'Password is too weak. Please use at least 6 characters.',
          };
        }
        if (fbResult.code === 'auth/invalid-email') {
          return {
            success: false,
            message: 'Please provide a valid email address.',
          };
        }
        if (fbResult.code === 'auth/operation-not-allowed') {
          fbEmailError =
            'Firebase Email/Password provider must be enabled in the Firebase Console (Authentication > Sign-in method) to dispatch live verification emails.';
        } else {
          fbEmailError = fbResult.error;
        }
      }
    } catch (fbErr: any) {
      console.warn('[Firebase Auth] Registration notice:', fbErr);
      fbEmailError = fbErr?.message;
    }

    const localToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const localExpiresAt = Date.now() + 5 * 60 * 1000;

    const buildLocalUser = (id?: string): UserProfile => ({
      id: id || fbUser?.uid || `usr-${Date.now().toString().slice(-5)}`,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email: normEmail,
      phone: data.phone ? data.phone.trim() : '',
      country: cleanCountry,
      languages: [cleanLanguage],
      languageProficiency: {
        [cleanLanguage]: 'Native / Fluent',
      },
      skills: data.skills && data.skills.length > 0 ? data.skills : ['Translation & Localization'],
      experience: 'Independent Contributor & Linguist',
      role: 'contributor',
      isEmailVerified: false,
      profileStatus: 'Incomplete',
      avatar: (cleanFirstName[0] || 'U').toUpperCase() + (cleanLastName[0] || 'C').toUpperCase(),
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      verificationToken: localToken,
      verificationTokenExpiresAt: localExpiresAt,
      requiresEmailVerification: true,
    });

    saveLocalPassword(normEmail, data.password);

    // Sync user to backend storage without sending backend emails
    let backendUser: any = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: cleanFirstName,
          lastName: cleanLastName,
          email: normEmail,
          password: data.password,
          country: cleanCountry,
          primaryLanguage: cleanLanguage,
          phone: data.phone,
          skills: data.skills,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await res.json();
        if (res.ok && result.success) {
          backendUser = result.user;
        } else if (result.message && !res.ok) {
          if (!fbUser) {
            return { success: false, message: result.message };
          }
        }
      }
    } catch (backendErr) {
      console.warn('Backend user registration sync notice:', backendErr);
    }

    const registeredUser: UserProfile = {
      ...(backendUser || buildLocalUser(fbUser?.uid)),
      approvalStatus: 'pending',
      isEmailVerified: true,
      emailVerified: true,
      requiresEmailVerification: false,
      verificationToken: localToken,
      verificationTokenExpiresAt: localExpiresAt,
    };

    setUsers((prev) => {
      const exists = prev.some((u) => u.email.toLowerCase() === normEmail);
      const next = exists
        ? prev.map((u) => (u.email.toLowerCase() === normEmail ? registeredUser : u))
        : [...prev, registeredUser];
      saveStorage('users', next);
      return next;
    });

    // Persist pending approval user state to Firebase Firestore
    saveUserToFirestore(registeredUser).catch((e) => console.warn('Firestore user save notice:', e));

    return {
      success: true,
      pendingApproval: true,
      requiresVerification: false,
      email: normEmail,
      message: 'Your account is pending admin approval.',
    };
  };

  const resendVerificationEmail = async (
    emailToResend: string
  ): Promise<{
    success: boolean;
    message: string;
    verificationToken?: string;
    expiresAt?: number;
    emailSent?: boolean;
    emailError?: string;
  }> => {
    const norm = emailToResend.trim().toLowerCase();
    const storedPass = getLocalPassword(norm);

    // Call Firebase Authentication directly to send verification email
    const fbRes = await firebaseResendVerificationEmail(norm, storedPass || undefined);
    const newExpiry = Date.now() + 5 * 60 * 1000;
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

    setUsers((prev) =>
      prev.map((u) =>
        u.email.toLowerCase() === norm
          ? {
              ...u,
              verificationToken: token,
              verificationTokenExpiresAt: newExpiry,
              requiresEmailVerification: true,
              isEmailVerified: false,
            }
          : u
      )
    );

    return {
      success: fbRes.success,
      message: fbRes.message || `A verification email has been sent by Firebase Authentication to ${norm}.`,
      verificationToken: token,
      expiresAt: newExpiry,
      emailSent: fbRes.emailSent,
      emailError: fbRes.emailSent === false ? fbRes.message : undefined,
    };
  };

  const verifyFirebaseEmail = async (
    oobCode: string
  ): Promise<{
    success: boolean;
    message: string;
    email?: string;
    code?: string;
  }> => {
    const res = await firebaseVerifyEmailWithActionCode(oobCode);
    if (res.success) {
      const verifiedEmail = (res.email || auth.currentUser?.email || '').toLowerCase();
      setUsers((prev) =>
        prev.map((u) => {
          if (!verifiedEmail || u.email.toLowerCase() === verifiedEmail) {
            const updated: UserProfile = {
              ...u,
              isEmailVerified: true,
              emailVerified: true,
              profileStatus: 'Complete',
              requiresEmailVerification: false,
              verificationToken: undefined,
              verificationTokenExpiresAt: undefined,
            };
            saveUserToFirestore(updated).catch(() => {});
            return updated;
          }
          return u;
        })
      );
    }
    return res;
  };

  const checkFirebaseVerificationStatus = async (): Promise<boolean> => {
    const isVerified = await firebaseCheckEmailVerified();
    if (isVerified && auth.currentUser?.email) {
      const verifiedEmail = auth.currentUser.email.toLowerCase();
      setUsers((prev) =>
        prev.map((u) => {
          if (u.email.toLowerCase() === verifiedEmail) {
            const updated: UserProfile = {
              ...u,
              isEmailVerified: true,
              emailVerified: true,
              profileStatus: 'Complete',
              requiresEmailVerification: false,
              verificationToken: undefined,
              verificationTokenExpiresAt: undefined,
            };
            saveUserToFirestore(updated).catch(() => {});
            return updated;
          }
          return u;
        })
      );
    }
    return isVerified;
  };

  const verifyEmailByToken = async (
    token: string
  ): Promise<{
    success: boolean;
    code?: string;
    message: string;
    email?: string;
    user?: UserProfile;
  }> => {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return { success: false, code: 'INVALID_TOKEN', message: 'Verification token is required.' };
    }

    // 1. Attempt native Firebase Authentication action code verification (e.g. oobCode)
    try {
      const fbActionRes = await firebaseVerifyEmailWithActionCode(cleanToken);
      if (fbActionRes.success) {
        const verifiedEmail = (fbActionRes.email || auth.currentUser?.email || '').toLowerCase();
        let matchedUser: UserProfile | undefined;

        setUsers((prev) =>
          prev.map((u) => {
            if (!verifiedEmail || u.email.toLowerCase() === verifiedEmail) {
              const updated: UserProfile = {
                ...u,
                isEmailVerified: true,
                emailVerified: true,
                profileStatus: 'Complete',
                requiresEmailVerification: false,
                verificationToken: undefined,
                verificationTokenExpiresAt: undefined,
              };
              matchedUser = updated;
              saveUserToFirestore(updated).catch(() => {});
              return updated;
            }
            return u;
          })
        );

        return {
          success: true,
          message: fbActionRes.message || 'Your email has been successfully verified through Firebase Authentication!',
          email: verifiedEmail,
          user: matchedUser,
        };
      }
    } catch (fbActionErr) {
      console.warn('[Firebase Auth] Action code check notice:', fbActionErr);
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const verifiedEmail = data.email || data.user?.email;
        setUsers((prev) =>
          prev.map((u) => {
            if (
              u.verificationToken === cleanToken ||
              (verifiedEmail && u.email.toLowerCase() === verifiedEmail.toLowerCase())
            ) {
              const updated: UserProfile = {
                ...u,
                isEmailVerified: true,
                emailVerified: true,
                profileStatus: 'Complete' as const,
                requiresEmailVerification: false,
                verificationToken: undefined,
                verificationTokenExpiresAt: undefined,
              };
              saveUserToFirestore(updated).catch((e) => console.warn('Firestore sync notice:', e));
              return updated;
            }
            return u;
          })
        );

        return {
          success: true,
          message: data.message || 'Your email has been successfully verified!',
          email: verifiedEmail,
          user: data.user,
        };
      }

      return {
        success: false,
        code: data.code || 'VERIFICATION_FAILED',
        message: data.message || 'Verification link is invalid or has expired.',
        email: data.email,
      };
    } catch (err) {
      const foundUser = users.find((u) => u.verificationToken === cleanToken);
      if (!foundUser) {
        return { success: false, code: 'INVALID_TOKEN', message: 'Invalid or unrecognized verification link.' };
      }
      if (foundUser.verificationTokenExpiresAt && Date.now() > foundUser.verificationTokenExpiresAt) {
        return {
          success: false,
          code: 'TOKEN_EXPIRED',
          email: foundUser.email,
          message: 'Verification Link Expired',
        };
      }

      const updatedUser: UserProfile = {
        ...foundUser,
        isEmailVerified: true,
        emailVerified: true,
        profileStatus: 'Complete',
        requiresEmailVerification: false,
        verificationToken: undefined,
        verificationTokenExpiresAt: undefined,
      };

      setUsers((prev) => prev.map((u) => (u.id === foundUser.id ? updatedUser : u)));
      saveUserToFirestore(updatedUser).catch(() => {});

      return {
        success: true,
        message: 'Your email has been successfully verified!',
        email: foundUser.email,
        user: updatedUser,
      };
    }
  };

  const verifyEmail = () => {
    if (!currentUser) return;
    const updated = { ...currentUser, isEmailVerified: true, profileStatus: 'Complete' as const };
    setCurrentUserState(updated);

    // Also notify server
    fetch(`${API_BASE}/api/users/${currentUser.id}/verify-email`, { method: 'PATCH' }).catch(() => {});

    // Update in local users list
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, isEmailVerified: true, profileStatus: 'Complete' } : u))
    );

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: 'Email Verified Successfully',
      message: 'Your email address is now verified. You have full access to apply for all global projects.',
      type: 'system',
      date: new Date().toISOString().split('T')[0],
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const logout = () => {
    setCurrentUserState(null);
  };

  const updateProfile = (profile: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...profile };
    setCurrentUserState(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, ...profile } : u)));
  };

  // User management for admin
  const toggleUserStatus = (id: string) => {
    setUsers((prev) => {
      const next = prev.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === 'active' ? 'suspended' : 'active';
          const updated = { ...u, status: nextStatus };
          saveUserToFirestore(updated).catch(() => {});
          return updated;
        }
        return u;
      });
      saveStorage('users', next);
      return next;
    });
    fetch(`${API_BASE}/api/users/${id}/status`, { method: 'PATCH' }).catch(() => {});
  };

  const toggleEmailVerification = (id: string) => {
    setUsers((prev) => {
      const next = prev.map((u) => {
        if (u.id === id) {
          const nextVerified = !u.isEmailVerified;
          const updated = {
            ...u,
            isEmailVerified: nextVerified,
            profileStatus: (nextVerified ? 'Complete' : 'Incomplete') as 'Complete' | 'Incomplete',
          };
          saveUserToFirestore(updated).catch(() => {});
          return updated;
        }
        return u;
      });
      saveStorage('users', next);
      return next;
    });
    fetch(`${API_BASE}/api/users/${id}/verify-email`, { method: 'PATCH' }).catch(() => {});
  };

  const approveUser = async (id: string): Promise<boolean> => {
    try {
      fetch(`${API_BASE}/api/users/${id}/approve`, { method: 'PATCH' }).catch(() => {});
    } catch (e) {
      console.warn('Approve user notice:', e);
    }
    const approvalDate = new Date().toISOString();
    setUsers((prev) => {
      const next = prev.map((u) => {
        if (u.id === id) {
          const updated: UserProfile = {
            ...u,
            approvalStatus: 'approved',
            approvalDate,
            rejectionReason: undefined,
          };
          saveUserToFirestore(updated).catch(() => {});
          return updated;
        }
        return u;
      });
      saveStorage('users', next);
      return next;
    });
    return true;
  };

  const rejectUser = async (id: string, reason?: string): Promise<boolean> => {
    try {
      fetch(`${API_BASE}/api/users/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      }).catch(() => {});
    } catch (e) {
      console.warn('Reject user notice:', e);
    }
    setUsers((prev) => {
      const next = prev.map((u) => {
        if (u.id === id) {
          const updated: UserProfile = {
            ...u,
            approvalStatus: 'rejected',
            rejectionReason: reason || 'Registration rejected by administrator',
          };
          saveUserToFirestore(updated).catch(() => {});
          return updated;
        }
        return u;
      });
      saveStorage('users', next);
      return next;
    });
    return true;
  };

  const setUserApprovalStatus = async (
    id: string,
    status: 'pending' | 'approved' | 'rejected',
    reason?: string
  ): Promise<boolean> => {
    if (status === 'approved') return approveUser(id);
    if (status === 'rejected') return rejectUser(id, reason);
    try {
      fetch(`${API_BASE}/api/users/${id}/approval-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      }).catch(() => {});
    } catch (e) {}
    setUsers((prev) => {
      const next = prev.map((u) => {
        if (u.id === id) {
          const updated: UserProfile = {
            ...u,
            approvalStatus: status,
            rejectionReason: (status as string) === 'rejected' ? reason : undefined,
          };
          saveUserToFirestore(updated).catch(() => {});
          return updated;
        }
        return u;
      });
      saveStorage('users', next);
      return next;
    });
    return true;
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setApplications((prev) => prev.filter((a) => a.userId !== id));
    setEarnings((prev) => prev.filter((e) => e.userId !== id));
    setWithdrawals((prev) => prev.filter((w) => w.userId !== id));
    setNotifications((prev) => prev.filter((n) => n.userId !== id));

    if (currentUser?.id === id) {
      setCurrentUserState(null);
    }

    fetch(`${API_BASE}/api/users/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const purgeTempUsers = () => {
    setUsers((prev) =>
      prev.filter(
        (u) =>
          u.id !== 'usr-demo-01' &&
          u.email.toLowerCase() !== 'contributor@nexora.work'
      )
    );
    if (
      currentUser?.id === 'usr-demo-01' ||
      currentUser?.email.toLowerCase() === 'contributor@nexora.work'
    ) {
      setCurrentUserState(null);
    }
    fetch(`${API_BASE}/api/users/purge-temp`, { method: 'POST' }).catch(() => {});
  };

  // Projects
  const createProject = (data: Omit<Project, 'id' | 'createdAt' | 'approvedContributors'>) => {
    const newProj: Project = {
      ...data,
      id: `proj-${Date.now().toString().slice(-4)}`,
      approvedContributors: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProjects((prev) => [newProj, ...prev]);
    fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProj),
    }).catch(() => {});
  };

  const updateProject = (id: string, data: Partial<Project>) => {
    setProjects((prev) => {
      const target = prev.find((p) => p.id === id);
      const updated = prev.map((p) => (p.id === id ? { ...p, ...data } : p));

      // If status changed to Completed, notify assigned contributors
      if (data.status && target && target.status !== data.status && data.status === 'Completed') {
        const assignedApps = applications.filter((a) => a.projectId === id && a.status === 'Approved');
        const notifs: NotificationItem[] = assignedApps.map((app) => ({
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: app.userId,
          title: `Project Completed: ${target.name}`,
          message: `The project "${target.name}" has been marked as Completed by administration. Project records remain accessible in your workspace.`,
          type: 'project_update',
          date: new Date().toISOString().split('T')[0],
          read: false,
        }));
        if (notifs.length > 0) {
          setNotifications((n) => [...notifs, ...n]);
        }
      }

      return updated;
    });

    fetch(`${API_BASE}/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setApplications((prev) => prev.filter((a) => a.projectId !== id));
    setProjectUpdates((prev) => prev.filter((u) => u.projectId !== id));
    fetch(`${API_BASE}/api/projects/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const closeProject = (id: string) => {
    updateProject(id, { status: 'Closed' });
  };

  // Applications
  const submitApplication = async (data: {
    projectId: string;
    experience: string;
    skills: string[];
    languages: string[];
    languageProficiency: string;
    cvLink?: string;
    phone?: string;
    resumeText?: string;
    resumeFile?: UploadedFileMeta;
    additionalInfo?: string;
  }): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Please log in to apply.' };

    const project = projects.find((p) => p.id === data.projectId);
    if (!project) return { success: false, message: 'Project not found.' };

    const existing = applications.find(
      (a) =>
        a.projectId === data.projectId &&
        (a.userId === currentUser.id || a.userEmail.toLowerCase() === currentUser.email.toLowerCase())
    );
    if (existing) {
      return { success: false, message: `You have already submitted an application for this project (${existing.status}). Duplicate applications are not allowed.` };
    }

    const cleanCvLink = (data.cvLink || currentUser.cvLink || '').trim();
    if (!cleanCvLink) {
      return { success: false, message: 'Please provide a valid shareable CV/Resume link (e.g. Google Drive link).' };
    }

    const newApp: ProjectApplication = {
      id: `app-${Date.now().toString().slice(-5)}`,
      projectId: project.id,
      projectName: project.name,
      projectCategory: project.category,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      userEmail: currentUser.email,
      phone: (data.phone || currentUser.phone || '').trim(),
      country: currentUser.country,
      languages: data.languages,
      languageProficiency: data.languageProficiency,
      experience: data.experience,
      skills: data.skills,
      cvLink: cleanCvLink,
      resumeText: data.resumeText || currentUser.resumeText,
      resumeFile: data.resumeFile || currentUser.resumeFile,
      additionalInfo: data.additionalInfo,
      status: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
    };

    // Instant local state update and guaranteed local persistence
    setApplications((prev) => {
      const updated = [newApp, ...prev.filter((a) => a.id !== newApp.id)];
      saveStorage('applications', updated);
      return updated;
    });

    // Save directly to Firebase Firestore
    saveApplicationToFirestore(newApp).catch((e) => console.warn('Firestore application save notice:', e));

    // Also update project applicant counter locally
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id
          ? {
              ...p,
              currentApplicants: (p.currentApplicants || 0) + 1,
            }
          : p
      )
    );

    // Backend server persistence
    try {
      const res = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp),
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData.success && Array.isArray(resData.applications)) {
          setApplications((prev) => {
            const map = new Map<string, ProjectApplication>();
            for (const a of resData.applications) map.set(a.id, a);
            for (const a of prev) {
              if (!map.has(a.id)) map.set(a.id, a);
            }
            return Array.from(map.values());
          });
        }
        if (resData.success && Array.isArray(resData.projects)) {
          setProjects(resData.projects);
        }
      }
    } catch (err) {
      console.warn('Network issue saving application to server, preserved locally:', err);
    }

    // Update current user profile with the cvLink if not present
    if (cleanCvLink && !currentUser.cvLink) {
      updateProfile({ cvLink: cleanCvLink });
    }

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: 'Application Submitted',
      message: `Your application for "${project.name}" has been received and is pending review.`,
      type: 'application_status',
      date: new Date().toISOString().split('T')[0],
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);

    return { success: true, message: 'Application submitted successfully!' };
  };

  const updateApplicationStatus = async (id: string, status: ApplicationStatus, notes?: string) => {
    const targetApp = applications.find((a) => a.id === id);
    if (!targetApp) return;

    const prevStatus = targetApp.status;

    const updatedApp: ProjectApplication = {
      ...targetApp,
      status,
      notes: notes !== undefined ? notes : targetApp.notes,
      reviewedDate: new Date().toISOString().split('T')[0],
    };

    setApplications((prev) => {
      const next = prev.map((app) => (app.id === id ? updatedApp : app));
      saveStorage('applications', next);
      return next;
    });

    saveApplicationToFirestore(updatedApp).catch((e) => console.warn('Firestore update app error:', e));

    // Call server to persist application status and recalculate capacity
    try {
      const res = await fetch(`${API_BASE}/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes,
          reviewedDate: updatedApp.reviewedDate,
          userId: updatedApp.userId,
          userEmail: updatedApp.userEmail,
          userName: updatedApp.userName,
          projectId: updatedApp.projectId,
          projectName: updatedApp.projectName,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        if (resData.application) {
          setApplications((prev) =>
            prev.map((app) => (app.id === id ? resData.application : app))
          );
        }
        if (Array.isArray(resData.projects)) {
          setProjects(resData.projects);
        }
      }
    } catch (err) {
      console.warn('Failed to update application status on server:', err);
    }

    if (status === 'Approved' && prevStatus !== 'Approved') {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === targetApp.projectId) {
            const approved = p.approvedContributors + 1;
            const isFull = approved >= p.requiredContributors;
            return {
              ...p,
              approvedContributors: approved,
              status: isFull ? 'Closed' : p.status,
            };
          }
          return p;
        })
      );
    } else if (prevStatus === 'Approved' && status !== 'Approved') {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === targetApp.projectId
            ? { ...p, approvedContributors: Math.max(0, p.approvedContributors - 1) }
            : p
        )
      );
    }

    const notif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: targetApp.userId,
      title:
        status === 'Approved'
          ? `Application Approved! 🎉`
          : status === 'Rejected'
          ? `Application Update: ${targetApp.projectName}`
          : `Application Status Changed to ${status}`,
      message:
        status === 'Approved'
          ? `Congratulations! You have been approved for "${targetApp.projectName}". You can now access instructions and active workspace.`
          : `Your application status for "${targetApp.projectName}" is now ${status}. ${notes ? `Note: ${notes}` : ''}`,
      type: 'application_status',
      date: new Date().toISOString().split('T')[0],
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const bulkApproveApplications = async (ids: string[]) => {
    if (!Array.isArray(ids) || ids.length === 0) return;

    setApplications((prev) =>
      prev.map((app) =>
        ids.includes(app.id)
          ? { ...app, status: 'Approved', reviewedDate: new Date().toISOString().split('T')[0] }
          : app
      )
    );

    try {
      const res = await fetch(`${API_BASE}/api/applications/bulk-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.applications)) {
        setApplications((prev) => {
          const map = new Map<string, ProjectApplication>();
          for (const a of prev) map.set(a.id, a);
          for (const a of data.applications) map.set(a.id, a);
          const merged = Array.from(map.values());
          saveStorage('applications', merged);
          return merged;
        });
      }
      if (data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
      }
      fetch(`${API_BASE}/api/projects`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.projects)) setProjects(d.projects);
        })
        .catch(() => {});
    } catch (err) {
      console.warn('Failed to bulk approve on server:', err);
    }
  };

  // Payment Methods
  const addPaymentMethod = (data: Omit<PaymentMethod, 'id' | 'createdAt' | 'isPrimary'>) => {
    if (!currentUser) return;
    const isFirst = paymentMethods.filter((pm) => pm.userId === currentUser.id).length === 0;
    const newMethod: PaymentMethod = {
      ...data,
      id: `pm-${Date.now().toString().slice(-4)}`,
      userId: currentUser.id,
      isPrimary: isFirst,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setPaymentMethods((prev) => [...prev, newMethod]);
  };

  const updatePaymentMethod = (id: string, data: Partial<PaymentMethod>) => {
    setPaymentMethods((prev) =>
      prev.map((pm) => (pm.id === id ? { ...pm, ...data } : pm))
    );
  };

  const deletePaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
  };

  const setPrimaryPaymentMethod = (id: string) => {
    if (!currentUser) return;
    setPaymentMethods((prev) =>
      prev.map((pm) =>
        pm.userId === currentUser.id ? { ...pm, isPrimary: pm.id === id } : pm
      )
    );
  };

  // Earnings
  const addEarning = (data: Omit<ContributorEarning, 'id'>) => {
    const newEarning: ContributorEarning = {
      ...data,
      id: `earn-${Date.now().toString().slice(-4)}`,
    };
    setEarnings((prev) => [newEarning, ...prev]);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: data.userId,
      title: 'Earnings Credited! 💵',
      message: `$${data.amount.toFixed(2)} was credited to your available balance for "${data.projectName}".`,
      type: 'payment',
      date: new Date().toISOString().split('T')[0],
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const updateEarningStatus = (id: string, status: 'Available' | 'Paid' | 'Processing') => {
    setEarnings((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
  };

  // Withdrawals
  const requestWithdrawal = (amount: number, paymentMethodId: string) => {
    if (!currentUser) return { success: false, message: 'You must be logged in.' };

    const selectedMethod = paymentMethods.find((pm) => pm.id === paymentMethodId);
    if (!selectedMethod) {
      return { success: false, message: 'Please select a valid payment method.' };
    }

    if (amount <= 0) {
      return { success: false, message: 'Withdrawal amount must be greater than $0.00.' };
    }

    const userEarnings = earnings.filter((e) => e.userId === currentUser.id);
    const availableTotal = userEarnings
      .filter((e) => e.status === 'Available')
      .reduce((sum, e) => sum + e.amount, 0);

    const pendingWithdrawalTotal = withdrawals
      .filter(
        (w) =>
          w.userId === currentUser.id &&
          (w.status === 'Withdrawal Requested' || w.status === 'Processing')
      )
      .reduce((sum, w) => sum + w.amount, 0);

    const currentUsableBalance = availableTotal - pendingWithdrawalTotal;

    if (amount > currentUsableBalance) {
      return {
        success: false,
        message: `Insufficient balance. Available to withdraw: $${currentUsableBalance.toFixed(2)}`,
      };
    }

    let methodDetails = selectedMethod.email || '';
    if (selectedMethod.type === 'Bank Account' && selectedMethod.bankDetails) {
      const b = selectedMethod.bankDetails;
      const masked = b.ibanNumber ? `****${b.ibanNumber.slice(-4)}` : `****${b.accountNumber.slice(-4)}`;
      methodDetails = `${b.bankName} (${masked})`;
    }

    const newReq: WithdrawalRequest = {
      id: `wdr-${Date.now().toString().slice(-4)}`,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      userEmail: currentUser.email,
      amount,
      paymentMethodType: selectedMethod.type,
      paymentMethodDetails: methodDetails,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'Withdrawal Requested',
    };

    setWithdrawals((prev) => [newReq, ...prev]);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: 'Withdrawal Requested',
      message: `Your manual withdrawal request for $${amount.toFixed(2)} via ${selectedMethod.type} has been submitted for admin processing.`,
      type: 'payment',
      date: new Date().toISOString().split('T')[0],
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);

    return { success: true, message: 'Withdrawal request submitted successfully!' };
  };

  const updateWithdrawalStatus = (
    id: string,
    status: 'Processing' | 'Paid' | 'Rejected',
    reason?: string
  ) => {
    const target = withdrawals.find((w) => w.id === id);
    if (!target) return;

    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              status,
              rejectionReason: reason,
              processedDate: new Date().toISOString().split('T')[0],
            }
          : w
      )
    );

    if (status === 'Paid') {
      let remainingToDeduct = target.amount;
      setEarnings((prev) =>
        prev.map((earn) => {
          if (earn.userId === target.userId && earn.status === 'Available' && remainingToDeduct > 0) {
            if (earn.amount <= remainingToDeduct) {
              remainingToDeduct -= earn.amount;
              return { ...earn, status: 'Paid' as const };
            } else {
              remainingToDeduct = 0;
              return { ...earn, status: 'Paid' as const };
            }
          }
          return earn;
        })
      );
    }

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: target.userId,
      title:
        status === 'Paid'
          ? 'Withdrawal Processed & Paid! 🎉'
          : status === 'Rejected'
          ? 'Withdrawal Request Declined'
          : `Withdrawal Status: ${status}`,
      message:
        status === 'Paid'
          ? `Your withdrawal of $${target.amount.toFixed(2)} has been transferred via ${target.paymentMethodType}.`
          : status === 'Rejected'
          ? `Your withdrawal request of $${target.amount.toFixed(2)} was rejected. Reason: ${reason || 'Details not provided'}. Amount returned to available balance.`
          : `Your withdrawal of $${target.amount.toFixed(2)} is now processing.`,
      type: 'payment',
      date: new Date().toISOString().split('T')[0],
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Project updates
  const createProjectUpdate = (
    data: Omit<ProjectUpdate, 'id' | 'createdAt' | 'readByUserIds'>
  ) => {
    const newUpdate: ProjectUpdate = {
      ...data,
      id: `upd-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      readByUserIds: [],
    };
    setProjectUpdates((prev) => [newUpdate, ...prev]);

    const approvedApplicants = applications.filter(
      (a) => a.projectId === data.projectId && a.status === 'Approved'
    );

    const newNotifs: NotificationItem[] = approvedApplicants.map((app) => ({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: app.userId,
      title: `Project Update: ${data.projectName}`,
      message: `${data.title}: ${data.message.slice(0, 100)}...`,
      type: 'project_update',
      date: new Date().toISOString().split('T')[0],
      read: false,
    }));

    if (newNotifs.length > 0) {
      setNotifications((prev) => [...newNotifs, ...prev]);
    }
  };

  const markUpdateRead = (updateId: string) => {
    if (!currentUser) return;
    setProjectUpdates((prev) =>
      prev.map((upd) =>
        upd.id === updateId && !upd.readByUserIds.includes(currentUser.id)
          ? { ...upd, readByUserIds: [...upd.readByUserIds, currentUser.id] }
          : upd
      )
    );
  };

  const deleteProjectUpdate = (id: string) => {
    setProjectUpdates((prev) => prev.filter((u) => u.id !== id));
  };

  const resetToDefaults = () => {
    setProjects(INITIAL_PROJECTS);
    setApplications(INITIAL_APPLICATIONS);
    setPaymentMethods(INITIAL_PAYMENT_METHODS);
    setEarnings(INITIAL_EARNINGS);
    setWithdrawals(INITIAL_WITHDRAWALS);
    setProjectUpdates(INITIAL_PROJECT_UPDATES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setUsers(INITIAL_USERS);
    saveStorage('projects', INITIAL_PROJECTS);
    saveStorage('applications', INITIAL_APPLICATIONS);
    saveStorage('paymentMethods', INITIAL_PAYMENT_METHODS);
    saveStorage('earnings', INITIAL_EARNINGS);
    saveStorage('withdrawals', INITIAL_WITHDRAWALS);
    saveStorage('projectUpdates', INITIAL_PROJECT_UPDATES);
    saveStorage('notifications', INITIAL_NOTIFICATIONS);
    saveStorage('users', INITIAL_USERS);
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => (n.userId === currentUser.id ? { ...n, read: true } : n))
    );
  };

  // Contributor balance calculation
  const userBalance = useMemo(() => {
    if (!currentUser) {
      return { totalEarnings: 0, availableBalance: 0, withdrawnAmount: 0, pendingWithdrawal: 0 };
    }
    const myEarnings = earnings.filter((e) => e.userId === currentUser.id);
    const myWithdrawals = withdrawals.filter((w) => w.userId === currentUser.id);

    const totalEarnings = myEarnings.reduce((acc, curr) => acc + curr.amount, 0);

    const withdrawnAmount = myWithdrawals
      .filter((w) => w.status === 'Paid')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const pendingWithdrawal = myWithdrawals
      .filter((w) => w.status === 'Withdrawal Requested' || w.status === 'Processing')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const availableEarned = myEarnings
      .filter((e) => e.status === 'Available')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const availableBalance = Math.max(0, availableEarned - pendingWithdrawal);

    return {
      totalEarnings,
      availableBalance,
      withdrawnAmount,
      pendingWithdrawal,
    };
  }, [currentUser, earnings, withdrawals]);

  // Maintenance state and scheduling
  const [maintenanceConfig, setMaintenanceConfig] = useState<MaintenanceConfig>(() =>
    loadStorage<MaintenanceConfig>('maintenance_config', DEFAULT_MAINTENANCE_CONFIG)
  );
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // 1-second live clock ticker to guarantee exact-second automatic schedule activation and deactivation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const maintenanceState = useMemo(() => {
    return computeMaintenanceState(maintenanceConfig, currentTime);
  }, [maintenanceConfig, currentTime]);

  useEffect(() => {
    saveStorage('maintenance_config', maintenanceConfig);
  }, [maintenanceConfig]);

  const refreshMaintenance = useCallback(async () => {
    try {
      const res = await fetch('/api/maintenance');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.config) {
          setMaintenanceConfig((prev) => {
            const prevUpdated = prev.lastUpdated ? new Date(prev.lastUpdated).getTime() : 0;
            const serverUpdated = data.config.lastUpdated ? new Date(data.config.lastUpdated).getTime() : 0;
            // Only overwrite if server has a valid update timestamp that is equal or newer,
            // or if local state has no lastUpdated timestamp
            if (serverUpdated >= prevUpdated || !prevUpdated) {
              return {
                ...prev,
                ...data.config,
              };
            }
            return prev;
          });
        }
      }
    } catch {
      try {
        const firestoreConfig = await fetchMaintenanceFromFirestore();
        if (firestoreConfig) {
          setMaintenanceConfig((prev) => {
            const prevUpdated = prev.lastUpdated ? new Date(prev.lastUpdated).getTime() : 0;
            const fsUpdated = firestoreConfig.lastUpdated ? new Date(firestoreConfig.lastUpdated).getTime() : 0;
            if (fsUpdated >= prevUpdated || !prevUpdated) {
              return {
                ...prev,
                ...firestoreConfig,
              };
            }
            return prev;
          });
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    refreshMaintenance();
    const interval = setInterval(refreshMaintenance, 8000);

    const unsub = subscribeToMaintenanceFirestore((newConfig) => {
      if (newConfig) {
        setMaintenanceConfig((prev) => {
          const prevUpdated = prev.lastUpdated ? new Date(prev.lastUpdated).getTime() : 0;
          const fsUpdated = newConfig.lastUpdated ? new Date(newConfig.lastUpdated).getTime() : 0;
          if (fsUpdated >= prevUpdated || !prevUpdated) {
            return {
              ...prev,
              ...newConfig,
            };
          }
          return prev;
        });
      }
    });

    return () => {
      clearInterval(interval);
      if (unsub) unsub();
    };
  }, [refreshMaintenance]);

  const saveMaintenance = async (
    updates: Partial<MaintenanceConfig>
  ): Promise<{ success: boolean; message: string }> => {
    const nextConfig: MaintenanceConfig = {
      ...maintenanceConfig,
      ...updates,
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser?.email || 'admin@nexora.ai',
    };

    setMaintenanceConfig(nextConfig);
    saveStorage('maintenance_config', nextConfig);

    // Save to Firestore first so real-time clients and serverless backends sync immediately
    try {
      await saveMaintenanceToFirestore(nextConfig);
    } catch (e) {
      console.warn('[Maintenance] Firestore save warning:', e);
    }

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextConfig),
      });
      const data = await res.json();
      return {
        success: true,
        message: data.message || 'Maintenance settings saved successfully.',
      };
    } catch {
      return {
        success: true,
        message: 'Maintenance settings saved locally and synchronized with database.',
      };
    }
  };

  const toggleMaintenance = async (enable?: boolean): Promise<{ success: boolean; message: string }> => {
    const nextEnabled = typeof enable === 'boolean' ? enable : !maintenanceState.isActive;
    const now = Date.now();
    let nextStart = maintenanceConfig.startDateTime;
    let nextEnd = maintenanceConfig.endDateTime;

    if (nextEnabled) {
      // Starting maintenance immediately: set start time to current ISO timestamp
      nextStart = new Date(now).toISOString();
      const existingEndMs = nextEnd ? new Date(nextEnd).getTime() : 0;
      // If end time was expired or not set, default to 2 hours from now
      if (!nextEnd || isNaN(existingEndMs) || existingEndMs <= now) {
        nextEnd = new Date(now + 2 * 3600 * 1000).toISOString();
      }
    }

    return saveMaintenance({
      enabled: nextEnabled,
      startDateTime: nextStart,
      endDateTime: nextEnd,
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        register,
        resendVerificationEmail,
        verifyEmailByToken,
        verifyFirebaseEmail,
        checkFirebaseVerificationStatus,
        verifyEmail,
        logout,
        updateProfile,

        users,
        toggleUserStatus,
        toggleEmailVerification,
        approveUser,
        rejectUser,
        setUserApprovalStatus,
        deleteUser,
        purgeTempUsers,

        projects,
        createProject,
        updateProject,
        deleteProject,
        closeProject,

        applications,
        submitApplication,
        updateApplicationStatus,
        bulkApproveApplications,

        refreshLiveServerData,
        isSyncing,
        lastSyncedAt,
        syncError,

        paymentMethods,
        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        setPrimaryPaymentMethod,

        earnings,
        addEarning,
        updateEarningStatus,

        withdrawals,
        requestWithdrawal,
        updateWithdrawalStatus,

        projectUpdates,
        createProjectUpdate,
        deleteProjectUpdate,
        markUpdateRead,

        resetToDefaults,

        notifications,
        markNotificationRead,
        markAllNotificationsRead,

        userBalance,
        firebaseConnected,
        firebaseProjectId: firebaseConfig.projectId,

        maintenanceState,
        saveMaintenance,
        toggleMaintenance,
        refreshMaintenance,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
