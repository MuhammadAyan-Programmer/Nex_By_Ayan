import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Mail, CheckCircle2, Clock, AlertTriangle, ArrowRight, RefreshCw, X, Sparkles, ShieldCheck, KeyRound, Check, Copy } from 'lucide-react';
import { LogoIcon } from '../common/Logo';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
  token?: string;
  expiresAt?: number;
  initialState?: 'created' | 'unverified_notice' | 'verifying' | 'success' | 'expired';
  emailSent?: boolean;
  emailError?: string;
  onVerifiedSuccess?: () => void;
  onContinueToLogin?: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email: initialEmail = '',
  token: initialToken = '',
  expiresAt: initialExpiresAt,
  initialState = 'created',
  emailSent: initialEmailSent,
  emailError: initialEmailError,
  onVerifiedSuccess,
  onContinueToLogin,
}) => {
  const { verifyEmailByToken, resendVerificationEmail } = useApp();

  const [currentEmail, setCurrentEmail] = useState(initialEmail);
  const [activeToken, setActiveToken] = useState(initialToken);
  const [deliveryStatus, setDeliveryStatus] = useState<{
    sent?: boolean;
    error?: string;
  }>({
    sent: initialEmailSent,
    error: initialEmailError,
  });
  const [expiresTime, setExpiresTime] = useState<number>(
    initialExpiresAt || Date.now() + 5 * 60 * 1000
  );
  const [status, setStatus] = useState<'created' | 'unverified_notice' | 'verifying' | 'success' | 'expired' | 'error'>(
    initialState
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const [instantActivating, setInstantActivating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync state whenever props change or modal is opened
  useEffect(() => {
    if (isOpen) {
      if (initialEmail) setCurrentEmail(initialEmail);
      if (initialToken) setActiveToken(initialToken);
      if (initialExpiresAt) setExpiresTime(initialExpiresAt);
      setDeliveryStatus({
        sent: initialEmailSent,
        error: initialEmailError,
      });
      setStatus(initialState);
      setErrorMessage('');
      setResendMessage('');

      if (initialState === 'verifying' && initialToken) {
        handleExecuteVerification(initialToken);
      }
    }
  }, [isOpen, initialEmail, initialToken, initialExpiresAt, initialState, initialEmailSent, initialEmailError]);

  // Real-time 5-minute countdown timer
  useEffect(() => {
    if (!isOpen || status === 'success') return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((expiresTime - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0 && status !== 'expired' && status !== 'success') {
        setStatus('expired');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen, expiresTime, status]);

  // Celebration animation in Nexora Theme (Blue / Slate / White / Gold)
  const triggerCelebration = () => {
    const colors = ['#2563EB', '#1D4ED8', '#0F172A', '#38BDF8', '#F59E0B', '#FFFFFF'];

    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors,
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.65 },
          colors,
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.65 },
          colors,
        });
      }, 250);
    } catch (e) {
      console.warn('Celebration animation notice:', e);
    }
  };

  const handleExecuteVerification = async (tokenToUse: string) => {
    if (!tokenToUse) {
      setStatus('error');
      setErrorMessage('No verification token available.');
      return;
    }

    setStatus('verifying');
    setErrorMessage('');

    try {
      const result = await verifyEmailByToken(tokenToUse);
      if (result.success) {
        setStatus('success');
        triggerCelebration();
        if (onVerifiedSuccess) {
          onVerifiedSuccess();
        }
      } else {
        if (result.code === 'TOKEN_EXPIRED') {
          setStatus('expired');
        } else {
          setStatus('error');
          setErrorMessage(result.message || 'The verification link is invalid or has already been used.');
        }
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to verify email. Please try again.');
    }
  };

  const handleInstantActivate = async () => {
    if (!activeToken) return;
    setInstantActivating(true);
    await handleExecuteVerification(activeToken);
    setInstantActivating(false);
  };

  const handleResendEmail = async () => {
    if (!currentEmail) return;
    setResendLoading(true);
    setResendMessage('');
    setErrorMessage('');

    try {
      const res = await resendVerificationEmail(currentEmail);
      setResendLoading(false);
      if (res.success) {
        const newExpiry = res.expiresAt || Date.now() + 5 * 60 * 1000;
        setExpiresTime(newExpiry);
        setSecondsRemaining(300);
        setStatus('created');
        setDeliveryStatus({
          sent: res.emailSent,
          error: res.emailError,
        });
        if (res.verificationToken) {
          setActiveToken(res.verificationToken);
        }
        setResendMessage(res.message || "We've sent a new verification email to your registered email. Please check your inbox.");
      } else {
        setErrorMessage(res.message || 'Failed to resend verification email.');
      }
    } catch (err: any) {
      setResendLoading(false);
      setErrorMessage('Failed to resend verification email. Please try again.');
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Users can close or navigate to login
  const canCloseModal = true;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
      onClick={() => {
        if (canCloseModal) onClose();
      }}
    >
      <div
        id="email-verification-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col transition-all duration-300 animate-in fade-in zoom-in-95"
      >
        {/* Top Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <LogoIcon size={30} />
            <div>
              <h3 className="font-bold text-slate-900 text-sm leading-tight">Nexora Workforce</h3>
              <p className="text-[11px] text-slate-500 font-medium">Account Activation & Security</p>
            </div>
          </div>
          {canCloseModal && (
            <button
              onClick={onClose}
              id="btn-close-verification-modal"
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body Based on State */}
        <div className="p-6">
          {/* 1. SUCCESS STATE WITH CELEBRATION */}
          {status === 'success' && (
            <div className="text-center py-2">
              <div className="relative mb-5 flex justify-center">
                <div className="w-20 h-20 bg-linear-to-tr from-blue-600 via-indigo-600 to-slate-900 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 text-white animate-bounce">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-2 text-blue-500 animate-pulse">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="absolute top-8 -left-3 text-slate-800 animate-ping opacity-75">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              <h4 className="text-2xl font-extrabold text-slate-900 mb-1.5 leading-tight">
                🎉 Congratulations!
              </h4>

              <p className="text-base font-bold text-slate-800 mb-4">
                Your email has been successfully verified!
              </p>

              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 mb-6 text-center shadow-xs">
                <p className="text-sm font-semibold text-blue-950 flex items-center justify-center gap-1.5 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  Your Nexora Workforce account is now activated. Welcome aboard! 🚀
                </p>
                <p className="text-xs text-slate-600">
                  You can now log in to participate in global AI data tasks, translation projects, and track your contributor rewards.
                </p>
              </div>

              <button
                type="button"
                id="btn-continue-to-login"
                onClick={() => {
                  onClose();
                  if (onContinueToLogin) {
                    onContinueToLogin();
                  } else if (onVerifiedSuccess) {
                    onVerifiedSuccess();
                  }
                }}
                className="w-full py-3.5 px-5 bg-linear-to-r from-blue-600 to-slate-900 hover:from-blue-700 hover:to-black text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Continue to Login</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* 2. EXPIRED STATE */}
          {status === 'expired' && (
            <div className="text-center py-2">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-200">
                <Clock className="w-8 h-8" />
              </div>

              <h4 className="text-xl font-bold text-slate-900 mb-2">
                Verification Link Expired
              </h4>

              <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                This verification link has expired because verification links are strictly valid for <strong>5 minutes</strong> for account security.
              </p>

              {resendMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg text-left">
                  {resendMessage}
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-lg text-left">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  id="btn-resend-expired-verification"
                  disabled={resendLoading}
                  onClick={handleResendEmail}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                  {resendLoading ? 'Sending New Link...' : 'Resend Verification Email'}
                </button>

                <button
                  type="button"
                  id="btn-back-to-signin"
                  onClick={() => {
                    onClose();
                    if (onContinueToLogin) onContinueToLogin();
                  }}
                  className="w-full py-2 px-4 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* 3. VERIFYING LOADING STATE */}
          {status === 'verifying' && (
            <div className="text-center py-8">
              <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <h4 className="text-base font-bold text-slate-900 mb-1">Verifying Email Link</h4>
              <p className="text-xs text-slate-500">Checking token authenticity and activating your Nexora account...</p>
            </div>
          )}

          {/* 4. ERROR STATE */}
          {status === 'error' && (
            <div className="text-center py-2">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <h4 className="text-lg font-bold text-slate-900 mb-2">Verification Failed</h4>
              <p className="text-xs text-slate-600 mb-4">{errorMessage || 'The verification link is invalid or has already been used.'}</p>

              <button
                type="button"
                id="btn-resend-error-verification"
                disabled={resendLoading}
                onClick={handleResendEmail}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                {resendLoading ? 'Sending New Link...' : 'Resend Verification Email'}
              </button>
            </div>
          )}

          {/* 5. CREATED OR UNVERIFIED NOTICE STATE */}
          {(status === 'created' || status === 'unverified_notice') && (
            <div>
              <div className="text-center mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner border ${
                  deliveryStatus.sent === false
                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                    : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {deliveryStatus.sent === false ? (
                    <AlertTriangle className="w-7 h-7 text-amber-600" />
                  ) : (
                    <Mail className="w-7 h-7 text-blue-600" />
                  )}
                </div>

                <h4 className="text-xl font-bold text-slate-900 mb-1.5">
                  Please verify your email
                </h4>

                <p className="text-xs font-semibold text-slate-700 mb-1">
                  Please verify your email address before continuing.
                </p>

                {deliveryStatus.sent === false ? (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 leading-relaxed text-left mt-2">
                    <span className="font-bold block mb-1">⚠️ Email Dispatch Notice:</span>
                    Could not deliver verification email to <code className="font-mono font-semibold">{currentEmail}</code>:
                    <br />
                    <span className="text-[11px] text-amber-900 font-medium">
                      {deliveryStatus.error || 'Google App Password required for Gmail SMTP.'}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                    We've sent a real email verification link to your registered email address. Please click the link to verify your email and activate your account.
                  </p>
                )}
              </div>

              {/* Registered Email Pill & 5-minute Expiry Timer */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-500 font-medium">Recipient Address:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[200px]">{currentEmail}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/70">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Link Expiry:
                  </span>
                  <span className={`font-mono font-bold ${secondsRemaining < 60 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
                    {formattedTime} (5 min valid)
                  </span>
                </div>
              </div>

              {/* Real Email Guidance */}
              {deliveryStatus.sent !== false && (
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl mb-3 text-left">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Check your email inbox (including the <strong>Spam</strong> or <strong>Promotions</strong> folder). Click the link inside to verify.
                    </p>
                  </div>
                </div>
              )}

              {/* Instant Verification Fallback & Direct Link: Accessible whenever activeToken exists */}
              {activeToken && (
                <div className={`p-3.5 rounded-xl mb-4 text-left border transition-all ${
                  deliveryStatus.sent === false
                    ? 'bg-emerald-50 border-emerald-200 shadow-2xs'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-start gap-2 mb-2.5">
                    <KeyRound className={`w-4 h-4 shrink-0 mt-0.5 ${
                      deliveryStatus.sent === false ? 'text-emerald-600' : 'text-slate-600'
                    }`} />
                    <div>
                      <span className={`text-xs font-bold block ${
                        deliveryStatus.sent === false ? 'text-emerald-900' : 'text-slate-800'
                      }`}>
                        {deliveryStatus.sent === false
                          ? 'Instant Account Activation'
                          : 'Didn\'t receive the email? Direct Activation'}
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                        {deliveryStatus.sent === false
                          ? 'Email delivery is awaiting configuration in Admin Settings. You can activate directly below:'
                          : 'If your email provider delays delivery or filters to spam, you can verify your account instantly:'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      id="btn-instant-activate-account"
                      disabled={instantActivating}
                      onClick={handleInstantActivate}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {instantActivating ? 'Activating Account...' : 'Instant Activate & Verify Account Now'}
                    </button>

                    <button
                      type="button"
                      id="btn-copy-verification-link"
                      onClick={() => {
                        const link = `${window.location.origin}/?verifyToken=${encodeURIComponent(activeToken)}`;
                        navigator.clipboard.writeText(link);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 3000);
                      }}
                      className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      {copiedLink ? 'Link Copied to Clipboard!' : 'Copy Direct Verification Link'}
                    </button>
                  </div>
                </div>
              )}

              {resendMessage && (
                <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg">
                  {resendMessage}
                </div>
              )}

              {errorMessage && (
                <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-lg">
                  {errorMessage}
                </div>
              )}

              {/* Resend Action & Go to Login */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  id="btn-resend-verification"
                  disabled={resendLoading}
                  onClick={handleResendEmail}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                  {resendLoading ? 'Sending Verification Link...' : 'Resend Verification Email'}
                </button>

                <button
                  type="button"
                  id="btn-nav-to-login"
                  onClick={() => {
                    onClose();
                    if (onContinueToLogin) onContinueToLogin();
                  }}
                  className="w-full py-2 px-4 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-center block"
                >
                  Already clicked the verification link? Go to Log In →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
