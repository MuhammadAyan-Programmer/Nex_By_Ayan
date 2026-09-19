import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { UserProfile } from '../../types';
import {
  Users,
  Search,
  ShieldCheck,
  Mail,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Calendar,
  Copy,
  ExternalLink,
  Flame,
  Check,
  Phone,
  Clock,
  UserCheck,
  UserX,
} from 'lucide-react';

interface AdminUsersViewProps {
  initialSubTab?: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ initialSubTab = 'ALL' }) => {
  const {
    users,
    approveUser,
    rejectUser,
    setUserApprovalStatus,
    toggleUserStatus,
    deleteUser,
    purgeTempUsers,
    refreshLiveServerData,
    isSyncing,
    syncError,
    firebaseConnected,
    firebaseProjectId,
  } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>(initialSubTab);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'suspended'>('ALL');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [userToReject, setUserToReject] = useState<UserProfile | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [purgeSuccess, setPurgeSuccess] = useState(false);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'reject' | 'info' } | null>(null);

  // Statistics & KPIs
  const totalUsers = users.length;
  const pendingApprovalsCount = users.filter(
    (u) => u.role !== 'admin' && u.approvalStatus === 'pending'
  ).length;
  const approvedUsersCount = users.filter(
    (u) => u.role === 'admin' || u.approvalStatus === 'approved' || !u.approvalStatus
  ).length;
  const rejectedUsersCount = users.filter(
    (u) => u.approvalStatus === 'rejected'
  ).length;
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

    // Approval status mapping (existing users without approvalStatus are treated as approved)
    const currentApproval = u.role === 'admin' ? 'approved' : (u.approvalStatus || 'approved');
    const matchApproval =
      approvalFilter === 'ALL' ||
      (approvalFilter === 'PENDING' && currentApproval === 'pending') ||
      (approvalFilter === 'APPROVED' && currentApproval === 'approved') ||
      (approvalFilter === 'REJECTED' && currentApproval === 'rejected');

    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchSearch && matchRole && matchApproval && matchStatus;
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

  const handleApprove = async (userId: string, userName: string) => {
    await approveUser(userId);
    setFeedback({
      message: `User ${userName} has been approved. They can now log in and access the Contributor Dashboard.`,
      type: 'success',
    });
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => (prev ? { ...prev, approvalStatus: 'approved', approvalDate: new Date().toISOString() } : null));
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleConfirmReject = async () => {
    if (!userToReject) return;
    setRejectLoading(true);
    const reason = rejectionReasonInput.trim() || 'Registration declined by administrator';
    await rejectUser(userToReject.id, reason);
    setRejectLoading(false);
    const rejectedName = `${userToReject.firstName} ${userToReject.lastName}`;
    if (selectedUser?.id === userToReject.id) {
      setSelectedUser((prev) => (prev ? { ...prev, approvalStatus: 'rejected', rejectionReason: reason } : null));
    }
    setUserToReject(null);
    setRejectionReasonInput('');
    setFeedback({
      message: `User ${rejectedName} has been rejected. They will be prevented from logging into the platform.`,
      type: 'reject',
    });
    setTimeout(() => setFeedback(null), 5000);
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Registered Users & Approvals</h1>
            {pendingApprovalsCount > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                {pendingApprovalsCount} Pending Approval
              </span>
            )}
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
            Admin User Approval System: Review newly registered accounts. Only approved users can log in to the application.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasTempUsers && (
            <button
              type="button"
              onClick={handlePurgeTemp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purge Demo Users
            </button>
          )}

          <button
            type="button"
            onClick={() => refreshLiveServerData()}
            disabled={isSyncing}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Refresh user list from Firebase database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-purple-600' : 'text-slate-500'}`} />
            {isSyncing ? 'Syncing...' : 'Sync with Firebase'}
          </button>
        </div>
      </div>

      {/* Actionable Pending Approvals Banner */}
      {pendingApprovalsCount > 0 && approvalFilter !== 'PENDING' && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-amber-950">
                {pendingApprovalsCount} User Registration{pendingApprovalsCount > 1 ? 's' : ''} Awaiting Approval
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                New users cannot sign in until you approve their registration. Click below to view only pending accounts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setApprovalFilter('PENDING')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            View Pending Approvals ({pendingApprovalsCount})
          </button>
        </div>
      )}

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : feedback.type === 'reject'
              ? 'bg-rose-50 text-rose-900 border-rose-300'
              : 'bg-blue-50 text-blue-900 border-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Strip with Approval Status Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* All Users */}
        <button
          type="button"
          onClick={() => setApprovalFilter('ALL')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            approvalFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold ${approvalFilter === 'ALL' ? 'text-slate-300' : 'text-slate-400'}`}>
            All Registered Users
          </span>
          <div className="text-2xl font-extrabold mt-0.5">{totalUsers}</div>
          <span className={`text-[10px] ${approvalFilter === 'ALL' ? 'text-slate-300' : 'text-slate-400'}`}>
            Total in database
          </span>
        </button>

        {/* Pending Approval */}
        <button
          type="button"
          onClick={() => setApprovalFilter('PENDING')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            approvalFilter === 'PENDING'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white hover:bg-amber-50/50 border-slate-200 shadow-2xs'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold flex items-center gap-1 ${approvalFilter === 'PENDING' ? 'text-amber-100' : 'text-amber-700'}`}>
            <Clock className="w-3.5 h-3.5" /> Pending Approval
          </span>
          <div className={`text-2xl font-extrabold mt-0.5 ${approvalFilter === 'PENDING' ? 'text-white' : 'text-amber-600'}`}>
            {pendingApprovalsCount}
          </div>
          <span className={`text-[10px] ${approvalFilter === 'PENDING' ? 'text-amber-100' : 'text-slate-400'}`}>
            Awaiting admin action
          </span>
        </button>

        {/* Approved Users */}
        <button
          type="button"
          onClick={() => setApprovalFilter('APPROVED')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            approvalFilter === 'APPROVED'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white hover:bg-emerald-50/50 border-slate-200 shadow-2xs'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold flex items-center gap-1 ${approvalFilter === 'APPROVED' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            <UserCheck className="w-3.5 h-3.5" /> Approved Users
          </span>
          <div className={`text-2xl font-extrabold mt-0.5 ${approvalFilter === 'APPROVED' ? 'text-white' : 'text-emerald-600'}`}>
            {approvedUsersCount}
          </div>
          <span className={`text-[10px] ${approvalFilter === 'APPROVED' ? 'text-emerald-100' : 'text-slate-400'}`}>
            Allowed to log in
          </span>
        </button>

        {/* Rejected Users */}
        <button
          type="button"
          onClick={() => setApprovalFilter('REJECTED')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            approvalFilter === 'REJECTED'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white hover:bg-rose-50/50 border-slate-200 shadow-2xs'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold flex items-center gap-1 ${approvalFilter === 'REJECTED' ? 'text-rose-100' : 'text-rose-700'}`}>
            <UserX className="w-3.5 h-3.5" /> Rejected
          </span>
          <div className={`text-2xl font-extrabold mt-0.5 ${approvalFilter === 'REJECTED' ? 'text-white' : 'text-rose-600'}`}>
            {rejectedUsersCount}
          </div>
          <span className={`text-[10px] ${approvalFilter === 'REJECTED' ? 'text-rose-100' : 'text-slate-400'}`}>
            Blocked from logging in
          </span>
        </button>

        {/* Active Accounts */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'active' ? 'ALL' : 'active')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white hover:bg-purple-50/50 border-slate-200 shadow-2xs'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold ${statusFilter === 'active' ? 'text-purple-100' : 'text-purple-700'}`}>
            Active Contributors
          </span>
          <div className={`text-2xl font-extrabold mt-0.5 ${statusFilter === 'active' ? 'text-white' : 'text-purple-700'}`}>
            {contributorCount}
          </div>
          <span className={`text-[10px] ${statusFilter === 'active' ? 'text-purple-100' : 'text-slate-400'}`}>
            Registered contributors
          </span>
        </button>
      </div>

      {purgeSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          All temporary demo users have been purged from the database.
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
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
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 font-semibold text-slate-800 cursor-pointer"
          >
            <option value="ALL">All Approval Statuses ({totalUsers})</option>
            <option value="PENDING">⏳ Pending Approval ({pendingApprovalsCount})</option>
            <option value="APPROVED">✅ Approved Users ({approvedUsersCount})</option>
            <option value="REJECTED">❌ Rejected Users ({rejectedUsersCount})</option>
          </select>
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 font-medium text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Roles ({totalUsers})</option>
            <option value="contributor">Contributor Only ({contributorCount})</option>
            <option value="admin">Admin Only ({totalUsers - contributorCount})</option>
          </select>
        </div>
      </div>

      {/* Users Table with Direct Approve / Reject Controls */}
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
                <th className="px-3 py-3">Approval Status</th>
                <th className="px-3 py-3">Account Status</th>
                <th className="px-4 py-3 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No registered users found for this filter</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {approvalFilter === 'PENDING'
                        ? 'There are currently no new users awaiting admin approval.'
                        : 'New registrations through the register page will automatically appear here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isPending = u.role !== 'admin' && u.approvalStatus === 'pending';
                  const isRejected = u.role !== 'admin' && u.approvalStatus === 'rejected';
                  const isApproved = u.role === 'admin' || u.approvalStatus === 'approved' || !u.approvalStatus;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isPending ? 'bg-amber-50/20' : isRejected ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* UID */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-medium">
                            {u.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyUid(u.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
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

                      {/* Approval Status Badge */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                            Admin
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Pending Approval
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Approved
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                            title={u.rejectionReason || 'Account rejected'}
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Rejected
                          </span>
                        )}
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
                          {/* Approve / Reject Actions for Non-Admin */}
                          {u.role !== 'admin' && (
                            <>
                              {isPending ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(u.id, `${u.firstName} ${u.lastName}`)}
                                    className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                    title="Approve user registration"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setUserToReject(u);
                                      setRejectionReasonInput('');
                                    }}
                                    className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Reject user registration"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Reject
                                  </button>
                                </>
                              ) : isRejected ? (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(u.id, `${u.firstName} ${u.lastName}`)}
                                  className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Change status and re-approve this user"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Re-Approve
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserToReject(u);
                                    setRejectionReasonInput('');
                                  }}
                                  className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Revoke approval / Reject user"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              )}
                            </>
                          )}

                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            className="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            title="View complete user details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </button>

                          {/* Suspend / Delete Actions */}
                          {u.role !== 'admin' && (
                            <>
                              <button
                                type="button"
                                onClick={() => toggleUserStatus(u.id)}
                                className={`px-2 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
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
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Delete User Permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
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
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Approval Decision Card */}
            {selectedUser.role !== 'admin' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Admin Approval Decision:</span>
                  {selectedUser.approvalStatus === 'pending' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <Clock className="w-3.5 h-3.5" /> Pending Approval
                    </span>
                  ) : selectedUser.approvalStatus === 'rejected' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      <XCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                  )}
                </div>

                {selectedUser.approvalDate && (
                  <p className="text-[11px] text-slate-500">
                    Approved On: <span className="font-semibold text-slate-700">{selectedUser.approvalDate.split('T')[0]}</span>
                  </p>
                )}

                {selectedUser.rejectionReason && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                    <span className="font-bold">Rejection Reason:</span> {selectedUser.rejectionReason}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedUser.id, `${selectedUser.firstName} ${selectedUser.lastName}`)}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Approve User Registration
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserToReject(selectedUser);
                      setRejectionReasonInput('');
                    }}
                    className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject User
                  </button>
                </div>
              </div>
            )}

            {/* Core Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Firebase UID</span>
                <div className="font-mono font-semibold text-slate-900 mt-1 flex items-center justify-between">
                  <span>{selectedUser.id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyUid(selectedUser.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
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
                <span className="text-[10px] uppercase font-bold text-slate-400">Country</span>
                <div className="font-semibold text-slate-900 mt-1">{selectedUser.country || 'Not specified'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Phone Number</span>
                <div className="font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {selectedUser.phone || 'Not provided'}
                </div>
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Open CV <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {selectedUser.role !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => toggleUserStatus(selectedUser.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                  >
                    {selectedUser.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject User Reason Dialog Modal */}
      {userToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <UserX className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Reject User Registration</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to reject the registration for{' '}
                <span className="font-semibold text-slate-900">
                  {userToReject.firstName} {userToReject.lastName}
                </span>{' '}
                ({userToReject.email})?
              </p>
              <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100 mt-2 text-left">
                Rejected users will receive an explanatory message and be blocked from logging into the platform.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Reason for Rejection (Optional)
              </label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g., Incomplete profile details, does not meet requirements, etc."
                rows={3}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Incomplete profile information', 'Does not meet location requirements', 'Duplicate registration'].map(
                  (preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectionReasonInput(preset)}
                      className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                    >
                      {preset}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToReject(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectLoading}
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                {rejectLoading ? 'Rejecting...' : 'Confirm Rejection'}
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
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
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
