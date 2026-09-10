import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, ArrowRight, AlertCircle, Link, Info, Phone } from 'lucide-react';
import { Badge } from '../common/Badge';
import { getCountryEligibility } from '../../utils/countryUtils';

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
  const [cvLink, setCvLink] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser && project) {
      setExperience(currentUser.experience || '');
      setSelectedSkills(project.skillsRequired || currentUser.skills || ['Arabic translation', 'English localization', 'Proofreading']);
      setSelectedLanguages(currentUser.languages || ['Arabic', 'English']);
      setResumeText(currentUser.resumeText || '');
      setCvLink(currentUser.cvLink || '');
      setPhone(currentUser.phone || '');
    }
  }, [currentUser, project]);

  if (!isOpen || !project || !currentUser) return null;

  const countryInfo = getCountryEligibility(project.country);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanLink = cvLink.trim();
    if (!cleanLink) {
      setError('Please provide a shareable CV/Resume link (e.g. Google Drive link).');
      return;
    }

    try {
      const url = new URL(cleanLink);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      setError('Please enter a valid web URL for your CV/Resume link (starting with https://).');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitApplication({
        projectId: project.id,
        experience,
        skills: selectedSkills,
        languages: selectedLanguages,
        languageProficiency: proficiency,
        cvLink: cleanLink,
        phone: phone.trim(),
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
              {currentUser.isEmailVerified ? 'Verified Contributor' : 'Active Contributor'}
            </Badge>
          </div>

          {/* Target Country & Global Eligibility Notice */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl shrink-0">{countryInfo.flag}</span>
              <div>
                <span className="font-semibold text-slate-800">
                  {countryInfo.isWorldwide
                    ? '🌍 Worldwide Opportunity'
                    : `Target Country: ${countryInfo.label}`}
                </span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Open worldwide to all registered contributors. Your application from{' '}
                  <span className="font-semibold text-indigo-900">{currentUser.country || 'any country'}</span> is fully eligible.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 shrink-0">
              Open to All
            </span>
          </div>

          {/* Languages & Proficiency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Language Pair
              </label>
              <input
                type="text"
                required
                value={selectedLanguages.join(', ')}
                onChange={(e) =>
                  setSelectedLanguages(e.target.value.split(',').map((s) => s.trim()))
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Arabic, English"
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
              </select>
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Relevant Experience & Track Record *
            </label>
            <textarea
              required
              rows={3}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Detail your experience with Arabic-to-English translation, localization tools, translation memory, and quality assurance..."
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

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Contact Phone / WhatsApp (Optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555-0199 or WhatsApp number"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* CV / Resume Link */}
          <div className="pt-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-indigo-600" />
                <span>CV / Resume Link *</span>
              </span>
              <span className="text-[11px] text-indigo-600 font-medium">Google Drive, Dropbox, OneDrive, etc.</span>
            </label>
            <input
              type="url"
              required
              value={cvLink}
              onChange={(e) => setCvLink(e.target.value)}
              placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono shadow-2xs"
            />
            <div className="mt-1.5 p-3 bg-blue-50/80 border border-blue-200 rounded-lg flex items-start gap-2.5 text-[11px] text-blue-900 leading-relaxed">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>How to share your CV:</strong> Upload your CV/Resume to Google Drive or any cloud storage, create a shareable link, and paste it here.
                <br />
                <span className="text-blue-950 font-semibold underline">Crucial:</span> Please make sure file permissions are set to <strong>"Anyone with the link can view"</strong> so our reviewers can access your CV.
              </div>
            </div>
          </div>

          {/* Optional credentials notes / text */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Resume / CV Summary or Portfolio (Optional)</span>
            </label>
            <textarea
              rows={2}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Optional: Paste additional qualifications, portfolio URLs, or brief overview..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Additional notes / weekly hours */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Availability & Weekly Capacity (Optional)
            </label>
            <input
              type="text"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="e.g. Available 20-30 hrs/week, Cairo/GMT+2 timezone."
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
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
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
