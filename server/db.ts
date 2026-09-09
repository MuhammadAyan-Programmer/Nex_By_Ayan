import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Pool } from 'pg';

export interface StoredUser {
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
  cvLink?: string;
  resumeUrl?: string;
  resumeText?: string;
  role: 'contributor' | 'admin';
  isEmailVerified: boolean;
  profileStatus: 'Complete' | 'Incomplete';
  avatar: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface StoredProject {
  id: string;
  name: string;
  category: string;
  projectType: string;
  description: string;
  language: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  country: string;
  skillsRequired: string[];
  requiredContributors: number;
  approvedContributors: number;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  qualificationRequired: boolean;
  qualificationTestInfo?: string;
  minimumRequirement?: string;
  instructions?: string;
  communityLink?: string;
  announcement?: string;
  status: 'Open' | 'Closed' | 'Archived' | 'In Progress' | 'Completed';
  paymentType: 'Per Item' | 'Hourly' | 'Task' | 'Fixed' | 'Milestone';
  paymentRateType?: 'fixed' | 'range';
  paymentAmountMin?: number;
  paymentAmountMax?: number;
  ratePay: string;
  createdAt: string;
}

export interface StoredApplication {
  id: string;
  projectId: string;
  projectName: string;
  projectCategory: string;
  userId: string;
  userName: string;
  userEmail: string;
  phone?: string;
  country?: string;
  languages?: string[];
  languageProficiency?: string;
  experience?: string;
  skills?: string[];
  cvLink?: string;
  resumeUrl?: string;
  resumeText?: string;
  additionalInfo?: string;
  status: 'Applied' | 'Under Review' | 'Approved' | 'Waitlisted' | 'Rejected';
  appliedDate: string;
  reviewedDate?: string;
  notes?: string;
  rating?: number;
  paymentMethodId?: string;
}

export interface StoredProjectUpdate {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  content: string;
  type: 'general' | 'requirement_change' | 'milestone' | 'urgent';
  createdAt: string;
  readByUserIds: string[];
}

// Password hashing utility using built-in Node crypto (scrypt)
export function hashPassword(password: string): string {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || !password) return false;
  if (storedHash.includes(':')) {
    try {
      const [salt, key] = storedHash.split(':');
      const hash1 = crypto.scryptSync(password, salt, 64).toString('hex');
      if (crypto.timingSafeEqual(Buffer.from(hash1, 'hex'), Buffer.from(key, 'hex'))) {
        return true;
      }
      // Also verify trimmed password in case of copy-paste trailing/leading whitespace
      const trimmed = password.trim();
      if (trimmed !== password) {
        const hash2 = crypto.scryptSync(trimmed, salt, 64).toString('hex');
        if (crypto.timingSafeEqual(Buffer.from(hash2, 'hex'), Buffer.from(key, 'hex'))) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }
  // Plain text match fallback (for legacy or direct matches)
  return storedHash === password || storedHash === password.trim();
}

// Storage path resolution: check if cwd/data is writable, otherwise use /tmp/data
let DATA_DIR = path.join(process.cwd(), 'data');
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const testFile = path.join(DATA_DIR, '.write_test');
  fs.writeFileSync(testFile, 'ok', 'utf-8');
  fs.unlinkSync(testFile);
} catch {
  DATA_DIR = path.join('/tmp', 'nexora_data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Canonical single Administrator account configuration
export const CANONICAL_ADMIN_EMAIL = 'admin@nexora.ai';
export const CANONICAL_ADMIN_PASSWORD = 'Admin1@';

// The single real Open project definition
export const CANONICAL_ARABIC_PROJECT: StoredProject = {
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
    '15-minute Arabic to English translation assessment and contextual evaluation test.',
  minimumRequirement:
    'Native or professional Arabic proficiency with fluent English writing capabilities.',
  instructions:
    'Translate, review, and evaluate Arabic source strings into high-quality, natural English according to project guidelines.',
  communityLink: 'https://community.nexora.work/c/arabic-english-translation',
  announcement:
    'We are actively recruiting bilingual Arabic → English translators, linguists, and evaluators worldwide.',
  status: 'Open',
  paymentType: 'Per Item',
  paymentRateType: 'range',
  paymentAmountMin: 0.3,
  paymentAmountMax: 0.7,
  ratePay: '$0.30 - $0.70 / item',
  createdAt: '2026-09-01',
};

function loadJsonFile<T>(filename: string, defaultValue: T): T {
  try {
    const p = path.join(DATA_DIR, filename);
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`[Storage] Could not load ${filename}:`, err);
  }
  return defaultValue;
}

function writeJsonFile<T>(filename: string, data: T): void {
  try {
    const p = path.join(DATA_DIR, filename);
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[Storage] Warning: unable to write ${filename}:`, err);
  }
}

class DatabaseService {
  private pool: Pool | null = null;
  private isPostgres = false;
  private initialized = false;

  // Active in-memory state
  private usersCache: StoredUser[] = [];
  private projectsCache: StoredProject[] = [CANONICAL_ARABIC_PROJECT];
  private applicationsCache: StoredApplication[] = [];
  private updatesCache: StoredProjectUpdate[] = [];

  constructor() {
    this.usersCache = loadJsonFile<StoredUser[]>('users.json', []);
    const diskProjects = loadJsonFile<StoredProject[]>('projects.json', [CANONICAL_ARABIC_PROJECT]);
    // Ensure only the Arabic project is loaded
    this.projectsCache = diskProjects.filter((p) => p.id === 'proj-arabic-en-001');
    if (this.projectsCache.length === 0) {
      this.projectsCache = [CANONICAL_ARABIC_PROJECT];
    }
    this.applicationsCache = loadJsonFile<StoredApplication[]>('applications.json', []);
    this.updatesCache = loadJsonFile<StoredProjectUpdate[]>('updates.json', []);

    // Immediately guarantee single Admin account exists in memory with hashed password
    this.ensureSingleAdminAccount();
  }

  public ensureSingleAdminAccount(): void {
    const adminEmailNorm = CANONICAL_ADMIN_EMAIL.toLowerCase();

    // 1. Purge any conflicting or duplicate admin accounts (strictly single Admin)
    this.usersCache = this.usersCache.filter((u) => {
      if (u.role === 'admin' && u.email.toLowerCase() !== adminEmailNorm) {
        return false;
      }
      return true;
    });

    const existingAdminIdx = this.usersCache.findIndex(
      (u) => u.email.toLowerCase() === adminEmailNorm
    );
    const hashedPw = hashPassword(CANONICAL_ADMIN_PASSWORD);

    if (existingAdminIdx >= 0) {
      const existing = this.usersCache[existingAdminIdx];
      const hasValidPassword =
        existing.password && verifyPassword(CANONICAL_ADMIN_PASSWORD, existing.password);
      this.usersCache[existingAdminIdx] = {
        ...existing,
        id: existing.id || 'admin-001',
        firstName: existing.firstName || 'Admin',
        lastName: existing.lastName || 'Nexora',
        email: CANONICAL_ADMIN_EMAIL,
        role: 'admin',
        isEmailVerified: true,
        profileStatus: 'Complete',
        avatar: existing.avatar || 'AN',
        country: existing.country || 'Global',
        languages: existing.languages?.length ? existing.languages : ['English', 'Arabic'],
        languageProficiency: existing.languageProficiency || {
          English: 'Native / Fluent',
          Arabic: 'Professional Working',
        },
        skills: existing.skills?.length
          ? existing.skills
          : ['Workforce Operations', 'Quality Assurance', 'Project Architecture'],
        experience:
          existing.experience ||
          'Platform Administrator & Operations Director at Nexora Workforce',
        status: 'active',
        password: hasValidPassword ? existing.password : hashedPw,
        createdAt: existing.createdAt || '2026-09-01',
      };
    } else {
      const adminRecord: StoredUser = {
        id: 'admin-001',
        firstName: 'Admin',
        lastName: 'Nexora',
        email: CANONICAL_ADMIN_EMAIL,
        password: hashedPw,
        role: 'admin',
        isEmailVerified: true,
        profileStatus: 'Complete',
        avatar: 'AN',
        country: 'Global',
        languages: ['English', 'Arabic'],
        languageProficiency: {
          English: 'Native / Fluent',
          Arabic: 'Professional Working',
        },
        skills: ['Workforce Operations', 'Quality Assurance', 'Project Architecture'],
        experience:
          'Platform Administrator & Operations Director at Nexora Workforce',
        status: 'active',
        createdAt: '2026-09-01',
      };
      this.usersCache.unshift(adminRecord);
    }
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (connStr) {
      try {
        console.log('[DB] Connecting to PostgreSQL database at:', connStr.split('@')[1] || 'Postgres host');
        this.pool = new Pool({
          connectionString: connStr,
          ssl: connStr.includes('localhost') ? false : { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 30000,
        });

        await this.pool.query('SELECT 1');
        this.isPostgres = true;
        console.log('[DB] Connected to PostgreSQL successfully!');

        // Run schema creation and migrations
        await this.migrateSchema();
        // Load data from SQL
        await this.refreshFromSql();
      } catch (err) {
        console.error('[DB] PostgreSQL connection failed, falling back to persistent server file storage:', err);
        this.isPostgres = false;
      }
    } else {
      console.log('[DB] No DATABASE_URL set. Running with persistent server storage in:', DATA_DIR);
    }

    this.ensureSingleAdminAccount();
    this.recalculateProjectCapacities();
    this.saveAll();
    this.initialized = true;
  }

  private async migrateSchema(): Promise<void> {
    if (!this.pool) return;

    // Create tables
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        phone TEXT,
        country TEXT,
        languages JSONB,
        language_proficiency JSONB,
        skills JSONB,
        experience TEXT,
        cv_link TEXT,
        resume_text TEXT,
        role TEXT NOT NULL DEFAULT 'contributor',
        is_email_verified BOOLEAN DEFAULT false,
        profile_status TEXT DEFAULT 'Complete',
        avatar TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        project_type TEXT,
        description TEXT,
        language TEXT,
        source_language TEXT,
        target_language TEXT,
        country TEXT,
        skills_required JSONB,
        required_contributors INTEGER DEFAULT 1200,
        approved_contributors INTEGER DEFAULT 0,
        start_date TEXT,
        end_date TEXT,
        application_deadline TEXT,
        qualification_required BOOLEAN DEFAULT true,
        qualification_test_info TEXT,
        minimum_requirement TEXT,
        instructions TEXT,
        community_link TEXT,
        announcement TEXT,
        status TEXT DEFAULT 'Open',
        payment_type TEXT,
        payment_rate_type TEXT,
        payment_amount_min NUMERIC,
        payment_amount_max NUMERIC,
        rate_pay TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        project_name TEXT,
        project_category TEXT,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL,
        phone TEXT,
        country TEXT,
        languages JSONB,
        language_proficiency TEXT,
        experience TEXT,
        skills JSONB,
        cv_link TEXT,
        additional_info TEXT,
        status TEXT DEFAULT 'Applied',
        applied_date TEXT,
        reviewed_date TEXT,
        notes TEXT,
        rating NUMERIC,
        payment_method_id TEXT
      );

      CREATE TABLE IF NOT EXISTS project_updates (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        project_name TEXT,
        title TEXT,
        content TEXT,
        type TEXT,
        created_at TEXT,
        read_by_user_ids JSONB
      );
    `);

    // Column additions if upgrading from earlier table versions
    await this.pool.query(`
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE applications ADD COLUMN cv_link TEXT;
        EXCEPTION WHEN duplicate_column THEN END;
        BEGIN
          ALTER TABLE applications ADD COLUMN phone TEXT;
        EXCEPTION WHEN duplicate_column THEN END;
        BEGIN
          ALTER TABLE applications ADD COLUMN additional_info TEXT;
        EXCEPTION WHEN duplicate_column THEN END;
        BEGIN
          ALTER TABLE users ADD COLUMN cv_link TEXT;
        EXCEPTION WHEN duplicate_column THEN END;
      END $$;
    `);

    // Add unique constraint on (user_id, project_id) to prevent duplicate applications
    try {
      await this.pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_project ON applications (user_id, project_id);
      `);
    } catch {
      // Index might already exist
    }

    // Clean up old demo users from PostgreSQL if any exist
    await this.pool.query(`
      DELETE FROM users 
      WHERE id IN ('user-001', 'user-002', 'user-003', 'user-004', 'user-005', 'user-006', 'user-007', 'user-008', 'user-009', 'user-010', 'user-011', 'user-012', 'user-013', 'user-014', 'user-015', 'user-016', 'user-017', 'user-018', 'user-019', 'user-020', 'user-021', 'user-022', 'user-023', 'user-024', 'user-025')
         OR email LIKE '%@example.com'
         OR email IN ('sarah.chen@globalai.org', 'alex.dubois@linguaeval.fr', 'elena.rodriguez@aiannotate.es', 'm.almansoori@gulfnlp.ae', 'kenji.tanaka@tokyodata.jp');
    `);

    // Clean up old demo applications from PostgreSQL if any exist
    await this.pool.query(`
      DELETE FROM applications
      WHERE id LIKE 'app-00%' OR user_email LIKE '%@example.com' OR user_name IN ('Sarah Chen', 'Alexandre Dubois', 'Elena Rodriguez');
    `);

    // Remove any projects that are NOT the Arabic translation project
    await this.pool.query(`
      DELETE FROM projects WHERE id != 'proj-arabic-en-001';
    `);

    // Purge any conflicting or legacy admin accounts from PostgreSQL
    await this.pool.query(
      `DELETE FROM users WHERE role = 'admin' AND LOWER(email) != $1`,
      [CANONICAL_ADMIN_EMAIL.toLowerCase()]
    );

    // Upsert the single canonical Admin account with securely hashed password
    const adminRecord = this.usersCache.find(
      (u) => u.email.toLowerCase() === CANONICAL_ADMIN_EMAIL.toLowerCase()
    );
    if (adminRecord) {
      await this.pool.query(
        `INSERT INTO users (
          id, first_name, last_name, email, password, role, is_email_verified,
          profile_status, avatar, country, languages, language_proficiency,
          skills, experience, status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, 'admin', true, 'Complete', 'AN', 'Global',
          $6, $7, $8, $9, 'active', '2026-09-01'
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          role = 'admin',
          password = EXCLUDED.password,
          status = 'active'`,
        [
          adminRecord.id,
          adminRecord.firstName,
          adminRecord.lastName,
          adminRecord.email,
          adminRecord.password,
          JSON.stringify(adminRecord.languages),
          JSON.stringify(adminRecord.languageProficiency),
          JSON.stringify(adminRecord.skills),
          adminRecord.experience || '',
        ]
      );
    }

    // Ensure the canonical Arabic project exists in PostgreSQL
    await this.pool.query(
      `INSERT INTO projects (
        id, name, category, project_type, description, language, source_language, target_language,
        country, skills_required, required_contributors, approved_contributors, start_date, end_date,
        application_deadline, qualification_required, qualification_test_info, minimum_requirement,
        instructions, community_link, announcement, status, payment_type, payment_rate_type,
        payment_amount_min, payment_amount_max, rate_pay, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
      ON CONFLICT (id) DO UPDATE SET
        status = 'Open',
        required_contributors = 1200`,
      [
        CANONICAL_ARABIC_PROJECT.id,
        CANONICAL_ARABIC_PROJECT.name,
        CANONICAL_ARABIC_PROJECT.category,
        CANONICAL_ARABIC_PROJECT.projectType,
        CANONICAL_ARABIC_PROJECT.description,
        CANONICAL_ARABIC_PROJECT.language,
        CANONICAL_ARABIC_PROJECT.sourceLanguage,
        CANONICAL_ARABIC_PROJECT.targetLanguage,
        CANONICAL_ARABIC_PROJECT.country,
        JSON.stringify(CANONICAL_ARABIC_PROJECT.skillsRequired),
        CANONICAL_ARABIC_PROJECT.requiredContributors,
        CANONICAL_ARABIC_PROJECT.approvedContributors,
        CANONICAL_ARABIC_PROJECT.startDate,
        CANONICAL_ARABIC_PROJECT.endDate,
        CANONICAL_ARABIC_PROJECT.applicationDeadline,
        CANONICAL_ARABIC_PROJECT.qualificationRequired,
        CANONICAL_ARABIC_PROJECT.qualificationTestInfo,
        CANONICAL_ARABIC_PROJECT.minimumRequirement,
        CANONICAL_ARABIC_PROJECT.instructions,
        CANONICAL_ARABIC_PROJECT.communityLink,
        CANONICAL_ARABIC_PROJECT.announcement,
        CANONICAL_ARABIC_PROJECT.status,
        CANONICAL_ARABIC_PROJECT.paymentType,
        CANONICAL_ARABIC_PROJECT.paymentRateType,
        CANONICAL_ARABIC_PROJECT.paymentAmountMin,
        CANONICAL_ARABIC_PROJECT.paymentAmountMax,
        CANONICAL_ARABIC_PROJECT.ratePay,
        CANONICAL_ARABIC_PROJECT.createdAt,
      ]
    );
  }

  private async refreshFromSql(): Promise<void> {
    if (!this.pool) return;
    try {
      const usersRes = await this.pool.query('SELECT * FROM users ORDER BY created_at DESC');
      this.usersCache = usersRes.rows.map((r) => ({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        password: r.password,
        phone: r.phone,
        country: r.country,
        languages: typeof r.languages === 'string' ? JSON.parse(r.languages) : r.languages || [],
        languageProficiency:
          typeof r.language_proficiency === 'string'
            ? JSON.parse(r.language_proficiency)
            : r.language_proficiency || {},
        skills: typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills || [],
        experience: r.experience,
        cvLink: r.cv_link,
        resumeText: r.resume_text,
        role: r.role,
        isEmailVerified: r.is_email_verified,
        profileStatus: r.profile_status,
        avatar: r.avatar,
        status: r.status,
        createdAt: r.created_at,
      }));

      const projsRes = await this.pool.query("SELECT * FROM projects WHERE id = 'proj-arabic-en-001'");
      if (projsRes.rows.length > 0) {
        const r = projsRes.rows[0];
        this.projectsCache = [
          {
            id: r.id,
            name: r.name,
            category: r.category,
            projectType: r.project_type,
            description: r.description,
            language: r.language,
            sourceLanguage: r.source_language,
            targetLanguage: r.target_language,
            country: r.country,
            skillsRequired:
              typeof r.skills_required === 'string'
                ? JSON.parse(r.skills_required)
                : r.skills_required || [],
            requiredContributors: r.required_contributors,
            approvedContributors: r.approved_contributors,
            startDate: r.start_date,
            endDate: r.end_date,
            applicationDeadline: r.application_deadline,
            qualificationRequired: r.qualification_required,
            qualificationTestInfo: r.qualification_test_info,
            minimumRequirement: r.minimum_requirement,
            instructions: r.instructions,
            communityLink: r.community_link,
            announcement: r.announcement,
            status: r.status,
            paymentType: r.payment_type,
            paymentRateType: r.payment_rate_type,
            paymentAmountMin: r.payment_amount_min ? parseFloat(r.payment_amount_min) : undefined,
            paymentAmountMax: r.payment_amount_max ? parseFloat(r.payment_amount_max) : undefined,
            ratePay: r.rate_pay,
            createdAt: r.created_at,
          },
        ];
      } else {
        this.projectsCache = [CANONICAL_ARABIC_PROJECT];
      }

      const appsRes = await this.pool.query('SELECT * FROM applications ORDER BY applied_date DESC');
      this.applicationsCache = appsRes.rows.map((r) => ({
        id: r.id,
        projectId: r.project_id,
        projectName: r.project_name,
        projectCategory: r.project_category,
        userId: r.user_id,
        userName: r.user_name,
        userEmail: r.user_email,
        phone: r.phone,
        country: r.country,
        languages: typeof r.languages === 'string' ? JSON.parse(r.languages) : r.languages || [],
        languageProficiency: r.language_proficiency,
        experience: r.experience,
        skills: typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills || [],
        cvLink: r.cv_link,
        additionalInfo: r.additional_info,
        status: r.status,
        appliedDate: r.applied_date,
        reviewedDate: r.reviewed_date,
        notes: r.notes,
        rating: r.rating ? parseFloat(r.rating) : undefined,
        paymentMethodId: r.payment_method_id,
      }));

      // Maintain single admin account in memory state
      this.ensureSingleAdminAccount();
    } catch (err) {
      console.error('[DB] Error refreshing state from PostgreSQL:', err);
    }
  }

  private saveAll(): void {
    writeJsonFile('users.json', this.usersCache);
    writeJsonFile('projects.json', this.projectsCache);
    writeJsonFile('applications.json', this.applicationsCache);
    writeJsonFile('updates.json', this.updatesCache);
  }

  private recalculateProjectCapacities(): void {
    const approvedCount = this.applicationsCache.filter(
      (a) => a.projectId === 'proj-arabic-en-001' && a.status === 'Approved'
    ).length;

    if (this.projectsCache.length > 0) {
      this.projectsCache[0].approvedContributors = approvedCount;
    }
  }

  public getStorageType(): string {
    return this.isPostgres ? 'PostgreSQL' : 'FileStore';
  }

  // =================== USERS API ===================

  public async getUsers(): Promise<StoredUser[]> {
    if (this.isPostgres && this.pool) {
      await this.refreshFromSql();
    }
    return this.usersCache;
  }

  public async getUserById(id: string): Promise<StoredUser | undefined> {
    if (this.isPostgres && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            firstName: r.first_name,
            lastName: r.last_name,
            email: r.email,
            password: r.password,
            phone: r.phone,
            country: r.country,
            languages: typeof r.languages === 'string' ? JSON.parse(r.languages) : r.languages || [],
            languageProficiency:
              typeof r.language_proficiency === 'string'
                ? JSON.parse(r.language_proficiency)
                : r.language_proficiency || {},
            skills: typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills || [],
            experience: r.experience,
            cvLink: r.cv_link,
            resumeText: r.resume_text,
            role: r.role,
            isEmailVerified: r.is_email_verified,
            profileStatus: r.profile_status,
            avatar: r.avatar,
            status: r.status,
            createdAt: r.created_at,
          };
        }
      } catch (err) {
        console.error('[DB] getUserById SQL error:', err);
      }
    }
    return this.usersCache.find((u) => u.id === id);
  }

  public async getUserByEmail(email: string): Promise<StoredUser | undefined> {
    const norm = email.trim().toLowerCase();
    if (this.isPostgres && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [norm]);
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            firstName: r.first_name,
            lastName: r.last_name,
            email: r.email,
            password: r.password,
            phone: r.phone,
            country: r.country,
            languages: typeof r.languages === 'string' ? JSON.parse(r.languages) : r.languages || [],
            languageProficiency:
              typeof r.language_proficiency === 'string'
                ? JSON.parse(r.language_proficiency)
                : r.language_proficiency || {},
            skills: typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills || [],
            experience: r.experience,
            cvLink: r.cv_link,
            resumeText: r.resume_text,
            role: r.role,
            isEmailVerified: r.is_email_verified,
            profileStatus: r.profile_status,
            avatar: r.avatar,
            status: r.status,
            createdAt: r.created_at,
          };
        }
      } catch (err) {
        console.error('[DB] getUserByEmail SQL error:', err);
      }
    }
    return this.usersCache.find((u) => u.email.trim().toLowerCase() === norm);
  }

  public async createUser(userData: StoredUser): Promise<StoredUser> {
    const norm = userData.email.trim().toLowerCase();
    const existing = await this.getUserByEmail(norm);
    if (existing) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    // Hash password if provided in plain text
    let securePassword = userData.password;
    if (securePassword && !securePassword.includes(':')) {
      securePassword = hashPassword(securePassword);
    }

    const newUser: StoredUser = {
      ...userData,
      email: norm,
      password: securePassword,
      role: userData.role || 'contributor',
      status: userData.status || 'active',
      isEmailVerified: userData.isEmailVerified ?? false,
      profileStatus: userData.profileStatus || 'Complete',
      createdAt: userData.createdAt || new Date().toISOString().split('T')[0],
      languages: userData.languages || ['English'],
      languageProficiency: userData.languageProficiency || { English: 'Fluent' },
      skills: userData.skills || [],
    };

    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO users (
            id, first_name, last_name, email, password, phone, country,
            languages, language_proficiency, skills, experience, cv_link,
            resume_text, role, is_email_verified, profile_status, avatar,
            status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            phone = EXCLUDED.phone,
            country = EXCLUDED.country`,
          [
            newUser.id,
            newUser.firstName,
            newUser.lastName,
            newUser.email,
            newUser.password,
            newUser.phone || '',
            newUser.country,
            JSON.stringify(newUser.languages),
            JSON.stringify(newUser.languageProficiency),
            JSON.stringify(newUser.skills),
            newUser.experience || '',
            newUser.cvLink || '',
            newUser.resumeText || '',
            newUser.role,
            newUser.isEmailVerified,
            newUser.profileStatus,
            newUser.avatar,
            newUser.status,
            newUser.createdAt,
          ]
        );
      } catch (err) {
        console.error('[DB] createUser SQL error:', err);
      }
    }

    const idx = this.usersCache.findIndex((u) => u.id === newUser.id);
    if (idx >= 0) {
      this.usersCache[idx] = newUser;
    } else {
      this.usersCache.unshift(newUser);
    }
    this.saveAll();
    return newUser;
  }

  public async updateUser(id: string, updates: Partial<StoredUser>): Promise<StoredUser | undefined> {
    const user = await this.getUserById(id);
    if (!user) return undefined;

    let updatedPassword = updates.password !== undefined ? updates.password : user.password;
    if (updatedPassword && !updatedPassword.includes(':')) {
      updatedPassword = hashPassword(updatedPassword);
    }

    const updatedUser: StoredUser = {
      ...user,
      ...updates,
      password: updatedPassword,
    };

    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query(
          `UPDATE users SET
            first_name = $1, last_name = $2, phone = $3, country = $4,
            languages = $5, language_proficiency = $6, skills = $7,
            experience = $8, cv_link = $9, status = $10, is_email_verified = $11,
            password = COALESCE($12, password)
           WHERE id = $13`,
          [
            updatedUser.firstName,
            updatedUser.lastName,
            updatedUser.phone || '',
            updatedUser.country,
            JSON.stringify(updatedUser.languages),
            JSON.stringify(updatedUser.languageProficiency),
            JSON.stringify(updatedUser.skills),
            updatedUser.experience,
            updatedUser.cvLink || '',
            updatedUser.status,
            updatedUser.isEmailVerified,
            updatedPassword,
            id,
          ]
        );
      } catch (err) {
        console.error('[DB] updateUser SQL error:', err);
      }
    }

