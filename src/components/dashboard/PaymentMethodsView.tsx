import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, PaymentMethodType } from '../../types';
import { Badge } from '../common/Badge';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Lock,
  X,
  Star,
} from 'lucide-react';

export const PaymentMethodsView: React.FC = () => {
  const {
    currentUser,
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setPrimaryPaymentMethod,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  // Form State
  const [methodType, setMethodType] = useState<PaymentMethodType>('Payoneer');
  const [email, setEmail] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState(
    currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''
  );
  const [accountNumber, setAccountNumber] = useState('');
  const [ibanNumber, setIbanNumber] = useState('');

  if (!currentUser) return null;

  const myMethods = paymentMethods.filter((pm) => pm.userId === currentUser.id);

  const openAddModal = () => {
    setEditingMethod(null);
    setMethodType('Payoneer');
    setEmail('');
    setBankName('');
    setAccountHolder(`${currentUser.firstName} ${currentUser.lastName}`);
    setAccountNumber('');
    setIbanNumber('');
    setIsModalOpen(true);
  };

  const openEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    setMethodType(method.type);
    setEmail(method.email || '');
    if (method.bankDetails) {
      setBankName(method.bankDetails.bankName);
      setAccountHolder(method.bankDetails.accountHolder);
      setAccountNumber(method.bankDetails.accountNumber);
      setIbanNumber(method.bankDetails.ibanNumber);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingMethod) {
      if (methodType === 'Bank Account') {
        updatePaymentMethod(editingMethod.id, {
          type: methodType,
          bankDetails: {
            bankName,
            accountHolder,
            accountNumber,
            ibanNumber,
          },
          email: undefined,
        });
      } else {
        updatePaymentMethod(editingMethod.id, {
          type: methodType,
          email,
          bankDetails: undefined,
        });
      }
    } else {
      if (methodType === 'Bank Account') {
        addPaymentMethod({
          userId: currentUser.id,
          type: methodType,
          bankDetails: {
            bankName,
            accountHolder,
            accountNumber,
            ibanNumber,
          },
        });
      } else {
        addPaymentMethod({
          userId: currentUser.id,
          type: methodType,
          email,
        });
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payment Methods</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your destination accounts for receiving project milestone payouts.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Payment Method
        </button>
      </div>

      {/* Security Banner (Section 38.14) */}
      <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center gap-3 text-xs text-indigo-950">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
        <div>
          <span className="font-bold">Enterprise Encryption & Masking: </span>
          All payment accounts are encrypted and accessible strictly to you and verified finance
          personnel. Bank credentials and IBAN numbers are securely masked.
        </div>
      </div>

      {/* List of Payment Methods */}
      {myMethods.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No payment methods configured</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Add your Payoneer, PayPal, Airtm, or Bank Account to enable manual withdrawal requests.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            + Add Payment Method
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myMethods.map((pm) => (
            <div
              key={pm.id}
              className={`p-4 bg-white rounded-xl border transition-all relative ${
                pm.isPrimary ? 'border-indigo-500 shadow-xs ring-1 ring-indigo-500/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                    {pm.type === 'Bank Account' ? (
                      <Building2 className="w-4 h-4 text-slate-600" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{pm.type}</h3>
                    <span className="text-[10px] text-slate-400">Added on {pm.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {pm.isPrimary ? (
                    <Badge variant="green" size="sm">
                      <Star className="w-2.5 h-2.5 fill-current" /> Primary
                    </Badge>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPrimaryPaymentMethod(pm.id)}
                      className="text-[10px] text-slate-400 hover:text-indigo-600 font-medium px-2 py-0.5 rounded hover:bg-slate-100"
                    >
                      Make Primary
                    </button>
                  )}
                </div>
              </div>

              {/* Account Details Content */}
              <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100 text-xs space-y-1">
                {pm.type === 'Bank Account' && pm.bankDetails ? (
                  <>
                    <p className="text-slate-500">
                      Bank Name:{' '}
                      <span className="font-semibold text-slate-800">
                        {pm.bankDetails.bankName}
                      </span>
                    </p>
                    <p className="text-slate-500">
                      Account Holder:{' '}
                      <span className="font-semibold text-slate-800">
                        {pm.bankDetails.accountHolder}
                      </span>
                    </p>
                    <p className="text-slate-500">
                      IBAN:{' '}
                      <span className="font-mono font-semibold text-slate-800">
                        ****{pm.bankDetails.ibanNumber.slice(-4)}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500">
                    Email Account:{' '}
                    <span className="font-semibold text-slate-800 font-mono">{pm.email}</span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => openEditModal(pm)}
                  className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors flex items-center gap-1 font-medium"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => deletePaymentMethod(pm.id)}
                  className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors flex items-center gap-1 font-medium"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method Type
                </label>
                <select
                  value={methodType}
                  onChange={(e) => setMethodType(e.target.value as PaymentMethodType)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Payoneer">Payoneer</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Airtm">Airtm</option>
                  <option value="Bank Account">Bank Account</option>
                </select>
              </div>

              {methodType === 'Bank Account' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Standard Chartered / Chase"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Muhammad Ayan"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      IBAN Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PK36SCBL0000001123456789"
                      value={ibanNumber}
                      onChange={(e) => setIbanNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {methodType} Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={`user@example.com for ${methodType}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  Save Payment Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
