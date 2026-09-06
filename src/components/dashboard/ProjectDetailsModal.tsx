import React from 'react';
import { Project } from '../../types';
import { Badge } from '../common/Badge';
import {
  X,
  Calendar,
  Users,
  Award,
  Globe,
  MessageSquare,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  Clock,
  Sparkles,
  Layers,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatProjectPayment } from '../../utils/paymentUtils';

interface ProjectDetailsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyClick: (project: Project) => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  isOpen,
  onClose,
  onApplyClick,
}) => {
  const { currentUser, applications } = useApp();

  if (!isOpen || !project) return null;

  const remainingSeats = Math.max(0, project.requiredContributors - project.approvedContributors);
  const percentFilled = Math.min(
    100,
    Math.round((project.approvedContributors / (project.requiredContributors || 1)) * 100)
  );

  const userApplication = currentUser
    ? applications.find((a) => a.projectId === project.id && a.userId === currentUser.id)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
      <div
        id="project-details-modal"
        className="relative w-full max-w-3xl my-8 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="blue">{project.category}</Badge>
              <Badge variant="indigo">{project.projectType}</Badge>
              <Badge
                variant={
                  project.status === 'Open'
                    ? 'green'
                    : project.status === 'Closed'
                    ? 'red'
                    : project.status === 'Completed'
                    ? 'purple'
                    : 'gray'
                }
              >
                ● {project.status}
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                {project.sourceLanguage && project.targetLanguage
                  ? `${project.sourceLanguage} → ${project.targetLanguage}`
                  : project.language}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Start Date: {project.startDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                Deadline: {project.applicationDeadline}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Capacity Progress Banner */}
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-indigo-950 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" /> Contributor Seats
              </span>
              <span className="text-indigo-700 font-bold">{percentFilled}% Capacity</span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden mb-2">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${percentFilled}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-lg border border-indigo-100/60 shadow-2xs">
                <p className="text-slate-400 text-[11px]">Required</p>
                <p className="font-bold text-slate-900">
                  {project.requiredContributors.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-indigo-100/60 shadow-2xs">
                <p className="text-slate-400 text-[11px]">Approved</p>
                <p className="font-bold text-emerald-600">
                  {project.approvedContributors.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-indigo-100/60 shadow-2xs">
                <p className="text-slate-400 text-[11px]">Remaining</p>
                <p className="font-bold text-indigo-600">{remainingSeats.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              About The Project & Scope of Work
            </h4>
            <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              {project.description}
            </p>
          </div>

          {/* Two-Column Grid: Requirements and Qualification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                Requirements & Eligibility
              </h4>
              <div>
                <p className="text-xs text-slate-500 font-medium">Minimum Requirement:</p>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">
                  {project.minimumRequirement || 'Open to all qualified contributors.'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1.5">Required Skills:</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.skillsRequired.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-md font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Compensation Model:</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {formatProjectPayment(project)}
                  </span>
                  {project.paymentType && (
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      {project.paymentType}
                    </span>
                  )}
                  {project.paymentRateType && (
                    <span className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                      {project.paymentRateType === 'fixed' ? 'Fixed Rate' : 'Rate Range'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-600" />
                Qualification & Assessment
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">Qualification Test:</span>
                {project.qualificationRequired ? (
                  <Badge variant="purple">Test Required</Badge>
                ) : (
                  <Badge variant="green">No Test Required</Badge>
                )}
              </div>
              {project.qualificationTestInfo && (
                <div className="p-2.5 bg-purple-50/50 rounded-lg border border-purple-100 text-xs text-purple-900">
                  <p className="font-semibold mb-0.5">Test Details:</p>
                  <p>{project.qualificationTestInfo}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500">Project Timeline:</p>
                <p className="text-xs font-medium text-slate-800">
                  {project.startDate} to {project.endDate}
                </p>
              </div>
            </div>
          </div>

          {/* Project Instructions & Community */}
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" /> Contributor Instructions
              </h4>
              <p className="text-xs text-slate-700 leading-normal">{project.instructions}</p>
            </div>

            {project.announcement && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Important Announcement: </span>
                  {project.announcement}
                </div>
              </div>
            )}

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-950">
                  Contributor Discussion & Community Channel:
                </span>
              </div>
              <a
                href={project.communityLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
              >
                Access Community <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Close
          </button>

          <div>
            {userApplication ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Your application:</span>
                <Badge
                  variant={
                    userApplication.status === 'Approved'
                      ? 'green'
                      : userApplication.status === 'Under Review'
                      ? 'amber'
                      : userApplication.status === 'Waitlisted'
                      ? 'purple'
                      : userApplication.status === 'Rejected'
                      ? 'red'
                      : 'blue'
                  }
                >
                  {userApplication.status}
                </Badge>
              </div>
            ) : project.status === 'Completed' ? (
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50 rounded-lg border border-purple-200">
                  Project Completed
                </span>
              </div>
            ) : project.status === 'Closed' ? (
              <button
                disabled
                className="px-4 py-2 text-sm font-semibold text-slate-400 bg-slate-200 rounded-lg cursor-not-allowed"
              >
                Project Closed (Capacity Reached)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApplyClick(project);
                }}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                Apply Now <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
