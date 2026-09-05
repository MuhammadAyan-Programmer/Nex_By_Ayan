import React, { useState } from 'react';
import { Project, ProjectCategory } from '../../types';
import { ALL_CATEGORIES } from '../../mockData';
import { ProjectCard } from '../dashboard/ProjectCard';
import {
  Globe,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  Compass,
  Briefcase,
  Layers,
  ChevronRight,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { LogoIcon } from '../common/Logo';

interface PublicWebsiteProps {
  projects: Project[];
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onViewProjectDetails: (project: Project) => void;
  onSelectCategory: (categoryName: string) => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  projects,
  onOpenLogin,
  onOpenRegister,
  onViewProjectDetails,
  onSelectCategory,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  const filteredProjects = projects.filter((p) =>
    activeCategoryFilter === 'ALL' ? true : p.category === activeCategoryFilter
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Public Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon size={36} />
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">
                Nexora Workforce
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                Global AI & Language Platform
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#categories" className="hover:text-indigo-600 transition-colors">
              Work Types & Categories
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <a href="#projects" className="hover:text-indigo-600 transition-colors">
              Featured Projects
            </a>
            <a href="#why-nexora" className="hover:text-indigo-600 transition-colors">
              Why Nexora
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={onOpenRegister}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              Join as Contributor
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 bg-slate-50/50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Global Remote Workforce Platform
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Connect with Global AI Data, Translation & Annotation Projects
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Join thousands of skilled linguists, evaluators, and data specialists worldwide.
              Complete qualification benchmarks, work on high-impact artificial intelligence models,
              and receive verified milestone payouts.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#projects"
                className="w-full sm:w-auto px-6 py-3 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4 text-indigo-600" />
                Browse Open Opportunities
              </a>
              <button
                type="button"
                onClick={onOpenRegister}
                className="w-full sm:w-auto px-6 py-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                Join as Contributor
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-8 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div>
                <span className="text-xl font-bold text-slate-900">18+</span>
                <span className="block text-[11px] text-slate-500 font-medium">
                  Work Categories
                </span>
              </div>
              <div>
                <span className="text-xl font-bold text-slate-900">100%</span>
                <span className="block text-[11px] text-slate-500 font-medium">
                  Remote & Flexible
                </span>
              </div>
              <div>
                <span className="text-xl font-bold text-slate-900">4 Gateways</span>
                <span className="block text-[11px] text-slate-500 font-medium">
                  Payoneer, PayPal & Bank
                </span>
              </div>
              <div>
                <span className="text-xl font-bold text-slate-900">Real-time</span>
                <span className="block text-[11px] text-slate-500 font-medium">
                  Seats & Capacity Tracking
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 18 Work Categories Section (Section 2) */}
      <section id="categories" className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Specialized Taxonomies
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Project Categories & Types of Work
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              From LLM safety alignment to multimodal bounding boxes and multilingual speech
              recognition.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {ALL_CATEGORIES.map((cat, idx) => (
              <div
                key={cat.name}
                onClick={() => {
                  setActiveCategoryFilter(cat.name);
                  const el = document.getElementById('projects');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group bg-slate-50/40 hover:bg-white"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[11px]">
                    {idx + 1}
                  </span>
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {cat.name}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed pl-8">
                  {cat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section (Section 1) */}
      <section id="how-it-works" className="py-16 bg-slate-50/60 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Contributor Journey
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              How Nexora Workforce Operates
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              A transparent four-step cycle designed for linguistic accuracy, merit, and predictable
              compensation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="font-bold text-sm text-slate-900">Create & Verify Account</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Register as a global contributor, complete email verification, and catalog your
                linguistic competencies and experience.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="font-bold text-sm text-slate-900">Browse & Apply</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Inspect project requirements, remaining contributor seats, and submit your targeted
                qualification dossier.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="font-bold text-sm text-slate-900">Get Approved & Deliver</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Once reviewed by administrators, your project appears under Active Projects with
                instructions and community links.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                04
              </div>
              <h3 className="font-bold text-sm text-slate-900">Milestone Payouts</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive milestone earnings directly into your available balance, and request manual
                withdrawals via Payoneer, PayPal, or Bank Transfer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section (Section 22) */}
      <section id="projects" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Live Opportunities
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                Open Projects & Tasks
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Real-time seat availability across open global projects.
              </p>
            </div>

            {activeCategoryFilter !== 'ALL' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Filtered by: {activeCategoryFilter}</span>
                <button
                  onClick={() => setActiveCategoryFilter('ALL')}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.slice(0, 6).map((proj) => (
              <ProjectCard
                key={proj.id}
                project={proj}
                onViewDetails={onViewProjectDetails}
                onApply={() => onOpenLogin()}
              />
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={onOpenRegister}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors inline-flex items-center gap-2"
            >
              Sign Up to Access All {projects.length} Projects <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Nexora Section */}
      <section id="why-nexora" className="py-16 bg-slate-50/70 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Enterprise Standards
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Built for Precision, Transparency, and Contributor Respect
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Nexora Workforce was engineered from the ground up to eliminate ambiguity in online
                contributor tasks. Every project lists explicit capacity seats, qualification
                criteria, and start dates upfront.
              </p>

              <div className="space-y-2.5 pt-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-time contributor capacity counts and remaining seat indicators.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Direct collaboration channels and guidelines for approved contributors.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Manual review and payout processing via verified global gateways.</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
                Platform Verification Checklist
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-bold text-slate-900 block">AI Data Training</span>
                  <span className="text-slate-500 text-[11px]">RLHF, SFT & Rubrics</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-bold text-slate-900 block">Localization</span>
                  <span className="text-slate-500 text-[11px]">80+ Language Pairs</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-bold text-slate-900 block">Speech Audio</span>
                  <span className="text-slate-500 text-[11px]">ASR, Phonetics, Accents</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-bold text-slate-900 block">Multimodal Vision</span>
                  <span className="text-slate-500 text-[11px]">Segmentation & OCR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <footer className="mt-auto bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800/80">
            {/* Col 1: Platform Brand */}
            <div className="space-y-3 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <LogoIcon size={30} />
                <span className="font-bold text-white text-sm tracking-tight">Nexora Workforce</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The professional global workforce platform connecting vetted contributors with verified
                AI evaluation, data labeling, and specialized technical projects.
              </p>
              <div className="inline-flex items-center gap-2 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 rounded-full px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Global Operations • Live</span>
              </div>
            </div>

            {/* Col 2: Platform Links */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Work Opportunities
              </h4>
              <ul className="space-y-2 text-[11px] text-slate-400">
                <li>
                  <a href="#projects" className="hover:text-white transition-colors">
                    Open Projects & Tasks
                  </a>
                </li>
                <li>
                  <a href="#taxonomies" className="hover:text-white transition-colors">
                    Work Taxonomies
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="hover:text-white transition-colors">
                    How Delivery Works
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenRegister}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Apply as Contributor
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Compliance & Legal */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Governance & Trust
              </h4>
              <ul className="space-y-2 text-[11px] text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy & Data Protection
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contributor Code of Conduct
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Intellectual Property NDA
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Community & Follow Us */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Community & Follow Us
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Join our official WhatsApp channel for real-time project drop alerts, onboarding dates, and task announcements.
              </p>
              <a
                href="https://whatsapp.com/channel/0029VbDD7TY9xVJajgIekd0K"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between gap-2 w-full px-3 py-2.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 hover:border-emerald-500 rounded-xl text-emerald-300 hover:text-emerald-100 font-semibold text-xs transition-all shadow-xs group"
                title="Follow Nexora Workforce on WhatsApp"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">WhatsApp Channel</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400/80 group-hover:text-emerald-300 shrink-0" />
              </a>
              <p className="text-[10px] text-slate-500">
                Official Broadcast • Direct Updates
              </p>
            </div>

            {/* Col 5: Platform Standards */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Quality Assurance
              </h4>
              <ul className="space-y-2.5 text-[11px] text-slate-300">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Enterprise Data Security</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Rigorous Milestone Verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Cross-Border Direct Withdrawals</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright and Legal Disclaimers (No SRS, No Login button) */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>
              © 2025 Nexora Workforce Global Inc. All rights reserved.
            </p>

            <div className="flex items-center gap-4 text-slate-400">
              <a
                href="https://whatsapp.com/channel/0029VbDD7TY9xVJajgIekd0K"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-emerald-400/90 font-medium"
              >
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp Channel</span>
              </a>
              <span className="text-slate-700">•</span>
              <a href="#" className="hover:text-slate-200 transition-colors">
                Privacy Policy
              </a>
              <span className="text-slate-700">•</span>
              <a href="#" className="hover:text-slate-200 transition-colors">
                Terms of Service
              </a>
              <span className="text-slate-700">•</span>
              <a href="#" className="hover:text-slate-200 transition-colors">
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
