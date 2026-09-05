import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import {
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building2,
  DollarSign,
  Receipt,
  X,
} from 'lucide-react';
import { UserTab } from './UserSidebar';

interface EarningsViewProps {
  onNavigate: (tab: UserTab) => void;
}

export const EarningsView: React.FC<EarningsViewProps> = ({ onNavigate }) => {
  const {
    currentUser,
    earnings,
    withdrawals,
    paymentMethods,
    userBalance,
    requestWithdrawal,
  } = useApp();

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('250.00');
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    paymentMethods.find((pm) => pm.isPrimary)?.id || paymentMethods[0]?.id || ''
  );
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  if (!currentUser) return null;

  const myEarnings = earnings.filter((e) => e.userId === currentUser.id);
  const myWithdrawals = withdrawals.filter((w) => w.userId === currentUser.id);
  const myPaymentMethods = paymentMethods.filter((pm) => pm.userId === currentUser.id);

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount)) {
      setWithdrawError('Please enter a valid numeric amount.');
      return;
    }

    if (myPaymentMethods.length === 0) {
      setWithdrawError('You must add a payment method before requesting a withdrawal.');
      return;
    }

    const res = requestWithdrawal(amount, selectedMethodId);
    if (res.success) {
      setWithdrawSuccess(res.message);
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawSuccess(null);
      }, 1400);
    } else {
      setWithdrawError(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Earnings & Payouts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track milestone payments, monitor your available balance, and submit manual withdrawal
            requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('payment-methods')}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
            Manage Payment Methods
          </button>
          <button
            type="button"
            onClick={() => {
              setWithdrawError(null);
              setWithdrawSuccess(null);
              if (myPaymentMethods.length > 0 && !selectedMethodId) {
                setSelectedMethodId(myPaymentMethods[0].id);
              }
              setIsWithdrawModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            Request Withdrawal
          </button>
        </div>
      </div>

      {/* SRS 38.7 Specification Metric Cards */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            MY EARNINGS OVERVIEW
          </span>
          <span className="text-xs text-slate-500 font-medium">Currency: USD ($)</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-slate-800">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
              Total Earnings
            </span>
            <span className="text-2xl font-bold text-slate-900">
              ${userBalance.totalEarnings.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">All approved milestones</span>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-800 block mb-0.5">
              Available Balance
            </span>
            <span className="text-2xl font-bold text-emerald-700">
              ${userBalance.availableBalance.toFixed(2)}
            </span>
            <span className="text-[10px] text-emerald-600 block mt-1">Ready to withdraw</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Withdrawn</span>
            <span className="text-2xl font-bold text-slate-800">
              ${userBalance.withdrawnAmount.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Transferred via admin</span>
          </div>

          <div className="p-3.5 bg-amber-50/60 rounded-lg border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-800 block mb-0.5">
              Pending Withdrawal
            </span>
            <span className="text-2xl font-bold text-amber-700">
              ${userBalance.pendingWithdrawal.toFixed(2)}
            </span>
            <span className="text-[10px] text-amber-600 block mt-1">Awaiting admin transfer</span>
          </div>
        </div>
      </div>

      {/* SRS 38.7 PROJECT EARNINGS SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            Project-Wise Earnings
          </h2>
          <span className="text-xs text-slate-400">{myEarnings.length} project records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Project</th>
                <th className="px-4 py-3">Amount Earned</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Credited Date</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myEarnings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    No project earnings recorded yet. Complete active project tasks to receive
                    milestone credits.
                  </td>
                </tr>
              ) : (
                myEarnings.map((earn) => (
                  <tr key={earn.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-semibold text-slate-900">{earn.projectName}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      ${earn.amount.toFixed(2)} {earn.currency}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={earn.status === 'Available' ? 'green' : 'gray'}>
                        ● {earn.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{earn.paymentDate}</td>
                    <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate">
                      {earn.notes || 'Milestone verified'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SRS 38.13 PAYMENT / WITHDRAWAL HISTORY */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Withdrawal & Payout History
          </h2>
          <span className="text-xs text-slate-400">{myWithdrawals.length} transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Request ID</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Details / Target</th>
                <th className="px-4 py-3">Request Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No withdrawal requests submitted yet.
                  </td>
                </tr>
              ) : (
                myWithdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-mono font-medium text-slate-600">{w.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">${w.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {w.paymentMethodType}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                      {w.paymentMethodDetails}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{w.requestDate}</td>
                    <td className="px-4 py-3">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SRS 38.10 MANUAL WITHDRAWAL MODAL */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                Submit Withdrawal Request
              </h3>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {withdrawSuccess ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Request Submitted</h4>
                <p className="text-xs text-slate-500 mt-1">{withdrawSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                {/* Available balance indicator */}
                <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-950">Available Balance:</span>
                  <span className="text-base font-bold text-indigo-700">
                    ${userBalance.availableBalance.toFixed(2)}
                  </span>
                </div>

                {withdrawError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {withdrawError}
                  </div>
                )}

                {/* Amount input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Withdrawal Amount ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max={userBalance.availableBalance}
                      required
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                    <span>Min: $1.00</span>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(userBalance.availableBalance.toFixed(2))}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Max Available (${userBalance.availableBalance.toFixed(2)})
                    </button>
                  </div>
                </div>

                {/* Select Payment Method */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Select Payment Method
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsWithdrawModalOpen(false);
                        onNavigate('payment-methods');
                      }}
                      className="text-[11px] text-indigo-600 hover:underline"
                    >
                      + Add New
                    </button>
                  </div>

                  {myPaymentMethods.length === 0 ? (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                      No payment methods found. Please add Payoneer, PayPal, Airtm, or Bank Account
                      first.
                    </div>
                  ) : (
                    <select
                      value={selectedMethodId}
                      onChange={(e) => setSelectedMethodId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {myPaymentMethods.map((pm) => (
                        <option key={pm.id} value={pm.id}>
                          {pm.type} -{' '}
                          {pm.type === 'Bank Account' && pm.bankDetails
                            ? `${pm.bankDetails.bankName} (****${pm.bankDetails.ibanNumber.slice(-4)})`
                            : pm.email}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                  Notice: Withdrawals are reviewed by administrator manual processing through the
                  selected gateway. The requested amount will be held in pending balance.
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={userBalance.availableBalance <= 0 || myPaymentMethods.length === 0}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    Submit Withdrawal Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
