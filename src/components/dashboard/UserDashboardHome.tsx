import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserTab } from './UserSidebar';
import { Project } from '../../types';
import {
  FolderKanban,
  FileCheck2,
  Wallet,
  Compass,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface UserDashboardHomeProps {
  onNavigate: (tab: UserTab) => void;
  onViewProject: (project: Project) => void;
}

export const UserDashboardHome: React.FC<UserDashboardHomeProps> = ({
  onNavigate,
  onViewProject,
}) => {
  const { currentUser, projects, applications, projectUpdates, userBalance } = useApp();

  if (!currentUser) return null;

  const myApprovedApps = applications.filter(
    (a) => a.userId === currentUser.id && a.status === 'Approved'
  );
  const activeProjects = projects.filter((p) =>
    myApprovedApps.some((app) => app.projectId === p.id)
  );

  const pendingApps = applications.filter(
    (a) =>
      a.userId === currentUser.id &&
      (a.status === 'Applied' || a.status === 'Under Review' || a.status === 'Waitlisted')
  );

  return (
    <div className="space-y-6">
      {/* Welcome & Top Metric Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Welcome back, {currentUser.firstName}!
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Contributor Workspace • {currentUser.email} • {currentUser.country}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('browse-projects')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            Browse New Projects
          </button>
        </div>
      </div>

      {/* 4 Stat Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('active-projects')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Active Projects</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activeProjects.length}</p>
          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> Approved & Working
          </span>
        </div>

        <div
          onClick={() => onNavigate('my-applications')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{pendingApps.length}</p>
          <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-1">
            <FileCheck2 className="w-3 h-3" /> Applications tracked
          </span>
        </div>

        <div
          onClick={() => onNavigate('earnings')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Available Balance</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-600">
            ${userBalance.availableBalance.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Ready for manual withdrawal
          </span>
        </div>

        <div
          onClick={() => onNavigate('earnings')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Lifetime Earned</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${userBalance.totalEarnings.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Across approved milestones
          </span>
        </div>
      </div>

      {/* Main Row: Active Projects & Recent Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Projects Working Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-600" />
              My Approved & Active Projects
            </h2>
            <button
              onClick={() => onNavigate('active-projects')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeProjects.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
              <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No active projects yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Explore open opportunities and submit your application to start working on AI and
                localization tasks.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('browse-projects')}
                className="mt-4 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Browse Available Projects
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeProjects.slice(0, 3).map((project) => (
                <div
                  key={project.id}
                  className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="blue" size="sm">
                        {project.category}
                      </Badge>
                      <Badge variant="green" size="sm">
                        Active Project
                      </Badge>
                    </div>
                    <h3
                      onClick={() => onViewProject(project)}
                      className="font-bold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer"
                    >
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{project.instructions}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={project.communityLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200/60 transition-colors flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Community
                    </a>
                    <button
                      type="button"
                      onClick={() => onViewProject(project)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
                    >
                      Guidelines
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending Applications tracker strip */}
          {pendingApps.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-amber-600" />
                Applications Under Review ({pendingApps.length})
              </h3>
              <div className="space-y-2">
                {pendingApps.slice(0, 2).map((app) => (
                  <div
                    key={app.id}
                    className="p-2.5 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{app.projectName}</span>
                      <p className="text-[11px] text-slate-400">
                        Applied on {app.appliedDate} • {app.projectCategory}
                      </p>
                    </div>
                    <Badge variant={app.status === 'Under Review' ? 'amber' : 'purple'} size="sm">
                      {app.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Latest Project Updates & Announcements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Project Updates
            </h2>
            <button
              onClick={() => onNavigate('notifications')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {projectUpdates.slice(0, 3).map((upd) => (
              <div
                key={upd.id}
                className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-indigo-600 truncate max-w-[180px]">
                    {upd.projectName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(upd.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">{upd.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{upd.message}</p>
                {upd.communityLink && (
                  <a
                    href={upd.communityLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 pt-1"
                  >
                    Open Community Channel <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
