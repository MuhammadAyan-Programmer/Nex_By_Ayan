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
  } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [purgeSuccess, setPurgeSuccess] = useState(false);

  const totalUsers = users.length;
  const verifiedUsers = users.filter((u) => u.isEmailVerified).length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const contributorCount = users.filter((u) => u.role === 'contributor').length;

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.country.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const hasTempUsers = users.some(
    (u) =>
      u.id === 'usr-demo-01' ||
      u.email.toLowerCase() === 'contributor@nexora.work' ||
      u.email.toLowerCase().includes('demo')
  );

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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">User Management</h1>
            {syncError ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Connection Disconnected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Server Synced
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of registered global workforce contributors and administrators. Auto-refreshing in real time.
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
            title="Refresh user list from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-purple-600' : 'text-slate-500'}`} />
            {isSyncing ? 'Syncing...' : 'Refresh Users'}
          </button>
        </div>
      </div>

      {syncError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-amber-800 text-sm shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Unable to load live data. Please try again.</p>
              <p className="text-xs text-amber-700 mt-0.5">Showing verified local records. Live reconnecting in progress.</p>
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
          <span className="text-[10px] uppercase font-bold text-slate-400">Registered Users</span>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5">{totalUsers}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-purple-600">Contributors</span>
          <div className="text-xl font-extrabold text-purple-700 mt-0.5">{contributorCount}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Active Status</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-0.5">{activeUsers}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-blue-600">Verified Emails</span>
          <div className="text-xl font-extrabold text-blue-600 mt-0.5">{verifiedUsers}</div>
        </div>
      </div>

      {purgeSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          All temporary and test users have been successfully purged from the database.
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
            placeholder="Search contributor by name, email, country..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Roles</option>
            <option value="contributor">Contributor Only</option>
            <option value="admin">Admin Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Languages</th>
                <th className="px-4 py-3">Email Verified</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No registered contributors found. Contributor accounts will appear here as users register.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">
                      {u.firstName} {u.lastName}
                    </div>
                    <div className="text-[10px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <Badge variant={u.role === 'admin' ? 'purple' : 'blue'}>
                      {u.role === 'admin' ? 'Administrator' : 'Contributor'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{u.country}</td>
                  <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                    {u.languages?.join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleEmailVerification(u.id)}
                      className="inline-flex items-center gap-1 text-xs"
                      title="Click to toggle email verification"
                    >
                      {u.isEmailVerified ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                          Unverified (Toggle)
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <Badge variant={u.status === 'active' ? 'green' : 'red'}>
                      ● {u.status === 'active' ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    {u.role !== 'admin' && (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(u.id)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
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
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete User Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

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
                This will permanently delete their account credentials and remove any associated applications or records.
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
