import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, RefreshCw, Shield, Server, Database, CheckCircle2 } from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const { resetToDefaults } = useApp();
  const [resetSuccess, setResetSuccess] = useState(false);

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
          Nexora Workforce global platform operations, database parameters, and runtime configuration.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          All platform demo data reset to seed state successfully!
        </div>
      )}

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
