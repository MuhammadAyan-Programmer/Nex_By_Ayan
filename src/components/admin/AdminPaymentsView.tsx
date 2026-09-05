import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WithdrawalStatus } from '../../types';
import { Badge } from '../common/Badge';
import {
  Wallet,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  Receipt,
  User,
  CreditCard,
  Building2,
  X,
  ExternalLink,
} from 'lucide-react';

interface AdminPaymentsViewProps {
  initialUserId?: string;
  initialProjectId?: string;
}

export const AdminPaymentsView: React.FC<AdminPaymentsViewProps> = ({
  initialUserId,
  initialProjectId,
}) => {
  const {
    users,
    projects,
    earnings,
    withdrawals,
    addEarning,
    updateEarningStatus,
    updateWithdrawalStatus,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'withdrawals' | 'earnings'>('withdrawals');

  // Add Earning Modal State
  const [isAddEarningModalOpen, setIsAddEarningModalOpen] = useState(
    Boolean(initialUserId && initialProjectId)
  );
  const [targetUserId, setTargetUserId] = useState<string>(initialUserId || users[1]?.id || '');
  const [targetProjectId, setTargetProjectId] = useState<string>(
    initialProjectId || projects[0]?.id || ''
  );
  const [earningAmount, setEarningAmount] = useState('150.00');
  const [earningStatus, setEarningStatus] = useState<'Available' | 'Paid'>('Available');
  const [earningNotes, setEarningNotes] = useState('Milestone 1 Quality Approved');

  // Withdrawal Status Action Modal State
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'Withdrawal Requested');

  const handleAddEarningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(earningAmount);
    if (isNaN(amount) || amount <= 0) return;

    addEarning({
      userId: targetUserId,
      projectId: targetProjectId,
      amount,
      currency: 'USD',
      status: earningStatus,
      notes: earningNotes,
    });

    setIsAddEarningModalOpen(false);
    setActiveTab('earnings');
  };

  const handleApprovePaid = (wId: string) => {
    updateWithdrawalStatus(wId, 'Paid');
  };

  const handleMarkProcessing = (wId: string) => {
    updateWithdrawalStatus(wId, 'Processing');
  };

  const handleOpenReject = (wId: string) => {
    setSelectedWithdrawalId(wId);
    setRejectionReason('Payment gateway returned invalid account details.');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawalId) return;
    updateWithdrawalStatus(selectedWithdrawalId, 'Rejected', rejectionReason);
    setIsRejectModalOpen(false);
    setSelectedWithdrawalId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payments & Withdrawals Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Credit project milestone earnings, inspect gateway details, and process contributor
            payouts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddEarningModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Credit Contributor Earning
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-4">
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'withdrawals'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Withdrawal Requests ({withdrawals.length})
          {pendingWithdrawals.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingWithdrawals.length} pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'earnings'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Credited Earnings Records ({earnings.length})
        </button>
      </div>

      {/* TAB 1: WITHDRAWAL REQUESTS (Section 38.9 & 38.12) */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              MANUAL WITHDRAWAL QUEUE (SECTION 38.9)
            </span>
            <span className="text-xs text-slate-500">
              Admin transfers funds manually via gateway, then marks status as Paid.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Contributor</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Gateway Target / Account Details</th>
                  <th className="px-4 py-3">Date Requested</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      No withdrawal requests in queue.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{w.userName}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">${w.amount.toFixed(2)}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">
                        {w.paymentMethodType}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700">
                        {w.paymentMethodDetails}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                        {w.requestDate}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge
                          variant={
                            w.status === 'Paid'
                              ? 'green'
                              : w.status === 'Processing'
                              ? 'blue'
                              : w.status === 'Withdrawal Requested'
                              ? 'amber'
                              : 'red'
                          }
                        >
                          {w.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {w.status === 'Withdrawal Requested' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleMarkProcessing(w.id)}
                                className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                              >
                                Set Processing
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApprovePaid(w.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs"
                              >
                                Mark Paid
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenReject(w.id)}
                                className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {w.status === 'Processing' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprovePaid(w.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs"
                              >
                                Confirm Paid
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenReject(w.id)}
                                className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {w.status === 'Paid' && (
                            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 justify-end">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Transfer Complete
                            </span>
                          )}
                          {w.status === 'Rejected' && (
                            <span className="text-[11px] text-rose-600 italic">
                              Refunded to Contributor
                            </span>
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
      )}

      {/* TAB 2: CREDITED EARNINGS (Section 38.8) */}
      {activeTab === 'earnings' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              CONTRIBUTOR PROJECT EARNINGS LEDGER (SECTION 38.8)
            </span>
            <span className="text-xs text-slate-500">{earnings.length} milestone credits</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Contributor</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Credited Date</th>
                  <th className="px-4 py-3">Milestone Notes</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {earnings.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{e.userName}</td>
                    <td className="px-4 py-3.5 text-slate-700 max-w-[200px] truncate">
                      {e.projectName}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      ${e.amount.toFixed(2)} {e.currency}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={e.status === 'Available' ? 'green' : 'gray'}>
                        ● {e.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {e.paymentDate}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 italic max-w-xs truncate">
                      {e.notes || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {e.status === 'Available' ? (
                        <button
                          type="button"
                          onClick={() => updateEarningStatus(e.id, 'Paid')}
                          className="text-[11px] text-purple-600 hover:text-purple-800 font-semibold"
                        >
                          Mark as Paid Direct
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Earning Modal matching Section 38.8 */}
      {isAddEarningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Credit Project Milestone Earning
              </h3>
              <button
                onClick={() => setIsAddEarningModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEarningSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contributor (Section 38.8) *
                </label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project *</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount (USD $) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={earningAmount}
                    onChange={(e) => setEarningAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status *</label>
                  <select
                    value={earningStatus}
                    onChange={(e) => setEarningStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Available">Available (User Can Withdraw)</option>
                    <option value="Paid">Paid (Already Disbursed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Milestone Notes / Memo
                </label>
                <input
                  type="text"
                  placeholder="e.g. Completed 100 translation units QA"
                  value={earningNotes}
                  onChange={(e) => setEarningNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEarningModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors"
                >
                  Confirm & Credit Earning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Withdrawal Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Reject Withdrawal Request
              </h3>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Rejecting this withdrawal will automatically unlock and refund the held amount back to
                the contributor's available balance.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
                >
                  Confirm Rejection & Refund Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
