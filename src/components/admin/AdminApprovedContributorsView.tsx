import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Search, UserCheck, Trash2, Mail, Globe, Calendar, DollarSign, Plus } from 'lucide-react';

interface AdminApprovedContributorsViewProps {
  initialProjectId?: string;
  onCreditPaymentForUser?: (userId: string, projectId: string) => void;
}

export const AdminApprovedContributorsView: React.FC<AdminApprovedContributorsViewProps> = ({
  initialProjectId,
  onCreditPaymentForUser,
}) => {
  const { applications, projects, updateApplicationStatus } = useApp();

  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || 'ALL');

  const approvedApps = applications.filter((a) => a.status === 'Approved');

  const filteredContributors = approvedApps.filter((app) => {
    const matchSearch =
      app.userName.toLowerCase().includes(search.toLowerCase()) ||
      app.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      app.projectName.toLowerCase().includes(search.toLowerCase());
    const matchProj = selectedProjectId === 'ALL' || app.projectId === selectedProjectId;
    return matchSearch && matchProj;
  });

  const handleRevoke = (appId: string, userName: string, projName: string) => {
    if (
      window.confirm(
        `Are you sure you want to revoke ${userName}'s seat on "${projName}"? This will return the seat to remaining capacity.`
      )
    ) {
      updateApplicationStatus(appId, 'Rejected', 'Project seat allocation revoked by administrator.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Approved Project Contributors</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active contributors with unlocked project workspaces, community access, and milestone
            eligibility.
          </p>
        </div>
        <div className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
          Total Active Seats: {approvedApps.length}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search active contributor, project..."
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
                {p.name} ({p.approvedContributors} active)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Contributor</th>
                <th className="px-4 py-3">Active Project</th>
                <th className="px-4 py-3">Languages</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Approved Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContributors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No approved contributors found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredContributors.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {app.userName}
                      </div>
                      <div className="text-[10px] text-slate-400">{app.userEmail}</div>
                    </td>
                    <td className="px-4 py-3.5 max-w-[220px]">
                      <div className="font-medium text-slate-800 truncate">{app.projectName}</div>
                      <span className="text-[10px] text-slate-400">{app.projectCategory}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {app.languages.join(', ')}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge variant="green">● Active Contributor</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                      {app.reviewedDate || app.appliedDate}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {onCreditPaymentForUser && (
                          <button
                            type="button"
                            onClick={() => onCreditPaymentForUser(app.userId, app.projectId)}
                            className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 flex items-center gap-1"
                            title="Credit milestone payment to this contributor"
                          >
                            <DollarSign className="w-3 h-3" />
                            Credit Earning
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRevoke(app.id, app.userName, app.projectName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Revoke Contributor Seat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
