import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { QuickTask, QuickTaskSubmission, QuickTaskSubmissionStatus } from '../../types';
import {
  Zap,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Edit2,
  Trash2,
  Filter,
  Check,
  X,
  MessageSquare,
  AlertCircle,
  FileText,
  Link as LinkIcon,
  Copy,
  DollarSign,
  User,
  Calendar,
  Layers,
} from 'lucide-react';

interface AdminQuickTasksViewProps {
  initialTaskId?: string;
}

export const AdminQuickTasksView: React.FC<AdminQuickTasksViewProps> = ({ initialTaskId }) => {
  const {
    quickTasks,
    createQuickTask,
    updateQuickTask,
    deleteQuickTask,
    quickTaskSubmissions,
    updateQuickTaskSubmissionStatus,
    currentUser,
  } = useApp();

  // Selected task to view segregated submissions
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId || null);

  // Filters & Search for tasks list
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'active' | 'closed'>('all');

  // Filters & Search for submissions list
  const [subStatusFilter, setSubStatusFilter] = useState<'all' | QuickTaskSubmissionStatus>('all');
  const [subSearch, setSubSearch] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<QuickTask | null>(null);
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<string | null>(null);

  // Rejection modal
  const [rejectingSub, setRejectingSub] = useState<QuickTaskSubmission | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');

  // Form state for Create / Edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    submissionRequirements: '',
    referenceLink: '',
    reward: '',
    status: 'active' as 'active' | 'closed',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Ensure tasks from submissions or default are always visible and shown
  const allTasks = useMemo(() => {
    const list = [...quickTasks];
    const taskIds = new Set(list.map((t) => t.id));

    // If quickTasks is empty but submissions exist, reconstitute the task so submissions can be reviewed
    if (list.length === 0 && quickTaskSubmissions.length > 0) {
      const sub = quickTaskSubmissions[0];
      const fallbackTask: QuickTask = {
        id: sub?.taskId || 'task-quick-001',
        title: sub?.taskTitle || 'Share Nexora Workforce on LinkedIn',
        description: 'Create a short public post on LinkedIn introducing Nexora Workforce and submit your post link.',
        instructions: '1. Log into your LinkedIn account.\n2. Write a short, professional post introducing Nexora Workforce to your network (mentioning our platform at https://nexora.work).\n3. Publish the post with visibility set to Public.\n4. Copy the URL of your published post and paste it into the submission link field below.',
        submissionRequirements: 'Provide the direct URL of your public LinkedIn post. Optionally include any additional notes in the text field.',
        referenceLink: 'https://www.linkedin.com',
        reward: '$5.00',
        status: 'active',
        createdAt: '2026-09-20T10:00:00.000Z',
      };
      list.push(fallbackTask);
      taskIds.add(fallbackTask.id);
    } else if (list.length === 0) {
      list.push({
        id: 'task-quick-001',
        title: 'Share Nexora Workforce on LinkedIn',
        description: 'Create a short public post on LinkedIn introducing Nexora Workforce and submit your post link.',
        instructions: '1. Log into your LinkedIn account.\n2. Write a short, professional post introducing Nexora Workforce to your network (mentioning our platform at https://nexora.work).\n3. Publish the post with visibility set to Public.\n4. Copy the URL of your published post and paste it into the submission link field below.',
        submissionRequirements: 'Provide the direct URL of your public LinkedIn post. Optionally include any additional notes in the text field.',
        referenceLink: 'https://www.linkedin.com',
        reward: '$5.00',
        status: 'active',
        createdAt: '2026-09-20T10:00:00.000Z',
      });
    }

    // Also include any other task referenced by submissions
    for (const sub of quickTaskSubmissions) {
      if (sub.taskId && !taskIds.has(sub.taskId)) {
        taskIds.add(sub.taskId);
        list.push({
          id: sub.taskId,
          title: sub.taskTitle || 'Quick Task',
          description: 'Quick task with active contributor submissions.',
          instructions: 'Review submitted links and text from contributors below.',
          submissionRequirements: 'Submission response required.',
          referenceLink: 'https://www.linkedin.com',
          reward: '$5.00',
          status: 'active',
          createdAt: sub.submittedAt || new Date().toISOString(),
        });
      }
    }
    return list;
  }, [quickTasks, quickTaskSubmissions]);

  // Selected task object
  const activeTask = useMemo(() => {
    return allTasks.find((t) => t.id === selectedTaskId) || null;
  }, [allTasks, selectedTaskId]);

  // Submissions for the selected task
  const taskSubmissions = useMemo(() => {
    if (!selectedTaskId) return [];
    return quickTaskSubmissions.filter((s) => s.taskId === selectedTaskId);
  }, [quickTaskSubmissions, selectedTaskId]);

  // Overall metrics
  const totalTasks = allTasks.length;
  const activeTasksCount = allTasks.filter((t) => t.status === 'active').length;
  const totalSubmissionsCount = quickTaskSubmissions.length;
  const pendingSubmissionsCount = quickTaskSubmissions.filter((s) => s.status === 'pending').length;

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const matchSearch =
        task.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
        task.description.toLowerCase().includes(taskSearch.toLowerCase());
      const matchStatus =
        taskStatusFilter === 'all' ? true : task.status === taskStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [allTasks, taskSearch, taskStatusFilter]);

  // Filtered submissions for selected task
  const filteredSubmissions = useMemo(() => {
    return taskSubmissions.filter((sub) => {
      const matchStatus = subStatusFilter === 'all' ? true : sub.status === subStatusFilter;
      const matchSearch =
        sub.userName.toLowerCase().includes(subSearch.toLowerCase()) ||
        sub.userEmail.toLowerCase().includes(subSearch.toLowerCase()) ||
        (sub.submittedUrl && sub.submittedUrl.toLowerCase().includes(subSearch.toLowerCase())) ||
        (sub.submittedText && sub.submittedText.toLowerCase().includes(subSearch.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [taskSubmissions, subStatusFilter, subSearch]);

  // Auto-sync missing tasks into state if submissions exist
  React.useEffect(() => {
    if (quickTasks.length === 0 && allTasks.length > 0) {
      for (const t of allTasks) {
        createQuickTask(t);
      }
    }
  }, [quickTasks.length, allTasks, createQuickTask]);

  const openCreateModal = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      instructions: '',
      submissionRequirements: '',
      referenceLink: '',
      reward: '',
      status: 'active',
    });
    setFormError('');
    setIsCreateOpen(true);
  };

  const openEditModal = (task: QuickTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      instructions: task.instructions,
      submissionRequirements: task.submissionRequirements,
      referenceLink: task.referenceLink || '',
      reward: task.reward || '',
      status: task.status,
    });
    setFormError('');
    setIsCreateOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Task title is required.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Short description is required.');
      return;
    }
    if (!formData.instructions.trim()) {
      setFormError('Detailed instructions are required.');
      return;
    }
    if (!formData.submissionRequirements.trim()) {
      setFormError('Submission requirements are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingTask) {
        await updateQuickTask(editingTask.id, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          instructions: formData.instructions.trim(),
          submissionRequirements: formData.submissionRequirements.trim(),
          referenceLink: formData.referenceLink.trim() || undefined,
          reward: formData.reward.trim() || undefined,
          status: formData.status,
        });
      } else {
        await createQuickTask({
          title: formData.title.trim(),
          description: formData.description.trim(),
          instructions: formData.instructions.trim(),
          submissionRequirements: formData.submissionRequirements.trim(),
          referenceLink: formData.referenceLink.trim() || undefined,
          reward: formData.reward.trim() || undefined,
          status: formData.status,
        });
      }
      setIsCreateOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    await deleteQuickTask(id);
    setDeleteConfirmTaskId(null);
    if (selectedTaskId === id) {
      setSelectedTaskId(null);
    }
  };

  const handleStatusChange = async (
    subId: string,
    newStatus: QuickTaskSubmissionStatus,
    feedback?: string
  ) => {
    await updateQuickTaskSubmissionStatus(subId, newStatus, feedback);
    if (rejectingSub) {
      setRejectingSub(null);
      setRejectionFeedback('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Zap className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Quick Tasks Management</h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-purple-100 text-purple-700">
              Admin Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create lightweight tasks for contributors to complete directly without CV or prior job approval. Review results per task.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedTaskId ? (
            <button
              type="button"
              onClick={() => setSelectedTaskId(null)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Quick Tasks
            </button>
          ) : (
            <button
              type="button"
              id="btn-create-quick-task"
              onClick={openCreateModal}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Quick Task
            </button>
          )}
        </div>
      </div>

      {/* Global Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Tasks</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-slate-900">{totalTasks}</p>
          <span className="text-[10px] text-slate-400">Created on platform</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Active Tasks</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600">{activeTasksCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Available to contributors</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Submissions</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-slate-900">{totalSubmissionsCount}</p>
          <span className="text-[10px] text-slate-400">Across all tasks</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600">{pendingSubmissionsCount}</p>
          <span className="text-[10px] text-amber-600 font-medium">Awaiting evaluation</span>
        </div>
      </div>

      {/* VIEW A: SEPARATE SUBMISSIONS LIST FOR SELECTED TASK */}
      {selectedTaskId && activeTask ? (
        <div className="space-y-4">
          {/* Submissions Header for this specific task */}
          <div className="p-4 bg-white rounded-xl border border-purple-200 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-purple-100 text-purple-700">
                    Results & Submissions
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      activeTask.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {activeTask.status === 'active' ? 'Active' : 'Closed'}
                  </span>
                  {activeTask.reward && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-amber-100 text-amber-800 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {activeTask.reward}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{activeTask.title}</h2>
                <p className="text-xs text-slate-600 mt-0.5">{activeTask.description}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {activeTask.status === 'closed' ? (
                  <button
                    type="button"
                    onClick={() => updateQuickTask(activeTask.id, { status: 'active' })}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Reopen task for new submissions"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Activate Task
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateQuickTask(activeTask.id, { status: 'closed' })}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Close task so contributors can no longer submit"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Close Task
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openEditModal(activeTask)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit Task
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteConfirmTaskId(activeTask.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Permanently remove task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Task
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTaskId(null)}
                  className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Switch Task
                </button>
              </div>
            </div>

            {/* Task Quick Info Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="font-bold text-slate-700 block mb-0.5">Submission Requirements:</span>
                <p className="text-slate-600 whitespace-pre-wrap">{activeTask.submissionRequirements}</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-700 block mb-0.5">Reference Link:</span>
                  {activeTask.referenceLink ? (
                    <a
                      href={activeTask.referenceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline flex items-center gap-1 truncate"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{activeTask.referenceLink}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400">None provided</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Created {new Date(activeTask.createdAt).toLocaleDateString()} • {taskSubmissions.length} Total Submissions
                </div>
              </div>
            </div>
          </div>

          {/* Submissions Filter & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search contributor, email, link, text..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 bg-slate-50"
                />
              </div>

              {/* Status pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => {
                  const count =
                    st === 'all'
                      ? taskSubmissions.length
                      : taskSubmissions.filter((s) => s.status === st).length;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSubStatusFilter(st)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        subStatusFilter === st
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <span className="capitalize">{st}</span>
                      <span
                        className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                          subStatusFilter === st
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submissions Cards / Table */}
          {filteredSubmissions.length === 0 ? (
            <div className="p-12 bg-white rounded-xl border border-slate-200 text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center mx-auto text-xl">
                📬
              </div>
              <h3 className="text-sm font-bold text-slate-800">No submissions found for this task</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {subSearch || subStatusFilter !== 'all'
                  ? 'Try clearing the search or status filter to see other submissions.'
                  : 'Contributors have not submitted responses for this task yet. Once submitted, each response will appear here strictly separated.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((sub) => {
                const isPending = sub.status === 'pending';
                const isApproved = sub.status === 'approved';
                const isRejected = sub.status === 'rejected';

                return (
                  <div
                    key={sub.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                  >
                    {/* Contributor Row Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {sub.userName
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{sub.userName}</h4>
                            <span className="text-[11px] text-slate-500">• {sub.userEmail}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-mono">UID: {sub.userId}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(sub.submittedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Current Status Badge */}
                      <div className="flex items-center gap-2">
                        {isPending && (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            Pending Review
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Result Content */}
                    <div className="space-y-2 text-xs">
                      {sub.submittedUrl && (
                        <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between gap-2 border border-slate-100">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <LinkIcon className="w-4 h-4 text-purple-600 shrink-0" />
                            <span className="font-semibold text-slate-700 shrink-0">Submitted URL:</span>
                            <a
                              href={sub.submittedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-800 font-medium truncate underline flex items-center gap-1"
                            >
                              <span className="truncate">{sub.submittedUrl}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(sub.submittedUrl!)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors shrink-0 cursor-pointer"
                            title="Copy link"
                          >
                            {copiedLink === sub.submittedUrl ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {sub.submittedText && (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                          <span className="font-bold text-slate-700 block">Submitted Text Response:</span>
                          <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {sub.submittedText}
                          </p>
                        </div>
                      )}

                      {/* Admin feedback note if exists */}
                      {sub.adminFeedback && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Admin Feedback / Reason:</span>
                            <p className="mt-0.5 text-amber-800">{sub.adminFeedback}</p>
                            {sub.reviewedAt && (
                              <span className="text-[10px] text-amber-600 block mt-1">
                                Reviewed {new Date(sub.reviewedAt).toLocaleString()} by {sub.reviewedBy || 'Admin'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Review Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[11px] text-slate-400">
                        Quick Evaluation Action:
                      </span>

                      <div className="flex items-center gap-1.5">
                        {sub.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(sub.id, 'approved')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}

                        {sub.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingSub(sub);
                              setRejectionFeedback(sub.adminFeedback || '');
                            }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        )}

                        {sub.status !== 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(sub.id, 'pending')}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-lg transition-colors text-xs cursor-pointer"
                          >
                            Reset to Pending
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VIEW B: ALL QUICK TASKS LIST */
        <div className="space-y-4">
          {/* Controls: Search & Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search quick tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                {(['all', 'active', 'closed'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setTaskStatusFilter(st)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      taskStatusFilter === st
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span className="capitalize">{st}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks Grid / Cards */}
          {filteredTasks.length === 0 ? (
            <div className="p-12 bg-white rounded-xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto text-xl">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No quick tasks found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {taskSearch
                  ? 'No quick tasks matched your search query.'
                  : 'Start by creating your first Quick Task. Contributors will be able to complete it directly with no CV or prior approval required.'}
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                + Create Quick Task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => {
                const subsForThisTask = quickTaskSubmissions.filter((s) => s.taskId === task.id);
                const pendingCount = subsForThisTask.filter((s) => s.status === 'pending').length;
                const approvedCount = subsForThisTask.filter((s) => s.status === 'approved').length;

                return (
                  <div
                    key={task.id}
                    className="p-5 bg-white rounded-xl border border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                              task.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {task.status === 'active' ? '● Active' : 'Closed'}
                          </span>
                          {task.reward && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <DollarSign className="w-2.5 h-2.5" />
                              {task.reward}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {task.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {task.description}
                      </p>

                      {/* Requirements Preview */}
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-100">
                        <span className="font-semibold text-slate-700 block text-[11px] mb-0.5">
                          Requirement:
                        </span>
                        <p className="text-slate-600 line-clamp-2 text-[11px]">
                          {task.submissionRequirements}
                        </p>
                      </div>

                      {/* Reference link if any */}
                      {task.referenceLink && (
                        <div className="mt-2 text-xs flex items-center gap-1 text-purple-600 truncate">
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="text-[11px] truncate">{task.referenceLink}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Stats & Action Bar */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      {/* Submissions count indicator */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Submissions:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{subsForThisTask.length} Total</span>
                          {pendingCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                              {pendingCount} Pending Review
                            </span>
                          ) : subsForThisTask.length > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {approvedCount} Approved
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">0 submissions</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedTaskId(task.id)}
                            className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View Submissions ({subsForThisTask.length})
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(task)}
                            className="px-3 py-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Edit Task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        </div>

                        {/* Dedicated Activate, Close, and Delete Buttons */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-100">
                          {/* Activate Button */}
                          <button
                            type="button"
                            onClick={() => updateQuickTask(task.id, { status: 'active' })}
                            disabled={task.status === 'active'}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                              task.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-90 cursor-default'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer'
                            }`}
                            title={task.status === 'active' ? 'Task is currently Active' : 'Activate this task for contributors'}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {task.status === 'active' ? 'Active' : 'Activate'}
                          </button>

                          {/* Close Button */}
                          <button
                            type="button"
                            onClick={() => updateQuickTask(task.id, { status: 'closed' })}
                            disabled={task.status === 'closed'}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                              task.status === 'closed'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200 opacity-90 cursor-default'
                                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xs cursor-pointer'
                            }`}
                            title={task.status === 'closed' ? 'Task is currently Closed' : 'Close task to prevent new submissions'}
                          >
                            <XCircle className="w-3 h-3" />
                            {task.status === 'closed' ? 'Closed' : 'Close'}
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmTaskId(task.id)}
                            className="py-1.5 px-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            title="Permanently Delete Task"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT QUICK TASK MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 block">
                  {editingTask ? 'Edit Quick Task' : 'New Quick Task'}
                </span>
                <h3 className="text-lg font-bold">
                  {editingTask ? 'Update Task Details' : 'Create Quick Task'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Share Nexora Workforce on LinkedIn"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-purple-600 bg-white"
                  required
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Short Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Create a short public post on LinkedIn introducing Nexora Workforce and share your link."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-purple-600 bg-white"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Displayed on user task cards as an overview.
                </p>
              </div>

              {/* Detailed Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detailed Task Instructions <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder={`1. Log into your LinkedIn account.\n2. Write a post introducing Nexora Workforce (https://nexora.work).\n3. Set post visibility to Public.\n4. Copy the URL of your published post and paste it into the submission field below.`}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-purple-600 bg-white leading-relaxed font-sans"
                  required
                />
              </div>

              {/* Submission Requirements */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Submission Requirements <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Direct public LinkedIn post URL. Optionally include notes or feedback in the text box."
                  value={formData.submissionRequirements}
                  onChange={(e) => setFormData({ ...formData, submissionRequirements: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-purple-600 bg-white"
                  required
                />
              </div>

              {/* Optional Reference Link & Optional Reward */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Optional Reference / Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com"
                    value={formData.referenceLink}
                    onChange={(e) => setFormData({ ...formData, referenceLink: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-purple-600 bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Clickable reference button for contributors.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reward / Compensation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $5.00 or Reward per submission"
                    value={formData.reward}
                    onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-purple-600 bg-white"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Task Status
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={() => setFormData({ ...formData, status: 'active' })}
                      className="text-purple-600"
                    />
                    <span>Active (Immediately visible to contributors)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="closed"
                      checked={formData.status === 'closed'}
                      onChange={() => setFormData({ ...formData, status: 'closed' })}
                      className="text-purple-600"
                    />
                    <span>Closed</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingTask ? 'Save Changes' : 'Publish Quick Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <XCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Reject Task Submission</h3>
            </div>
            <p className="text-xs text-slate-500">
              Provide feedback or instructions explaining why this submission for{' '}
              <span className="font-semibold text-slate-700">"{rejectingSub.taskTitle}"</span> is being rejected.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason / Feedback Note (optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Post visibility was set to Private, or link is broken. Please adjust to Public and re-submit."
                value={rejectionFeedback}
                onChange={(e) => setRejectionFeedback(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-rose-500 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingSub(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange(rejectingSub.id, 'rejected', rejectionFeedback.trim())}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmTaskId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Quick Task?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this Quick Task? Contributors will no longer be able to submit responses to it.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTaskId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTask(deleteConfirmTaskId)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
              >
                Yes, Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
