import React from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { UserTab } from './UserSidebar';
import { FileCheck2, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight, FolderKanban, FileText, Download, ExternalLink } from 'lucide-react';
import { ApplicationStatus } from '../../types';

interface MyApplicationsViewProps {
  onNavigate: (tab: UserTab) => void;
}

export const MyApplicationsView: React.FC<MyApplicationsViewProps> = ({ onNavigate }) => {
  const { currentUser, applications } = useApp();

  if (!currentUser) return null;

  const myApplications = applications.filter((a) => a.userId === currentUser.id);

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="green">Approved</Badge>;
      case 'Under Review':
        return <Badge variant="amber">Under Review</Badge>;
      case 'Waitlisted':
        return <Badge variant="purple">Waitlisted</Badge>;
      case 'Rejected':
        return <Badge variant="red">Rejected</Badge>;
      case 'Applied':
      default:
        return <Badge variant="blue">Applied</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Applications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your application statuses, review timelines, and qualification notes.
          </p>
        </div>
        <button
          onClick={() => onNavigate('browse-projects')}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          Explore More Open Projects <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {myApplications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
          <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No applications submitted yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Browse our open projects and submit your application to start contributing.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('browse-projects')}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Browse Projects
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Language(s)</th>
                  <th className="px-4 py-3">Applied Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Feedback / Notes</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {myApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 max-w-[220px]">
                      <div className="truncate">{app.projectName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-normal">
                          ID: {app.id}
                        </span>
                        {(app.cvLink || app.resumeUrl) && (
                          <a
                            href={app.cvLink || app.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200 transition-colors"
                            title="Open submitted CV Link"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            CV Link
                          </a>
                        )}
                        {app.resumeFile && (
                          <a
                            href={app.resumeFile.dataUrl}
                            download={app.resumeFile.name}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200 transition-colors"
                            title={`Download ${app.resumeFile.name}`}
                          >
                            <FileText className="w-2.5 h-2.5" />
                            CV
                            <Download className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {app.projectCategory}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {app.languages.join(', ')}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{app.appliedDate}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(app.status)}</td>
                    <td className="px-4 py-3.5 max-w-[200px] text-slate-500 text-[11px]">
                      {app.notes ? (
                        <span className="text-slate-700 italic">"{app.notes}"</span>
                      ) : (
                        <span className="text-slate-400">Application pending queue</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {app.status === 'Approved' ? (
                        <button
                          type="button"
                          onClick={() => onNavigate('active-projects')}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors inline-flex items-center gap-1"
                        >
                          <FolderKanban className="w-3 h-3" />
                          View Active
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">In queue</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
