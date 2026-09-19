import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Project } from './types';
import { Eye, X } from 'lucide-react';
import { PublicWebsite } from './components/public/PublicWebsite';
import { AuthModal } from './components/auth/AuthModal';
import { ProjectDetailsModal } from './components/dashboard/ProjectDetailsModal';
import { ProjectApplicationModal } from './components/dashboard/ProjectApplicationModal';
import { EmailVerifyModal } from './components/dashboard/EmailVerifyModal';
import { EmailVerificationModal } from './components/auth/EmailVerificationModal';
import { UserSidebar, UserTab } from './components/dashboard/UserSidebar';
import { UserDashboardHome } from './components/dashboard/UserDashboardHome';
import { BrowseProjectsView } from './components/dashboard/BrowseProjectsView';
import { MyApplicationsView } from './components/dashboard/MyApplicationsView';
import { ActiveProjectsView } from './components/dashboard/ActiveProjectsView';
import { EarningsView } from './components/dashboard/EarningsView';
import { PaymentMethodsView } from './components/dashboard/PaymentMethodsView';
import { UserProfileView } from './components/dashboard/UserProfileView';
import { NotificationsView } from './components/dashboard/NotificationsView';

// Admin imports
import { AdminSidebar, AdminTab } from './components/admin/AdminSidebar';
import { AdminDashboardHome } from './components/admin/AdminDashboardHome';
import { AdminCreateProjectModal } from './components/admin/AdminCreateProjectModal';
import { AdminProjectsView } from './components/admin/AdminProjectsView';
import { AdminApplicationsView } from './components/admin/AdminApplicationsView';
import { AdminApprovedContributorsView } from './components/admin/AdminApprovedContributorsView';
import { AdminProjectUpdatesView } from './components/admin/AdminProjectUpdatesView';
import { AdminPaymentsView } from './components/admin/AdminPaymentsView';
import { AdminUsersView } from './components/admin/AdminUsersView';
import { AdminSettingsView } from './components/admin/AdminSettingsView';
import { AdminMaintenanceView } from './components/admin/AdminMaintenanceView';
import { MaintenancePage } from './components/common/MaintenancePage';

