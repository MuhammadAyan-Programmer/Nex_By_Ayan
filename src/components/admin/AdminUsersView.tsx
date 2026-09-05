import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
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
} from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const { users, toggleUserStatus, toggleEmailVerification } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.country.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of registered global workforce contributors and platform administrators.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
          {users.length} registered accounts
        </div>
      </div>

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
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(u.id)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                          u.status === 'active'
                            ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
