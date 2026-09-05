import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus } from '../../types';
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
} from 'lucide-react';

interface AdminProjectsViewProps {
  onOpenCreateProject: () => void;
  onViewContributorsForProject: (projectId: string) => void;
}

export const AdminProjectsView: React.FC<AdminProjectsViewProps> = ({
  onOpenCreateProject,
  onViewContributorsForProject,
}) => {
  const { projects, updateProject, deleteProject } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Edit Modal State
  const [editingProject, setEditingProject] = useState<Project | null>(null);

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

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    updateProject(editingProject.id, editingProject);
    setEditingProject(null);
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
                <th className="px-4 py-3">Capacity (Approved / Req / Rem)</th>
                <th className="px-4 py-3">Timeline</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map((p) => {
                const rem = Math.max(0, p.requiredContributors - p.approvedContributors);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 max-w-[240px]">
                      <div className="font-bold text-slate-900 truncate">{p.name}</div>
                      <span className="text-[10px] text-slate-400">{p.projectType}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{p.category}</td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{p.language}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-mono text-xs">
                        <span className="font-bold text-emerald-600">
                          {p.approvedContributors}
                        </span>{' '}
                        /{' '}
                        <span className="text-slate-700">
                          {p.requiredContributors.toLocaleString()}
                        </span>{' '}
                        (<span className="font-semibold text-purple-600">{rem} rem</span>)
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
                            : 'gray'
                        }
                      >
                        ● {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
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
                          onClick={() => setEditingProject({ ...p })}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                          title="Edit Project Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete project "${p.name}"?`)) {
                              deleteProject(p.id);
                            }
                          }}
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
              <h3 className="text-sm font-bold text-slate-900">Edit Project: {editingProject.name}</h3>
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
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