    const idx = this.usersCache.findIndex((u) => u.id === id);
    if (idx >= 0) {
      this.usersCache[idx] = updatedUser;
    }
    this.saveAll();
    return updatedUser;
  }

  public async deleteUser(id: string): Promise<boolean> {
    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
      } catch (err) {
        console.error('[DB] deleteUser SQL error:', err);
      }
    }
    const initialLen = this.usersCache.length;
    this.usersCache = this.usersCache.filter((u) => u.id !== id);
    this.saveAll();
    return this.usersCache.length < initialLen;
  }

  // =================== PROJECTS API ===================

  public async getProjects(): Promise<StoredProject[]> {
    // Only the single canonical Arabic project is returned
    this.recalculateProjectCapacities();
    return this.projectsCache;
  }

  public async getProjectById(id: string): Promise<StoredProject | undefined> {
    this.recalculateProjectCapacities();
    return this.projectsCache.find((p) => p.id === id);
  }

  public async createProject(proj: StoredProject): Promise<StoredProject> {
    const existing = this.projectsCache.find((p) => p.id === proj.id);
    if (existing) {
      const updated = await this.updateProject(proj.id, proj);
      return updated || proj;
    }
    this.projectsCache.push(proj);
    this.saveAll();
    return proj;
  }

  public async updateProject(id: string, updates: Partial<StoredProject>): Promise<StoredProject | undefined> {
    const idx = this.projectsCache.findIndex((p) => p.id === id);
    if (idx >= 0) {
      this.projectsCache[idx] = { ...this.projectsCache[idx], ...updates };
      this.saveAll();
      return this.projectsCache[idx];
    }
    return undefined;
  }

  public async deleteProject(id: string): Promise<boolean> {
    const prevLen = this.projectsCache.length;
    this.projectsCache = this.projectsCache.filter((p) => p.id !== id);
    this.saveAll();
    return this.projectsCache.length < prevLen;
  }

  // =================== APPLICATIONS API ===================

  public async getApplications(): Promise<StoredApplication[]> {
    if (this.isPostgres && this.pool) {
      await this.refreshFromSql();
    }
    return this.applicationsCache;
  }

  public async getApplicationById(id: string): Promise<StoredApplication | undefined> {
    return this.applicationsCache.find((a) => a.id === id);
  }

  public async hasUserApplied(userId: string, projectId: string): Promise<boolean> {
    const existing = this.applicationsCache.find(
      (a) => a.projectId === projectId && (a.userId === userId || a.userEmail.toLowerCase() === userId.toLowerCase())
    );
    if (existing) return true;

    if (this.isPostgres && this.pool) {
      try {
        const res = await this.pool.query(
          'SELECT id FROM applications WHERE project_id = $1 AND (user_id = $2 OR LOWER(user_email) = $3)',
          [projectId, userId, userId.toLowerCase()]
        );
        return res.rows.length > 0;
      } catch (err) {
        console.error('[DB] hasUserApplied error:', err);
      }
    }
    return false;
  }

  public async createApplication(appData: StoredApplication): Promise<StoredApplication> {
    // Prevent duplicate application to the same project
    const alreadyApplied = await this.hasUserApplied(appData.userId, appData.projectId);
    if (alreadyApplied) {
      throw new Error('You have already submitted an application for this project.');
    }

    const newApp: StoredApplication = {
      ...appData,
      id: appData.id || `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status: appData.status || 'Applied',
      appliedDate: appData.appliedDate || new Date().toISOString().split('T')[0],
      projectName: appData.projectName || CANONICAL_ARABIC_PROJECT.name,
      projectCategory: appData.projectCategory || CANONICAL_ARABIC_PROJECT.category,
    };

    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO applications (
            id, project_id, project_name, project_category, user_id, user_name, user_email,
            phone, country, languages, language_proficiency, experience, skills, cv_link,
            additional_info, status, applied_date, reviewed_date, notes, rating, payment_method_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            notes = EXCLUDED.notes`,
          [
            newApp.id,
            newApp.projectId,
            newApp.projectName,
            newApp.projectCategory,
            newApp.userId,
            newApp.userName,
            newApp.userEmail,
            newApp.phone || '',
            newApp.country || 'Global',
            JSON.stringify(newApp.languages || []),
            newApp.languageProficiency || '',
            newApp.experience || '',
            JSON.stringify(newApp.skills || []),
            newApp.cvLink || '',
            newApp.additionalInfo || '',
            newApp.status,
            newApp.appliedDate,
            newApp.reviewedDate || null,
            newApp.notes || '',
            newApp.rating || null,
            newApp.paymentMethodId || '',
          ]
        );
      } catch (err) {
        console.error('[DB] createApplication SQL error:', err);
      }
    }

    this.applicationsCache.unshift(newApp);
    this.recalculateProjectCapacities();
    this.saveAll();
    return newApp;
  }

  public async updateApplication(
    id: string,
    updates: Partial<StoredApplication>
  ): Promise<StoredApplication | undefined> {
    const app = await this.getApplicationById(id);
    if (!app) return undefined;

    const updatedApp: StoredApplication = {
      ...app,
      ...updates,
      reviewedDate: updates.status ? new Date().toISOString().split('T')[0] : app.reviewedDate,
    };

    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query(
          `UPDATE applications SET
            status = $1, notes = $2, reviewed_date = $3, rating = $4
           WHERE id = $5`,
          [
            updatedApp.status,
            updatedApp.notes || '',
            updatedApp.reviewedDate || null,
            updatedApp.rating || null,
            id,
          ]
        );
      } catch (err) {
        console.error('[DB] updateApplication SQL error:', err);
      }
    }

    const idx = this.applicationsCache.findIndex((a) => a.id === id);
    if (idx >= 0) {
      this.applicationsCache[idx] = updatedApp;
    }

    this.recalculateProjectCapacities();
    this.saveAll();
    return updatedApp;
  }

  public async deleteApplication(id: string): Promise<boolean> {
    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query('DELETE FROM applications WHERE id = $1', [id]);
      } catch (err) {
        console.error('[DB] deleteApplication SQL error:', err);
      }
    }
    const initialLen = this.applicationsCache.length;
    this.applicationsCache = this.applicationsCache.filter((a) => a.id !== id);
    this.recalculateProjectCapacities();
    this.saveAll();
    return this.applicationsCache.length < initialLen;
  }

  public async bulkApproveApplications(ids: string[]): Promise<StoredApplication[]> {
    const updated: StoredApplication[] = [];
    for (const id of ids) {
      const res = await this.updateApplication(id, { status: 'Approved' });
      if (res) updated.push(res);
    }
    return updated;
  }

  // =================== UPDATES API ===================

  public async getUpdates(): Promise<any[]> {
    return this.updatesCache;
  }

  public async createUpdate(updateData: any): Promise<any> {
    const newUpdate = {
      ...updateData,
      id: updateData.id || `upd-${Date.now()}`,
      createdAt: updateData.createdAt || new Date().toISOString(),
    };
    this.updatesCache.unshift(newUpdate);
    this.saveAll();
    return newUpdate;
  }

  public async deleteUpdate(id: string): Promise<boolean> {
    const prevLen = this.updatesCache.length;
    this.updatesCache = this.updatesCache.filter((u) => u.id !== id);
    this.saveAll();
    return this.updatesCache.length < prevLen;
  }

  // =================== STATISTICS (Zero Mock Data) ===================

  public async getStats() {
    if (this.isPostgres && this.pool) {
      await this.refreshFromSql();
    }

    const totalUsers = this.usersCache.filter((u) => u.role !== 'admin').length;
    const totalApplications = this.applicationsCache.length;
    const pendingApplications = this.applicationsCache.filter(
      (a) => a.status === 'Applied' || a.status === 'Under Review'
    ).length;
    const approvedApplications = this.applicationsCache.filter((a) => a.status === 'Approved').length;
    const rejectedApplications = this.applicationsCache.filter((a) => a.status === 'Rejected').length;
    const openProjects = this.projectsCache.filter((p) => p.status === 'Open').length;

    return {
      totalUsers,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalProjects: this.projectsCache.length,
      openProjects,
      activeProjects: openProjects,
      approvedContributors: approvedApplications,
      totalPayoutsDistributed: 0,
      activePipelines: openProjects,
      storageEngine: this.getStorageType(),
    };
  }
}

export const db = new DatabaseService();
