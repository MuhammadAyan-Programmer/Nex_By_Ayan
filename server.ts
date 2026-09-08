import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Admin credentials verification helper
const ADMIN_EMAIL = '03004292351muhammadayan@gmail.com';

const isValidAdminEmail = (emailStr: string): boolean => {
  const norm = emailStr.trim().toLowerCase();
  return (
    norm === ADMIN_EMAIL.toLowerCase() ||
    Boolean(process.env.ADMIN_EMAIL && norm === process.env.ADMIN_EMAIL.trim().toLowerCase())
  );
};

const isValidAdminPassword = (pw: string): boolean => {
  return (
    pw === 'Admin123' ||
    pw === 'Admin123@' ||
    Boolean(process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD)
  );
};

interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
  country: string;
  languages: string[];
  languageProficiency: Record<string, string>;
  skills: string[];
  experience: string;
  resumeText?: string;
  role: 'contributor' | 'admin';
  isEmailVerified: boolean;
  profileStatus: 'Complete' | 'Incomplete';
  avatar: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

// Persistent storage directory
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create data dir:', e);
  }
}

function loadJsonFile<T>(filename: string, defaultValue: T): T {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn(`Error reading ${filename}, using default`, e);
  }
  return defaultValue;
}

function saveJsonFile<T>(filename: string, data: T): void {
  try {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error writing ${filename}`, e);
  }
}

const DEFAULT_USERS: StoredUser[] = [];

const DEFAULT_PROJECTS = [
  {
    id: 'proj-french-en-002',
    name: 'French → English Machine Translation Project',
    category: 'Translation & Localization',
    projectType: 'Translation / AI Data',
    description:
      'High-volume machine translation post-editing (MTPE), cultural localization, and linguistic quality assessment for French to English textual corpora, conversation logs, and domain-specific documentation. Contributors evaluate fluency, terminological accuracy, and grammatical precision.',
    language: 'French',
    sourceLanguage: 'French',
    targetLanguage: 'English',
    country: 'Global',
    skillsRequired: [
      'Bilingual French/English',
      'Machine Translation Post-Editing (MTPE)',
      'Localization QA',
      'Context Evaluation',
    ],
    requiredContributors: 4000,
    approvedContributors: 0,
    startDate: '2026-09-05',
    endDate: '2027-08-31',
    applicationDeadline: '2026-11-30',
    qualificationRequired: true,
    qualificationTestInfo:
      '15-minute French to English translation evaluation and terminology verification benchmark.',
    minimumRequirement:
      'Native or C1/C2 French proficiency with professional fluency in written English.',
    instructions:
      'Post-edit machine-translated French sentences into idiomatic, accurate English conforming to domain glossaries and quality rubrics.',
    communityLink: 'https://community.nexora.work/c/french-english-translation',
    announcement:
      'The French → English Machine Translation Project is currently welcoming applications worldwide.',
    status: 'Open',
    paymentType: 'Per Item',
    paymentRateType: 'range',
    paymentAmountMin: 0.8,
    paymentAmountMax: 3.0,
    ratePay: '$0.80 - $3 / item',
    createdAt: '2026-09-05',
  },
  {
    id: 'proj-arabic-en-001',
    name: 'Arabic → English Translation Project',
    category: 'Translation & Localization',
    projectType: 'Translation / AI Data',
    description:
      'Translation, localization, and quality review of high-value textual content, conversational datasets, and technical documentation from Modern Standard Arabic and regional dialects into fluent English. Contributors assess translation accuracy, grammatical fidelity, terminological precision, and cultural nuance.',
    language: 'Arabic, English',
    sourceLanguage: 'Arabic',
    targetLanguage: 'English',
    country: 'Global',
    skillsRequired: [
      'Bilingual Arabic/English',
      'Modern Standard Arabic (MSA)',
      'Context Checking',
      'Terminology Research',
      'Localization QA',
    ],
    requiredContributors: 1200,
    approvedContributors: 0,
    startDate: '2026-09-15',
    endDate: '2027-06-30',
    applicationDeadline: '2026-10-15',
    qualificationRequired: true,
    qualificationTestInfo:
      'Brief 15-minute bilingual Arabic to English translation evaluation and terminology verification benchmark.',
    minimumRequirement:
      'Native or C1/C2 Arabic proficiency and professional fluency in written English.',
    instructions:
      'Translate source Arabic passages into natural, grammatically sound English. Adhere strictly to domain glossaries, maintain cultural context, and flag ambiguous idiomatic phrasing.',
    communityLink: 'https://community.nexora.work/c/arabic-english-translation',
    announcement:
      'The Arabic → English Translation Project is officially open for applications. Complete your contributor profile and apply to schedule your qualification benchmark.',
    status: 'Open',
    paymentType: 'Per Item',
    paymentRateType: 'range',
    paymentAmountMin: 0.3,
    paymentAmountMax: 0.7,
    ratePay: '$0.30 - $0.70 / item',
    createdAt: '2026-09-01',
  },
];

// In-memory cache synced with disk (purging any legacy temp users)
let registeredUsers: StoredUser[] = loadJsonFile<StoredUser[]>('users.json', DEFAULT_USERS).filter(
  (u) =>
    u.id !== 'usr-demo-01' &&
    u.email.toLowerCase() !== 'contributor@nexora.work' &&
    !u.email.toLowerCase().includes('demo') &&
    !u.email.toLowerCase().includes('temp')
);
saveJsonFile('users.json', registeredUsers);

let projectsStore: any[] = loadJsonFile<any[]>('projects.json', DEFAULT_PROJECTS);
let applicationsStore: any[] = loadJsonFile<any[]>('applications.json', []);
let updatesStore: any[] = loadJsonFile<any[]>('updates.json', []);

function recalculateProjectCapacities() {
  projectsStore = projectsStore.map((p) => {
    const approvedCount = applicationsStore.filter(
      (a) => a.projectId === p.id && a.status === 'Approved'
    ).length;
    const isFull = approvedCount >= p.requiredContributors;
    return {
      ...p,
      approvedContributors: approvedCount,
      status: isFull ? 'Closed' : p.status,
    };
  });
  saveJsonFile('projects.json', projectsStore);
}

// Initial ensure on start
saveJsonFile('projects.json', projectsStore);
saveJsonFile('applications.json', applicationsStore);
saveJsonFile('updates.json', updatesStore);
recalculateProjectCapacities();

// =================== API ROUTES ===================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Unified Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email and password.',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const inputPassword = String(password);

  // 1. Check Admin Credentials securely on the backend
  if (isValidAdminEmail(normalizedEmail) && isValidAdminPassword(inputPassword)) {
    const adminProfile: StoredUser = {
      id: 'adm-001',
      firstName: 'Muhammad',
      lastName: 'Ayan',
      email: ADMIN_EMAIL,
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
    };

    return res.json({
      success: true,
      role: 'admin',
      user: adminProfile,
    });
  }

  // 2. Check Contributor Credentials
  const contributor = registeredUsers.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === inputPassword
  );

  if (contributor) {
    if (contributor.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact platform support.',
      });
    }

    const { password: _, ...safeUser } = contributor;
    return res.json({
      success: true,
      role: 'contributor',
      user: safeUser,
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid email or password.',
  });
});

// Registration Endpoint for new contributors
app.post('/api/auth/register', (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      country,
      primaryLanguage,
      skills,
      phone,
      experience,
    } = req.body || {};

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and password are required.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Prevent registration using admin email
    if (isValidAdminEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'This email is reserved for system administration.',
      });
    }

    // Check for existing registration
    const existing = registeredUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      // If same password provided (e.g. user retrying or re-registering), sign them in seamlessly
      if (existing.password === String(password)) {
        const { password: _, ...safeUser } = existing;
        return res.json({
          success: true,
          user: safeUser,
          message: 'Welcome back! Your account has been loaded.',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    const selectedCountry = country && String(country).trim() ? String(country).trim() : 'United States';
    const selectedLanguage = primaryLanguage && String(primaryLanguage).trim() ? String(primaryLanguage).trim() : 'English';

    const newUser: StoredUser = {
      id: `usr-${Date.now().toString().slice(-5)}`,
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: normalizedEmail,
      password: String(password),
      phone: phone ? String(phone).trim() : '',
      country: selectedCountry,
      languages: [selectedLanguage],
      languageProficiency: {
        [selectedLanguage]: 'Native / Fluent',
      },
      skills: Array.isArray(skills) && skills.length > 0 ? skills : ['Translation & Localization'],
      experience: experience || 'Independent Contributor & Linguist',
      role: 'contributor',
      isEmailVerified: false,
      profileStatus: 'Incomplete',
      avatar: (String(firstName)[0] || 'U').toUpperCase() + (String(lastName)[0] || 'C').toUpperCase(),
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    registeredUsers.push(newUser);
    saveJsonFile('users.json', registeredUsers);

    const { password: _, ...safeUser } = newUser;
    return res.json({
      success: true,
      user: safeUser,
      message: 'Account registered successfully! Welcome to Nexora Workforce.',
    });
  } catch (error) {
    console.error('Registration processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration service encountered an error. Please try again.',
    });
  }
});

// User directory for admin management
app.get('/api/users', (_req, res) => {
  const safeUsers = registeredUsers.map(({ password: _, ...u }) => u);
  res.json({ success: true, users: safeUsers });
});

// Client-to-server users sync endpoint (ensures any locally registered users are saved)
app.post('/api/users/sync', (req, res) => {
  const { users: incomingUsers, user: singleUser } = req.body || {};
  const list = Array.isArray(incomingUsers) ? incomingUsers : singleUser ? [singleUser] : [];
  for (const u of list) {
    if (!u || !u.email) continue;
    const normEmail = String(u.email).trim().toLowerCase();
    if (
      normEmail === 'contributor@nexora.work' ||
      u.id === 'usr-demo-01' ||
      normEmail.includes('temp')
    ) {
      continue;
    }
    const idx = registeredUsers.findIndex(
      (existing) => existing.email.toLowerCase() === normEmail || existing.id === u.id
    );
    if (idx !== -1) {
      registeredUsers[idx] = {
        ...registeredUsers[idx],
        ...u,
        email: normEmail,
      };
    } else {
      registeredUsers.push({
        ...u,
        id: u.id || `usr-${Date.now().toString().slice(-5)}`,
        email: normEmail,
        createdAt: u.createdAt || new Date().toISOString().split('T')[0],
      });
    }
  }
  saveJsonFile('users.json', registeredUsers);
  const safeUsers = registeredUsers.map(({ password: _, ...u }) => u);
  res.json({ success: true, users: safeUsers });
});

// Toggle user status (suspend/activate)
app.patch('/api/users/:id/status', (req, res) => {
  const { id } = req.params;
  const user = registeredUsers.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  user.status = user.status === 'active' ? 'suspended' : 'active';
  saveJsonFile('users.json', registeredUsers);
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// Toggle email verification
app.patch('/api/users/:id/verify-email', (req, res) => {
  const { id } = req.params;
  const user = registeredUsers.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  user.isEmailVerified = !user.isEmailVerified;
  user.profileStatus = user.isEmailVerified ? 'Complete' : 'Incomplete';
  saveJsonFile('users.json', registeredUsers);
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// Delete user endpoint
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  registeredUsers = registeredUsers.filter((u) => u.id !== id);
  saveJsonFile('users.json', registeredUsers);
  applicationsStore = applicationsStore.filter((a) => a.userId !== id);
  saveJsonFile('applications.json', applicationsStore);
  res.json({ success: true, message: 'User deleted successfully.' });
});

// Purge temporary / demo accounts endpoint
app.post('/api/users/purge-temp', (_req, res) => {
  registeredUsers = registeredUsers.filter(
    (u) =>
      u.id !== 'usr-demo-01' &&
      u.email.toLowerCase() !== 'contributor@nexora.work' &&
      !u.email.toLowerCase().includes('demo') &&
      !u.email.toLowerCase().includes('temp')
  );
  saveJsonFile('users.json', registeredUsers);
  res.json({ success: true, count: registeredUsers.length, message: 'Temporary users removed.' });
});

// =================== PROJECTS API ===================

app.get('/api/projects', (_req, res) => {
  res.json({ success: true, projects: projectsStore });
});

app.post('/api/projects', (req, res) => {
  const projectData = req.body;
  const newProject = {
    ...projectData,
    id: projectData.id || `proj-${Date.now().toString().slice(-5)}`,
    approvedContributors: projectData.approvedContributors || 0,
    createdAt: projectData.createdAt || new Date().toISOString().split('T')[0],
  };
  projectsStore = [newProject, ...projectsStore];
  saveJsonFile('projects.json', projectsStore);
  res.json({ success: true, project: newProject });
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const idx = projectsStore.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }
  projectsStore[idx] = { ...projectsStore[idx], ...updateData };
  saveJsonFile('projects.json', projectsStore);
  res.json({ success: true, project: projectsStore[idx] });
});

app.patch('/api/projects/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const idx = projectsStore.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }
  projectsStore[idx].status = status;
  saveJsonFile('projects.json', projectsStore);
  res.json({ success: true, project: projectsStore[idx] });
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  projectsStore = projectsStore.filter((p) => p.id !== id);
  saveJsonFile('projects.json', projectsStore);

  // Also clean applications and updates for this project
  applicationsStore = applicationsStore.filter((a) => a.projectId !== id);
  saveJsonFile('applications.json', applicationsStore);

  updatesStore = updatesStore.filter((u) => u.projectId !== id);
  saveJsonFile('updates.json', updatesStore);

  res.json({ success: true, message: 'Project deleted successfully.' });
});

// Bulk sync projects from admin to server
app.post('/api/projects/sync', (req, res) => {
  const { projects: incomingProjects } = req.body || {};
  if (Array.isArray(incomingProjects)) {
    for (const proj of incomingProjects) {
      if (!proj || !proj.name) continue;
      const idx = projectsStore.findIndex(
        (p) => p.id === proj.id || p.name.toLowerCase() === proj.name.toLowerCase()
      );
      if (idx !== -1) {
        projectsStore[idx] = { ...projectsStore[idx], ...proj };
      } else {
        projectsStore.unshift({
          ...proj,
          id: proj.id || `proj-${Date.now().toString().slice(-5)}`,
          approvedContributors: proj.approvedContributors || 0,
          createdAt: proj.createdAt || new Date().toISOString().split('T')[0],
        });
      }
    }
    recalculateProjectCapacities();
  }
  res.json({ success: true, projects: projectsStore });
});

// =================== APPLICATIONS API ===================

app.get('/api/applications', (_req, res) => {
  res.json({ success: true, applications: applicationsStore });
});

app.post('/api/applications', (req, res) => {
  const appData = req.body;
  if (!appData || !appData.projectId) {
    return res.status(400).json({ success: false, message: 'Invalid application payload' });
  }

  const existingIdx = applicationsStore.findIndex(
    (a) =>
      a.id === appData.id ||
      (a.projectId === appData.projectId &&
        ((appData.userId && a.userId === appData.userId) ||
          (appData.userEmail && a.userEmail?.toLowerCase() === appData.userEmail?.toLowerCase())))
  );

  const newApp = {
    ...appData,
    id: appData.id || `app-${Date.now().toString().slice(-5)}`,
    status: appData.status || 'Applied',
    appliedDate: appData.appliedDate || new Date().toISOString().split('T')[0],
  };

  if (existingIdx !== -1) {
    applicationsStore[existingIdx] = {
      ...applicationsStore[existingIdx],
      ...newApp,
    };
  } else {
    applicationsStore = [newApp, ...applicationsStore];
  }

  saveJsonFile('applications.json', applicationsStore);
  recalculateProjectCapacities();
  res.json({ success: true, application: newApp, applications: applicationsStore });
});

// Bulk sync applications from client localStorage to server database
app.post('/api/applications/sync', (req, res) => {
  const { applications: incomingApps } = req.body || {};
  if (Array.isArray(incomingApps)) {
    for (const app of incomingApps) {
      if (!app || !app.projectId || (!app.userId && !app.userEmail)) continue;
      const existingIdx = applicationsStore.findIndex(
        (a) =>
          a.id === app.id ||
          (a.projectId === app.projectId &&
            ((app.userId && a.userId === app.userId) ||
              (app.userEmail && a.userEmail?.toLowerCase() === app.userEmail?.toLowerCase())))
      );
      if (existingIdx !== -1) {
        applicationsStore[existingIdx] = {
          ...app,
          status: applicationsStore[existingIdx].status || app.status || 'Applied',
          notes: applicationsStore[existingIdx].notes || app.notes,
        };
      } else {
        applicationsStore.unshift({
          ...app,
          id: app.id || `app-${Date.now().toString().slice(-5)}-${Math.random().toString(36).slice(2, 6)}`,
          status: app.status || 'Applied',
          appliedDate: app.appliedDate || new Date().toISOString().split('T')[0],
        });
      }
    }
    saveJsonFile('applications.json', applicationsStore);
    recalculateProjectCapacities();
  }
  res.json({ success: true, applications: applicationsStore });
});

// Bulk approve applications
app.post('/api/applications/bulk-approve', (req, res) => {
  const { ids } = req.body || {};
  if (Array.isArray(ids) && ids.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    applicationsStore = applicationsStore.map((app) => {
      if (ids.includes(app.id)) {
        return {
          ...app,
          status: 'Approved',
          reviewedDate: today,
        };
      }
      return app;
    });
    saveJsonFile('applications.json', applicationsStore);
    recalculateProjectCapacities();
  }
  res.json({ success: true, applications: applicationsStore });
});

app.patch('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const idx = applicationsStore.findIndex((a) => a.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Application not found.' });
  }
  applicationsStore[idx] = {
    ...applicationsStore[idx],
    status: status || applicationsStore[idx].status,
    notes: notes !== undefined ? notes : applicationsStore[idx].notes,
    reviewedDate: new Date().toISOString().split('T')[0],
  };
  saveJsonFile('applications.json', applicationsStore);
  recalculateProjectCapacities();
  res.json({ success: true, application: applicationsStore[idx], applications: applicationsStore });
});

// =================== PROJECT UPDATES API ===================

app.get('/api/project-updates', (_req, res) => {
  res.json({ success: true, updates: updatesStore });
});

app.post('/api/project-updates', (req, res) => {
  const updateData = req.body;
  const newUpdate = {
    ...updateData,
    id: updateData.id || `upd-${Date.now().toString().slice(-4)}`,
    createdAt: new Date().toISOString(),
    readByUserIds: updateData.readByUserIds || [],
  };
  updatesStore = [newUpdate, ...updatesStore];
  saveJsonFile('updates.json', updatesStore);
  res.json({ success: true, update: newUpdate });
});

app.delete('/api/project-updates/:id', (req, res) => {
  const { id } = req.params;
  updatesStore = updatesStore.filter((u) => u.id !== id);
  saveJsonFile('updates.json', updatesStore);
  res.json({ success: true, message: 'Update deleted.' });
});

// =================== RESET API ===================

app.post('/api/reset', (_req, res) => {
  projectsStore = [...DEFAULT_PROJECTS];
  registeredUsers = [...DEFAULT_USERS];
  applicationsStore = [];
  updatesStore = [];
  saveJsonFile('projects.json', projectsStore);
  saveJsonFile('users.json', registeredUsers);
  saveJsonFile('applications.json', applicationsStore);
  saveJsonFile('updates.json', updatesStore);
  res.json({ success: true, message: 'Platform reset to seed data.' });
});

// =================== VITE & STATIC SERVING ===================

async function startServer() {
  // Serve static assets (favicons, images, manifest) from public directory
  app.use(express.static(path.join(process.cwd(), 'public')));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexora Workforce backend running on port ${PORT}`);
  });
}

startServer();
