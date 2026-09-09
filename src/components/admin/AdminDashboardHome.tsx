import React from 'react';
import { useApp } from '../../context/AppContext';
import { AdminTab } from './AdminSidebar';
import {
  Users,
  FolderKanban,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  BellRing,
  Wallet,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface AdminDashboardHomeProps {
  onNavigate: (tab: AdminTab) => void;
  onOpenCreateProject: () => void;
}

export const AdminDashboardHome: React.FC<AdminDashboardHomeProps> = ({
  onNavigate,
  onOpenCreateProject,
}) => {
  const {
    users,
    projects,
    applications,
    withdrawals,
    refreshLiveServerData,
    isSyncing,
    lastSyncedAt,
    syncError,
  } = useApp();

  // Statistics according to Section 31
  const totalUsers = users.length;
  const totalProjects = projects.length;
  const openProjects = projects.filter((p) => p.status === 'Open').length;
  const closedProjects = projects.filter((p) => p.status === 'Closed').length;

  const totalApplications = applications.length;
  const pendingApplications = applications.filter(
    (a) => a.status === 'Applied' || a.status === 'Under Review'
  ).length;
  const approvedContributors = applications.filter((a) => a.status === 'Approved').length;
  const rejectedApplications = applications.filter((a) => a.status === 'Rejected').length;

  const pendingWithdrawalCount = withdrawals.filter(
    (w) => w.status === 'Withdrawal Requested'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Admin Control Center</h1>
            {isSyncing ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-spin" />
                Syncing Database...
              </span>
            ) : syncError ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Local Storage Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Server Synced
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational overview of contributors, global projects, seats capacity, and manual payouts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refreshLiveServerData()}
            disabled={isSyncing}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Refresh statistics and all data from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-purple-600' : 'text-slate-500'}`} />
            {isSyncing ? 'Syncing...' : 'Refresh All'}
          </button>
          <button
            type="button"
            onClick={onOpenCreateProject}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Project
          </button>
        </div>
      </div>

      {/* Database Connection Warning (Only show if there is no data loaded) */}
      {syncError && projects.length === 0 && (
        <div id="admin-sync-error-banner" className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-amber-800 text-sm shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Connecting to live database...</p>
              <p className="text-xs text-amber-700 mt-0.5">Please wait while the server initializes or click retry below.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refreshLiveServerData()}
            disabled={isSyncing}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shrink-0 disabled:opacity-50"
          >
            {isSyncing ? 'Retrying...' : 'Retry Connection'}
          </button>
        </div>
      )}

      {/* 8 Statistics Cards matching Section 31 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigate('users')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Users</span>
            <Users className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
          <span className="text-[10px] text-slate-400">Registered contributors</span>
        </div>

        <div
          onClick={() => onNavigate('projects')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Projects</span>
            <FolderKanban className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalProjects}</p>
          <span className="text-[10px] text-slate-400">Across 18 categories</span>
        </div>

        <div
          onClick={() => onNavigate('projects')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Open Projects</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{openProjects}</p>
          <span className="text-[10px] text-emerald-600">Accepting applications</span>
        </div>

        <div
          onClick={() => onNavigate('projects')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Closed Projects</span>
            <div className="w-2 h-2 rounded-full bg-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-700">{closedProjects}</p>
          <span className="text-[10px] text-slate-400">Capacity reached</span>
        </div>

        <div
          onClick={() => onNavigate('applications')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Applications</span>
            <FileCheck2 className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalApplications}</p>
          <span className="text-[10px] text-slate-400">Submitted to date</span>
        </div>

        <div
          onClick={() => onNavigate('applications')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{pendingApplications}</p>
          <span className="text-[10px] text-amber-600">Requires triage</span>
        </div>

        <div
          onClick={() => onNavigate('approved-contributors')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Approved Seats</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{approvedContributors}</p>
          <span className="text-[10px] text-emerald-600">Active on projects</span>
        </div>

        <div
          onClick={() => onNavigate('applications')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Rejected Apps</span>
            <XCircle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-600">{rejectedApplications}</p>
          <span className="text-[10px] text-slate-400">Not qualified</span>
        </div>
      </div>

      {/* Quick Actions Bar (Section 31) */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3">
          Executive Quick Actions (Section 31)
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenCreateProject}
            className="px-3.5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Project
          </button>
          <button
            type="button"
            onClick={() => onNavigate('applications')}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            Review Applications ({pendingApplications})
          </button>
          <button
            type="button"
            onClick={() => onNavigate('users')}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Manage Users
          </button>
          <button
            type="button"
            onClick={() => onNavigate('project-updates')}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <BellRing className="w-3.5 h-3.5" />
            Send Project Update
          </button>
          <button
            type="button"
            onClick={() => onNavigate('payments')}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Wallet className="w-3.5 h-3.5" />
            Review Withdrawals ({pendingWithdrawalCount})
          </button>
        </div>
      </div>

      {/* Two columns: Pending Applications Queue & Project Capacity Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pending Applications Queue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              Pending Applications Queue
            </h3>
            <button
              onClick={() => onNavigate('applications')}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              Open Full Queue <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {applications.filter((a) => a.status === 'Applied' || a.status === 'Under Review')
              .length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                All applications have been triaged.
              </p>
            ) : (
              applications
                .filter((a) => a.status === 'Applied' || a.status === 'Under Review')
                .slice(0, 4)
                .map((app) => (
                  <div
                    key={app.id}
                    className="p-3 bg-slate-50/80 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{app.userName}</p>
                      <p className="text-[11px] text-slate-500">
                        {app.projectName} • {app.userEmail}
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('applications')}
                      className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded border border-purple-200"
                    >
                      Review
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Right: Project Capacity Tracker */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FolderKanban className="w-4 h-4 text-indigo-600" />
              Project Seat Capacity Health
            </h3>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              All Projects <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {projects.slice(0, 4).map((p) => {
              const pct = Math.min(
                100,
                Math.round((p.approvedContributors / p.requiredContributors) * 100)
              );
              return (
                <div key={p.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                      {p.name}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {p.approvedContributors} / {p.requiredContributors} seats ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 100
                          ? 'bg-rose-500'
                          : pct >= 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
