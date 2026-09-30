import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser } from './firebase';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { Dashboard } from './components/Dashboard';
import { RdoList } from './components/RdoList';
import { ProjectsManager } from './components/ProjectsManager';
import { CompaniesManager } from './components/CompaniesManager';
import { TeamManager } from './components/TeamManager';
import { AudioRdoModal } from './components/AudioRdoModal';
import { RdoFormModal } from './components/RdoFormModal';
import { RdoDetailModal } from './components/RdoDetailModal';
import { AuthModal } from './components/AuthModal';
import { LandingLoginPage } from './components/LandingLoginPage';
import {
  subscribeCompanies,
  saveCompany,
  deleteCompany,
  subscribeProjects,
  saveProject,
  deleteProject,
  subscribeTeam,
  saveTeamMember,
  deleteTeamMember,
  subscribeRdos,
  saveRdo,
  deleteRdo,
} from './services/dbService';
import {
  Company,
  Project,
  TeamMember,
  Rdo,
  UserProfile,
  ParsedRdoFromAi,
} from './types';

export default function App() {
  // Authentication & Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('obracert_is_authenticated') === 'true';
  });

  // Mobile Sidebar Drawer State
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Desktop Sidebar Collapsed State (persisted in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('obracert_sidebar_collapsed') === 'true';
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('obracert_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Navigation State
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'rdos' | 'projects' | 'companies' | 'team'>('dashboard');

  // User Profile & System Role (Editor vs Visualizador)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('obracert_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      uid: 'user-larissa-01',
      email: 'larifreitaseng@gmail.com',
      displayName: 'Eng. Larissa Freitas',
      systemRole: 'Editor',
    };
  });
  const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState(false);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsGoogleLoggedIn(true);
        setIsAuthenticated(true);
        localStorage.setItem('obracert_is_authenticated', 'true');
        setUserProfile((prev) => {
          const updated: UserProfile = {
            ...prev,
            uid: user.uid,
            email: user.email || prev.email,
            displayName: user.displayName || prev.displayName,
            photoURL: user.photoURL || undefined,
          };
          localStorage.setItem('obracert_active_user', JSON.stringify(updated));
          return updated;
        });
      } else {
        setIsGoogleLoggedIn(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setUserProfile(user);
    setIsAuthenticated(true);
    localStorage.setItem('obracert_is_authenticated', 'true');
    localStorage.setItem('obracert_active_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout error:', err);
    }
    setIsAuthenticated(false);
    setIsGoogleLoggedIn(false);
    localStorage.removeItem('obracert_is_authenticated');
    localStorage.removeItem('obracert_active_user');
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await loginWithGoogle();
      if (res?.user) {
        setIsAuthenticated(true);
        localStorage.setItem('obracert_is_authenticated', 'true');
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && !err?.message?.includes('popup-closed-by-user')) {
        alert(`Falha no login com Google: ${err.message}`);
      }
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutUser();
      setIsGoogleLoggedIn(false);
    } catch (err: any) {
      console.warn('Logout error:', err);
    }
  };

  // Domain Collections State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [rdos, setRdos] = useState<Rdo[]>([]);

  // Filter state for RDOs list
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Modals State
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [rdoFormOpen, setRdoFormOpen] = useState(false);
  const [editingRdo, setEditingRdo] = useState<Rdo | null>(null);
  const [selectedRdoForView, setSelectedRdoForView] = useState<Rdo | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Subscribe to Firestore collections with real-time updates
  useEffect(() => {
    const unsubCompanies = subscribeCompanies((data) => setCompanies(data));
    const unsubProjects = subscribeProjects((data) => setProjects(data));
    const unsubTeam = subscribeTeam((data) => setTeam(data));
    const unsubRdos = subscribeRdos((data) => setRdos(data));

    return () => {
      unsubCompanies();
      unsubProjects();
      unsubTeam();
      unsubRdos();
    };
  }, []);

  // Handlers for Audio RDO from AI
  const handleApplyParsedData = (data: ParsedRdoFromAi, targetProjectId: string) => {
    const proj = projects.find((p) => p.id === targetProjectId) || projects[0];
    const generatedNumber = `RDO #${Math.floor(100 + Math.random() * 900)}`;

    const draftRdo: Rdo = {
      id: `rdo-${Date.now()}`,
      rdoNumber: generatedNumber,
      projectId: proj ? proj.id : '',
      projectName: proj ? proj.name : 'Obra em Andamento',
      date: new Date().toISOString().split('T')[0],
      weatherMorning: data.weatherMorning || 'Ensolarado',
      weatherAfternoon: data.weatherAfternoon || 'Nublado',
      weatherNight: data.weatherNight || 'Ensolarado',
      workforce: data.workforce.map((w, idx) => ({
        id: `w-${idx}-${Date.now()}`,
        role: w.role,
        count: w.count,
        type: w.type,
      })),
      totalWorkers: data.totalWorkers || 12,
      equipment: data.equipment.map((eq, idx) => ({
        id: `eq-${idx}-${Date.now()}`,
        name: eq.name,
        quantity: eq.quantity,
        status: eq.status,
      })),
      activities: data.activities.map((act, idx) => ({
        id: `act-${idx}-${Date.now()}`,
        description: act.description,
        location: act.location,
        progressPercent: act.progressPercent,
        status: act.status,
      })),
      materials: data.materials.map((m, idx) => ({
        id: `mat-${idx}-${Date.now()}`,
        item: m.item,
        quantity: m.quantity,
        unit: m.unit,
        supplierOrInvoice: m.supplierOrInvoice || '',
      })),
      occurrences: data.occurrences || '',
      generalNotes: data.generalNotes || '',
      photoAttachments: [],
      googleDriveLink: proj?.googleDriveFolderUrl || '',
      audioTranscript: data.transcriptText || '',
      createdBy: userProfile.uid,
      authorName: userProfile.displayName,
      authorEmail: userProfile.email,
      status: 'Finalizado',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEditingRdo(draftRdo);
    setRdoFormOpen(true);
  };

  const handleOpenNewRdo = () => {
    setEditingRdo(null);
    setRdoFormOpen(true);
  };

  const handleEditRdo = (rdo: Rdo) => {
    setEditingRdo(rdo);
    setRdoFormOpen(true);
  };

  const handleFilterByProject = (projId: string) => {
    setSelectedProjectId(projId);
    setCurrentTab('rdos');
  };

  const selectedRdoProject = projects.find((p) => p.id === selectedRdoForView?.projectId);
  const selectedRdoCompany = companies.find((c) => c.id === selectedRdoProject?.companyId);

  // If user is logged out or opening shared link for the first time, show Landing & Login page
  if (!isAuthenticated) {
    return (
      <LandingLoginPage
        onLoginSuccess={handleLoginSuccess}
        onGoogleLogin={handleGoogleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Left Navigation Panel (Sidebar) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        onOpenVoiceModal={() => setVoiceModalOpen(true)}
        onOpenNewRdoModal={handleOpenNewRdo}
        onLogout={handleLogout}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isGoogleLoggedIn={isGoogleLoggedIn}
        onGoogleLogin={handleGoogleLogin}
        onGoogleLogout={handleGoogleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        counts={{
          rdos: rdos.length,
          projects: projects.length,
          companies: companies.length,
          team: team.length,
        }}
      />

      {/* Main Viewport Container (Offset on desktop smoothly according to sidebar state) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64 xl:pl-72'
        } min-h-screen`}
      >
        {/* Clean, Uncluttered Top Header */}
        <TopHeader
          currentTab={currentTab}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onLogout={handleLogout}
          isGoogleLoggedIn={isGoogleLoggedIn}
          onGoogleLogin={handleGoogleLogin}
          onGoogleLogout={handleGoogleLogout}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentTab === 'dashboard' && (
            <Dashboard
              projects={projects}
              rdos={rdos}
              companies={companies}
              systemRole={userProfile.systemRole}
              onOpenVoiceModal={() => setVoiceModalOpen(true)}
              onOpenNewRdo={handleOpenNewRdo}
              onOpenNewProject={() => setCurrentTab('projects')}
              onSelectRdo={(rdo) => setSelectedRdoForView(rdo)}
              onFilterByProject={handleFilterByProject}
              onNavigateToTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'rdos' && (
            <RdoList
              rdos={rdos}
              projects={projects}
              companies={companies}
              selectedProjectId={selectedProjectId}
              setSelectedProjectId={setSelectedProjectId}
              systemRole={userProfile.systemRole}
              onSelectRdo={(rdo) => setSelectedRdoForView(rdo)}
              onEditRdo={handleEditRdo}
              onDeleteRdo={deleteRdo}
              onSaveRdo={saveRdo}
              onOpenVoiceModal={() => setVoiceModalOpen(true)}
              onOpenNewRdo={handleOpenNewRdo}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsManager
              projects={projects}
              companies={companies}
              systemRole={userProfile.systemRole}
              userProfile={userProfile}
              onSaveProject={saveProject}
              onDeleteProject={deleteProject}
            />
          )}

          {currentTab === 'companies' && (
            <CompaniesManager
              companies={companies}
              systemRole={userProfile.systemRole}
              onSaveCompany={saveCompany}
              onDeleteCompany={deleteCompany}
            />
          )}

          {currentTab === 'team' && (
            <TeamManager
              team={team}
              companies={companies}
              projects={projects}
              systemRole={userProfile.systemRole}
              onSaveMember={saveTeamMember}
              onDeleteMember={deleteTeamMember}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© 2026 Obracert RDO · Sistema de Gestão de Diários de Obra com IA</p>
            <div className="flex items-center gap-3 text-slate-600">
              <span>Engenharia Civil e Construção</span>
              <span>·</span>
              <span>Firebase e Gemini AI Integrados</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Auth Modal for Email & Password */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={userProfile}
        onUserChange={(updated) => setUserProfile(updated)}
        onGoogleLogin={handleGoogleLogin}
      />

      {/* Audio RDO Modal */}
      <AudioRdoModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onApplyParsedData={handleApplyParsedData}
      />

      {/* RDO Creation & Editing Form Modal */}
      <RdoFormModal
        isOpen={rdoFormOpen}
        onClose={() => {
          setRdoFormOpen(false);
          setEditingRdo(null);
        }}
        onSave={saveRdo}
        projects={projects}
        companies={companies}
        initialRdo={editingRdo}
        userProfile={userProfile}
      />

      {/* RDO Technical Detail & Printable View Modal */}
      <RdoDetailModal
        rdo={selectedRdoForView}
        project={selectedRdoProject}
        company={selectedRdoCompany}
        systemRole={userProfile.systemRole}
        isOpen={!!selectedRdoForView}
        onClose={() => setSelectedRdoForView(null)}
        onEdit={handleEditRdo}
        onSaveRdo={saveRdo}
      />
    </div>
  );
}
