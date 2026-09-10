import React from 'react';
import { useApp } from '../../context/AppContext';
import { Project } from '../../types';
import { Badge } from '../common/Badge';
import {
  FolderKanban,
  MessageSquare,
  FileText,
  ExternalLink,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Clock,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { UserTab } from './UserSidebar';
import { getProjectDisplayRate, getPaymentTypeBadgeInfo } from '../../utils/paymentUtils';
import { JobCountryBadge } from '../common/JobCountryBadge';

interface ActiveProjectsViewProps {
  onViewProject: (project: Project) => void;
  onNavigate: (tab: UserTab) => void;
}

export const ActiveProjectsView: React.FC<ActiveProjectsViewProps> = ({
  onViewProject,
  onNavigate,
}) => {
  const { currentUser, applications, projects, projectUpdates } = useApp();

  if (!currentUser) return null;

  const myApprovedApps = applications.filter(
    (a) => a.userId === currentUser.id && a.status === 'Approved'
  );

  const activeProjects = projects.filter((p) =>
    myApprovedApps.some((app) => app.projectId === p.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Active Projects</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your approved projects and tasks, operational guidelines, announcements, and team communication
            links.
          </p>
        </div>
        <button
          onClick={() => onNavigate('browse-projects')}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          Apply for more projects <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {activeProjects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
          <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No active projects or tasks</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Once an administrator approves your project application, your workspace guidelines and
            community channels will be unlocked here.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('browse-projects')}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Explore Projects
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {activeProjects.map((project) => {
            const updatesForProj = projectUpdates.filter((u) => u.projectId === project.id);

            return (
              <div
                key={project.id}
                id={`active-proj-${project.id}`}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-5"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <Badge variant="blue">{project.category}</Badge>
                      <JobCountryBadge country={project.country} size="xs" />
                      {project.status === 'Completed' ? (
                        <Badge variant="purple">● Completed</Badge>
                      ) : project.status === 'Closed' ? (
                        <Badge variant="red">● Closed</Badge>
                      ) : (
                        <Badge variant="green">● Active / In Progress</Badge>
                      )}
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 text-xs">
                        <DollarSign className="w-3 h-3 text-emerald-600" />
                        {getProjectDisplayRate(project)}
                      </span>
                      {project.paymentType && (
                        <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                          {project.paymentType}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 ml-auto sm:ml-0">
                        Starts: {project.startDate} • Ends: {project.endDate}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900">{project.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{project.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={project.communityLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200/60 transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Community Channel <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onViewProject(project)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Full Details
                    </button>
                  </div>
                </div>

                {/* Completed status announcement banner */}
                {project.status === 'Completed' && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200/80 text-xs text-purple-950 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Project Completed: </span>
                      This project has been marked as Completed by administrator. Tasks and deliverables have concluded. Project records and instructions remain accessible here for your reference.
                    </div>
                  </div>
                )}

                {/* Instructions Box */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                  <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Project Operational Instructions
                  </h4>
                  <p className="text-slate-600 leading-relaxed">{project.instructions}</p>
                </div>

                {/* Project Announcement banner if exists */}
                {project.announcement && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Latest Administrator Announcement: </span>
                      {project.announcement}
                    </div>
                  </div>
                )}

                {/* Project Updates history for this specific project */}
                {updatesForProj.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Recent Project Updates ({updatesForProj.length})
                    </h4>
                    <div className="space-y-2">
                      {updatesForProj.map((upd) => (
                        <div
                          key={upd.id}
                          className="p-3 bg-indigo-50/40 rounded-lg border border-indigo-100 text-xs text-slate-700"
                        >
                          <div className="flex items-center justify-between font-bold text-indigo-950 mb-1">
                            <span>{upd.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {new Date(upd.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-normal mb-1">{upd.message}</p>
                          {upd.instructions && (
                            <p className="text-[11px] text-indigo-800 bg-white/80 p-2 rounded border border-indigo-100 font-mono">
                              Instructions: {upd.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
