import React, { useState, useEffect } from 'react';
import { Project, UploadedFileMeta } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, ArrowRight, FileText, Globe, AlertCircle } from 'lucide-react';
import { Badge } from '../common/Badge';
import { ResumeUpload } from '../common/ResumeUpload';

interface ProjectApplicationModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProjectApplicationModal: React.FC<ProjectApplicationModalProps> = ({
  project,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, submitApplication } = useApp();

  const [experience, setExperience] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [proficiency, setProficiency] = useState('Native / Bilingual');
  const [resumeFile, setResumeFile] = useState<UploadedFileMeta | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser && project) {
      setExperience(currentUser.experience || '');
      setSelectedSkills(project.skillsRequired || currentUser.skills || []);
      setSelectedLanguages(currentUser.languages || [project.language.split(',')[0] || 'English']);
      setResumeText(currentUser.resumeText || '');
      setResumeFile(currentUser.resumeFile || null);
    }
  }, [currentUser, project]);

  if (!isOpen || !project || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await submitApplication({
        projectId: project.id,
        experience,
        skills: selectedSkills,
        languages: selectedLanguages,
        languageProficiency: proficiency,
        resumeFile: resumeFile || undefined,
        resumeText,
        additionalInfo,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
      <div
        id="application-modal"
        className="relative w-full max-w-2xl my-8 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Project Application</h3>
            <p className="text-xs text-slate-500 truncate max-w-md">
              Applying for: <span className="font-semibold text-slate-700">{project.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Contributor summary */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-900">
                {currentUser.firstName} {currentUser.lastName}
              </p>
              <p className="text-[11px] text-slate-500">
                {currentUser.email} • {currentUser.country}
              </p>
            </div>
            <Badge variant={currentUser.isEmailVerified ? 'green' : 'amber'}>
              {currentUser.isEmailVerified ? 'Verified Contributor' : 'Email Unverified'}
            </Badge>
          </div>

          {/* Languages & Proficiency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Language(s)
              </label>
              <input
                type="text"
                required
                value={selectedLanguages.join(', ')}
                onChange={(e) =>
                  setSelectedLanguages(e.target.value.split(',').map((s) => s.trim()))
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. English, German"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Language Proficiency
              </label>
              <select
                value={proficiency}
                onChange={(e) => setProficiency(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option>Native / Bilingual</option>
                <option>Professional Working Proficiency (C1/C2)</option>
                <option>Limited Working Proficiency (B1/B2)</option>
                <option>Elementary Proficiency</option>
              </select>
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Relevant Experience & Track Record
            </label>
            <textarea
              required
              rows={3}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Detail your experience with this type of task, tools used, and similar projects..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Key Skills (comma separated)
            </label>
            <input
              type="text"
              required
              value={selectedSkills.join(', ')}
              onChange={(e) =>
                setSelectedSkills(e.target.value.split(',').map((s) => s.trim()))
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* CV / Resume Upload with clear + button */}
          <div className="pt-1">
            <ResumeUpload
              value={resumeFile}
              onChange={(file) => setResumeFile(file)}
              label="Upload CV / Resume"
              required={false}
              helpText="PDF (.pdf) or Word (.doc, .docx) • Max 10MB"
              idPrefix="project-application"
            />
          </div>

          {/* Optional credentials notes / text */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Resume / CV Summary (Optional)</span>
              <span className="text-[11px] text-slate-400 font-normal">Auto-filled from profile</span>
            </label>
            <textarea
              rows={2}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste additional qualifications, credential URLs, or brief experience summary..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Additional notes / weekly hours */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Information (Weekly availability, time zone, etc.)
            </label>
            <input
              type="text"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="e.g. Available 20-30 hrs/week, GMT+1 timezone."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
