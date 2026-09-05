import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectUpdate } from '../../types';
import { Badge } from '../common/Badge';
import {
  BellRing,
  Plus,
  Send,
  Trash2,
  Edit2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';

export const AdminProjectUpdatesView: React.FC = () => {
  const { projects, projectUpdates, createProjectUpdate, deleteProjectUpdate } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states matching Section 28
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [communityLink, setCommunityLink] = useState('');

  const handleOpenCreate = () => {
    const proj = projects.find((p) => p.id === selectedProjectId) || projects[0];
    setTitle('');
    setMessage('');
    setInstructions('');
    setCommunityLink(proj ? proj.communityLink : '');
    setIsModalOpen(true);
  };

  const handleProjectSelectChange = (pId: string) => {
    setSelectedProjectId(pId);
    const proj = projects.find((p) => p.id === pId);
    if (proj && !communityLink) {
      setCommunityLink(proj.communityLink);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProjectUpdate({
      projectId: selectedProjectId,
      title,
      message,
      instructions: instructions || undefined,
      communityLink: communityLink || undefined,
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Project Updates & Directives</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Broadcast revised guidelines, tooling links, and operational announcements to approved
            contributors.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Publish New Directive
        </button>
      </div>

      {/* List of Published Updates */}
      <div className="space-y-4">
        {projectUpdates.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
            <BellRing className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No project updates published</p>
            <p className="text-xs text-slate-400 mt-1">
              Publish instructions or guidelines to notify all approved contributors on a project.
            </p>
          </div>
        ) : (
          projectUpdates.map((upd) => (
            <div
              key={upd.id}
              className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="purple" size="sm">
                      {upd.projectName}
                    </Badge>
                    <span className="text-[11px] text-slate-400">
                      Published: {new Date(upd.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{upd.title}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => deleteProjectUpdate(upd.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                  title="Delete Directive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{upd.message}</p>

              {upd.instructions && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-800 block mb-0.5 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    Directive Instructions:
                  </span>
                  {upd.instructions}
                </div>
              )}

              {upd.communityLink && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <a
                    href={upd.communityLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Target Discussion Channel <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    ✓ Broadcast to all approved contributors
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Publish Modal matching Section 28 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
          <div className="relative w-full max-w-lg my-6 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Publish Project Directive</h3>
                <p className="text-xs text-slate-500">
                  Approved contributors will receive an immediate in-app notification.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Project *</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleProjectSelectChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.approvedContributors} approved contributors)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Update Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Updated Guidelines for Batch 2 Evaluation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Update Message *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summarize the announcement or schedule change..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Important Instructions / Rubric
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific task steps, error thresholds, or formatting requirements..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Community Link</label>
                <input
                  type="text"
                  placeholder="https://community.nexora.work/c/channel"
                  value={communityLink}
                  onChange={(e) => setCommunityLink(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publish & Notify Contributors
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
