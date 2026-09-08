import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Application, ApplicationStatus } from '../../types';
import { Badge } from '../common/Badge';
import {
  FileCheck2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Globe,
  FileText,
  CheckSquare,
  Square,
  AlertCircle,
  X,
  Send,
  Download,
  RefreshCw,
} from 'lucide-react';

export const AdminApplicationsView: React.FC = () => {
  const {
    applications,
    projects,
    updateApplicationStatus,
    bulkApproveApplications,
    refreshLiveServerData,
    isSyncing,
    lastSyncedAt,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

  // Detailed Review Modal
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const totalCount = applications.length;
  const pendingCount = applications.filter((a) => a.status === 'Applied' || a.status === 'Under Review').length;
  const approvedCount = applications.filter((a) => a.status === 'Approved').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;

  const filteredApps = applications.filter((app) => {
    const matchSearch =
      app.userName.toLowerCase().includes(search.toLowerCase()) ||
      app.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      app.projectName.toLowerCase().includes(search.toLowerCase());
    const matchProj = selectedProjectId === 'ALL' || app.projectId === selectedProjectId;
    const matchStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchSearch && matchProj && matchStatus;
  });

  const toggleSelectAll = () => {
    if (selectedAppIds.length === filteredApps.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(filteredApps.map((a) => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = () => {
    if (selectedAppIds.length === 0) return;
    bulkApproveApplications(selectedAppIds);
    setSelectedAppIds([]);
  };

  const openReviewModal = (app: Application) => {
    setActiveApp(app);
    setReviewNotes(app.notes || '');
  };

  const handleStatusChange = (status: ApplicationStatus) => {
    if (!activeApp) return;
    updateApplicationStatus(activeApp.id, status, reviewNotes);
    setActiveApp(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Application Management</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Server Synced
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review contributor qualification dossiers, language proficiencies, and adjudicate project seats. Auto-refreshing in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedAppIds.length > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
                {selectedAppIds.length} selected
              </span>
              <button
                type="button"
                onClick={handleBulkApprove}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Bulk Approve Selected
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => refreshLiveServerData()}
            disabled={isSyncing}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Force refresh applications from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-purple-600' : 'text-slate-500'}`} />
            {isSyncing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Applications</span>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5">{totalCount}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-500">Pending Review</span>
          <div className="text-xl font-extrabold text-amber-600 mt-0.5">{pendingCount}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Approved Seats</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-0.5">{approvedCount}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-rose-500">Rejected</span>
          <div className="text-xl font-extrabold text-rose-600 mt-0.5">{rejectedCount}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contributor, email, project..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Application Statuses</option>
            <option value="Applied">Applied (New)</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Waitlisted">Waitlisted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-8 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-700">
                    {selectedAppIds.length === filteredApps.length && filteredApps.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Project Name</th>
                <th className="px-4 py-3">Languages</th>
                <th className="px-4 py-3">Applied Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                        <FileCheck2 className="w-6 h-6" />
                      </div>
                      {applications.length === 0 ? (
                        <>
                          <h4 className="font-bold text-slate-800 text-sm mb-1">No Applications Yet</h4>
                          <p className="text-xs text-slate-500 mb-4">
                            When users from your community apply for projects, their applications will show up here automatically via real-time synchronization.
                          </p>
                          <button
                            type="button"
                            onClick={() => refreshLiveServerData()}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync from Server
                          </button>
                        </>
                      ) : (
                        <>
                          <h4 className="font-bold text-slate-800 text-sm mb-1">No Applications Matching Filters</h4>
                          <p className="text-xs text-slate-500 mb-4">
                            Try adjusting your search query, project filter, or status filter.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSearch('');
                              setSelectedProjectId('ALL');
                              setStatusFilter('ALL');
                            }}
                            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            Reset Filters
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const isChecked = selectedAppIds.includes(app.id);
                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isChecked ? 'bg-purple-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => toggleSelectOne(app.id)}
                          className="text-slate-400 hover:text-purple-600"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{app.userName}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span>{app.userEmail}</span>
                          <span>•</span>
                          <span className="text-slate-600 font-medium">{app.country || 'Global'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <div className="font-medium text-slate-800 truncate">{app.projectName}</div>
                        <span className="text-[10px] text-slate-400">{app.projectCategory}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {app.languages.join(', ')}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                        {app.appliedDate}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge
                          variant={
                            app.status === 'Approved'
                              ? 'green'
                              : app.status === 'Under Review'
                              ? 'amber'
                              : app.status === 'Waitlisted'
                              ? 'purple'
                              : app.status === 'Rejected'
                              ? 'red'
                              : 'blue'
                          }
                        >
                          {app.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openReviewModal(app)}
                            className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition-colors"
                          >
                            Review & Decide
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Applicant Dossier Modal */}
      {activeApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
          <div className="relative w-full max-w-2xl my-6 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Review Application: {activeApp.userName}
                </h3>
                <p className="text-xs text-slate-500">
                  Project: <span className="font-semibold">{activeApp.projectName}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Applicant Card */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Email</span>
                    <span className="font-semibold text-slate-800">{activeApp.userEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Country</span>
                    <span className="font-semibold text-slate-800">{activeApp.country || 'Global'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Applied Date</span>
                    <span className="font-semibold text-slate-800">{activeApp.appliedDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Languages</span>
                    <span className="font-semibold text-slate-800">
                      {activeApp.languages.join(', ')} ({activeApp.languageProficiency})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Current Status</span>
                    <Badge variant="purple">{activeApp.status}</Badge>
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div>
                <h4 className="font-bold text-slate-700 mb-1">Stated Experience & History</h4>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-600 leading-relaxed">
                  {activeApp.experience || 'No detailed background provided.'}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="font-bold text-slate-700 mb-1">Declared Competencies</h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeApp.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Uploaded CV / Resume File */}
              {activeApp.resumeFile && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Uploaded CV / Resume Document</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      {(activeApp.resumeFile.size / 1024).toFixed(1)} KB
                    </span>
                  </h4>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {activeApp.resumeFile.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate max-w-xs">
                          {activeApp.resumeFile.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Uploaded on {activeApp.resumeFile.uploadedAt}
                        </p>
                      </div>
                    </div>
                    {activeApp.resumeFile.dataUrl && (
                      <a
                        href={activeApp.resumeFile.dataUrl}
                        download={activeApp.resumeFile.name}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1 shrink-0 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download CV
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Resume / CV text info */}
              {activeApp.resumeText && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">Resume / CV Notes</h4>
                  <pre className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-sans text-slate-600 whitespace-pre-wrap leading-relaxed text-xs">
                    {activeApp.resumeText}
                  </pre>
                </div>
              )}

              {/* Additional notes */}
              {activeApp.additionalInfo && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">Additional Candidate Notes</h4>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-600">
                    {activeApp.additionalInfo}
                  </div>
                </div>
              )}

              {/* Feedback / Admin Notes Input */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700 mb-1">
                  Administrator Review Notes / Feedback
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared test rubric with 94% score. Welcome aboard!"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Decision Actions matching Section 26 */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange('Waitlisted')}
                    className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200"
                  >
                    Waitlist
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('Rejected')}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200"
                  >
                    Reject
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange('Under Review')}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200"
                  >
                    Mark Under Review
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('Approved')}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Contributor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
