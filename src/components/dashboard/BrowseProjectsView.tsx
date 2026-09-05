import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectCategory } from '../../types';
import { ProjectCard } from './ProjectCard';
import { Search, Filter, SlidersHorizontal, Layers } from 'lucide-react';
import { ALL_CATEGORIES } from '../../mockData';

interface BrowseProjectsViewProps {
  onViewDetails: (project: Project) => void;
  onApply: (project: Project) => void;
  initialCategory?: string;
}

export const BrowseProjectsView: React.FC<BrowseProjectsViewProps> = ({
  onViewDetails,
  onApply,
  initialCategory,
}) => {
  const { projects } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Open' | 'Closed'>('ALL');
  const [languageFilter, setLanguageFilter] = useState<string>('ALL');

  // Extract unique languages
  const languagesList = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      p.language.split(',').forEach((l) => set.add(l.trim()));
      if (p.sourceLanguage) set.add(p.sourceLanguage.trim());
      if (p.targetLanguage) set.add(p.targetLanguage.trim());
    });
    return Array.from(set).filter(Boolean);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Search
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.skillsRequired.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.language.toLowerCase().includes(searchQuery.toLowerCase());

      // Category
      const matchCategory =
        selectedCategory === 'ALL' || p.category === selectedCategory;

      // Status
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;

      // Language
      const matchLanguage =
        languageFilter === 'ALL' ||
        p.language.toLowerCase().includes(languageFilter.toLowerCase()) ||
        p.sourceLanguage?.toLowerCase().includes(languageFilter.toLowerCase()) ||
        p.targetLanguage?.toLowerCase().includes(languageFilter.toLowerCase());

      return matchSearch && matchCategory && matchStatus && matchLanguage;
    });
  }, [projects, searchQuery, selectedCategory, statusFilter, languageFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Browse Projects</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Explore global AI data, translation, annotation, and linguistic evaluation opportunities.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
          Showing {filteredProjects.length} of {projects.length} opportunities
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, skill, language..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories (18 Types)</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Project Statuses</option>
              <option value="Open">Open Only (Accepting Applications)</option>
              <option value="Closed">Closed / Full</option>
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Languages</option>
              {languagesList.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Category Chips for Most Popular */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs">
          <span className="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" /> Quick Filter:
          </span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {[
            'Translation & Localization',
            'LLM Evaluation',
            'Speech / ASR Projects',
            'Image Annotation',
            'AI Data Collection',
          ].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
                selectedCategory === c
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Projects */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No matching projects found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or resetting filters to view all open opportunities.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setStatusFilter('ALL');
              setLanguageFilter('ALL');
            }}
            className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onViewDetails={onViewDetails}
              onApply={onApply}
            />
          ))}
        </div>
      )}
    </div>
  );
};
