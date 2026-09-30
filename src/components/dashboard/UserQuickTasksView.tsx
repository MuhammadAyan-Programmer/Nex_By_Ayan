import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { QuickTask, QuickTaskSubmission } from '../../types';
import {
  Zap,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Send,
  X,
  MessageSquare,
  AlertCircle,
  FileText,
  Link as LinkIcon,
  Copy,
  DollarSign,
  Calendar,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';

export const UserQuickTasksView: React.FC = () => {
  const { currentUser, quickTasks, quickTaskSubmissions, submitQuickTask } = useApp();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'submitted'>('all');

  // Selected task for viewing instructions & submitting
  const [selectedTask, setSelectedTask] = useState<QuickTask | null>(null);

  // Form submission state
  const [submitUrl, setSubmitUrl] = useState('');
  const [submitText, setSubmitText] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success confirmation modal state
  const [submittedSuccessSub, setSubmittedSuccessSub] = useState<QuickTaskSubmission | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // User's submissions map by taskId
  const userSubmissionsByTaskId = useMemo(() => {
    if (!currentUser) return new Map<string, QuickTaskSubmission>();
    const map = new Map<string, QuickTaskSubmission>();
    quickTaskSubmissions
      .filter((s) => s.userId === currentUser.id)
      .forEach((s) => {
        // Keep the latest submission if multiple exist
        if (!map.has(s.taskId)) {
          map.set(s.taskId, s);
        }
      });
    return map;
  }, [quickTaskSubmissions, currentUser]);

  // Active tasks only for contributors
  const availableQuickTasks = useMemo(() => {
    return quickTasks.filter((t) => t.status === 'active');
  }, [quickTasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return availableQuickTasks.filter((task) => {
      const matchSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase()) ||
        task.instructions.toLowerCase().includes(search.toLowerCase());

      const userSub = userSubmissionsByTaskId.get(task.id);
      let matchFilter = true;
      if (filter === 'available') {
        matchFilter = !userSub;
      } else if (filter === 'submitted') {
        matchFilter = !!userSub;
      }

      return matchSearch && matchFilter;
    });
  }, [availableQuickTasks, search, filter, userSubmissionsByTaskId]);

  const handleOpenTask = (task: QuickTask) => {
    setSelectedTask(task);
    const existingSub = userSubmissionsByTaskId.get(task.id);
    setSubmitUrl(existingSub?.submittedUrl || '');
    setSubmitText(existingSub?.submittedText || '');
    setFormError('');
  };

  const handleCloseTask = () => {
    setSelectedTask(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const trimmedUrl = submitUrl.trim();
    const trimmedText = submitText.trim();

    if (!trimmedUrl && !trimmedText) {
      setFormError('Please provide either a submission URL or a text response.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');

      const res = await submitQuickTask({
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        submittedUrl: trimmedUrl || undefined,
        submittedText: trimmedText || undefined,
      });

      if (res.success && res.submission) {
        setSelectedTask(null);
        setSubmittedSuccessSub(res.submission);
      } else {
        setFormError(res.message || 'Submission failed. Please try again.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit quick task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // User stats
  const totalAvailable = availableQuickTasks.length;
  const userSubCount = userSubmissionsByTaskId.size;
  const userApprovedCount = (Array.from(userSubmissionsByTaskId.values()) as QuickTaskSubmission[]).filter(
    (s) => s.status === 'approved'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Zap className="w-5 h-5 fill-amber-500" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Quick Tasks</h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800">
              Direct Participation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Lightweight tasks open to all contributors. No CV, prior job application, or approval required.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-700 flex items-center gap-1.5 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Instant Access</span>
          </div>
        </div>
      </div>

      {/* Feature Explainer Notice */}
      <div className="p-4 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">How Quick Tasks Work</h3>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              Unlike normal jobs, Quick Tasks require <strong>zero CV screening</strong>. Simply read the instructions, complete the action (such as sharing a post or providing an evaluation), submit your result link or text, and receive your evaluation!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 px-2 text-slate-700 font-medium">
          <div className="text-center">
            <span className="block text-base font-bold text-slate-900">{totalAvailable}</span>
            <span className="text-[10px] text-slate-500">Available</span>
          </div>
          <div className="h-6 w-px bg-slate-300" />
          <div className="text-center">
            <span className="block text-base font-bold text-purple-700">{userSubCount}</span>
            <span className="text-[10px] text-slate-500">Submitted</span>
          </div>
          <div className="h-6 w-px bg-slate-300" />
          <div className="text-center">
            <span className="block text-base font-bold text-emerald-700">{userApprovedCount}</span>
            <span className="text-[10px] text-slate-500">Approved</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quick tasks by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
          {(['all', 'available', 'submitted'] as const).map((mode) => {
            const count =
              mode === 'all'
                ? availableQuickTasks.length
                : mode === 'available'
                ? availableQuickTasks.filter((t) => !userSubmissionsByTaskId.has(t.id)).length
                : userSubCount;

            return (
              <button
                key={mode}
                type="button"
                onClick={() => setFilter(mode)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  filter === mode
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="capitalize">{mode}</span>
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                    filter === mode ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 bg-white rounded-xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto text-xl">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No quick tasks found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {search
              ? 'No quick tasks matched your search.'
              : filter === 'submitted'
              ? "You haven't submitted any quick tasks yet. Check out the available tasks to get started!"
              : 'New quick tasks will appear here as soon as the administrator publishes them.'}
          </p>
          {filter !== 'all' && (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              View All Tasks
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const userSub = userSubmissionsByTaskId.get(task.id);
            const isSubmitted = !!userSub;
            const isApproved = userSub?.status === 'approved';
            const isPending = userSub?.status === 'pending';
            const isRejected = userSub?.status === 'rejected';

            return (
              <div
                key={task.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-amber-500" />
                        Quick Task
                      </span>

                      {task.reward && (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {task.reward}
                        </span>
                      )}
                    </div>

                    {/* Contributor's Personal Submission Status */}
                    {isSubmitted ? (
                      isApproved ? (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      ) : isPending ? (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending Review
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Needs Revision
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-1">
                        ● Open for Submission
                      </span>
                    )}
                  </div>

                  {/* Title & Short Description */}
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>

                  {/* Submission Requirement Highlight */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-700 block text-[11px] mb-0.5">
                      Requirement:
                    </span>
                    <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                      {task.submissionRequirements}
                    </p>
                  </div>

                  {/* Reference link preview if any */}
                  {task.referenceLink && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-indigo-600 truncate">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{task.referenceLink}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-[10px] text-slate-400">
                    Published {new Date(task.createdAt).toLocaleDateString()}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenTask(task)}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      isApproved
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : isPending
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : isRejected
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <span>
                      {isApproved
                        ? 'View Approved Result'
                        : isPending
                        ? 'View / Update Submission'
                        : isRejected
                        ? 'Revise & Re-submit'
                        : 'View Task & Submit'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TASK DETAILS & SUBMISSION MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-700 via-purple-700 to-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-white/20 text-white">
                    Quick Task
                  </span>
                  {selectedTask.reward && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-400 text-slate-950">
                      Reward: {selectedTask.reward}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold mt-1">{selectedTask.title}</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseTask}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Direct Access Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>No CV or application needed:</strong> Follow the instructions below, submit your proof/result, and earn rewards upon approval.
                </span>
              </div>

              {/* Task Short Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Task Overview
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedTask.description}
                </p>
              </div>

              {/* Complete Task Instructions */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Detailed Instructions
                </h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                  {selectedTask.instructions}
                </div>
              </div>

              {/* Reference Link if provided */}
              {selectedTask.referenceLink && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Reference / Link
                  </h4>
                  <a
                    href={selectedTask.referenceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-semibold text-purple-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Reference Resource ({selectedTask.referenceLink})</span>
                  </a>
                </div>
              )}

              {/* Submission Requirements */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600" />
                  Submission Requirements:
                </span>
                <p className="text-amber-800 leading-relaxed pl-5.5">
                  {selectedTask.submissionRequirements}
                </p>
              </div>

              {/* If user already submitted this task, show previous submission status and details */}
              {userSubmissionsByTaskId.get(selectedTask.id) && (
                <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Your Current Submission:</span>
                    {(() => {
                      const sub = userSubmissionsByTaskId.get(selectedTask.id)!;
                      if (sub.status === 'approved') {
                        return (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        );
                      }
                      if (sub.status === 'pending') {
                        return (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending Review
                          </span>
                        );
                      }
                      return (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Needs Revision
                        </span>
                      );
                    })()}
                  </div>

                  {(() => {
                    const sub = userSubmissionsByTaskId.get(selectedTask.id)!;
                    return (
                      <div className="space-y-1 text-slate-700">
                        {sub.submittedUrl && (
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-semibold text-slate-600 shrink-0">URL:</span>
                            <a
                              href={sub.submittedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 underline truncate"
                            >
                              {sub.submittedUrl}
                            </a>
                          </div>
                        )}
                        {sub.submittedText && (
                          <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-800 whitespace-pre-wrap">
                            {sub.submittedText}
                          </div>
                        )}
                        {sub.adminFeedback && (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 mt-2">
                            <span className="font-bold block">Admin Feedback:</span>
                            <p className="mt-0.5">{sub.adminFeedback}</p>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 block pt-1">
                          Submitted on {new Date(sub.submittedAt).toLocaleString()}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* SUBMISSION FORM */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    {userSubmissionsByTaskId.get(selectedTask.id)
                      ? 'Update / Resubmit Task Result'
                      : 'Submit Your Task Result'}
                  </h4>
                </div>

                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Result URL field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Result URL / Link (e.g. LinkedIn post link, public document, tweet)
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      placeholder="https://linkedin.com/posts/your-post-link..."
                      value={submitUrl}
                      onChange={(e) => setSubmitUrl(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-600 bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Paste the direct URL where your completed task can be verified.
                  </p>
                </div>

                {/* Result Text Response field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Text Response / Additional Notes (if required by the task)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter written answers, translation strings, feedback, or verification details..."
                    value={submitText}
                    onChange={(e) => setSubmitText(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-600 bg-white leading-relaxed font-sans"
                  />
                </div>

                {/* Submit Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseTask}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Task Result'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL */}
      {submittedSuccessSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto text-3xl shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                Submitted Successfully
              </span>
              <h3 className="text-lg font-bold text-slate-900">Task Submitted Successfully!</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your submission for <span className="font-semibold text-slate-700">"{submittedSuccessSub.taskTitle}"</span> has been received and logged for admin review.
              </p>
            </div>

            {/* Submission summary box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Status: <strong className="text-amber-600">Pending Admin Review</strong></span>
                <span>{new Date(submittedSuccessSub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {submittedSuccessSub.submittedUrl && (
                <div className="truncate text-slate-700">
                  <span className="font-semibold text-slate-500 block text-[10px]">Submitted URL:</span>
                  <a
                    href={submittedSuccessSub.submittedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline truncate block"
                  >
                    {submittedSuccessSub.submittedUrl}
                  </a>
                </div>
              )}
              {submittedSuccessSub.submittedText && (
                <div>
                  <span className="font-semibold text-slate-500 block text-[10px]">Submitted Text:</span>
                  <p className="text-slate-800 line-clamp-2 italic">
                    "{submittedSuccessSub.submittedText}"
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSubmittedSuccessSub(null)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
              >
                Done / Back to Quick Tasks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
