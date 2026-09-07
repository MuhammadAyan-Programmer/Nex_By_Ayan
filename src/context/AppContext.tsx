import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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

interface AppContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    country?: string;
    primaryLanguage?: string;
    phone?: string;
    skills?: string[];
  }) => Promise<{ success: boolean; message: string }>;
  verifyEmail: () => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;

  // Users Directory
  users: UserProfile[];
  toggleUserStatus: (id: string) => void;
  toggleEmailVerification: (id: string) => void;
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
    resumeText?: string;
    resumeFile?: UploadedFileMeta;
    additionalInfo?: string;
  }) => { success: boolean; message: string };
  updateApplicationStatus: (id: string, status: ApplicationStatus, notes?: string) => void;
  bulkApproveApplications: (ids: string[]) => void;

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Migration check: Purge any old fake demo data or temp users from previous sessions
const CURRENT_DATA_VERSION = 'v3_no_temp_users';
try {
  if (typeof window !== 'undefined' && localStorage.getItem('nexora_data_version') !== CURRENT_DATA_VERSION) {
    const keysToClean = [
      'nexora_currentUser',
      'nexora_projects',
      'nexora_applications',
      'nexora_paymentMethods',
      'nexora_earnings',
      'nexora_withdrawals',
      'nexora_projectUpdates',
      'nexora_notifications',
      'nexora_users',
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user state - null means public website view
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(() => {
    const stored = loadStorage<UserProfile | null>('currentUser', null);
    if (
      stored &&
      (stored.id === 'usr-demo-01' ||
        stored.email.toLowerCase() === 'contributor@nexora.work' ||
        stored.email.toLowerCase().includes('demo') ||
        stored.email.toLowerCase().includes('temp'))
    ) {
      return null;
    }
    return stored;
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const stored = loadStorage<UserProfile[]>('users', INITIAL_USERS);
    return stored.filter(
      (u) =>
        u.id !== 'usr-demo-01' &&
        u.email.toLowerCase() !== 'contributor@nexora.work' &&
        !u.email.toLowerCase().includes('demo') &&
        !u.email.toLowerCase().includes('temp')
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

  // Fetch live projects, applications, and users from backend server on mount
  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects);
        }
      })
      .catch(() => {});

    fetch('/api/applications')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.applications)) {
          setApplications(data.applications);
        }
      })
      .catch(() => {});

    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.users)) {
          const cleanUsers = data.users.filter(
            (u: any) =>
              u.id !== 'usr-demo-01' &&
              u.email.toLowerCase() !== 'contributor@nexora.work' &&
              !u.email.toLowerCase().includes('demo') &&
              !u.email.toLowerCase().includes('temp')
          );
          setUsers(cleanUsers);
        }
      })
      .catch(() => {});
  }, []);

  const setCurrentUser = (user: UserProfile | null) => {
    setCurrentUserState(user);
  };

  // UNIFIED AUTHENTICATION
  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const normEmail = email.trim().toLowerCase();

    // 1. Direct Admin validation (guaranteed instant access)
    if (
      (normEmail === '03004292351muhammadayan@gmail.com' || normEmail === 'admin@nexora.work') &&
      (password === 'Admin123' || password === 'Admin123@')
    ) {
      const adminProfile: UserProfile = {
        id: 'adm-001',
        firstName: 'Muhammad',
        lastName: 'Ayan',
        email: '03004292351muhammadayan@gmail.com',
        role: 'admin',
        isEmailVerified: true,
        profileStatus: 'Complete',
        avatar: 'MA',
        country: 'Global',
        languages: ['English', 'Arabic'],
        languageProficiency: {
          English: 'Native / Fluent',
          Arabic: 'Professional Working',
        },
        skills: ['Workforce Operations', 'Quality Assurance', 'Project Architecture'],
        experience: 'Platform Administrator & Operations Director at Nexora Workforce',
        status: 'active',
        createdAt: '2026-09-01',
        phone: '',
      };
      setCurrentUserState(adminProfile);
      return { success: true };
    }

    // 2. Attempt Backend Login with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normEmail, password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();

        if (res.ok && data.success && data.user) {
          saveLocalPassword(normEmail, password);
          setCurrentUserState(data.user);
          if (data.user.role === 'contributor') {
            setUsers((prev) => {
              const exists = prev.some((u) => u.id === data.user.id || u.email.toLowerCase() === normEmail);
              if (!exists) return [...prev, data.user];
              return prev.map((u) => (u.email.toLowerCase() === normEmail ? data.user : u));
            });
          }
          return { success: true };
        }

        if (res.status === 401 || res.status === 400 || res.status === 403) {
          // Check if user was registered locally or in offline cache
          const localPass = getLocalPassword(normEmail);
          const found = users.find((u) => u.email.toLowerCase() === normEmail);
          if (found && localPass && localPass === password) {
            if (found.status === 'suspended') {
              return { success: false, message: 'Your account has been suspended. Please contact platform support.' };
            }
            setCurrentUserState(found);
            return { success: true };
          }
          return {
            success: false,
            message: data.message || 'Invalid email or password.',
          };
        }
      }

      throw new Error('Server returned non-JSON response');
    } catch (err) {
      // 3. Fallback when network or backend is unreachable
      console.warn('Login network fallback engaged:', err);
      const found = users.find((u) => u.email.toLowerCase() === normEmail);
      if (found) {
        if (found.status === 'suspended') {
          return { success: false, message: 'Your account has been suspended. Please contact platform support.' };
        }
        const storedPass = getLocalPassword(normEmail);
        if (!storedPass || storedPass === password) {
          saveLocalPassword(normEmail, password);
          setCurrentUserState(found);
          return { success: true };
        }
        return { success: false, message: 'Incorrect password for this email address.' };
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
  }): Promise<{ success: boolean; message: string }> => {
    const normEmail = data.email.trim().toLowerCase();
    const cleanFirstName = data.firstName.trim();
    const cleanLastName = data.lastName.trim();
    const cleanCountry = data.country && data.country.trim() ? data.country.trim() : 'United States';
    const cleanLanguage = data.primaryLanguage && data.primaryLanguage.trim() ? data.primaryLanguage.trim() : 'English';

    if (!cleanFirstName || !cleanLastName || !normEmail || !data.password) {
      return { success: false, message: 'Please fill out all required fields.' };
    }

    const buildLocalUser = (id?: string): UserProfile => ({
      id: id || `usr-${Date.now().toString().slice(-5)}`,
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
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('/api/auth/register', {
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

        if (res.ok && result.success && result.user) {
          saveLocalPassword(normEmail, data.password);
          setCurrentUserState(result.user);
          setUsers((prev) => {
            const exists = prev.some((u) => u.email.toLowerCase() === normEmail);
            return exists ? prev.map((u) => (u.email.toLowerCase() === normEmail ? result.user : u)) : [...prev, result.user];
          });
          return {
            success: true,
            message: result.message || 'Account registered successfully! Welcome to Nexora Workforce.',
          };
        }

        // Specific message from backend (e.g. email reserved for admin)
        if (result.message && !res.ok) {
          if (result.message.toLowerCase().includes('already exists')) {
            const localPass = getLocalPassword(normEmail);
            if (localPass && localPass === data.password) {
              const existing = users.find((u) => u.email.toLowerCase() === normEmail);
              if (existing) {
                setCurrentUserState(existing);
                return { success: true, message: 'Welcome back! Your account has been loaded.' };
              }
            }
          }
          return {
            success: false,
            message: result.message,
          };
        }
      }

      throw new Error('Non-JSON response from server');
    } catch (err) {
      // Seamless registration fallback if server is restarting or network hiccup occurs
      console.warn('Registration network fallback engaged:', err);

      const existingUser = users.find((u) => u.email.toLowerCase() === normEmail);
      if (existingUser) {
        const storedPass = getLocalPassword(normEmail);
        if (storedPass === data.password) {
          setCurrentUserState(existingUser);
          return { success: true, message: 'Welcome back! Your account has been loaded.' };
        }
        return {
          success: false,
          message: 'An account with this email address already exists. Please log in.',
        };
      }

      const localUser = buildLocalUser();
      saveLocalPassword(normEmail, data.password);
      setCurrentUserState(localUser);
      setUsers((prev) => [...prev, localUser]);

      // Schedule background sync once server is responsive
      setTimeout(() => {
        fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: cleanFirstName,
            lastName: cleanLastName,
            email: normEmail,
            password: data.password,
            country: cleanCountry,
            primaryLanguage: cleanLanguage,
          }),
        }).catch(() => {});
      }, 1500);

      return {
        success: true,
        message: 'Account registered successfully! Welcome to Nexora Workforce.',
      };
    }
  };

  const verifyEmail = () => {
    if (!currentUser) return;
    const updated = { ...currentUser, isEmailVerified: true, profileStatus: 'Complete' as const };
    setCurrentUserState(updated);

    // Also notify server
    fetch(`/api/users/${currentUser.id}/verify-email`, { method: 'PATCH' }).catch(() => {});

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
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === 'active' ? 'suspended' : 'active';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
    fetch(`/api/users/${id}/status`, { method: 'PATCH' }).catch(() => {});
  };

  const toggleEmailVerification = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextVerified = !u.isEmailVerified;
          return {
            ...u,
            isEmailVerified: nextVerified,
            profileStatus: nextVerified ? 'Complete' : 'Incomplete',
          };
        }
        return u;
      })
    );
    fetch(`/api/users/${id}/verify-email`, { method: 'PATCH' }).catch(() => {});
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

    fetch(`/api/users/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const purgeTempUsers = () => {
    setUsers((prev) =>
      prev.filter(
        (u) =>
          u.id !== 'usr-demo-01' &&
          u.email.toLowerCase() !== 'contributor@nexora.work' &&
          !u.email.toLowerCase().includes('demo') &&
          !u.email.toLowerCase().includes('temp')
      )
    );
    if (
      currentUser?.id === 'usr-demo-01' ||
      currentUser?.email.toLowerCase() === 'contributor@nexora.work' ||
      currentUser?.email.toLowerCase().includes('demo') ||
      currentUser?.email.toLowerCase().includes('temp')
    ) {
      setCurrentUserState(null);
    }
    fetch('/api/users/purge-temp', { method: 'POST' }).catch(() => {});
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
    fetch('/api/projects', {
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

    fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setApplications((prev) => prev.filter((a) => a.projectId !== id));
    setProjectUpdates((prev) => prev.filter((u) => u.projectId !== id));
    fetch(`/api/projects/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const closeProject = (id: string) => {
    updateProject(id, { status: 'Closed' });
  };

  // Applications
  const submitApplication = (data: {
    projectId: string;
    experience: string;
    skills: string[];
    languages: string[];
    languageProficiency: string;
    resumeText?: string;
    resumeFile?: UploadedFileMeta;
    additionalInfo?: string;
  }) => {
    if (!currentUser) return { success: false, message: 'Please log in to apply.' };

    const project = projects.find((p) => p.id === data.projectId);
    if (!project) return { success: false, message: 'Project not found.' };

    const existing = applications.find(
      (a) => a.projectId === data.projectId && a.userId === currentUser.id
    );
    if (existing) {
      return { success: false, message: `You have already applied for this project (${existing.status}).` };
    }

    const attachedFile = data.resumeFile || currentUser.resumeFile;

    const newApp: ProjectApplication = {
      id: `app-${Date.now().toString().slice(-4)}`,
      projectId: project.id,
      projectName: project.name,
      projectCategory: project.category,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      userEmail: currentUser.email,
      country: currentUser.country,
      languages: data.languages,
      languageProficiency: data.languageProficiency,
      experience: data.experience,
      skills: data.skills,
      resumeText: data.resumeText || currentUser.resumeText,
      resumeFile: attachedFile,
      additionalInfo: data.additionalInfo,
      status: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
    };

    setApplications((prev) => [newApp, ...prev]);

    // Update current user profile with the resumeFile if user didn't have one
    if (data.resumeFile && !currentUser.resumeFile) {
      updateProfile({ resumeFile: data.resumeFile });
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

  const updateApplicationStatus = (id: string, status: ApplicationStatus, notes?: string) => {
    const targetApp = applications.find((a) => a.id === id);
    if (!targetApp) return;

    const prevStatus = targetApp.status;

    setApplications((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status,
              notes: notes !== undefined ? notes : app.notes,
              reviewedDate: new Date().toISOString().split('T')[0],
            }
          : app
      )
    );

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

  const bulkApproveApplications = (ids: string[]) => {
    ids.forEach((id) => updateApplicationStatus(id, 'Approved'));
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

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        register,
        verifyEmail,
        logout,
        updateProfile,

        users,
        toggleUserStatus,
        toggleEmailVerification,
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
