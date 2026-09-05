import React from 'react';
import { Project } from '../../types';
import { Badge } from '../common/Badge';
import { Calendar, Users, Globe, ArrowUpRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ProjectCardProps {
  project: Project;
  onViewDetails: (project: Project) => void;
  onApply: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onViewDetails,
  onApply,
}) => {
  const { currentUser, applications } = useApp();

  const remainingSeats = Math.max(0, project.requiredContributors - project.approvedContributors);
  const userApp = currentUser
    ? applications.find((a) => a.projectId === project.id && a.userId === currentUser.id)
    : null;

  return (
    <div
      id={`project-card-${project.id}`}
      className="bg-white rounded-xl border border-slate-200 hover:border-indigo-200/80 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
    >
      {/* Card Header & Badges */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="blue" size="sm">
            {project.category}
          </Badge>
          <Badge
            variant={
              project.status === 'Open'
                ? 'green'
                : project.status === 'Closed'
                ? 'red'
                : 'gray'
            }
            size="sm"
          >
            ● {project.status}
          </Badge>
        </div>

        <h3
          onClick={() => onViewDetails(project)}
          className="font-bold text-slate-900 text-base mb-1.5 group-hover:text-indigo-600 cursor-pointer transition-colors line-clamp-2"
        >
          {project.name}
        </h3>

        <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          {project.sourceLanguage && project.targetLanguage
            ? `${project.sourceLanguage} → ${project.targetLanguage}`
            : project.language}
          <span className="text-slate-300">•</span>
          <span className="text-slate-600 font-medium">{project.projectType}</span>
        </p>

        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {project.description}
        </p>

        {/* Structured Spec Grid matching Section 22 */}
        <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="block text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Required
            </span>
            <span className="font-bold text-slate-800 text-xs">
              {project.requiredContributors.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Approved
            </span>
            <span className="font-bold text-emerald-600 text-xs">
              {project.approvedContributors.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Remaining
            </span>
            <span className="font-bold text-indigo-600 text-xs">
              {remainingSeats.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" /> Start: {project.startDate}
          </span>
          {project.ratePay && (
            <span className="font-semibold text-emerald-700">{project.ratePay}</span>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(project)}
          className="flex-1 py-1.5 px-3 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors text-center"
        >
          VIEW DETAILS
        </button>

        {userApp ? (
          <span className="flex-1 py-1.5 px-2 text-center text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-md border border-emerald-200/60">
            {userApp.status === 'Approved' ? 'Active' : userApp.status}
          </span>
        ) : project.status === 'Closed' ? (
          <span className="flex-1 py-1.5 px-2 text-center text-xs font-semibold text-slate-400 bg-slate-100 rounded-md">
            Full
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onApply(project)}
            className="flex-1 py-1.5 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-2xs transition-colors text-center flex items-center justify-center gap-1"
          >
            APPLY NOW
            <ArrowUpRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
