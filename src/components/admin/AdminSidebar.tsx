import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileCheck2,
  CheckCircle2,
  BellRing,
  Wallet,
  Settings,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { LogoIcon } from '../common/Logo';

export type AdminTab =
  | 'dashboard'
  | 'users'
  | 'projects'
  | 'applications'
  | 'approved-contributors'
  | 'project-updates'
  | 'payments'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  onOpenCreateProject: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateProject,
}) => {
  const { currentUser, logout, applications, withdrawals } = useApp();

  const pendingApps = applications.filter(
    (a) => a.status === 'Applied' || a.status === 'Under Review'
  ).length;

  const pendingWithdrawals = withdrawals.filter(
    (w) => w.status === 'Withdrawal Requested'
  ).length;

  const navItems: { id: AdminTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    {
      id: 'applications',
      label: 'Applications',
      icon: FileCheck2,
      badge: pendingApps > 0 ? pendingApps : undefined,
    },
    { id: 'approved-contributors', label: 'Approved Contributors', icon: UserCheck },
    { id: 'project-updates', label: 'Project Updates', icon: BellRing },
    {
      id: 'payments',
      label: 'Payments & Withdrawals',
      icon: Wallet,
      badge: pendingWithdrawals > 0 ? pendingWithdrawals : undefined,
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      id="admin-sidebar"
      className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-slate-800"
    >
      <div>
        {/* Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoIcon size={32} variant="purple" />
            <div>
              <h1 className="font-bold text-white text-base tracking-tight leading-tight">
                Nexora Workforce
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-400">
                Administration Portal
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action button */}
        <div className="p-3">
          <button
            type="button"
            onClick={onOpenCreateProject}
            className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            + Create New Project
          </button>
        </div>

        {/* Nav list */}
        <nav className="p-3 pt-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-purple-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        <div className="p-2.5 bg-slate-900 rounded-lg flex items-center justify-between">
          <div className="overflow-hidden pr-2">
            <p className="text-xs font-semibold text-white">Administrator</p>
            <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || 'admin'}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
