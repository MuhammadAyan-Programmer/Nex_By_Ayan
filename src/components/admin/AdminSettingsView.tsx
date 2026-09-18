import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  RefreshCw,
  Server,
  Database,
  CheckCircle2,
  Mail,
  Send,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Check,
} from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const { resetToDefaults } = useApp();
  const [resetSuccess, setResetSuccess] = useState(false);

  // Email Config State
  const [provider, setProvider] = useState<'gmail' | 'smtp' | 'brevo' | 'resend'>('gmail');
  const [gmailUser, setGmailUser] = useState('sahfiquetolokaking@gmail.com');
  const [gmailAppPassword, setGmailAppPassword] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [brevoApiKey, setBrevoApiKey] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');

  // Status & Testing State
  const [activeProviderText, setActiveProviderText] = useState('Loading...');
  const [hasConfiguredPass, setHasConfiguredPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [testEmailAddress, setTestEmailAddress] = useState('sahfiquetolokaking@gmail.com');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load existing config on mount
  useEffect(() => {
    fetch('/api/admin/email-config')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.config) {
          const cfg = data.config;
          setActiveProviderText(cfg.activeProvider || 'None configured');
          if (cfg.gmailUser) setGmailUser(cfg.gmailUser);
          if (cfg.smtpHost) setSmtpHost(cfg.smtpHost);
          if (cfg.smtpPort) setSmtpPort(cfg.smtpPort);
          if (cfg.smtpUser) setSmtpUser(cfg.smtpUser);
          setHasConfiguredPass(Boolean(cfg.hasGmailPass || cfg.hasSmtpPass));
        }
      })
      .catch(() => {
        setActiveProviderText('Unavailable');
      });
  }, []);

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const payload: any = { provider };
      if (provider === 'gmail') {
        payload.gmailUser = gmailUser.trim();
        if (gmailAppPassword.trim()) {
          payload.gmailAppPassword = gmailAppPassword.trim();
        }
      } else if (provider === 'smtp') {
        payload.smtpHost = smtpHost.trim();
        payload.smtpPort = Number(smtpPort);
        payload.smtpSecure = smtpSecure;
        payload.smtpUser = smtpUser.trim();
        if (smtpPass.trim()) payload.smtpPass = smtpPass.trim();
        if (smtpFrom.trim()) payload.smtpFrom = smtpFrom.trim();
      } else if (provider === 'brevo') {
        if (brevoApiKey.trim()) payload.brevoApiKey = brevoApiKey.trim();
      } else if (provider === 'resend') {
        if (resendApiKey.trim()) payload.resendApiKey = resendApiKey.trim();
      }

      const res = await fetch('/api/admin/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setIsSaving(false);

      if (data.success) {
        setSaveMessage({ type: 'success', text: 'Email delivery settings saved successfully!' });
        if (data.config) {
          setActiveProviderText(data.config.activeProvider);
          setHasConfiguredPass(Boolean(data.config.hasGmailPass || data.config.hasSmtpPass));
        }
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        setSaveMessage({ type: 'error', text: data.message || 'Failed to save email settings.' });
      }
    } catch (err: any) {
      setIsSaving(false);
      setSaveMessage({ type: 'error', text: err.message || 'Failed to save configuration.' });
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress.trim()) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/email-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: testEmailAddress.trim() }),
      });
      const data = await res.json();
      setIsTesting(false);
      setTestResult(data);
    } catch (err: any) {
      setIsTesting(false);
      setTestResult({
        success: false,
        message: err.message || 'Error occurred while contacting test email API.',
      });
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Reset all mock projects, applications, and earnings back to initial default seed data?'
      )
    ) {
      resetToDefaults();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">System & Platform Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Nexora Workforce global platform operations, email delivery parameters, and runtime configuration.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          All platform demo data reset to seed state successfully!
        </div>
      )}

      {/* Real Email Delivery & SMTP Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" /> Real Email Delivery Service (Verification Emails)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure real transactional emails for contributor signups and verification links.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Active Service:</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              {activeProviderText}
            </span>
          </div>
        </div>

        {/* Diagnostic Notice */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            Why was no email received on Gmail?
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Google SMTP strictly rejects regular Google account passwords with <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">535 BadCredentials</code>.
            To deliver real emails to <span className="font-semibold">sahfiquetolokaking@gmail.com</span> and contributor inboxes, Google requires a <strong>16-character App Password</strong>.
          </p>
          <div className="pt-1 text-xs text-slate-700">
            <strong>How to get your 16-character Google App Password in 30 seconds:</strong>
            <ol className="list-decimal list-inside space-y-1 mt-1.5 text-[11px] text-slate-600">
              <li>Open your Google Account: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1">https://myaccount.google.com/apppasswords <ExternalLink className="w-3 h-3" /></a></li>
              <li>Make sure 2-Step Verification is turned on in your Google Account Security settings.</li>
              <li>Under "App name", enter <strong>Nexora Workforce</strong> and click <strong>Create</strong>.</li>
              <li>Google will generate a 16-letter password (e.g. <code className="font-mono bg-white px-1 py-0.5 border border-slate-200 rounded">abcd efgh ijkl mnop</code>).</li>
              <li>Paste that 16-character code below and click <strong>Save & Test Connection</strong>!</li>
            </ol>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSaveEmailConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-1 bg-slate-100 rounded-lg max-w-md">
            <button
              type="button"
              onClick={() => setProvider('gmail')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                provider === 'gmail' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gmail SMTP
            </button>
            <button
              type="button"
              onClick={() => setProvider('smtp')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                provider === 'smtp' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom SMTP
            </button>
            <button
              type="button"
              onClick={() => setProvider('brevo')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                provider === 'brevo' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Brevo API
            </button>
            <button
              type="button"
              onClick={() => setProvider('resend')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                provider === 'resend' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resend API
            </button>
          </div>

          {/* Provider Specific Inputs */}
          {provider === 'gmail' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gmail Sender Address
                </label>
                <input
                  type="email"
                  value={gmailUser}
                  onChange={(e) => setGmailUser(e.target.value)}
                  placeholder="e.g. sahfiquetolokaking@gmail.com"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google App Password (16 Characters)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={gmailAppPassword}
                    onChange={(e) => setGmailAppPassword(e.target.value)}
                    placeholder={hasConfiguredPass ? '•••••••••••••••• (Saved in system)' : 'e.g. abcd efgh ijkl mnop'}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Spaces are automatically stripped. Generate at myaccount.google.com/apppasswords
                </span>
              </div>
            </div>
          )}

          {provider === 'smtp' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.example.com"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username / Email</label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="smtp-user"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="SMTP Password"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">From Email / Name</label>
                <input
                  type="text"
                  value={smtpFrom}
                  onChange={(e) => setSmtpFrom(e.target.value)}
                  placeholder="Nexora Workforce <noreply@nexora.work>"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  Use SSL/TLS (Port 465)
                </label>
              </div>
            </div>
          )}

          {provider === 'brevo' && (
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brevo API Key (v3)
              </label>
              <input
                type="password"
                value={brevoApiKey}
                onChange={(e) => setBrevoApiKey(e.target.value)}
                placeholder="xkeysib-..."
                className="w-full max-w-md px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Get free 300 emails/day key at app.brevo.com
              </span>
            </div>
          )}

          {provider === 'resend' && (
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resend API Key
              </label>
              <input
                type="password"
                value={resendApiKey}
                onChange={(e) => setResendApiKey(e.target.value)}
                placeholder="re_..."
                className="w-full max-w-md px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Get free key at resend.com
              </span>
            </div>
          )}

          {saveMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                saveMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {saveMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              )}
              {saveMessage.text}
            </div>
          )}

          <div className="pt-1 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {isSaving ? 'Saving Settings...' : 'Save Email Settings'}
            </button>
          </div>
        </form>

        <hr className="border-slate-100" />

        {/* Live Test Dispatch */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <Send className="w-3.5 h-3.5 text-indigo-600" /> Send Live Test Email to Your Inbox
          </h4>
          <p className="text-xs text-slate-500">
            Verify real delivery by dispatching a test email directly to your inbox right now.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg">
            <input
              type="email"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="e.g. sahfiquetolokaking@gmail.com"
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              disabled={isTesting || !testEmailAddress}
              onClick={handleTestEmail}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Sending Test...' : 'Send Test Email'}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block mb-0.5">
                    {testResult.success ? '✅ Test Email Successfully Delivered!' : '❌ Test Email Dispatch Failed'}
                  </span>
                  <p className="text-[11px]">{testResult.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Platform Specification Manifest */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-purple-600" /> Platform Deployment Specifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-semibold text-slate-900 block mb-0.5">Specification Version</span>
            <p className="text-slate-500">SRS Version 1.1 (Corporate Production)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-semibold text-slate-900 block mb-0.5">Systems Architecture</span>
            <p className="text-slate-500">
              Contributor Panel + Admin Panel (No Manager Panel in v1.0)
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-semibold text-slate-900 block mb-0.5">
              Financial Payout Engine
            </span>
            <p className="text-slate-500">
              Manual Gateway Review (Payoneer, PayPal, Airtm, Bank Transfer)
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-semibold text-slate-900 block mb-0.5">Category Taxonomies</span>
            <p className="text-slate-500">18 Global AI & Localization Work Types</p>
          </div>
        </div>
      </div>

      {/* Database Reset */}
      <div className="bg-white rounded-xl border border-rose-200 p-6 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" /> Demo State Administration
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Need to test the onboarding and lifecycle flow from scratch? Resetting will restore all
          projects, applications, seat calculations, notifications, and earnings back to initial SRS
          v1.1 defaults.
        </p>

        <div>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Demo Database to Initial State
          </button>
        </div>
      </div>
    </div>
  );
};
