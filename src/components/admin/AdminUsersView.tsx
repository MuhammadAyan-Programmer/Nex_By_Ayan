import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { UserProfile } from '../../types';
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Globe,
  Award,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Trash2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Eye,
  Calendar,
  Hash,
  Copy,
  ExternalLink,
  Flame,
  Check,
  Phone,
  FileText,
} from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const {
    users,
    toggleUserStatus,
    toggleEmailVerification,
    deleteUser,
    purgeTempUsers,
    refreshLiveServerData,
    isSyncing,
    lastSyncedAt,
    syncError,
    firebaseConnected,
    firebaseProjectId,
  } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [purgeSuccess, setPurgeSuccess] = useState(false);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  const totalUsers = users.length;
  const verifiedUsers = users.filter((u) => u.isEmailVerified).length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const contributorCount = users.filter((u) => u.role === 'contributor').length;

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.country.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const hasTempUsers = users.some(
    (u) =>
      u.id === 'usr-demo-01' ||
      u.email.toLowerCase() === 'contributor@nexora.work' ||
      u.email.toLowerCase().includes('demo')
  );

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid).catch(() => {});
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete.id);
    setUserToDelete(null);
  };

  const handlePurgeTemp = () => {
    purgeTempUsers();
    setPurgeSuccess(true);
    setTimeout(() => setPurgeSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">User Management</h1>
            {firebaseConnected ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                Firebase Firestore Live
              </span>
            ) : null}

            {isSyncing ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-spin" />
                Syncing Firebase & Server...
              </span>
            ) : syncError ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Local Storage Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Real-Time Synced
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered contributors & admins in Firebase ({firebaseProjectId || 'Firestore'}). Real-time updates on new registrations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasTempUsers && (
            <button
              type="button"
              onClick={handlePurgeTemp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purge Demo Users
            </button>
          )}

          <button
            type="button"
            onClick={() => refreshLiveServerData()}
            disabled={isSyncing}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Refresh user list from Firebase database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-purple-600' : 'text-slate-500'}`} />
            {isSyncing ? 'Syncing...' : 'Sync with Firebase'}
          </button>
        </div>
      </div>

      {syncError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-amber-800 text-sm shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Live sync notice</p>
              <p className="text-xs text-amber-700 mt-0.5">Showing verified local records. Auto-reconnecting to Firestore in background.</p>
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

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Registered</span>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5">{totalUsers}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-purple-600">Contributors</span>
          <div className="text-xl font-extrabold text-purple-700 mt-0.5">{contributorCount}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Active Accounts</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-0.5">{activeUsers}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-blue-600">Email Verified</span>
          <div className="text-xl font-extrabold text-blue-600 mt-0.5">{verifiedUsers}</div>
        </div>
      </div>

      {purgeSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          All temporary demo users have been purged from the database.
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by UID, name, email, country..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Roles ({totalUsers})</option>
            <option value="contributor">Contributor Only ({contributorCount})</option>
            <option value="admin">Admin Only ({totalUsers - contributorCount})</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">UID</th>
                <th className="px-4 py-3">User & Email</th>
                <th className="px-3 py-3">Registration Date</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Country & Languages</th>
                <th className="px-3 py-3">Email Verified</th>
                <th className="px-3 py-3">Account Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No registered users found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      New registrations through the register page will automatically appear here via Firebase Firestore.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* UID */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-medium">
                          {u.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyUid(u.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Copy UID"
                        >
                          {copiedUid === u.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* User & Email */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[11px] shrink-0 border border-purple-200">
                          {u.avatar || (u.firstName[0] + (u.lastName?.[0] || '')).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5 text-slate-400" />
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Registration Date */}
                    <td className="px-3 py-3.5 whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{u.createdAt || 'Recent'}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <Badge variant={u.role === 'admin' ? 'purple' : 'blue'}>
                        {u.role === 'admin' ? 'Administrator' : 'Contributor'}
                      </Badge>
                    </td>

                    {/* Country & Languages */}
                    <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">
                      <div className="text-[11px] font-medium text-slate-800">{u.country || 'Not specified'}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                        {u.languages && u.languages.length > 0 ? u.languages.join(', ') : 'English'}
                      </div>
                    </td>

                    {/* Email Verified Toggle */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleEmailVerification(u.id)}
                        className="inline-flex items-center gap-1 text-[11px] transition-transform active:scale-95"
                        title="Click to toggle email verification status"
                      >
                        {u.isEmailVerified ? (
                          <span className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 font-medium flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-amber-600" /> Unverified
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Account Status */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <Badge variant={u.status === 'active' ? 'green' : 'red'}>
                        ● {u.status === 'active' ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* View Full Info */}
                        <button
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded transition-colors flex items-center gap-1"
                          title="View complete user details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </button>

                        {u.role !== 'admin' && (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleUserStatus(u.id)}
                              className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                                u.status === 'active'
                                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete User Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm border border-purple-200">
                  {selectedUser.avatar || (selectedUser.firstName[0] + (selectedUser.lastName?.[0] || '')).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Firebase UID</span>
                <div className="font-mono font-semibold text-slate-900 mt-1 flex items-center justify-between">
                  <span>{selectedUser.id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyUid(selectedUser.id)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title="Copy UID"
                  >
                    {copiedUid === selectedUser.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Registration Date</span>
                <div className="font-semibold text-slate-900 mt-1">{selectedUser.createdAt || 'Recent'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Account Status</span>
                <div className="mt-1">
                  <Badge variant={selectedUser.status === 'active' ? 'green' : 'red'}>
                    ● {selectedUser.status === 'active' ? 'Active' : 'Suspended'}
                  </Badge>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Email Verification</span>
                <div className="mt-1">
                  <Badge variant={selectedUser.isEmailVerified ? 'green' : 'amber'}>
                    {selectedUser.isEmailVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Country</span>
                <div className="font-semibold text-slate-900 mt-1">{selectedUser.country || 'Not specified'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Phone Number</span>
                <div className="font-semibold text-slate-900 mt-1">{selectedUser.phone || 'Not provided'}</div>
              </div>
            </div>

            {/* Languages & Proficiency */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-700">Languages & Proficiency:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedUser.languages && selectedUser.languages.length > 0 ? (
                  selectedUser.languages.map((lang) => {
                    const prof = selectedUser.languageProficiency?.[lang] || 'Proficient';
                    return (
                      <span
                        key={lang}
                        className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium"
                      >
                        {lang} <span className="text-[10px] text-purple-500">({prof})</span>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-slate-400 italic">No languages specified</span>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-700">Skills:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedUser.skills && selectedUser.skills.length > 0 ? (
                  selectedUser.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px]"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic">No skills specified</span>
                )}
              </div>
            </div>

            {/* CV / Resume Link */}
            {selectedUser.cvLink && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-700">Shareable CV / Resume Link</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-blue-900 truncate">{selectedUser.cvLink}</span>
                  <a
                    href={selectedUser.cvLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shrink-0"
                  >
                    Open CV <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleEmailVerification(selectedUser.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Toggle Verification
                </button>
                {selectedUser.role !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => toggleUserStatus(selectedUser.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                  >
                    {selectedUser.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Delete Contributor Account?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to permanently delete{' '}
                <span className="font-semibold text-slate-900">
                  {userToDelete.firstName} {userToDelete.lastName}
                </span>{' '}
                ({userToDelete.email})?
              </p>
              <p className="text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100 mt-2.5 leading-relaxed">
                This will permanently delete their account credentials from Firebase and remove any associated applications or records.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

