import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

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

// In-memory persistent server store for registered contributors
const registeredUsers: StoredUser[] = [];

// =================== API ROUTES ===================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Unified Login Endpoint: Automatically detects account role server-side
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

  // Prevent duplicate registration
  if (registeredUsers.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({
      success: false,
      message: 'An account with this email address already exists. Please log in.',
    });
  }

  const newUser: StoredUser = {
    id: `usr-${Date.now().toString().slice(-5)}`,
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    email: normalizedEmail,
    password: String(password),
    phone: phone ? String(phone).trim() : '',
    country: country || 'United States',
    languages: primaryLanguage ? [String(primaryLanguage).trim()] : ['English'],
    languageProficiency: {
      [primaryLanguage || 'English']: 'Native / Fluent',
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

  const { password: _, ...safeUser } = newUser;
  return res.json({
    success: true,
    user: safeUser,
    message: 'Account registered successfully! Please verify your email.',
  });
});

// User directory for admin management
app.get('/api/users', (_req, res) => {
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
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// =================== VITE & STATIC SERVING ===================

async function startServer() {
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
