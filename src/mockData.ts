import {
  Project,
  UserProfile,
  ProjectApplication,
  PaymentMethod,
  ContributorEarning,
  WithdrawalRequest,
  ProjectUpdate,
  NotificationItem,
} from './types';

// Real active projects: French → English Machine Translation and Arabic → English Translation
export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-french-en-002',
    name: 'French → English Machine Translation Project',
    category: 'Translation & Localization',
    projectType: 'Translation / AI Data',
    description:
      'High-volume machine translation post-editing (MTPE), cultural localization, and linguistic quality assessment for French to English textual corpora, conversation logs, and domain-specific documentation. Contributors evaluate fluency, terminological accuracy, and grammatical precision.',
    language: 'French',
    sourceLanguage: 'French',
    targetLanguage: 'English',
    country: 'Global',
    skillsRequired: [
      'Bilingual French/English',
      'Machine Translation Post-Editing (MTPE)',
      'Localization QA',
      'Context Evaluation',
    ],
    requiredContributors: 4000,
    approvedContributors: 0,
    startDate: '2026-09-05',
    endDate: '2027-08-31',
    applicationDeadline: '2026-11-30',
    qualificationRequired: true,
    qualificationTestInfo:
      '15-minute French to English translation evaluation and terminology verification benchmark.',
    minimumRequirement:
      'Native or C1/C2 French proficiency with professional fluency in written English.',
    instructions:
      'Post-edit machine-translated French sentences into idiomatic, accurate English conforming to domain glossaries and quality rubrics.',
    communityLink: 'https://community.nexora.work/c/french-english-translation',
    announcement:
      'The French → English Machine Translation Project is currently welcoming applications worldwide.',
    status: 'Open',
    paymentType: 'Per Item',
    paymentRateType: 'range',
    paymentAmountMin: 0.8,
    paymentAmountMax: 3.0,
    ratePay: '$0.80 - $3 / item',
    createdAt: '2026-09-05',
  },
  {
    id: 'proj-arabic-en-001',
    name: 'Arabic → English Translation Project',
    category: 'Translation & Localization',
    projectType: 'Translation / AI Data',
    description:
      'Translation, localization, and quality review of high-value textual content, conversational datasets, and technical documentation from Modern Standard Arabic and regional dialects into fluent English. Contributors assess translation accuracy, grammatical fidelity, terminological precision, and cultural nuance.',
    language: 'Arabic, English',
    sourceLanguage: 'Arabic',
    targetLanguage: 'English',
    country: 'Global',
    skillsRequired: [
      'Bilingual Arabic/English',
      'Modern Standard Arabic (MSA)',
      'Context Checking',
      'Terminology Research',
      'Localization QA',
    ],
    requiredContributors: 1200,
    approvedContributors: 0,
    startDate: '2026-09-15',
    endDate: '2027-06-30',
    applicationDeadline: '2026-10-15',
    qualificationRequired: true,
    qualificationTestInfo:
      'Brief 15-minute bilingual Arabic to English translation evaluation and terminology verification benchmark.',
    minimumRequirement:
      'Native or C1/C2 Arabic proficiency and professional fluency in written English.',
    instructions:
      'Translate source Arabic passages into natural, grammatically sound English. Adhere strictly to domain glossaries, maintain cultural context, and flag ambiguous idiomatic phrasing.',
    communityLink: 'https://community.nexora.work/c/arabic-english-translation',
    announcement:
      'The Arabic → English Translation Project is officially open for applications. Complete your contributor profile and apply to schedule your qualification benchmark.',
    status: 'Open',
    paymentType: 'Per Item',
    paymentRateType: 'range',
    paymentAmountMin: 0.3,
    paymentAmountMax: 0.7,
    ratePay: '$0.30 - $0.70 / item',
    createdAt: '2026-09-01',
  },
];

// Clean real-state collections: No fake/demo data
export const INITIAL_APPLICATIONS: ProjectApplication[] = [];
export const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [];
export const INITIAL_EARNINGS: ContributorEarning[] = [];
export const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [];
export const INITIAL_PROJECT_UPDATES: ProjectUpdate[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_USERS: UserProfile[] = [];

// 18 Work taxonomies according to SRS v1.1
export const ALL_CATEGORIES = [
  {
    name: 'Translation & Localization',
    description: 'Translate, localize, and quality-check content between language pairs with human nuances.',
    icon: 'Languages',
    count: 1,
  },
  {
    name: 'Transcription',
    description: 'Convert speech, conversations, and audio/video files into clean, timestamped text.',
    icon: 'Headphones',
    count: 0,
  },
  {
    name: 'Audio Annotation',
    description: 'Analyze acoustic events, speaker diarization, emotions, and sound classification.',
    icon: 'Mic',
    count: 0,
  },
  {
    name: 'Text Annotation',
    description: 'Entity recognition, sentiment analysis, topic categorization, and linguistic tagging.',
    icon: 'FileText',
    count: 0,
  },
  {
    name: 'Image Annotation',
    description: 'Bounding boxes, polygon segmentation, keypoints, and visual defect identification.',
    icon: 'Image',
    count: 0,
  },
  {
    name: 'Video Annotation',
    description: 'Object tracking across frames, action recognition, scene transitions, and event timing.',
    icon: 'Video',
    count: 0,
  },
  {
    name: 'AI Data Collection',
    description: 'Collect rich real-world voice samples, images, documents, and dialogue recordings.',
    icon: 'FolderPlus',
    count: 0,
  },
  {
    name: 'Data Labeling',
    description: 'Categorize datasets, assign multi-class labels, and structure raw training data.',
    icon: 'Tag',
    count: 0,
  },
  {
    name: 'LLM Evaluation',
    description: 'Compare multi-model responses, audit truthfulness, reasoning quality, and RLHF criteria.',
    icon: 'Bot',
    count: 0,
  },
  {
    name: 'AI Model Evaluation',
    description: 'Stress-test AI outputs against benchmarks, identify hallucinations, and score accuracy.',
    icon: 'Cpu',
    count: 0,
  },
  {
    name: 'Linguistic Evaluation',
    description: 'Expert syntax, morphology, pragmatics, naturalness, and regional dialect validation.',
    icon: 'BookOpen',
    count: 0,
  },
  {
    name: 'Search / Relevance Evaluation',
    description: 'Judge query intent, web search result utility, content freshness, and domain relevance.',
    icon: 'Search',
    count: 0,
  },
  {
    name: 'Question & Answer (KQA/QA)',
    description: 'Formulate questions, verify knowledge graph ground-truth answers, and test QA engines.',
    icon: 'HelpCircle',
    count: 0,
  },
  {
    name: 'Speech / ASR Projects',
    description: 'Automatic speech recognition correction, phoneme alignment, and pronunciation testing.',
    icon: 'Volume2',
    count: 0,
  },
  {
    name: 'Prompt Evaluation',
    description: 'Assess prompt effectiveness, user intent alignment, and safety instruction compliance.',
    icon: 'MessageSquare',
    count: 0,
  },
  {
    name: 'Content Evaluation',
    description: 'Review digital content for community guidelines, misinformation, safety, and suitability.',
    icon: 'ShieldCheck',
    count: 0,
  },
  {
    name: 'Data Quality Assurance',
    description: 'Senior audit, consensus scoring, error categorization, and contributor feedback loops.',
    icon: 'CheckCircle2',
    count: 0,
  },
  {
    name: 'Other AI/Data Projects',
    description: 'Custom workflows, bespoke multi-modal tasks, and specialized enterprise data pipelines.',
    icon: 'Sparkles',
    count: 0,
  },
] as const;
