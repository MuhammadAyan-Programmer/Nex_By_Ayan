import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { CountrySelect } from '../common/CountrySelect';
import {
  User,
  Mail,
  Phone,
  Globe,
  Award,
  CheckCircle2,
  Save,
  Link,
  Info,
  Edit3,
  X,
  Plus,
  Sparkles,
  Tag,
  Briefcase,
  FileText,
  ShieldCheck,
  Check,
  Shield,
} from 'lucide-react';

const SUGGESTED_SKILLS = [
  'Arabic Translation',
  'English Localization',
  'Data Annotation',
  'Audio Transcription',
  'LLM Evaluation',
  'Quality Assurance',
  'Content Moderation',
  'Proofreading',
  'Prompt Engineering',
  'Linguistic QA',
];

export const UserProfileView: React.FC = () => {
  const { currentUser, updateProfile, toggleUserSkillVerification } = useApp();

  const isAdmin = currentUser?.role === 'admin';
  const verifiedSkillsSet = new Set(currentUser?.verifiedSkills || currentUser?.endorsedSkills || []);

  // Full form state
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim()
  );
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [country, setCountry] = useState(currentUser?.country || 'United States');
  const [languagesStr, setLanguagesStr] = useState(
    currentUser?.languages?.join(', ') || 'Arabic, English'
  );
  const [skills, setSkills] = useState<string[]>(
    Array.isArray(currentUser?.skills) ? currentUser.skills : ['Arabic Translation', 'English Localization']
  );
  const [bio, setBio] = useState(currentUser?.bio || currentUser?.experience || '');
  const [experience, setExperience] = useState(currentUser?.experience || currentUser?.bio || '');
  const [cvLink, setCvLink] = useState(currentUser?.cvLink || '');
  const [resumeText, setResumeText] = useState(currentUser?.resumeText || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Profile updated successfully!');

  // 'Edit Profile' Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalFirstName, setModalFirstName] = useState('');
  const [modalLastName, setModalLastName] = useState('');
  const [modalDisplayName, setModalDisplayName] = useState('');
  const [modalBio, setModalBio] = useState('');
  const [modalSkills, setModalSkills] = useState<string[]>([]);
  const [modalVerifiedSkills, setModalVerifiedSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSavingModal, setIsSavingModal] = useState(false);

  // Sync state whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName || '');
      setLastName(currentUser.lastName || '');
      setDisplayName(
        currentUser.displayName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
      );
      setPhone(currentUser.phone || '');
      setCountry(currentUser.country || 'United States');
      setLanguagesStr(currentUser.languages?.join(', ') || 'Arabic, English');
      setSkills(Array.isArray(currentUser.skills) ? currentUser.skills : []);
      setBio(currentUser.bio || currentUser.experience || '');
      setExperience(currentUser.experience || currentUser.bio || '');
      setCvLink(currentUser.cvLink || '');
      setResumeText(currentUser.resumeText || '');
    }
  }, [currentUser]);

  if (!currentUser) return null;

  // Open 'Edit Profile' Modal
  const handleOpenEditModal = () => {
    setModalFirstName(firstName);
    setModalLastName(lastName);
    setModalDisplayName(displayName || `${firstName} ${lastName}`.trim());
    setModalBio(bio || experience);
    setModalSkills([...skills]);
    setModalVerifiedSkills([...(currentUser.verifiedSkills || currentUser.endorsedSkills || [])]);
    setNewSkillInput('');
    setModalError('');
    setIsEditModalOpen(true);
  };

  // Add a new skill tag inside modal
  const handleAddSkillTag = (skillToAdd?: string) => {
    const skillName = (skillToAdd || newSkillInput).trim();
    if (!skillName) return;

    // Check duplicate
    const exists = modalSkills.some((s) => s.toLowerCase() === skillName.toLowerCase());
    if (exists) {
      setModalError(`Skill "${skillName}" is already added.`);
      return;
    }

    setModalSkills((prev) => [...prev, skillName]);
    if (!skillToAdd) {
      setNewSkillInput('');
    }
    setModalError('');
  };

  // Remove a skill tag inside modal
  const handleRemoveSkillTag = (skillToRemove: string) => {
    setModalSkills((prev) => prev.filter((s) => s !== skillToRemove));
    setModalVerifiedSkills((prev) => prev.filter((s) => s !== skillToRemove));
    setModalError('');
  };

  // Toggle skill verification by admin directly in view
  const handleToggleSkillVerification = (skill: string) => {
    if (!currentUser) return;
    toggleUserSkillVerification(currentUser.id, skill);
    const willBeVerified = !verifiedSkillsSet.has(skill);
    setSuccessMessage(
      willBeVerified
        ? `Skill "${skill}" marked as Verified & Endorsed by Administrator!`
        : `Skill "${skill}" endorsement removed.`
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Save changes from 'Edit Profile' Modal
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const cleanFirst = modalFirstName.trim();
    const cleanLast = modalLastName.trim();
    const cleanDisplay = modalDisplayName.trim() || `${cleanFirst} ${cleanLast}`.trim();
    const cleanBio = modalBio.trim();

    if (!cleanFirst) {
      setModalError('First name is required.');
      return;
    }

    if (modalSkills.length === 0) {
      setModalError('Please add at least one skill tag.');
      return;
    }

    try {
      setIsSavingModal(true);

      const updatedVerified = modalVerifiedSkills.filter((s) => modalSkills.includes(s));

      // Apply updates to Profile
      updateProfile({
        firstName: cleanFirst,
        lastName: cleanLast,
        displayName: cleanDisplay,
        bio: cleanBio,
        experience: cleanBio,
        skills: modalSkills,
        verifiedSkills: updatedVerified,
        endorsedSkills: updatedVerified,
        profileStatus: 'Complete',
      });

      // Update local state
      setFirstName(cleanFirst);
      setLastName(cleanLast);
      setDisplayName(cleanDisplay);
      setBio(cleanBio);
      setExperience(cleanBio);
      setSkills(modalSkills);

      setIsEditModalOpen(false);
      setSuccessMessage('Profile and skills updated successfully!');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save profile changes.');
    } finally {
      setIsSavingModal(false);
    }
  };

  // Full form submission (for deep credentials & CV)
  const handleSaveFullForm = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLanguages = languagesStr
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);

    updateProfile({
      firstName,
      lastName,
      displayName: displayName || `${firstName} ${lastName}`.trim(),
      phone,
      country,
      languages: parsedLanguages,
      skills,
      bio,
      experience,
      cvLink: cvLink.trim(),
      resumeText,
      profileStatus: 'Complete',
    });

    setSuccessMessage('Profile details saved successfully!');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const userInitials =
    `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase() || 'CP';

  const resolvedDisplayName =
    currentUser.displayName || `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'Contributor';

  const resolvedBio =
    currentUser.bio || currentUser.experience || 'Bilingual translator and data annotation specialist with verified linguistic skills.';

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
          <Badge variant="indigo">Profile: {currentUser.profileStatus || 'Complete'}</Badge>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-2xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Profile Overview Card with 'Edit Profile' Button & Verified Skills Indicators */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/5 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shrink-0">
              {userInitials}
            </div>

            {/* Name, Role & Details */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{resolvedDisplayName}</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 capitalize">
                  {currentUser.role || 'Contributor'}
                </span>
                {currentUser.isEmailVerified && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {currentUser.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {currentUser.country || 'Global'}
                </span>
                {currentUser.phone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {currentUser.phone}
                    </span>
                  </>
                )}
              </div>

              {/* Bio Preview */}
              <div className="pt-2 text-xs text-slate-600 leading-relaxed max-w-2xl bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-700 block text-[11px] mb-0.5 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-indigo-500" />
                  Bio & Professional Summary:
                </span>
                <p className="whitespace-pre-wrap">{resolvedBio}</p>
              </div>

              {/* Skills Tags & Endorsements Section */}
              <div className="pt-3">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    Skill Tags & Endorsements ({skills.length}):
                  </span>
                  {verifiedSkillsSet.size > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {verifiedSkillsSet.size} {verifiedSkillsSet.size === 1 ? 'Verified Skill' : 'Verified Skills'}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {skills.length > 0 ? (
                    skills.map((skill) => {
                      const isVerified = verifiedSkillsSet.has(skill);
                      return (
                        <div
                          key={skill}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all shadow-2xs ${
                            isVerified
                              ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 border-emerald-300 shadow-emerald-500/10'
                              : 'bg-purple-50/70 text-purple-800 border-purple-200'
                          }`}
                          title={
                            isVerified
                              ? 'Skill Verified: Endorsed and validated by Nexora Workforce Administration'
                              : 'Self-declared competency'
                          }
                        >
                          {isVerified ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                          )}
                          <span>{skill}</span>

                          {/* Visual Indicator Badge */}
                          {isVerified ? (
                            <span className="ml-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-200/90 text-emerald-900 border border-emerald-300 flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" />
                              Verified
                            </span>
                          ) : (
                            <span className="ml-0.5 text-[9px] text-purple-400 font-normal">
                              Self-declared
                            </span>
                          )}

                          {/* Admin toggle endorsement button */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleToggleSkillVerification(skill)}
                              className={`ml-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                isVerified
                                  ? 'bg-emerald-100 hover:bg-rose-100 text-emerald-800 hover:text-rose-700 border border-emerald-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                              }`}
                              title={
                                isVerified
                                  ? 'Admin: Click to revoke skill endorsement'
                                  : 'Admin: Click to endorse & validate this skill'
                              }
                            >
                              <ShieldCheck className="w-3 h-3" />
                              {isVerified ? 'Endorsed ✓' : 'Endorse'}
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      No skill tags added yet. Click Edit Profile to add skills.
                    </span>
                  )}
                </div>

                {/* Admin Mode Info Banner */}
                {isAdmin && (
                  <div className="mt-2.5 p-2 bg-purple-50/80 border border-purple-200 rounded-lg flex items-center gap-2 text-[11px] text-purple-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>
                      <strong>Admin Endorsement Active:</strong> You can mark specific contributor skills as <strong>Verified</strong> or revoke endorsements using the action buttons above.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Action Button */}
          <button
            type="button"
            onClick={handleOpenEditModal}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer self-start"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-white">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Edit Contributor Profile</h3>
                  <p className="text-[11px] text-purple-200">
                    Update your public display name, professional bio, and competencies.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-5 text-xs">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Display Name Section */}
              <div className="space-y-3">
                <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                  Display Name & Identity
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={modalFirstName}
                      onChange={(e) => setModalFirstName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Last Name</label>
                    <input
                      type="text"
                      value={modalLastName}
                      onChange={(e) => setModalLastName(e.target.value)}
                      placeholder="e.g. Rivera"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Display Name (How your name appears on workforce projects)
                  </label>
                  <input
                    type="text"
                    value={modalDisplayName}
                    onChange={(e) => setModalDisplayName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Defaults to your First Name + Last Name if left unchanged.
                  </span>
                </div>
              </div>

              {/* Bio Section */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    Bio & Professional Summary
                  </label>
                  <span className={`text-[10px] ${modalBio.length > 500 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                    {modalBio.length}/500 chars
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={modalBio}
                  onChange={(e) => setModalBio(e.target.value)}
                  placeholder="Introduce yourself, your domain expertise (e.g. translation, QA, audio transcription), native languages, and years of experience..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-white"
                />
                <span className="text-[10px] text-slate-400 block">
                  A concise bio helps project managers and reviewers quickly match you with suitable tasks.
                </span>
              </div>

              {/* Skill Tags Section */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    Skill Tags ({modalSkills.length})
                  </label>
                  {isAdmin && (
                    <span className="text-[10px] text-purple-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Admin Endorsement Mode
                    </span>
                  )}
                </div>

                {/* Active Tags Pills with Verified Indicators */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[52px] flex flex-wrap items-center gap-2">
                  {modalSkills.length > 0 ? (
                    modalSkills.map((skill) => {
                      const isVerified = modalVerifiedSkills.includes(skill);
                      return (
                        <div
                          key={skill}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 shadow-2xs group ${
                            isVerified
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : 'bg-purple-100 text-purple-800 border-purple-200'
                          }`}
                        >
                          {isVerified ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-purple-600" />
                          )}
                          <span>{skill}</span>

                          {isVerified ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900">
                              Verified
                            </span>
                          ) : null}

                          {/* Admin toggle verification directly in modal */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setModalVerifiedSkills((prev) =>
                                  prev.includes(skill)
                                    ? prev.filter((s) => s !== skill)
                                    : [...prev, skill]
                                );
                              }}
                              className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                                isVerified
                                  ? 'bg-emerald-200 text-emerald-900 hover:bg-rose-100 hover:text-rose-700'
                                  : 'bg-slate-200 text-slate-700 hover:bg-emerald-600 hover:text-white'
                              }`}
                              title={isVerified ? 'Admin: Click to revoke validation' : 'Admin: Click to mark as validated'}
                            >
                              {isVerified ? '✓ Validated' : '+ Validate'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveSkillTag(skill)}
                            className="w-4 h-4 rounded-full bg-black/10 hover:bg-rose-200 text-slate-700 hover:text-rose-700 flex items-center justify-center transition-colors cursor-pointer"
                            title={`Remove ${skill}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-slate-400 text-xs italic">
                      No skill tags selected yet. Type a skill or choose from suggestions below.
                    </span>
                  )}
                </div>

                {/* Add Custom Tag Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkillTag();
                      }
                    }}
                    placeholder="Type custom skill tag (e.g. Arabic Translation) and press Enter..."
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkillTag()}
                    className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Tag
                  </button>
                </div>

                {/* Popular Skill Suggestions */}
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                    Suggested Quick-Add Tags:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_SKILLS.map((suggestion) => {
                      const isAdded = modalSkills.some(
                        (s) => s.toLowerCase() === suggestion.toLowerCase()
                      );
                      return (
                        <button
                          key={suggestion}
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleAddSkillTag(suggestion)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                            isAdded
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-300 shadow-2xs'
                          }`}
                        >
                          {isAdded ? '✓' : '+'} {suggestion}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingModal}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingModal ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Profile Details Form (Location, Credentials & CV) */}
      <form onSubmit={handleSaveFullForm} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">Additional Account & Credentials</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure contact information, language proficiencies, and resume documents.
          </p>
        </div>

        {/* Location & Languages */}
        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-600" /> Location & Languages
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Country of Residence
              </label>
              <CountrySelect
                value={country}
                onChange={setCountry}
                placeholder="Select Country of Residence..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Languages (comma separated)
              </label>
              <input
                type="text"
                required
                placeholder="English, Arabic, Spanish, French"
                value={languagesStr}
                onChange={(e) => setLanguagesStr(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Phone & Email */}
        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-indigo-600" /> Contact Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* CV & Credentials */}
        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-indigo-600" /> Resume & CV Verification
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-indigo-600" />
                  <span>CV / Resume Link (Google Drive, Dropbox, LinkedIn)</span>
                </span>
                <span className="text-[11px] text-slate-400">Shareable URL</span>
              </label>
              <input
                type="url"
                value={cvLink}
                onChange={(e) => setCvLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono shadow-2xs"
              />
              <div className="mt-1.5 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-2 text-[11px] text-blue-800">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Make sure file permissions are set to "Anyone with the link can view" so project reviewers can access your resume.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resume / CV Plain Text or Certification Summary
              </label>
              <textarea
                rows={3}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste certification credentials, degrees, or key career achievements..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Profile Details
          </button>
        </div>
      </form>
    </div>
  );
};
