import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectPaymentRecord } from '../../types';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle2,
  ListChecks,
  FileSpreadsheet,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  HelpCircle,
  Download,
  Info,
  Layers,
  ArrowUpDown,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

export const AdminProjectPaymentRecordsView: React.FC = () => {
  const {
    projectPaymentRecords,
    createProjectPaymentRecord,
    updateProjectPaymentRecord,
    deleteProjectPaymentRecord,
    refreshProjectPaymentRecords,
    isSyncing,
  } = useApp();

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>(''); // YYYY-MM or YYYY-MM-DD
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'name-asc'>('date-desc');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProjectPaymentRecord | null>(null);

  // Form Fields
  const [formProjectName, setFormProjectName] = useState('');
  const [formProjectBatch, setFormProjectBatch] = useState('');
  const [formTotalTasksSubmitted, setFormTotalTasksSubmitted] = useState<string>('');
  const [formTotalApprovedTasks, setFormTotalApprovedTasks] = useState<string>('');
  const [formTotalPaymentDistributed, setFormTotalPaymentDistributed] = useState<string>('');
  const [formPaymentDate, setFormPaymentDate] = useState<string>('');
  const [formAdditionalNotes, setFormAdditionalNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [recordToDelete, setRecordToDelete] = useState<ProjectPaymentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Note View Modal (for reading long notes)
  const [activeNoteRecord, setActiveNoteRecord] = useState<ProjectPaymentRecord | null>(null);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    setFormProjectName('');
    setFormProjectBatch('');
    setFormTotalTasksSubmitted('');
    setFormTotalApprovedTasks('');
    setFormTotalPaymentDistributed('');
    // Default payment date to current local date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    setFormPaymentDate(today);
    setFormAdditionalNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (record: ProjectPaymentRecord) => {
    setEditingRecord(record);
    setFormProjectName(record.projectName);
    setFormProjectBatch(record.projectBatch);
    setFormTotalTasksSubmitted(String(record.totalTasksSubmitted));
    setFormTotalApprovedTasks(record.totalApprovedTasks !== undefined ? String(record.totalApprovedTasks) : '');
    setFormTotalPaymentDistributed(String(record.totalPaymentDistributed));
    setFormPaymentDate(record.paymentDate);
    setFormAdditionalNotes(record.additionalNotes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Form Submission
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate inputs
    const projectNameTrimmed = formProjectName.trim();
    if (!projectNameTrimmed) {
      setFormError('Please enter a project name.');
      return;
    }

    const batchTrimmed = formProjectBatch.trim();
    if (!batchTrimmed) {
      setFormError('Please enter a project batch name or number.');
      return;
    }

    const submittedNum = Number(formTotalTasksSubmitted);
    if (formTotalTasksSubmitted === '' || isNaN(submittedNum) || submittedNum < 0) {
      setFormError('Please enter a valid number for total tasks submitted (0 or greater).');
      return;
    }

    let approvedNum: number | undefined = undefined;
    if (formTotalApprovedTasks.trim() !== '') {
      const parsedApproved = Number(formTotalApprovedTasks);
      if (isNaN(parsedApproved) || parsedApproved < 0) {
        setFormError('Approved tasks must be a valid number (0 or greater).');
        return;
      }
      if (parsedApproved > submittedNum) {
        setFormError('Total approved tasks cannot exceed total tasks submitted.');
        return;
      }
      approvedNum = Math.floor(parsedApproved);
    }

    const paymentNum = Number(formTotalPaymentDistributed);
    if (formTotalPaymentDistributed === '' || isNaN(paymentNum) || paymentNum < 0) {
      setFormError('Please enter a valid amount for total payment distributed (USD).');
      return;
    }

    if (!formPaymentDate.trim()) {
      setFormError('Please choose a payment date.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingRecord) {
        // Update existing record
        const res = await updateProjectPaymentRecord(editingRecord.id, {
          projectName: projectNameTrimmed,
          projectBatch: batchTrimmed,
          totalTasksSubmitted: Math.floor(submittedNum),
          totalApprovedTasks: approvedNum,
          totalPaymentDistributed: paymentNum,
          paymentDate: formPaymentDate.trim(),
          additionalNotes: formAdditionalNotes.trim() || undefined,
        });

        if (res.success) {
          setIsModalOpen(false);
        } else {
          setFormError(res.message || 'Failed to update record');
        }
      } else {
        // Create new record
        const res = await createProjectPaymentRecord({
          projectName: projectNameTrimmed,
          projectBatch: batchTrimmed,
          totalTasksSubmitted: Math.floor(submittedNum),
          totalApprovedTasks: approvedNum,
          totalPaymentDistributed: paymentNum,
          paymentDate: formPaymentDate.trim(),
          additionalNotes: formAdditionalNotes.trim() || undefined,
        });

        if (res.success) {
          setIsModalOpen(false);
        } else {
          setFormError(res.message || 'Failed to save record');
        }
      }
    } catch (err: any) {
      setFormError(err?.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      setIsDeleting(true);
      await deleteProjectPaymentRecord(recordToDelete.id);
      setRecordToDelete(null);
    } catch (err) {
      console.error('Failed to delete record:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Distinct Batches for Filter Dropdown
  const uniqueBatches = useMemo(() => {
    const set = new Set<string>();
    projectPaymentRecords.forEach((r) => {
      if (r.projectBatch && r.projectBatch.trim()) {
        set.add(r.projectBatch.trim());
      }
    });
    return Array.from(set).sort();
  }, [projectPaymentRecords]);

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    return projectPaymentRecords
      .filter((record) => {
        // Search filter (project name, batch, notes)
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = record.projectName.toLowerCase().includes(q);
          const matchBatch = record.projectBatch.toLowerCase().includes(q);
          const matchNotes = (record.additionalNotes || '').toLowerCase().includes(q);
          if (!matchName && !matchBatch && !matchNotes) return false;
        }

        // Batch filter
        if (selectedBatchFilter !== 'all') {
          if (record.projectBatch.toLowerCase() !== selectedBatchFilter.toLowerCase()) {
            return false;
          }
        }

        // Date filter
        if (dateFilter.trim()) {
          if (!record.paymentDate.startsWith(dateFilter.trim())) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'date-desc') {
          const cmp = (b.paymentDate || '').localeCompare(a.paymentDate || '');
          if (cmp !== 0) return cmp;
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        }
        if (sortOrder === 'date-asc') {
          const cmp = (a.paymentDate || '').localeCompare(b.paymentDate || '');
          if (cmp !== 0) return cmp;
          return (a.createdAt || '').localeCompare(b.createdAt || '');
        }
        if (sortOrder === 'amount-desc') {
          return (b.totalPaymentDistributed || 0) - (a.totalPaymentDistributed || 0);
        }
        if (sortOrder === 'amount-asc') {
          return (a.totalPaymentDistributed || 0) - (b.totalPaymentDistributed || 0);
        }
        if (sortOrder === 'name-asc') {
          return a.projectName.localeCompare(b.projectName);
        }
        return 0;
      });
  }, [projectPaymentRecords, searchTerm, selectedBatchFilter, dateFilter, sortOrder]);

  // Dashboard Aggregates (Requirement 3: Total Project Records, Total Tasks Submitted, Total Approved Tasks, Total Payments Distributed)
  const dashboardStats = useMemo(() => {
    const totalRecords = projectPaymentRecords.length;
    let totalTasksSubmitted = 0;
    let totalApprovedTasks = 0;
    let totalPaymentsDistributed = 0;

    projectPaymentRecords.forEach((r) => {
      totalTasksSubmitted += Number(r.totalTasksSubmitted) || 0;
      if (r.totalApprovedTasks !== undefined && r.totalApprovedTasks !== null) {
        totalApprovedTasks += Number(r.totalApprovedTasks) || 0;
      }
      totalPaymentsDistributed += Number(r.totalPaymentDistributed) || 0;
    });

    return {
      totalRecords,
      totalTasksSubmitted,
      totalApprovedTasks,
      totalPaymentsDistributed,
    };
  }, [projectPaymentRecords]);

  // Filtered view summary totals (for currently filtered rows)
  const filteredStats = useMemo(() => {
    let tasksSubmitted = 0;
    let approvedTasks = 0;
    let paymentDistributed = 0;

    filteredRecords.forEach((r) => {
      tasksSubmitted += Number(r.totalTasksSubmitted) || 0;
      if (r.totalApprovedTasks !== undefined && r.totalApprovedTasks !== null) {
        approvedTasks += Number(r.totalApprovedTasks) || 0;
      }
      paymentDistributed += Number(r.totalPaymentDistributed) || 0;
    });

    return {
      count: filteredRecords.length,
      tasksSubmitted,
      approvedTasks,
      paymentDistributed,
    };
  }, [filteredRecords]);

  // Export filtered records to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = [
      'Record ID',
      'Project Name',
      'Project Batch',
      'Total Tasks Submitted',
      'Total Approved Tasks',
      'Total Payment Distributed (USD)',
      'Payment Date',
      'Additional Notes',
      'Created At',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.id}"`,
      `"${r.projectName.replace(/"/g, '""')}"`,
      `"${r.projectBatch.replace(/"/g, '""')}"`,
      r.totalTasksSubmitted,
      r.totalApprovedTasks !== undefined ? r.totalApprovedTasks : '',
      r.totalPaymentDistributed.toFixed(2),
      `"${r.paymentDate}"`,
      `"${(r.additionalNotes || '').replace(/"/g, '""')}"`,
      `"${r.createdAt || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexora_project_payment_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedBatchFilter('all');
    setDateFilter('');
    setSortOrder('date-desc');
  };

  const hasActiveFilters = searchTerm !== '' || selectedBatchFilter !== 'all' || dateFilter !== '';

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Project Payment Records</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                  Admin Notebook
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Personal administrative financial notebook to manually maintain the payment and work history of every project and batch.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {projectPaymentRecords.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              title="Export current view to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Export CSV
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            + Add Project Record
          </button>
        </div>
      </div>

      {/* Internal Security & Isolation Notice */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-blue-950">Internal Manual Notebook:</strong>{' '}
          All entries in this notebook are entered manually by the administrator and stored privately. Saving, editing, or deleting records here{' '}
          <strong className="underline">will NOT</strong> transfer money, alter contributor wallet balances, or trigger automatic payment runs.
        </div>
      </div>

      {/* Section 3: Admin Dashboard Summary (Clean Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Project Records */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Project Records</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{dashboardStats.totalRecords.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-medium">saved entries</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Across {uniqueBatches.length} project batches</span>
          </div>
        </div>

        {/* Card 2: Total Tasks Submitted */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks Submitted</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <ListChecks className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{dashboardStats.totalTasksSubmitted.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-medium">tasks recorded</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Aggregated batch work</span>
          </div>
        </div>

        {/* Card 3: Total Approved Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Approved Tasks</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{dashboardStats.totalApprovedTasks.toLocaleString()}</span>
            {dashboardStats.totalTasksSubmitted > 0 && (
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                {((dashboardStats.totalApprovedTasks / dashboardStats.totalTasksSubmitted) * 100).toFixed(1)}% approved
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>Passed quality evaluation</span>
          </div>
        </div>

        {/* Card 4: Total Payments Distributed */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-white to-blue-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Payments Distributed</span>
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">
              ${dashboardStats.totalPaymentsDistributed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-blue-600">USD</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Cumulative distributed across all saved batches</span>
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by project name, batch, or notes..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-all text-slate-800 placeholder-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Batch Filter Dropdown */}
          <div className="md:col-span-3">
            <div className="relative">
              <select
                value={selectedBatchFilter}
                onChange={(e) => setSelectedBatchFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-colors text-slate-800 cursor-pointer appearance-none pr-8"
              >
                <option value="all">All Batches ({uniqueBatches.length})</option>
                {uniqueBatches.map((b) => (
                  <option key={b} value={b}>
                    Batch: {b}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Payment Date Filter */}
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-colors text-slate-800 cursor-pointer"
                title="Filter by payment date"
              />
            </div>
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-2">
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-colors text-slate-800 cursor-pointer appearance-none pr-8"
              >
                <option value="date-desc">Newest Date</option>
                <option value="date-asc">Oldest Date</option>
                <option value="amount-desc">Highest Payment</option>
                <option value="amount-asc">Lowest Payment</option>
                <option value="name-asc">Project Name (A-Z)</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filters Summary Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-medium">
                Showing {filteredRecords.length} of {projectPaymentRecords.length} records
              </span>
              <span className="text-slate-300">•</span>
              <span>
                Filtered Total:{' '}
                <strong className="text-blue-700 font-bold">
                  ${filteredStats.paymentDistributed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Records Table / Notebook View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {projectPaymentRecords.length === 0 ? 'No Project Payment Records Yet' : 'No Records Match Your Filters'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
              {projectPaymentRecords.length === 0
                ? 'Use this private administrative notebook to log manual payment records, batches, submitted and approved tasks, and disbursed amounts.'
                : 'Try adjusting your search keywords, batch filter, or date selection to view other records.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {projectPaymentRecords.length === 0 ? (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  + Add Your First Project Record
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-200 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th scope="col" className="py-3.5 px-4 font-semibold">
                    Project & Batch
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold">
                    Payment Date
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold text-center">
                    Tasks (Submitted / Approved)
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold text-right">
                    Payment Distributed
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold">
                    Notes
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredRecords.map((record, index) => {
                  const hasApproved = record.totalApprovedTasks !== undefined && record.totalApprovedTasks !== null;
                  const approvalRate =
                    hasApproved && record.totalTasksSubmitted > 0
                      ? ((record.totalApprovedTasks! / record.totalTasksSubmitted) * 100).toFixed(0)
                      : null;

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* Project Name & Batch */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-slate-900 text-sm leading-snug">{record.projectName}</div>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-800 font-semibold text-[10px]">
                            <Layers className="w-2.5 h-2.5 text-blue-600" />
                            {record.projectBatch}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {record.id.slice(0, 14)}</span>
                        </div>
                      </td>

                      {/* Payment Date */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{record.paymentDate}</span>
                        </div>
                        {record.createdAt && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Logged: {new Date(record.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </td>

                      {/* Tasks Submitted / Approved */}
                      <td className="py-4 px-4 align-top text-center">
                        <div className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                          <span className="text-slate-900 font-black">{record.totalTasksSubmitted.toLocaleString()}</span>
                          <span className="text-slate-400 font-normal">sub</span>
                          {hasApproved ? (
                            <>
                              <span className="text-slate-300">/</span>
                              <span className="text-emerald-700 font-black">{record.totalApprovedTasks!.toLocaleString()}</span>
                              <span className="text-emerald-600 font-normal">app</span>
                            </>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-normal italic">(- app)</span>
                          )}
                        </div>
                        {approvalRate !== null && (
                          <div className="mt-1 flex items-center justify-center gap-1">
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min(100, Number(approvalRate))}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700">{approvalRate}%</span>
                          </div>
                        )}
                      </td>

                      {/* Payment Distributed */}
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        <div className="text-base font-black text-slate-900 tracking-tight">
                          ${record.totalPaymentDistributed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">USD Distr.</span>
                      </td>

                      {/* Additional Notes */}
                      <td className="py-4 px-4 align-top max-w-xs">
                        {record.additionalNotes ? (
                          <div>
                            <p className="line-clamp-2 text-slate-600 text-xs leading-relaxed">{record.additionalNotes}</p>
                            {record.additionalNotes.length > 80 && (
                              <button
                                type="button"
                                onClick={() => setActiveNoteRecord(record)}
                                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold mt-0.5 cursor-pointer underline"
                              >
                                View full note
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No notes</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(record)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecordToDelete(record)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Footer with Summary Calculation */}
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                <tr>
                  <td className="py-3 px-4" colSpan={2}>
                    <div className="flex items-center gap-2">
                      <span className="uppercase text-[11px] tracking-wider text-slate-600 font-extrabold">Notebook Total:</span>
                      <span className="text-xs text-slate-700 font-semibold">({filteredRecords.length} records shown)</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-extrabold">{filteredStats.tasksSubmitted.toLocaleString()}</span> submitted
                    {filteredStats.approvedTasks > 0 && (
                      <span className="text-emerald-700 ml-1.5">({filteredStats.approvedTasks.toLocaleString()} approved)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-black text-blue-900">
                      ${filteredStats.paymentDistributed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-blue-700 block font-bold">USD Total</span>
                  </td>
                  <td className="py-3 px-4" colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Create or Edit Project Payment Record */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">
                    {editingRecord ? 'Edit Project Payment Record' : '+ Add Project Record'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {editingRecord ? 'Update your manual payment record entry' : 'Log a new manual payment entry into your notebook'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRecord} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Requirement 1: Project Name & Project Batch (Manually editable, no forced dropdown) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formProjectName}
                    onChange={(e) => setFormProjectName(e.target.value)}
                    placeholder="e.g. Arabic Translation & Annotation"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl outline-hidden transition-all text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Manually entered project title</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Project Batch <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formProjectBatch}
                    onChange={(e) => setFormProjectBatch(e.target.value)}
                    placeholder="e.g. Batch-01 or Q3-Evaluation"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl outline-hidden transition-all text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Enter batch name or number yourself</span>
                </div>
              </div>

              {/* Requirement 1: Total Tasks Submitted & Total Approved Tasks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Total Tasks Submitted <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formTotalTasksSubmitted}
                    onChange={(e) => setFormTotalTasksSubmitted(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl outline-hidden transition-all text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Total work tasks submitted in batch</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Total Approved Tasks <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formTotalApprovedTasks}
                    onChange={(e) => setFormTotalApprovedTasks(e.target.value)}
                    placeholder="e.g. 1420"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl outline-hidden transition-all text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Accepted / quality passed tasks</span>
                </div>
              </div>

              {/* Requirement 1: Total Payment Distributed & Payment Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Total Payment Distributed ($ USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formTotalPaymentDistributed}
                      onChange={(e) => setFormTotalPaymentDistributed(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl outline-hidden transition-all text-slate-900 font-semibold"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Gross USD disbursed for this batch</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formPaymentDate}
                    onChange={(e) => setFormPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl outline-hidden transition-all text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Date of payment disbursement</span>
                </div>
              </div>

              {/* Requirement 1: Additional Notes (Large text field) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Additional Notes <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={4}
                  value={formAdditionalNotes}
                  onChange={(e) => setFormAdditionalNotes(e.target.value)}
                  placeholder="Record payment transaction IDs, banking references, contributor breakdown details, rate per task ($0.25/task), batch milestones, or any administrative notes..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl outline-hidden transition-all text-slate-900 leading-relaxed resize-y"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Saving...'
                  ) : editingRecord ? (
                    'Update Record'
                  ) : (
                    'Save Record'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Project Payment Record?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete this record from your notebook? This action cannot be undone.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700">
              <div>
                <strong className="text-slate-900">Project:</strong> {recordToDelete.projectName}
              </div>
              <div>
                <strong className="text-slate-900">Batch:</strong> {recordToDelete.projectBatch}
              </div>
              <div>
                <strong className="text-slate-900">Payment Date:</strong> {recordToDelete.paymentDate}
              </div>
              <div>
                <strong className="text-slate-900">Payment Amount:</strong>{' '}
                <span className="text-blue-700 font-bold">
                  ${recordToDelete.totalPaymentDistributed.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Full Note Viewer */}
      {activeNoteRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Additional Notes</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveNoteRecord(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <div>
                <strong>Project:</strong> {activeNoteRecord.projectName} ({activeNoteRecord.projectBatch})
              </div>
              <div>
                <strong>Payment Date:</strong> {activeNoteRecord.paymentDate}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-sans">
              {activeNoteRecord.additionalNotes}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveNoteRecord(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
