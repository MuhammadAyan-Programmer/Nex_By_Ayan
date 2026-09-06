import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectCategory, ProjectStatus, PaymentType, PaymentAmountType } from '../../types';
import { ALL_CATEGORIES } from '../../mockData';
import { X, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { PaymentTypeConfigurator } from './PaymentTypeConfigurator';
import { getPaymentUnitLabel } from '../../utils/paymentUtils';

interface AdminCreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminCreateProjectModal: React.FC<AdminCreateProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createProject } = useApp();

  // Form states matching Section 21
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Translation & Localization');
  const [projectType, setProjectType] = useState('Translation / AI Data');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('English');
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [country, setCountry] = useState('Global');
  const [skillsStr, setSkillsStr] = useState('');
  const [requiredContributors, setRequiredContributors] = useState<number>(1000);
  const [startDate, setStartDate] = useState('2027-01-15');
  const [endDate, setEndDate] = useState('2027-07-30');
  const [applicationDeadline, setApplicationDeadline] = useState('2026-12-30');
  const [qualificationRequired, setQualificationRequired] = useState(true);
  const [qualificationTestInfo, setQualificationTestInfo] = useState('');
  const [minimumRequirement, setMinimumRequirement] = useState('');
  const [instructions, setInstructions] = useState('');
  const [communityLink, setCommunityLink] = useState('https://community.nexora.work/c/');
  const [announcement, setAnnouncement] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Open');

  // Payment configuration (Section 1: Payment Type & USD Amount / Range)
  const [paymentType, setPaymentType] = useState<PaymentType>('Per Hour');
  const [rateType, setRateType] = useState<PaymentAmountType>('fixed');
  const [fixedAmount, setFixedAmount] = useState('25.00');
  const [minAmount, setMinAmount] = useState('20.00');
  const [maxAmount, setMaxAmount] = useState('35.00');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = skillsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const unit = getPaymentUnitLabel(paymentType, false);
    let finalRatePay = '';
    if (rateType === 'fixed') {
      const amt = parseFloat(fixedAmount) || 0;
      finalRatePay = `$${amt.toFixed(2)} ${unit}`;
    } else {
      const min = parseFloat(minAmount) || 0;
      const max = parseFloat(maxAmount) || 0;
      finalRatePay = `$${min.toFixed(2)} - $${max.toFixed(2)} ${unit}`;
    }

    createProject({
      name,
      category,
      projectType,
      description,
      language,
      sourceLanguage: sourceLanguage || undefined,
      targetLanguage: targetLanguage || undefined,
      country,
      skillsRequired: skills.length ? skills : ['General AI Data Annotation'],
      requiredContributors: Number(requiredContributors) || 500,
      startDate,
      endDate,
      applicationDeadline,
      qualificationRequired,
      qualificationTestInfo: qualificationTestInfo || undefined,
      minimumRequirement: minimumRequirement || undefined,
      instructions,
      communityLink,
      announcement: announcement || undefined,
      status,
      paymentType,
      paymentRateType: rateType,
      paymentAmount: rateType === 'fixed' ? parseFloat(fixedAmount) || 0 : undefined,
      paymentAmountMin: rateType === 'range' ? parseFloat(minAmount) || 0 : undefined,
      paymentAmountMax: rateType === 'range' ? parseFloat(maxAmount) || 0 : undefined,
      ratePay: finalRatePay,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Create New Project</h2>
            <p className="text-xs text-slate-500">
              Define project scope, capacity limits, qualification benchmarks, and instructions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Section: Basic Information */}
          <div className="space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              1. Basic Project Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spanish → English Legal Translation Evaluation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Project Category (Section 2) *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                >
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Type *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Translation / AI Data / Evaluation"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Comprehensive description of the opportunity and contributor responsibilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Languages & Geography */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              2. Languages & Regional Target
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Language</label>
                <input
                  type="text"
                  required
                  placeholder="English, Spanish, etc."
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Language</label>
                <input
                  type="text"
                  placeholder="e.g. Spanish"
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Language</label>
                <input
                  type="text"
                  placeholder="e.g. English"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Country</label>
                <input
                  type="text"
                  placeholder="Global / Specific"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Skills Required (comma separated)
              </label>
              <input
                type="text"
                placeholder="Translation, Legal Terminology, Context Checking"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Section: Capacity & Timeline */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              3. Contributor Capacity & Timeline (Section 21 & 29)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Required Contributors (Seats) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={requiredContributors}
                  onChange={(e) => setRequiredContributors(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Application Deadline *
                </label>
                <input
                  type="date"
                  required
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Qualification */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              4. Qualification & Eligibility
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Qualification Test Required?
                </label>
                <select
                  value={qualificationRequired ? 'yes' : 'no'}
                  onChange={(e) => setQualificationRequired(e.target.value === 'yes')}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="yes">Yes (Test Required Before Approval)</option>
                  <option value="no">No (Direct Application & Review)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Minimum Requirement
                </label>
                <input
                  type="text"
                  placeholder="e.g. CEFR C1 proficiency or 2+ yrs experience"
                  value={minimumRequirement}
                  onChange={(e) => setMinimumRequirement(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Qualification Test Information / Rubric
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15-minute terminology quiz and sample error ranking trial"
                  value={qualificationTestInfo}
                  onChange={(e) => setQualificationTestInfo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Communication & Instructions */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              5. Instructions & Communication
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Project Instructions *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detailed guidelines visible to approved contributors..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Community Link *</label>
                <input
                  type="text"
                  required
                  placeholder="https://community.nexora.work/c/channel"
                  value={communityLink}
                  onChange={(e) => setCommunityLink(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Important Announcement (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Batch 1 begins next Wednesday"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Open">Open (Accepting Applications)</option>
                  <option value="Draft">Draft</option>
                  <option value="Closed">Closed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Payment & Compensation Model */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <PaymentTypeConfigurator
              paymentType={paymentType}
              onChangePaymentType={setPaymentType}
              rateType={rateType}
              onChangeRateType={setRateType}
              fixedAmount={fixedAmount}
              onChangeFixedAmount={setFixedAmount}
              minAmount={minAmount}
              onChangeMinAmount={setMinAmount}
              maxAmount={maxAmount}
              onChangeMaxAmount={setMaxAmount}
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Publish Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
