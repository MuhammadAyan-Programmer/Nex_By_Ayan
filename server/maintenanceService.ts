import fs from 'fs';
import path from 'path';

export interface MaintenanceConfig {
  enabled: boolean;
  startDateTime: string;
  endDateTime: string;
  title: string;
  message: string;
  lastUpdated?: string;
  updatedBy?: string;
}

export type MaintenanceStatus = 'disabled' | 'scheduled' | 'active' | 'ended';

export interface MaintenanceInfo {
  config: MaintenanceConfig;
  isActive: boolean;
  status: MaintenanceStatus;
  timeRemainingMs: number;
  timeUntilStartMs: number;
  serverTime: string;
}

const DEFAULT_CONFIG: MaintenanceConfig = {
  enabled: false,
  startDateTime: '',
  endDateTime: '',
  title: 'System Under Scheduled Maintenance',
  message: 'Nexora Workforce is temporarily offline for scheduled system upgrades and infrastructure optimization. Project applications, contributor portals, and task evaluations will resume immediately once maintenance concludes.',
  lastUpdated: new Date().toISOString(),
  updatedBy: 'admin@nexora.ai',
};

// Data persistence file location
const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'maintenance.json');

let inMemoryConfig: MaintenanceConfig = { ...DEFAULT_CONFIG };

function initStorage(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(FILE_PATH)) {
      const raw = fs.readFileSync(FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      inMemoryConfig = { ...DEFAULT_CONFIG, ...parsed };
    } else {
      fs.writeFileSync(FILE_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('[MaintenanceService] Storage init notice (using memory fallback):', err);
  }
}

initStorage();

function persist(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(FILE_PATH, JSON.stringify(inMemoryConfig, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[MaintenanceService] Persist write notice:', err);
  }
}

/**
 * Calculates current maintenance status against the live clock
 */
export function calculateMaintenanceStatus(
  config: MaintenanceConfig = inMemoryConfig,
  nowMs: number = Date.now()
): {
  status: MaintenanceStatus;
  isActive: boolean;
  timeRemainingMs: number;
  timeUntilStartMs: number;
} {
  if (!config.enabled) {
    return {
      status: 'disabled',
      isActive: false,
      timeRemainingMs: 0,
      timeUntilStartMs: 0,
    };
  }

  const startMs = config.startDateTime ? new Date(config.startDateTime).getTime() : 0;
  const endMs = config.endDateTime ? new Date(config.endDateTime).getTime() : 0;

  // Case 1: Start time is set in the future -> Scheduled
  if (startMs > 0 && nowMs < startMs) {
    const timeUntilStart = startMs - nowMs;
    return {
      status: 'scheduled',
      isActive: false,
      timeRemainingMs: endMs > 0 ? Math.max(0, endMs - nowMs) : 0,
      timeUntilStartMs: Math.max(0, timeUntilStart),
    };
  }

  // Case 2: End time is set in the past -> Ended / Expired
  if (endMs > 0 && nowMs > endMs) {
    return {
      status: 'ended',
      isActive: false,
      timeRemainingMs: 0,
      timeUntilStartMs: 0,
    };
  }

  // Case 3: Maintenance is enabled and currently within window
  // (or enabled with no start time, or start time already passed, and end time not passed or not set)
  const timeRemaining = endMs > 0 ? Math.max(0, endMs - nowMs) : 0;
  return {
    status: 'active',
    isActive: true,
    timeRemainingMs: timeRemaining,
    timeUntilStartMs: 0,
  };
}

export function getMaintenanceInfo(): MaintenanceInfo {
  const calc = calculateMaintenanceStatus(inMemoryConfig);
  return {
    config: { ...inMemoryConfig },
    isActive: calc.isActive,
    status: calc.status,
    timeRemainingMs: calc.timeRemainingMs,
    timeUntilStartMs: calc.timeUntilStartMs,
    serverTime: new Date().toISOString(),
  };
}

export function updateMaintenanceConfig(
  updates: Partial<MaintenanceConfig>,
  updatedBy: string = 'admin@nexora.ai'
): MaintenanceInfo {
  inMemoryConfig = {
    ...inMemoryConfig,
    ...updates,
    lastUpdated: new Date().toISOString(),
    updatedBy,
  };
  persist();
  return getMaintenanceInfo();
}

export function toggleMaintenance(enabled?: boolean, updatedBy: string = 'admin@nexora.ai'): MaintenanceInfo {
  const nextEnabled = typeof enabled === 'boolean' ? enabled : !inMemoryConfig.enabled;
  return updateMaintenanceConfig({ enabled: nextEnabled }, updatedBy);
}
