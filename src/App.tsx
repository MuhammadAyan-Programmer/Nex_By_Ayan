import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Project } from './types';
import { PublicWebsite } from './components/public/PublicWebsite';
import { AuthModal } from './components/auth/AuthModal';
import { ProjectDetailsModal } from './components/dashboard/ProjectDetailsModal';
import { ProjectApplicationModal } from './components/dashboard/ProjectApplicationModal';
import { EmailVerifyModal } from './components/dashboard/EmailVerifyModal';
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

const AppContent: React.FC = () => {
  const { currentUser, projects } = useApp();

  // Auth & Project Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<Project | null>(null);
  const [selectedProjectForApp, setSelectedProjectForApp] = useState<Project | null>(null);
  const [isEmailVerifyOpen, setIsEmailVerifyOpen] = useState(false);

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
          }}
          onOpenCreateProject={() => setIsAdminCreateOpen(true)}
        />

        {/* Main Dashboard Content Area */}
        <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto max-h-screen">
          <div className="max-w-7xl mx-auto">
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
              />
            )}
            {adminTab === 'applications' && <AdminApplicationsView />}
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
            {adminTab === 'settings' && <AdminSettingsView />}
          </div>
        </main>

        {/* Admin Modals */}
        <AdminCreateProjectModal
          isOpen={isAdminCreateOpen}
          onClose={() => setIsAdminCreateOpen(false)}
        />
      </div>
    );
  }

  // 3. CONTRIBUTOR DASHBOARD VIEW
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
