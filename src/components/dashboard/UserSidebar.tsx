import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Compass,
  FileCheck2,
  FolderKanban,
  Wallet,
  CreditCard,
  User,
  Bell,
  LogOut,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { LogoIcon } from '../common/Logo';

export type UserTab =
  | 'dashboard'
  | 'browse-projects'
  | 'my-applications'
  | 'active-projects'
  | 'earnings'
  | 'payment-methods'
  | 'profile'
  | 'notifications';

interface UserSidebarProps {
  activeTab: UserTab;
  setActiveTab: (tab: UserTab) => void;
  onOpenEmailVerifyModal?: () => void;
}

export const UserSidebar: React.FC<UserSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenEmailVerifyModal,
}) => {
  const { currentUser, logout, notifications, applications } = useApp();

  if (!currentUser) return null;

  const unreadNotifs = notifications.filter((n) => n.userId === currentUser.id && !n.read).length;
  const activeProjectsCount = applications.filter(
    (a) => a.userId === currentUser.id && a.status === 'Approved'
  ).length;
  const pendingAppsCount = applications.filter(
    (a) =>
      a.userId === currentUser.id &&
      (a.status === 'Applied' || a.status === 'Under Review' || a.status === 'Waitlisted')
  ).length;

  const navItems: { id: UserTab; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'browse-projects', label: 'Browse Projects', icon: Compass },
    {
      id: 'my-applications',
      label: 'My Applications',
      icon: FileCheck2,
      badge: pendingAppsCount > 0 ? pendingAppsCount : undefined,
    },
    {
      id: 'active-projects',
      label: 'Active Projects',
      icon: FolderKanban,
      badge: activeProjectsCount > 0 ? activeProjectsCount : undefined,
    },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
    { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
    { id: 'profile', label: 'My Profile', icon: User },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifs > 0 ? unreadNotifs : undefined,
    },
  ];

  return (
    <aside
      id="user-sidebar"
      className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-slate-800"
    >
      {/* Brand & Identity */}
      <div className="flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoIcon size={32} />
            <div>
              <h1 className="font-bold text-white text-base tracking-tight leading-tight">
                Nexora Workforce
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400">
                Contributor Panel
              </span>
            </div>
          </div>
        </div>

        {/* Email verification reminder banner if not verified */}
        {!currentUser.isEmailVerified && (
          <div className="mx-3 my-2 p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-lg text-xs text-amber-200 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Email Unverified
            </div>
            <p className="text-[11px] text-amber-200/80 leading-tight">
              Please verify your email to unlock all project submissions.
            </p>
            {onOpenEmailVerifyModal && (
              <button
                type="button"
                onClick={onOpenEmailVerifyModal}
                className="mt-1 py-1 px-2 text-[11px] font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded transition-colors text-center"
              >
                Verify Email Now
              </button>
            )}
          </div>
        )}

        {/* Main Navigation Menu - strictly in LEFT SIDEBAR */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.id === 'notifications'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <div className="p-2.5 bg-slate-800/60 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
              {currentUser.avatar || currentUser.firstName[0]}
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser.firstName} {currentUser.lastName}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
