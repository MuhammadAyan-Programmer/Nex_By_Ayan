export type ProjectCategory =
  | 'Translation & Localization'
  | 'Transcription'
  | 'Audio Annotation'
  | 'Text Annotation'
  | 'Image Annotation'
  | 'Video Annotation'
  | 'AI Data Collection'
  | 'Data Labeling'
  | 'LLM Evaluation'
  | 'AI Model Evaluation'
  | 'Linguistic Evaluation'
  | 'Search / Relevance Evaluation'
  | 'Question & Answer (KQA/QA)'
  | 'Speech / ASR Projects'
  | 'Prompt Evaluation'
  | 'Content Evaluation'
  | 'Data Quality Assurance'
  | 'Other AI/Data Projects';

export type ProjectStatus = 'Draft' | 'Open' | 'Closed' | 'Completed';

export type ApplicationStatus = 'Applied' | 'Under Review' | 'Approved' | 'Rejected' | 'Waitlisted';

export type PaymentMethodType = 'Payoneer' | 'PayPal' | 'Airtm' | 'Bank Account';

export type PaymentEarningStatus = 'Available' | 'Paid' | 'Processing' | 'Withdrawal Requested' | 'Rejected';

export type WithdrawalStatus = 'Withdrawal Requested' | 'Processing' | 'Paid' | 'Rejected';

export interface BankDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ibanNumber: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  email?: string;
  bankDetails?: BankDetails;
  isPrimary: boolean;
  createdAt: string;
}

export type PaymentType = 'Per Hour' | 'Per Item' | 'Per Task';
export type PaymentAmountType = 'fixed' | 'range';

export interface Project {
  id: string;
  name: string;
  category: ProjectCategory;
  projectType: string;
  description: string;
  language: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  country: string;
  skillsRequired: string[];
  requiredContributors: number;
  approvedContributors: number;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  qualificationRequired: boolean;
  qualificationTestInfo?: string;
  minimumRequirement?: string;
  instructions: string;
  communityLink: string;
  announcement?: string;
  status: ProjectStatus;
  paymentType?: PaymentType;
  paymentRateType?: PaymentAmountType;
  paymentAmount?: number;
  paymentAmountMin?: number;
  paymentAmountMax?: number;
  ratePay?: string;
  createdAt: string;
}

export interface UploadedFileMeta {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  uploadedAt: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  languages: string[];
  languageProficiency: Record<string, string>;
  skills: string[];
  experience: string;
  cvLink?: string;
  resumeUrl?: string;
  resumeText?: string;
  resumeFile?: UploadedFileMeta;
  role: 'contributor' | 'admin';
  isEmailVerified: boolean;
  profileStatus: 'Complete' | 'Incomplete';
  avatar?: string;
  status?: 'active' | 'suspended';
  createdAt?: string;
}

export interface ProjectApplication {
  id: string;
  projectId: string;
  projectName: string;
  projectCategory: ProjectCategory;
  userId: string;
  userName: string;
  userEmail: string;
  phone?: string;
  country: string;
  languages: string[];
  languageProficiency: string;
  experience: string;
  skills: string[];
  cvLink?: string;
  resumeText?: string;
  resumeFile?: UploadedFileMeta;
  additionalInfo?: string;
  status: ApplicationStatus;
  appliedDate: string;
  reviewedDate?: string;
  notes?: string;
}

export type Application = ProjectApplication;

export interface ProjectUpdate {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  message: string;
  instructions?: string;
  communityLink?: string;
  createdAt: string;
  readByUserIds: string[];
}

export interface ContributorEarning {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  projectId: string;
  projectName: string;
  amount: number;
  currency: string;
  status: 'Available' | 'Paid' | 'Processing';
  paymentDate: string;
  notes?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  paymentMethodType: PaymentMethodType;
  paymentMethodDetails: string;
  requestDate: string;
  processedDate?: string;
  status: WithdrawalStatus;
  rejectionReason?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'project_update' | 'application_status' | 'payment' | 'system';
  link?: string;
  date: string;
  read: boolean;
}
