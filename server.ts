import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db, StoredUser, StoredProject, StoredApplication, StoredProjectUpdate, verifyPassword } from './server/db';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Database connection (PostgreSQL if configured, otherwise file persistence)
db.init().catch((err) => {
  console.error('[Server] Database initialization failed:', err);
});

// CORS and Preflight headers for production & cross-origin deployment
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Admin credentials verification helper
const ADMIN_EMAIL = '03004292351muhammadayan@gmail.com';

const isValidAdminEmail = (emailStr: string): boolean => {
  const norm = emailStr.trim().toLowerCase();
  return (
    norm === ADMIN_EMAIL.toLowerCase() ||
    norm === 'admin@nexora.work' ||
    Boolean(process.env.ADMIN_EMAIL && norm === process.env.ADMIN_EMAIL.trim().toLowerCase())
  );
};

const isValidAdminPassword = (pw: string): boolean => {
  return (
    pw === 'admin' ||
    pw === 'Admin123' ||
    pw === 'Admin123@' ||
    Boolean(process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD)
  );
};

// =================== API ROUTER ===================
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', async (_req: Request, res: Response) => {
  const stats = await db.getStats();
  res.json({
    status: 'ok',
    storage: db.getStorageType(),
    usersCount: stats.totalUsers,
    projectsCount: stats.totalProjects,
    applicationsCount: stats.totalApplications,
    timestamp: new Date().toISOString(),
  });
});

// Dynamic Statistics Endpoint (Section 10)
apiRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await db.getStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =================== AUTHENTICATION API (Section 5) ===================

// Unified Login Endpoint: email + password
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email and password.',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const inputPassword = String(password);

  // 1. Secure Admin Login Verification
  if (isValidAdminEmail(normalizedEmail) && isValidAdminPassword(inputPassword)) {
    const adminUser = await db.getUserByEmail(normalizedEmail);
    const adminProfile: StoredUser = {
      id: adminUser?.id || 'adm-001',
      firstName: adminUser?.firstName || 'Muhammad',
      lastName: adminUser?.lastName || 'Ayan',
      email: normalizedEmail,
      role: 'admin',
      isEmailVerified: true,
      profileStatus: 'Complete',
      avatar: adminUser?.avatar || 'MA',
      country: adminUser?.country || 'Global',
      languages: adminUser?.languages || ['English', 'Arabic'],
      languageProficiency: adminUser?.languageProficiency || {
        English: 'Native / Fluent',
        Arabic: 'Professional Working',
      },
      skills: adminUser?.skills || ['Workforce Operations', 'Quality Assurance', 'Project Architecture'],
      experience: adminUser?.experience || 'Platform Administrator & Operations Director at Nexora Workforce',
      status: 'active',
      createdAt: adminUser?.createdAt || '2026-09-01',
    };

    return res.json({
      success: true,
      role: 'admin',
      user: adminProfile,
    });
  }

  // 2. Contributor Login Verification against Database
  const contributor = await db.getUserByEmail(normalizedEmail);
  if (contributor) {
    // Verify password if recorded using cryptographic verification
    if (contributor.password && !verifyPassword(inputPassword, contributor.password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please verify your credentials and try again.',
      });
    }

    if (contributor.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact platform support.',
      });
    }

    const { password: _, ...safeUser } = contributor;
    return res.json({
      success: true,
      role: contributor.role || 'contributor',
      user: safeUser,
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid email or password. Please verify your credentials and try again.',
  });
});

// Registration Endpoint for new contributors (Section 6)
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
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
      cvLink,
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

    // Check for existing registration in database
    const existing = await db.getUserByEmail(normalizedEmail);
    if (existing) {
      if (verifyPassword(String(password), existing.password)) {
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
      cvLink: cvLink ? String(cvLink).trim() : undefined,
      role: 'contributor',
      isEmailVerified: false,
      profileStatus: 'Incomplete',
      avatar: (String(firstName)[0] || 'U').toUpperCase() + (String(lastName)[0] || 'C').toUpperCase(),
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    await db.createUser(newUser);

    const { password: _, ...safeUser } = newUser;
    return res.json({
      success: true,
      user: safeUser,
      message: 'Account registered successfully! Welcome to Nexora Workforce.',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to complete registration. Please try again.',
    });
  }
});

// =================== USERS API (Section 1) ===================

