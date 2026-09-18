import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wrench,
  Power,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Info,
  Save,
  ShieldCheck,
  Radio,
  Timer,
  ExternalLink,
} from 'lucide-react';
import { MaintenancePage } from '../common/MaintenancePage';

export const AdminMaintenanceView: React.FC = () => {
  const { maintenanceState, saveMaintenance, toggleMaintenance, refreshMaintenance, currentUser } =
    useApp();
  const { config, isActive, status, timeRemainingMs, timeUntilStartMs } = maintenanceState;

  // Local form state
  const [enabled, setEnabled] = useState(config.enabled);
  const [startDateTime, setStartDateTime] = useState(config.startDateTime || '');
  const [endDateTime, setEndDateTime] = useState(config.endDateTime || '');
  const [title, setTitle] = useState(config.title || 'System Under Scheduled Maintenance');
  const [message, setMessage] = useState(
    config.message ||
      'Nexora Workforce is temporarily offline for scheduled system upgrades and infrastructure optimization. Project applications, contributor portals, and task evaluations will resume immediately once maintenance concludes.'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Sync form whenever external config changes
  useEffect(() => {
    setEnabled(config.enabled);
    setStartDateTime(config.startDateTime || '');
    setEndDateTime(config.endDateTime || '');
    if (config.title) setTitle(config.title);
    if (config.message) setMessage(config.message);
  }, [config]);

  // Convert Date to datetime-local input string YYYY-MM-DDTHH:mm in local time
  const toLocalISO = (d: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper presets
  const handleSetStartNow = () => {
    setStartDateTime(toLocalISO(new Date()));
  };

  const handleSetStartOffset = (minutes: number) => {
    const d = new Date(Date.now() + minutes * 60 * 1000);
    setStartDateTime(toLocalISO(d));
  };

  const handleSetEndOffset = (hours: number) => {
    const base = startDateTime ? new Date(startDateTime).getTime() : Date.now();
    const d = new Date(base + hours * 3600 * 1000);
    setEndDateTime(toLocalISO(d));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveFeedback(null);

    // Validate dates if both provided
    if (startDateTime && endDateTime) {
      const s = new Date(startDateTime).getTime();
      const end = new Date(endDateTime).getTime();
      if (end <= s) {
        setSaveFeedback({
          type: 'error',
          text: 'The end date & time must be after the start date & time.',
        });
        setIsSaving(false);
        return;
      }
    }

    try {
      const result = await saveMaintenance({
        enabled,
        startDateTime,
        endDateTime,
        title: title.trim(),
        message: message.trim(),
      });
      setSaveFeedback({
        type: 'success',
        text: result.message || 'Maintenance settings updated successfully.',
      });
      await refreshMaintenance();
    } catch (err: any) {
      setSaveFeedback({
        type: 'error',
        text: err.message || 'Failed to save maintenance settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickToggle = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const next = !enabled;
      setEnabled(next);
      // If turning ON and no start time, set start time to now
      let nextStart = startDateTime;
      let nextEnd = endDateTime;
      if (next && !startDateTime) {
        nextStart = toLocalISO(new Date());
        setStartDateTime(nextStart);
      }
      if (next && !endDateTime) {
        nextEnd = toLocalISO(new Date(Date.now() + 2 * 3600 * 1000));
        setEndDateTime(nextEnd);
      }
      const result = await saveMaintenance({
        enabled: next,
        startDateTime: nextStart,
        endDateTime: nextEnd,
        title,
        message,
      });
      setSaveFeedback({
        type: 'success',
        text: next ? 'Maintenance mode enabled immediately.' : 'Maintenance mode disabled.',
      });
    } catch (err: any) {
      setSaveFeedback({
        type: 'error',
        text: err.message || 'Failed to toggle maintenance mode.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms <= 0) return '0s';
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDisplayDate = (iso: string) => {
    if (!iso) return 'Not set (Immediate / Indefinite)';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Maintenance Mode</h2>
              <p className="text-xs text-slate-500">
                Control platform accessibility, schedule planned downtime, and monitor maintenance windows.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="btn-preview-maintenance-screen"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            Preview User Screen
          </button>

          <button
            type="button"
            id="btn-quick-toggle-maintenance"
            onClick={handleQuickToggle}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isActive
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : enabled
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            {isActive
              ? 'Disable Maintenance Now'
              : enabled
              ? 'Maintenance Scheduled (Cancel)'
              : 'Enable Maintenance Now'}
          </button>
        </div>
      </div>

      {/* Live Status Hero Card */}
      <div
        className={`rounded-2xl border p-6 transition-all ${
          isActive
            ? 'bg-red-50/80 border-red-200 text-red-950'
            : status === 'scheduled'
            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
            : status === 'ended'
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isActive
                    ? 'bg-red-600 text-white animate-pulse'
                    : status === 'scheduled'
                    ? 'bg-amber-500 text-white'
                    : status === 'ended'
                    ? 'bg-slate-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                <Radio className="w-3 h-3" />
                {isActive
                  ? 'Active Now — System Offline'
                  : status === 'scheduled'
                  ? 'Scheduled — Starting Soon'
                  : status === 'ended'
                  ? 'Schedule Concluded (Inactive)'
                  : 'System Online & Operational'}
              </span>

              <span className="text-xs text-slate-500 font-medium">
                Admin Panel always accessible
              </span>
            </div>

            <h3 className="text-xl font-extrabold tracking-tight">
              {isActive
                ? 'The application is currently in Maintenance Mode'
                : status === 'scheduled'
                ? `Maintenance is scheduled to begin in ${formatDuration(timeUntilStartMs)}`
                : status === 'ended'
                ? 'Scheduled maintenance window has ended'
                : 'All platform services are running normally'}
            </h3>

            <p className="text-xs opacity-80 max-w-2xl leading-relaxed">
              {isActive
                ? 'All non-admin users (contributors and public visitors) are currently blocked from normal views and see the System Under Maintenance screen. Administrators can manage the platform freely.'
                : status === 'scheduled'
                ? 'The application will automatically switch to Maintenance Mode when the scheduled start time is reached, with no manual action required.'
                : 'Contributors can browse projects, submit applications, evaluate tasks, and request payment withdrawals without interruption.'}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/80 backdrop-blur-xs border border-black/5 rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Start Time
              </span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5 truncate">
                {config.startDateTime ? formatDisplayDate(config.startDateTime) : 'Immediate'}
              </span>
            </div>

            <div className="bg-white/80 backdrop-blur-xs border border-black/5 rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                End Time
              </span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5 truncate">
                {config.endDateTime ? formatDisplayDate(config.endDateTime) : 'Manual Disabling'}
              </span>
            </div>

            <div className="bg-white/80 backdrop-blur-xs border border-black/5 rounded-xl p-3 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {isActive ? 'Time Remaining' : status === 'scheduled' ? 'Starts In' : 'Duration'}
              </span>
              <span
                className={`text-xs font-mono font-bold block mt-0.5 ${
                  isActive ? 'text-red-600' : status === 'scheduled' ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {isActive
                  ? config.endDateTime
                    ? formatDuration(timeRemainingMs)
                    : 'Until Disabled'
                  : status === 'scheduled'
                  ? formatDuration(timeUntilStartMs)
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {saveFeedback && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border ${
            saveFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {saveFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{saveFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveFeedback(null)}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Schedule & Configuration Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Configuration Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Activation Switch & Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Maintenance Schedule</h4>
                <p className="text-xs text-slate-500">
                  Enable maintenance mode and specify the exact operational window.
                </p>
              </div>

              {/* Master Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="toggle-enable-maintenance-mode"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                <span className="ml-3 text-xs font-bold text-slate-700">
                  {enabled ? 'Schedule Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            {/* Date & Time Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Start Date & Time */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    Start Date & Time
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">Local Time</span>
                </div>

                <input
                  type="datetime-local"
                  id="input-maintenance-start-time"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-2xs"
                />

                {/* Quick Presets for Start */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 py-1 font-semibold">Presets:</span>
                  <button
                    type="button"
                    onClick={handleSetStartNow}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold border border-purple-200 transition-colors"
                  >
                    Start Now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetStartOffset(15)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                  >
                    +15 Mins
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetStartOffset(60)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                  >
                    +1 Hour
                  </button>
                </div>
              </div>

              {/* End Date & Time */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    End Date & Time
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">Auto-Disables</span>
                </div>

                <input
                  type="datetime-local"
                  id="input-maintenance-end-time"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-2xs"
                />

                {/* Quick Presets for End */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 py-1 font-semibold">Duration:</span>
                  <button
                    type="button"
                    onClick={() => handleSetEndOffset(0.5)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                  >
                    +30 Mins
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetEndOffset(1)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                  >
                    +1 Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetEndOffset(2)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold border border-purple-200 transition-colors"
                  >
                    +2 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetEndOffset(4)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                  >
                    +4 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetEndOffset(24)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                  >
                    +24 Hours
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Automatic Schedule Activation & Deactivation</span>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  When enabled with future dates, the system continuously tracks the clock. When the Start Time arrives, the entire site automatically locks down for visitors and contributors. When the End Time is reached, the site automatically unlocks and resumes normal operation.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Public Notice Customization */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900">User Notice & Messaging</h4>
            <p className="text-xs text-slate-500">
              Customize the headline and message displayed to users on the maintenance screen.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Notice Title / Headline
                </label>
                <input
                  type="text"
                  id="input-maintenance-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="System Under Scheduled Maintenance"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Detailed Explanation / Notice for Contributors
                </label>
                <textarea
                  id="textarea-maintenance-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain the reason for maintenance and reassure contributors about their data safety..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs leading-relaxed focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              id="btn-reset-maintenance-form"
              onClick={() => {
                setEnabled(false);
                setStartDateTime('');
                setEndDateTime('');
                setTitle('System Under Scheduled Maintenance');
                setMessage(
                  'Nexora Workforce is temporarily offline for scheduled system upgrades and infrastructure optimization. Project applications, contributor portals, and task evaluations will resume immediately once maintenance concludes.'
                );
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Clear Schedule
            </button>

            <button
              type="submit"
              id="btn-save-maintenance-schedule"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving Changes...' : 'Save Maintenance Schedule'}
            </button>
          </div>
        </div>

        {/* Right 1 Column: Schedule Summary & Rules Checklist */}
        <div className="space-y-6">
          {/* Current Saved Status Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Currently Saved Status
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isActive ? 'bg-red-500 animate-ping' : enabled ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Mode Setting</span>
                <span
                  className={`font-bold ${
                    config.enabled ? 'text-purple-700 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {config.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="space-y-1 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium block">Scheduled Start:</span>
                <span className="font-semibold text-slate-800 block truncate">
                  {formatDisplayDate(config.startDateTime)}
                </span>
              </div>

              <div className="space-y-1 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium block">Scheduled End:</span>
                <span className="font-semibold text-slate-800 block truncate">
                  {formatDisplayDate(config.endDateTime)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Last Updated</span>
                <span className="text-slate-700 font-medium">
                  {config.lastUpdated
                    ? new Date(config.lastUpdated).toLocaleTimeString()
                    : 'Not yet saved'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Configured By</span>
                <span className="text-purple-600 font-semibold truncate max-w-[140px]">
                  {config.updatedBy || currentUser?.email || 'admin@nexora.ai'}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Guarantees */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3 text-xs text-slate-600">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Security & Reliability
            </h5>
            <ul className="space-y-2 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Admin Exemption:</strong> Administrators remain logged in and have unhindered access to the Admin Panel at all times.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Data Integrity:</strong> User profiles, task evaluations, project applications, and payment balances remain untouched.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Real-Time Sync:</strong> Settings synchronize across all browser sessions and cloud storage within seconds.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </form>

      {/* User Screen Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-white">Maintenance Screen Preview</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 text-[10px] font-semibold border border-purple-800/60">
                  Visitor & Contributor View
                </span>
              </div>

              <button
                type="button"
                id="btn-close-preview-modal"
                onClick={() => setIsPreviewOpen(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <MaintenancePage />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
