import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Mail, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface EmailVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailVerifyModal: React.FC<EmailVerifyModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, verifyEmail } = useApp();
  const [code, setCode] = useState('742891');
  const [verified, setVerified] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyEmail();
    setVerified(true);
    setTimeout(() => {
      setVerified(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {verified ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Email Verified!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your profile is now verified and ready for all global projects and tasks.
            </p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Verify Your Email Address</h3>
              <p className="text-xs text-slate-500 mt-1">
                We sent a 6-digit confirmation code to:
              </p>
              <p className="text-xs font-semibold text-slate-800 mt-0.5">{currentUser.email}</p>
            </div>

            <div className="pt-2">
              <label className="block text-center text-xs font-medium text-slate-600 mb-1.5">
                Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 text-center mt-1.5">
                (Pre-filled with test token for seamless demonstration)
              </p>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Confirm & Verify Email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
