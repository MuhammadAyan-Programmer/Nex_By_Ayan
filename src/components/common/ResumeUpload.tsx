import React, { useRef, useState } from 'react';
import { UploadedFileMeta } from '../../types';
import {
  Plus,
  FileText,
  CheckCircle2,
  Trash2,
  Download,
  AlertCircle,
  RefreshCw,
  FileCheck,
} from 'lucide-react';

interface ResumeUploadProps {
  value?: UploadedFileMeta | null;
  onChange: (file: UploadedFileMeta | null) => void;
  label?: string;
  required?: boolean;
  helpText?: string;
  idPrefix?: string;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  value,
  onChange,
  label = 'CV / Resume Document',
  required = false,
  helpText = 'Supported formats: PDF (.pdf), Microsoft Word (.doc/.docx) • Max 10MB',
  idPrefix = 'cv-upload',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const allowedExtensions = ['pdf', 'doc', 'docx'];
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processFile = (file: File) => {
    setError(null);

    // Validate extension
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(extension)) {
      setError('Invalid format. Please upload a PDF (.pdf) or Microsoft Word (.doc, .docx) file.');
      return;
    }

    // Validate size
    if (file.size > maxSizeBytes) {
      setError(`File is too large (${formatFileSize(file.size)}). Maximum supported size is 10MB.`);
      return;
    }

    setIsReading(true);

    const reader = new FileReader();

    reader.onload = () => {
      setIsReading(false);
      const dataUrl = reader.result as string;
      const fileMeta: UploadedFileMeta = {
        name: file.name,
        size: file.size,
        type: file.type || (extension === 'pdf' ? 'application/pdf' : 'application/msword'),
        dataUrl,
        uploadedAt: new Date().toISOString().split('T')[0],
      };
      onChange(fileMeta);
    };

    reader.onerror = () => {
      setIsReading(false);
      setError('Failed to read file from your device. Please try again.');
    };

    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // Reset input so re-uploading the same file still triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleOpenPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = () => {
    setError(null);
    onChange(null);
  };

  const isPdf = value?.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-2">
      {/* Label and requirements */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-800">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
        <span className="text-[11px] text-slate-500 font-medium">
          PDF, DOC, DOCX
        </span>
      </div>

      {/* Hidden native input with strict accept filters for mobile & desktop */}
      <input
        ref={fileInputRef}
        type="file"
        id={`${idPrefix}-file-input`}
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Error alert if validation failed */}
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* State A: File already attached */}
      {value ? (
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                isPdf
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              {isPdf ? 'PDF' : 'DOC'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                  {value.name}
                </p>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {formatFileSize(value.size)} • Ready for submission
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {value.dataUrl && (
              <a
                href={value.dataUrl}
                download={value.name}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors inline-flex items-center gap-1"
                title="Download or preview CV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Preview</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleOpenPicker}
              className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors inline-flex items-center gap-1"
              title="Replace CV"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Replace</span>
            </button>

            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              title="Remove file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* State B: No file uploaded yet - Prominent "Upload CV/Resume" with + icon */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`p-4 border-2 border-dashed rounded-xl transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-indigo-50/20'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Attach your CV or Resume
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {helpText}
                </p>
              </div>
            </div>

            {/* Clear "Upload CV/Resume" button with a + icon */}
            <button
              type="button"
              id={`${idPrefix}-trigger-btn`}
              onClick={handleOpenPicker}
              disabled={isReading}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer touch-manipulation disabled:opacity-50"
            >
              {isReading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading file...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Upload CV/Resume</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
