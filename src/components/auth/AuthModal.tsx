import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { LogoIcon } from '../common/Logo';
import { CountrySelect } from '../common/CountrySelect';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('United States');
  const [primaryLanguage, setPrimaryLanguage] = useState('English');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    if (!cleanEmail || !cleanPassword) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    const res = await login(cleanEmail, cleanPassword);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Invalid email or password.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName || !lastName || !email || !password) {
      setError('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    const res = await register({
      firstName,
      lastName,
      email,
      password,
      country,
      primaryLanguage,
    });
    setLoading(false);

    if (res.success) {
      setRegSuccessMessage(res.message);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setError(res.message || 'Registration failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="auth-modal-container"
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 my-auto flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-xl shrink-0">
          <div className="flex items-center gap-2.5">
            <LogoIcon size={32} />
            <div>
              <h3 className="font-bold text-slate-900 leading-tight">Nexora Workforce</h3>
              <p className="text-xs text-slate-500 font-medium">Global AI Data & Language Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success notification if registered */}
        {regSuccessMessage ? (
          <div className="p-8 text-center bg-white overflow-y-auto">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">Registration Successful</h4>
            <p className="text-sm text-slate-600 mb-4">{regSuccessMessage}</p>
            <p className="text-xs text-slate-500 font-medium">Opening your dashboard...</p>
          </div>
        ) : (
          <div className="p-6 bg-white overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-lg flex items-start justify-between gap-2">
                <div>
                  <p>{error}</p>
                  {error.toLowerCase().includes('already exists') && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                      }}
                      className="mt-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 underline block"
                    >
                      Click here to Sign In with this email →
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-rose-500 hover:text-rose-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {mode === 'login' ? (
              /* UNIFIED LOGIN: ONLY Email, Password, and [LOGIN] */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {loading ? 'Signing In...' : 'LOGIN'}
                </button>

                <div className="pt-4 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setError(null);
                      }}
                      className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline ml-1"
                    >
                      Create Account
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Create Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Country
                    </label>
                    <CountrySelect
                      value={country}
                      onChange={setCountry}
                      placeholder="Select Country..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Primary Language
                    </label>
                    <input
                      type="text"
                      placeholder="Arabic / English"
                      value={primaryLanguage}
                      onChange={(e) => setPrimaryLanguage(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Creating Account...' : 'Register'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                      }}
                      className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline ml-1"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
