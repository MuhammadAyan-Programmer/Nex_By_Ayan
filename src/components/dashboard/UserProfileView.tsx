import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UploadedFileMeta } from '../../types';
import { Badge } from '../common/Badge';
import { ResumeUpload } from '../common/ResumeUpload';
import {
  User,
  Mail,
  Phone,
  Globe,
  Award,
  FileText,
  CheckCircle2,
  Save,
  AlertCircle,
} from 'lucide-react';

export const UserProfileView: React.FC = () => {
  const { currentUser, updateProfile } = useApp();

  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [country, setCountry] = useState(currentUser?.country || 'United States');
  const [languagesStr, setLanguagesStr] = useState(
    currentUser?.languages?.join(', ') || 'English, German'
  );
  const [skillsStr, setSkillsStr] = useState(currentUser?.skills?.join(', ') || '');
  const [experience, setExperience] = useState(currentUser?.experience || '');
  const [resumeFile, setResumeFile] = useState<UploadedFileMeta | null>(
    currentUser?.resumeFile || null
  );
  const [resumeText, setResumeText] = useState(currentUser?.resumeText || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLanguages = languagesStr
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);
    const parsedSkills = skillsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateProfile({
      firstName,
      lastName,
      phone,
      country,
      languages: parsedLanguages,
      skills: parsedSkills,
      experience,
      resumeFile: resumeFile || undefined,
      resumeText,
      profileStatus: 'Complete',
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Contributor Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your personal data, linguistic proficiencies, and resume credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={currentUser.isEmailVerified ? 'green' : 'amber'}>
            {currentUser.isEmailVerified ? '✓ Email Verified' : 'Email Unverified'}
          </Badge>
          <Badge variant="indigo">Profile: {currentUser.profileStatus}</Badge>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Profile updated successfully!
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
        {/* Personal Details */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-600" /> Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location & Languages */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-600" /> Location & Languages
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Country of Residence
              </label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Languages (comma separated)
              </label>
              <input
                type="text"
                required
                placeholder="English, German, Spanish, Japanese"
                value={languagesStr}
                onChange={(e) => setLanguagesStr(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Skills & Experience */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-indigo-600" /> Professional Skills & Experience
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Skills & Specialties (comma separated)
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="Audio Transcription, Translation, LLM Evaluation, Bounding Boxes, QA"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Experience Overview
              </label>
              <textarea
                rows={3}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Summarize your work history, domain expertise, and prior AI contribution projects..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* CV / Resume File Upload */}
            <div className="pt-1">
              <ResumeUpload
                value={resumeFile}
                onChange={(file) => setResumeFile(file)}
                label="Primary CV / Resume Document"
                required={false}
                helpText="PDF (.pdf) or Word (.doc, .docx) • Max 10MB"
                idPrefix="profile-cv-upload"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resume / CV Text or Credentials Link (Optional)
              </label>
              <textarea
                rows={2}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your curriculum vitae text, portfolio link, or certification credentials..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
};
