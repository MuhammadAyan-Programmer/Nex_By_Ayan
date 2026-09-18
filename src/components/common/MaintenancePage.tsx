import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LogoIcon } from './Logo';
import {
  Wrench,
  Clock,
  ShieldCheck,
  Calendar,
  RefreshCw,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogIn,
} from 'lucide-react';

interface MaintenancePageProps {
  onAdminLoginRequested?: () => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ onAdminLoginRequested }) => {
  const { maintenanceState, refreshMaintenance, login, currentUser, logout } = useApp();
  const { config, timeRemainingMs } = maintenanceState;

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('admin@nexora.ai');
  const [adminPassword, setAdminPassword] = useState('Admin@123456');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Format remaining time nicely
  const formatCountdown = (ms: number) => {
    if (ms <= 0) return { hours: '00', minutes: '00', seconds: '00' };
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    };
  };

  const countdown = formatCountdown(timeRemainingMs);

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'Not specified';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshMaintenance();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const result = await login(adminEmail.trim(), adminPassword);
      if (result.success) {
        if (result.user?.role !== 'admin') {
          logout();
          setLoginError('Access restricted: Contributor accounts are paused while maintenance is in effect. Only System Administrators may access the platform.');
          return;
        }
        setIsAdminModalOpen(false);
      } else {
        setLoginError(result.message || 'Invalid administrator credentials.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Failed to authenticate administrator.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      {/* Top Header */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon size={34} variant="purple" />
            <div>
              <span className="text-base font-bold text-white tracking-tight leading-tight block">
                Nexora Workforce
              </span>
              <span className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase block">
                Platform Operations
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-maintenance-refresh"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
              Check Status
            </button>

            {currentUser?.role === 'admin' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-300 font-medium hidden sm:inline">
                  Admin Active ({currentUser.email})
                </span>
                <button
                  type="button"
                  id="btn-maintenance-admin-exit"
                  onClick={() => logout()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="btn-maintenance-admin-login-trigger"
                onClick={() => {
                  if (onAdminLoginRequested) {
                    onAdminLoginRequested();
                  } else {
                    setIsAdminModalOpen(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 transition-colors cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                Admin Access
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-3xl space-y-6">
          {/* Status Badge */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-800/60 text-purple-300 text-xs font-semibold uppercase tracking-wider shadow-inner">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              Scheduled System Maintenance
            </div>

            {/* Main Icon */}
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-radial from-purple-900/60 to-slate-900 border border-purple-500/30 shadow-2xl mx-auto">
              <Wrench className="w-10 h-10 text-purple-400 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-purple-500/40 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-purple-300" />
              </div>
            </div>

            {/* Headline & Notice */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              {config.title || 'System Under Maintenance'}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              {config.message ||
                'Nexora Workforce is currently undergoing scheduled platform upgrades and infrastructure optimization. Project applications, task evaluations, and contributor portals will resume immediately once maintenance concludes.'}
            </p>
          </div>

          {/* Countdown Clock (if end time is set) */}
          {config.endDateTime && (
            <div className="bg-slate-900/90 border border-purple-900/40 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-xs text-center space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                Estimated Time Remaining
              </span>
              <div className="flex items-center justify-center gap-3 sm:gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-16 sm:w-20 py-3 rounded-xl bg-slate-950 border border-slate-800 text-2xl sm:text-3xl font-mono font-bold text-white shadow-inner">
                    {countdown.hours}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 font-medium uppercase tracking-wider">
                    Hours
                  </span>
                </div>
                <span className="text-2xl font-bold text-purple-500/60 pb-5">:</span>
                <div className="flex flex-col items-center">
                  <div className="w-16 sm:w-20 py-3 rounded-xl bg-slate-950 border border-slate-800 text-2xl sm:text-3xl font-mono font-bold text-white shadow-inner">
                    {countdown.minutes}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 font-medium uppercase tracking-wider">
                    Minutes
                  </span>
                </div>
                <span className="text-2xl font-bold text-purple-500/60 pb-5">:</span>
                <div className="flex flex-col items-center">
                  <div className="w-16 sm:w-20 py-3 rounded-xl bg-slate-950 border border-slate-800 text-2xl sm:text-3xl font-mono font-bold text-purple-400 shadow-inner">
                    {countdown.seconds}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 font-medium uppercase tracking-wider">
                    Seconds
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Windows & Reassurance Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Window Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4.5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Calendar className="w-4 h-4 text-purple-400" />
                Maintenance Window
              </div>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Start Time</span>
                  <span className="font-semibold text-slate-200">
                    {formatDateTime(config.startDateTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">End Time</span>
                  <span className="font-semibold text-slate-200">
                    {formatDateTime(config.endDateTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Data Protection Guarantee */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4.5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Data & Progress Safe
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                All submitted project applications, earnings, payment balances, and contributor ratings remain 100% encrypted and intact. No tasks or submissions will be lost.
              </p>
            </div>
          </div>

          {/* Live sync footnote */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              This page monitors platform health automatically and will refresh as soon as maintenance completes.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/60 px-6 py-4 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Nexora Workforce. All rights reserved.</span>
          <button
            type="button"
            id="link-admin-panel-footer"
            onClick={() => setIsAdminModalOpen(true)}
            className="text-slate-400 hover:text-purple-400 transition-colors cursor-pointer text-xs"
          >
            Authorized Administrator Portal
          </button>
        </div>
      </footer>

      {/* Admin Quick Login Modal */}
      {isAdminModalOpen && (
        <div
          id="modal-admin-login-overlay"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-100 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800/60 flex items-center justify-center text-purple-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">Admin Sign In</h3>
                  <span className="text-xs text-slate-400">Access Admin Panel during maintenance</span>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-admin-modal"
                onClick={() => setIsAdminModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl leading-none p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-red-950/70 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Administrator Email
                </label>
                <input
                  type="email"
                  id="input-admin-login-email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  placeholder="admin@nexora.ai"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-hidden focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  id="input-admin-login-password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-hidden focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  id="btn-submit-admin-login"
                  disabled={loginLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {loginLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {loginLoading ? 'Authenticating...' : 'Sign In to Admin Panel'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail('admin@nexora.ai');
                    setAdminPassword('Admin@123456');
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 underline py-1"
                >
                  Use Canonical Admin Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