const AppContent: React.FC = () => {
  const { currentUser, projects, logout, maintenanceState, toggleMaintenance } = useApp();

  // Auth & Project Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<Project | null>(null);
  const [selectedProjectForApp, setSelectedProjectForApp] = useState<Project | null>(null);
  const [isEmailVerifyOpen, setIsEmailVerifyOpen] = useState(false);

  // Email verification modal state
  const [verificationModal, setVerificationModal] = useState<{
    isOpen: boolean;
    email?: string;
    token?: string;
    expiresAt?: number;
    initialState?: 'created' | 'unverified_notice' | 'verifying' | 'success' | 'expired';
    emailSent?: boolean;
    emailError?: string;
  }>({
    isOpen: false,
  });

  // Admin preview of public/contributor maintenance page
  const [isAdminPreviewingMaintenance, setIsAdminPreviewingMaintenance] = useState(false);

  // Check URL query param or hash for email verification links (?verifyToken=... or #verify=...)
  React.useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const oobCode = searchParams.get('oobCode');
      const tokenFromQuery =
        oobCode ||
        searchParams.get('verifyToken') ||
        searchParams.get('token') ||
        searchParams.get('verify_token');
      const hash = window.location.hash;
      const tokenFromHash = hash.startsWith('#verify=') ? hash.replace('#verify=', '') : null;
      const token = tokenFromQuery || tokenFromHash;

      if (token) {
        setVerificationModal({
          isOpen: true,
          token: token.trim(),
          initialState: 'verifying',
        });
        if (window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (e) {
      console.warn('URL token check notice:', e);
    }
  }, []);

  // Contributor Dashboard Tab
  const [contributorTab, setContributorTab] = useState<UserTab>('dashboard');

  // Admin Dashboard Tab & Modals
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [isAdminCreateOpen, setIsAdminCreateOpen] = useState(false);
  const [adminCreditTarget, setAdminCreditTarget] = useState<{
    userId: string;
    projectId: string;
  } | null>(null);
  const [adminProjectContributorsFilter, setAdminProjectContributorsFilter] = useState<
    string | undefined
  >(undefined);
  const [adminProjectApplicationsFilter, setAdminProjectApplicationsFilter] = useState<
    string | undefined
  >(undefined);

  // Handlers for Project actions
  const handleViewProjectDetails = (project: Project) => {
    setSelectedProjectForDetails(project);
  };

  const handleApplyToProject = (project: Project) => {
    if (!currentUser) {
      setAuthMode('login');
      setIsAuthOpen(true);
      return;
    }
    setSelectedProjectForApp(project);
  };

  // 0. SYSTEM UNDER MAINTENANCE (Applies to all non-admin users across the entire application)
  if (maintenanceState.isActive && currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950">
        <MaintenancePage
          onAdminLoginRequested={() => {
            setAuthMode('login');
            setIsAuthOpen(true);
          }}
        />

        <AuthModal
          isOpen={isAuthOpen}
          initialMode="login"
          onClose={() => setIsAuthOpen(false)}
          onOpenVerification={(data) => {
            setVerificationModal({
              isOpen: true,
              email: data.email,
              token: data.token,
              expiresAt: data.expiresAt,
              initialState: data.initialState,
              emailSent: data.emailSent,
              emailError: data.emailError,
            });
          }}
        />
      </div>
    );
  }

  // 1. PUBLIC WEBSITE VIEW (When not logged in)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white">
        <PublicWebsite
          projects={projects}
          onOpenLogin={() => {
            setAuthMode('login');
            setIsAuthOpen(true);
          }}
          onOpenRegister={() => {
            setAuthMode('register');
            setIsAuthOpen(true);
          }}
          onViewProjectDetails={handleViewProjectDetails}
          onSelectCategory={(category) => {
            // Can open register/login with category context
            setAuthMode('register');
            setIsAuthOpen(true);
          }}
        />

        {/* Global Modals in Public Mode */}
        <AuthModal
          isOpen={isAuthOpen}
          initialMode={authMode}
          onClose={() => setIsAuthOpen(false)}
          onOpenVerification={(data) => {
            setVerificationModal({
              isOpen: true,
              email: data.email,
              token: data.token,
              expiresAt: data.expiresAt,
              initialState: data.initialState,
              emailSent: data.emailSent,
              emailError: data.emailError,
            });
          }}
        />

        <EmailVerificationModal
          isOpen={verificationModal.isOpen}
          email={verificationModal.email}
          token={verificationModal.token}
          expiresAt={verificationModal.expiresAt}
          initialState={verificationModal.initialState}
          emailSent={verificationModal.emailSent}
          emailError={verificationModal.emailError}
          onClose={() => setVerificationModal((prev) => ({ ...prev, isOpen: false }))}
          onContinueToLogin={() => {
            setVerificationModal((prev) => ({ ...prev, isOpen: false }));
            setAuthMode('login');
            setIsAuthOpen(true);
          }}
        />

        <ProjectDetailsModal
          project={selectedProjectForDetails}
          isOpen={Boolean(selectedProjectForDetails)}
          onClose={() => setSelectedProjectForDetails(null)}
          onApplyClick={(proj) => {
            setSelectedProjectForDetails(null);
            setAuthMode('login');
            setIsAuthOpen(true);
          }}
        />
      </div>
    );
  }

  // 2. ADMIN DASHBOARD VIEW (Strict dashboard layout: Left Sidebar + Main Content)
  if (currentUser.role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-row">
        {/* Left Column Navigation */}
        <AdminSidebar
          activeTab={adminTab}
          setActiveTab={(tab) => {
            setAdminTab(tab);
            setAdminCreditTarget(null);
            setAdminProjectContributorsFilter(undefined);
            setAdminProjectApplicationsFilter(undefined);
          }}
          onOpenCreateProject={() => setIsAdminCreateOpen(true)}
        />

        {/* Main Dashboard Content Area */}
        <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto max-h-screen">
          <div className="max-w-7xl mx-auto">
            {/* Top Admin Global Maintenance Alert Bar */}
            {maintenanceState.isActive && (
              <div
                id="admin-top-maintenance-status-bar"
                className="mb-6 p-4 bg-red-600 text-white rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
                  <div>
                    <span className="font-extrabold text-sm block">System Under Maintenance is Currently ACTIVE</span>
                    <span className="opacity-90">
                      All non-admin visitors and contributors are blocked from regular views and are seeing the maintenance screen.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAdminPreviewingMaintenance(true)}
                    className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview User Screen
                  </button>
                  {adminTab !== 'maintenance' && (
                    <button
                      type="button"
                      onClick={() => setAdminTab('maintenance')}
                      className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Open Maintenance Schedule
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleMaintenance(false)}
                    className="px-3.5 py-1.5 bg-white text-red-700 hover:bg-red-50 font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    Disable Maintenance Now
                  </button>
                </div>
              </div>
            )}

            {adminTab === 'dashboard' && (
              <AdminDashboardHome
                onNavigate={setAdminTab}
                onOpenCreateProject={() => setIsAdminCreateOpen(true)}
              />
            )}
            {adminTab === 'users' && <AdminUsersView />}
            {adminTab === 'projects' && (
              <AdminProjectsView
                onOpenCreateProject={() => setIsAdminCreateOpen(true)}
                onViewContributorsForProject={(pId) => {
                  setAdminProjectContributorsFilter(pId);
                  setAdminTab('approved-contributors');
                }}
                onViewApplicationsForProject={(pId) => {
                  setAdminProjectApplicationsFilter(pId);
                  setAdminTab('applications');
                }}
              />
            )}
            {adminTab === 'applications' && (
              <AdminApplicationsView initialProjectId={adminProjectApplicationsFilter} />
            )}
            {adminTab === 'approved-contributors' && (
              <AdminApprovedContributorsView
                initialProjectId={adminProjectContributorsFilter}
                onCreditPaymentForUser={(uId, pId) => {
                  setAdminCreditTarget({ userId: uId, projectId: pId });
                  setAdminTab('payments');
                }}
              />
            )}
            {adminTab === 'project-updates' && <AdminProjectUpdatesView />}
            {adminTab === 'payments' && (
              <AdminPaymentsView
                initialUserId={adminCreditTarget?.userId}
                initialProjectId={adminCreditTarget?.projectId}
              />
            )}
            {adminTab === 'maintenance' && <AdminMaintenanceView />}
            {adminTab === 'settings' && <AdminSettingsView onNavigateToMaintenance={() => setAdminTab('maintenance')} />}
          </div>
        </main>

        {/* Admin Modals */}
        <AdminCreateProjectModal
          isOpen={isAdminCreateOpen}
          onClose={() => setIsAdminCreateOpen(false)}
        />

        {/* Admin Maintenance Screen Preview Overlay */}
        {isAdminPreviewingMaintenance && (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Admin Live Preview: What visitors & contributors see
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminPreviewingMaintenance(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                Exit Preview
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MaintenancePage />
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. CONTRIBUTOR DASHBOARD VIEW
  // Strict check: Only users who are Approved by the Admin are allowed to access the application.
  const isPendingApproval = currentUser.role !== 'admin' && currentUser.approvalStatus === 'pending';
  const isRejected = currentUser.role !== 'admin' && currentUser.approvalStatus === 'rejected';

  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto text-2xl shadow-inner">
            ⏳
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your account is pending admin approval</h2>
          <p className="text-sm font-semibold text-slate-700">
            Registration Submitted Successfully
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your contributor profile has been registered and is currently awaiting review by the platform administrator. Once approved, you will be able to sign in and access the dashboard.
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left">
            <span className="font-bold block mb-0.5">Account Details:</span>
            <span>{currentUser.email} • Registered {currentUser.createdAt ? currentUser.createdAt.split('T')[0] : 'Today'}</span>
          </div>
          <div className="pt-2">
            <button
              type="button"
              id="btn-pending-gate-return"
              onClick={() => logout()}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
            >
              Sign Out & Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="min-h-screen bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto text-2xl shadow-inner">
            ✕
          </div>
          <h2 className="text-xl font-bold text-slate-900">Account Registration Declined</h2>
          <p className="text-sm font-semibold text-rose-700">
            Your registration was not approved by the administrator.
          </p>
          {currentUser.rejectionReason && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 text-left">
              <span className="font-bold block mb-0.5">Reason:</span>
              <span>{currentUser.rejectionReason}</span>
            </div>
          )}
          <p className="text-xs text-slate-500 leading-relaxed">
            Please contact the administration team at support@nexora.work if you believe this is an error.
          </p>
          <div className="pt-2">
            <button
              type="button"
              id="btn-rejected-gate-return"
              onClick={() => logout()}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
            >
              Sign Out & Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // "IMPORTANT UI : After user login, show ONLY the dashboard interface with: Left Sidebar, Main Dashboard Content.
  // The footer and public website sections should be hidden inside the logged-in dashboard."
  return (
    <div className="min-h-screen bg-slate-100 flex flex-row">
      {/* Strict Left Sidebar Column */}
      <UserSidebar
        activeTab={contributorTab}
        setActiveTab={setContributorTab}
        onOpenEmailVerifyModal={() => setIsEmailVerifyOpen(true)}
      />

      {/* Main Dashboard Content Area */}
      <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto">
          {contributorTab === 'dashboard' && (
            <UserDashboardHome
              onNavigate={setContributorTab}
              onViewProject={handleViewProjectDetails}
            />
          )}

          {contributorTab === 'browse-projects' && (
            <BrowseProjectsView
              onViewDetails={handleViewProjectDetails}
              onApply={handleApplyToProject}
            />
          )}

          {contributorTab === 'my-applications' && (
            <MyApplicationsView onNavigate={setContributorTab} />
          )}

          {contributorTab === 'active-projects' && (
            <ActiveProjectsView
              onViewProject={handleViewProjectDetails}
              onNavigate={setContributorTab}
            />
          )}

          {contributorTab === 'earnings' && <EarningsView onNavigate={setContributorTab} />}

          {contributorTab === 'payment-methods' && <PaymentMethodsView />}

          {contributorTab === 'profile' && <UserProfileView />}

          {contributorTab === 'notifications' && <NotificationsView />}
        </div>
      </main>

      {/* Contributor Modals */}
      <ProjectDetailsModal
        project={selectedProjectForDetails}
        isOpen={Boolean(selectedProjectForDetails)}
        onClose={() => setSelectedProjectForDetails(null)}
        onApplyClick={(proj) => {
          setSelectedProjectForDetails(null);
          setSelectedProjectForApp(proj);
        }}
      />

      <ProjectApplicationModal
        project={selectedProjectForApp}
        isOpen={Boolean(selectedProjectForApp)}
        onClose={() => setSelectedProjectForApp(null)}
        onSuccess={() => {
          setContributorTab('my-applications');
        }}
      />

      <EmailVerifyModal
        isOpen={isEmailVerifyOpen}
        onClose={() => setIsEmailVerifyOpen(false)}
      />

      <EmailVerificationModal
        isOpen={verificationModal.isOpen}
        email={verificationModal.email}
        token={verificationModal.token}
        expiresAt={verificationModal.expiresAt}
        initialState={verificationModal.initialState}
        onClose={() => setVerificationModal((prev) => ({ ...prev, isOpen: false }))}
        onContinueToLogin={() => {
          setVerificationModal((prev) => ({ ...prev, isOpen: false }));
          logout();
          setAuthMode('login');
          setIsAuthOpen(true);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