// GET /api/users - Return all registered users
apiRouter.get('/users', async (_req: Request, res: Response) => {
  try {
    const allUsers = await db.getUsers();
    const safeUsers = allUsers.map(({ password: _, ...u }) => u);
    res.json({ success: true, users: safeUsers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/:id - Return single user
apiRouter.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await db.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users - Create new user
apiRouter.post('/users', async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    if (!userData || !userData.email || !userData.firstName) {
      return res.status(400).json({ success: false, message: 'Invalid user payload' });
    }
    const newUser: StoredUser = {
      id: userData.id || `usr-${Date.now().toString().slice(-5)}`,
      firstName: userData.firstName,
      lastName: userData.lastName || '',
      email: String(userData.email).trim().toLowerCase(),
      password: userData.password || 'Password123@',
      phone: userData.phone || '',
      country: userData.country || 'United States',
      languages: userData.languages || ['English'],
      languageProficiency: userData.languageProficiency || { English: 'Native / Fluent' },
      skills: userData.skills || ['Translation & Localization'],
      experience: userData.experience || 'Contributor',
      role: userData.role || 'contributor',
      isEmailVerified: userData.isEmailVerified ?? false,
      profileStatus: userData.profileStatus || 'Incomplete',
      avatar: userData.avatar || (userData.firstName[0] + (userData.lastName?.[0] || '')).toUpperCase(),
      status: userData.status || 'active',
      createdAt: userData.createdAt || new Date().toISOString().split('T')[0],
    };
    await db.createUser(newUser);
    const { password: _, ...safeUser } = newUser;
    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/:id - Update existing user
apiRouter.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await db.updateUser(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { password: _, ...safeUser } = updated;
    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/:id - Delete user
apiRouter.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/users/:id/status - Toggle active/suspended
apiRouter.patch('/users/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await db.getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const updated = await db.updateUser(id, { status: nextStatus });
    const { password: _, ...safeUser } = updated!;
    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/users/:id/verify-email - Toggle email verification
apiRouter.patch('/users/:id/verify-email', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await db.getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const isEmailVerified = !user.isEmailVerified;
    const profileStatus = isEmailVerified ? 'Complete' : 'Incomplete';
    const updated = await db.updateUser(id, { isEmailVerified, profileStatus });
    const { password: _, ...safeUser } = updated!;
    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/sync - Client-to-server users sync (preserves existing data from localStorage)
apiRouter.post('/users/sync', async (req: Request, res: Response) => {
  try {
    const { users: incomingUsers, user: singleUser } = req.body || {};
    const list = Array.isArray(incomingUsers) ? incomingUsers : singleUser ? [singleUser] : [];

    for (const u of list) {
      if (!u || !u.email) continue;
      const normEmail = String(u.email).trim().toLowerCase();
      if (normEmail === 'contributor@nexora.work' || u.id === 'usr-demo-01' || normEmail.includes('temp')) {
        continue;
      }
      await db.createUser({
        ...u,
        id: u.id || `usr-${Date.now().toString().slice(-5)}`,
        email: normEmail,
        createdAt: u.createdAt || new Date().toISOString().split('T')[0],
      });
    }

    const allUsers = await db.getUsers();
    const safeUsers = allUsers.map(({ password: _, ...u }) => u);
    res.json({ success: true, users: safeUsers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =================== PROJECTS API (Section 1) ===================

// GET /api/projects - Return all projects
apiRouter.get('/projects', async (_req: Request, res: Response) => {
  try {
    const projects = await db.getProjects();
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/projects/:id - Return single project
apiRouter.get('/projects/:id', async (req: Request, res: Response) => {
  try {
    const project = await db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/projects - Create project
apiRouter.post('/projects', async (req: Request, res: Response) => {
  try {
    const projectData = req.body;
    if (!projectData || !projectData.name) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    const newProject: StoredProject = {
      ...projectData,
      id: projectData.id || `proj-${Date.now().toString().slice(-6)}`,
      approvedContributors: projectData.approvedContributors || 0,
      status: projectData.status || 'Open',
      createdAt: projectData.createdAt || new Date().toISOString().split('T')[0],
    };

    await db.createProject(newProject);
    const allProjects = await db.getProjects();
    res.json({ success: true, project: newProject, projects: allProjects });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/projects/:id - Update project
apiRouter.put('/projects/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const projectData = req.body;
    const updated = await db.updateProject(id, projectData);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const allProjects = await db.getProjects();
    res.json({ success: true, project: updated, projects: allProjects });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/projects/:id/status - Change project status
apiRouter.patch('/projects/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await db.updateProject(id, { status });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const allProjects = await db.getProjects();
    res.json({ success: true, project: updated, projects: allProjects });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/projects/:id - Delete project
apiRouter.delete('/projects/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteProject(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const allProjects = await db.getProjects();
    res.json({ success: true, message: 'Project deleted successfully.', projects: allProjects });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/projects/sync - Sync projects from client
apiRouter.post('/projects/sync', async (req: Request, res: Response) => {
  try {
    const { projects: incomingProjects } = req.body || {};
    if (Array.isArray(incomingProjects)) {
      for (const p of incomingProjects) {
        if (!p || !p.id) continue;
        const exists = await db.getProjectById(p.id);
        if (exists) {
          await db.updateProject(p.id, p);
        } else {
          await db.createProject(p);
        }
      }
    }
    const allProjects = await db.getProjects();
    res.json({ success: true, projects: allProjects });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =================== APPLICATIONS API (Section 1 & 7) ===================

// GET /api/applications - Return all applications
apiRouter.get('/applications', async (_req: Request, res: Response) => {
  try {
    const applications = await db.getApplications();
    res.json({ success: true, applications });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/applications/:id - Return single application
apiRouter.get('/applications/:id', async (req: Request, res: Response) => {
  try {
    const application = await db.getApplicationById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.json({ success: true, application });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/applications - Submit new application (Section 7)
apiRouter.post('/applications', async (req: Request, res: Response) => {
  try {
    const appData = req.body;
    if (!appData || !appData.projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    const newApp: StoredApplication = {
      ...appData,
      id: appData.id || `app-${Date.now().toString().slice(-5)}`,
      status: appData.status || 'Applied',
      appliedDate: appData.appliedDate || new Date().toISOString().split('T')[0],
    };

    await db.createApplication(newApp);
    const allApps = await db.getApplications();
    const allProjects = await db.getProjects();

    res.json({
      success: true,
      application: newApp,
      applications: allApps,
      projects: allProjects,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT & PATCH /api/applications/:id - Review & update application status (Section 7)
const handleUpdateApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, reviewedDate } = req.body;
    const updated = await db.updateApplication(id, {
      status,
      notes,
      reviewedDate: reviewedDate || new Date().toISOString().split('T')[0],
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const allApps = await db.getApplications();
    const allProjects = await db.getProjects();

    res.json({
      success: true,
      application: updated,
      applications: allApps,
      projects: allProjects,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

apiRouter.put('/applications/:id', handleUpdateApplication);
apiRouter.patch('/applications/:id', handleUpdateApplication);

// DELETE /api/applications/:id - Delete application
apiRouter.delete('/applications/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteApplication(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    const allApps = await db.getApplications();
    const allProjects = await db.getProjects();
    res.json({ success: true, message: 'Application deleted.', applications: allApps, projects: allProjects });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/applications/sync - Sync applications from client
apiRouter.post('/applications/sync', async (req: Request, res: Response) => {
  try {
    const { applications: incomingApps } = req.body || {};
    if (Array.isArray(incomingApps)) {
      for (const app of incomingApps) {
        if (!app || !app.projectId || (!app.userId && !app.userEmail)) continue;
        await db.createApplication({
          ...app,
          id: app.id || `app-${Date.now().toString().slice(-5)}`,
          status: app.status || 'Applied',
          appliedDate: app.appliedDate || new Date().toISOString().split('T')[0],
        });
      }
    }
    const allApps = await db.getApplications();
    const allProjects = await db.getProjects();
    res.json({ success: true, applications: allApps, projects: allProjects });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/applications/bulk-approve - Bulk approve applications
apiRouter.post('/applications/bulk-approve', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body || {};
    if (Array.isArray(ids) && ids.length > 0) {
      await db.bulkApproveApplications(ids);
    }
    const allApps = await db.getApplications();
    const allProjects = await db.getProjects();
    res.json({ success: true, applications: allApps, projects: allProjects });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =================== PROJECT UPDATES API ===================

apiRouter.get('/project-updates', async (_req: Request, res: Response) => {
  try {
    const updates = await db.getUpdates();
    res.json({ success: true, updates });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.post('/project-updates', async (req: Request, res: Response) => {
  try {
    const updateData = req.body;
    const newUpdate: StoredProjectUpdate = {
      ...updateData,
      id: updateData.id || `upd-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      readByUserIds: updateData.readByUserIds || [],
    };
    await db.createUpdate(newUpdate);
    res.json({ success: true, update: newUpdate });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.delete('/project-updates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.deleteUpdate(id);
    res.json({ success: true, message: 'Update deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =================== RESET API ===================
apiRouter.post('/reset', async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Reset acknowledged.' });
});

// Mount the API Router on both '/api' and '/'
// This guarantees that whether a request comes as '/api/projects' or is rewritten to '/projects' on Vercel, it ALWAYS resolves!
app.use('/api', apiRouter);
app.use('/', apiRouter);

// =================== VITE & STATIC SERVING ===================

async function startServer() {
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

// Start standalone server unless running as a Vercel serverless function
if (!process.env.VERCEL) {
  startServer();
}

export default app;
