import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus, PaymentType, PaymentAmountType } from '../../types';
import { Badge } from '../common/Badge';
import { ALL_CATEGORIES } from '../../mockData';
import {
  FolderKanban,
  Plus,
  Search,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Users,
  ExternalLink,
  Calendar,
  X,
  CheckCircle2,
  RotateCcw,
  DollarSign,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { PaymentTypeConfigurator } from './PaymentTypeConfigurator';
import { formatProjectPayment, getPaymentUnitLabel } from '../../utils/paymentUtils';

interface AdminProjectsViewProps {
  onOpenCreateProject: () => void;
  onViewContributorsForProject: (projectId: string) => void;
  onViewApplicationsForProject?: (projectId: string) => void;
}

export const AdminProjectsView: React.FC<AdminProjectsViewProps> = ({
  onOpenCreateProject,
  onViewContributorsForProject,
  onViewApplicationsForProject,
}) => {
  const { projects, applications, updateProject, deleteProject } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Edit Modal State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editPaymentType, setEditPaymentType] = useState<PaymentType>('Per Hour');
  const [editRateType, setEditRateType] = useState<PaymentAmountType>('fixed');
  const [editFixedAmount, setEditFixedAmount] = useState('20.00');
  const [editMinAmount, setEditMinAmount] = useState('15.00');
  const [editMaxAmount, setEditMaxAmount] = useState('30.00');

  // In-app Delete Confirmation State
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.language.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const handleToggleStatus = (p: Project) => {
    const nextStatus: ProjectStatus = p.status === 'Open' ? 'Closed' : 'Open';
    updateProject(p.id, { status: nextStatus });
  };

  const handleMarkCompleted = (p: Project) => {
    const nextStatus: ProjectStatus = p.status === 'Completed' ? 'Open' : 'Completed';
    updateProject(p.id, { status: nextStatus });
  };

  const handleStartEdit = (p: Project) => {
    setEditingProject({ ...p });
    setEditPaymentType(p.paymentType || 'Per Hour');
    setEditRateType(p.paymentRateType || 'fixed');
    setEditFixedAmount(
      p.paymentAmount != null ? String(p.paymentAmount) : '20.00'
    );
    setEditMinAmount(
      p.paymentAmountMin != null ? String(p.paymentAmountMin) : '15.00'
    );
    setEditMaxAmount(
      p.paymentAmountMax != null ? String(p.paymentAmountMax) : '30.00'
    );
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    const unit = getPaymentUnitLabel(editPaymentType, false);
    let computedRatePay = '';
    if (editRateType === 'fixed') {
      const amt = parseFloat(editFixedAmount) || 0;
      computedRatePay = `$${amt.toFixed(2)} ${unit}`;
    } else {
      const min = parseFloat(editMinAmount) || 0;
      const max = parseFloat(editMaxAmount) || 0;
      computedRatePay = `$${min.toFixed(2)} - $${max.toFixed(2)} ${unit}`;
    }

    const updatedData: Partial<Project> = {
      ...editingProject,
      paymentType: editPaymentType,
      paymentRateType: editRateType,
      paymentAmount: editRateType === 'fixed' ? parseFloat(editFixedAmount) || 0 : undefined,
      paymentAmountMin: editRateType === 'range' ? parseFloat(editMinAmount) || 0 : undefined,
      paymentAmountMax: editRateType === 'range' ? parseFloat(editMaxAmount) || 0 : undefined,
      ratePay: computedRatePay,
    };

    updateProject(editingProject.id, updatedData);
    setEditingProject(null);
  };

  const handleConfirmDelete = () => {
    if (!projectToDelete) return;
    deleteProject(projectToDelete.id);
    setProjectToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Project Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure project specifications, manage capacity thresholds, and regulate status.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreateProject}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Create New Project
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, language..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Categories ({ALL_CATEGORIES.length})</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="Draft">Draft</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Project</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Compensation</th>
                <th className="px-4 py-3">Applicants (Applied / Review)</th>
                <th className="px-4 py-3">Capacity (Approved / Target)</th>
                <th className="px-4 py-3">Timeline</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map((p) => {
                const projectApps = applications.filter((a) => a.projectId === p.id);
                const totalApplied = projectApps.length;
                const pendingCount = projectApps.filter(
                  (a) => a.status === 'Applied' || a.status === 'Under Review'
                ).length;
                const approvedApps = projectApps.filter((a) => a.status === 'Approved').length;
                const actualApproved = Math.max(p.approvedContributors || 0, approvedApps);
                const rem = Math.max(0, p.requiredContributors - actualApproved);
                const fillPct = Math.min(
                  100,
                  Math.round((actualApproved / (p.requiredContributors || 1)) * 100)
                );
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 max-w-[240px]">
                      <div className="font-bold text-slate-900 truncate">{p.name}</div>
                      <span className="text-[10px] text-slate-400">{p.projectType}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{p.category}</td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{p.language}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{formatProjectPayment(p)}</span>
                      </div>
                      {p.paymentType && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {p.paymentType}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          {totalApplied} Applied
                        </span>
                        {pendingCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {pendingCount} Pending
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                            0 Pending
                          </span>
                        )}
                      </div>
                      {onViewApplicationsForProject && (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => onViewApplicationsForProject(p.id)}
                            className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1"
                          >
                            <span>Review Applications</span>
                            <span>→</span>
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap min-w-[160px]">
                      <div className="font-mono text-xs">
                        <span className="font-bold text-emerald-600">
                          {actualApproved.toLocaleString()}
                        </span>{' '}
                        /{' '}
                        <span className="text-slate-700">
                          {p.requiredContributors.toLocaleString()}
                        </span>{' '}
                        (<span className="font-semibold text-purple-600">{rem.toLocaleString()} rem</span>)
                      </div>
                      <div className="w-full max-w-[130px] bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between max-w-[130px]">
                        <span>{fillPct}% filled</span>
                        {rem === 0 && <span className="font-bold text-rose-600">Full</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                      {p.startDate} → {p.endDate}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge
                        variant={
                          p.status === 'Open'
                            ? 'green'
                            : p.status === 'Closed'
                            ? 'red'
                            : p.status === 'Completed'
                            ? 'purple'
                            : 'gray'
                        }
                      >
                        ● {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {onViewApplicationsForProject && (
                          <button
                            type="button"
                            onClick={() => onViewApplicationsForProject(p.id)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded relative"
                            title={`Review Applications (${totalApplied} applied, ${pendingCount} pending)`}
                          >
                            <FileText className="w-4 h-4" />
                            {pendingCount > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onViewContributorsForProject(p.id)}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded"
                          title="View Approved Contributors"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkCompleted(p)}
                          className={`p-1.5 rounded transition-colors ${
                            p.status === 'Completed'
                              ? 'text-purple-600 hover:text-emerald-600 hover:bg-purple-50'
                              : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
                          }`}
                          title={p.status === 'Completed' ? 'Re-open from Completed' : 'Mark as Completed'}
                        >
                          {p.status === 'Completed' ? (
                            <RotateCcw className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded"
                          title={p.status === 'Open' ? 'Close Project' : 'Re-open Project'}
                        >
                          {p.status === 'Open' ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                          title="Edit Project Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setProjectToDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
          <div className="relative w-full max-w-2xl my-6 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Edit Project: {editingProject.name}</h3>
                <p className="text-[11px] text-slate-500">Update status, payment compensation, and requirements</p>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={editingProject.name}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingProject.status}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        status: e.target.value as ProjectStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="Draft">Draft</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Required Contributors (Seats)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingProject.requiredContributors}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        requiredContributors: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Payment Type & Amount Range Configurator */}
              <div className="pt-2 border-t border-slate-100">
                <PaymentTypeConfigurator
                  paymentType={editPaymentType}
                  onChangePaymentType={setEditPaymentType}
                  rateType={editRateType}
                  onChangeRateType={setEditRateType}
                  fixedAmount={editFixedAmount}
                  onChangeFixedAmount={setEditFixedAmount}
                  minAmount={editMinAmount}
                  onChangeMinAmount={setEditMinAmount}
                  maxAmount={editMaxAmount}
                  onChangeMaxAmount={setEditMaxAmount}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProject.description}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Project Instructions
                </label>
                <textarea
                  rows={3}
                  value={editingProject.instructions}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, instructions: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Community Link</label>
                <input
                  type="text"
                  value={editingProject.communityLink}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, communityLink: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Important Announcement (Optional)
                </label>
                <input
                  type="text"
                  value={editingProject.announcement || ''}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, announcement: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Delete Project?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to permanently delete:
              </p>
              <div className="font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-2 text-xs">
                "{projectToDelete.name}"
              </div>
              <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100 mt-2.5 leading-relaxed">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-rose-500" />
                This will remove the project from the platform along with its active applicants and updates.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
