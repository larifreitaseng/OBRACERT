import React from 'react';
import {
  HardHat,
  FileText,
  Building2,
  FolderGit2,
  Users,
  Mic,
  Plus,
  ShieldCheck,
  Eye,
  LogOut,
  FolderOpen,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SystemRole, UserProfile } from '../types';

interface SidebarProps {
  currentTab: 'dashboard' | 'rdos' | 'projects' | 'companies' | 'team';
  setCurrentTab: (tab: 'dashboard' | 'rdos' | 'projects' | 'companies' | 'team') => void;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onOpenVoiceModal: () => void;
  onOpenNewRdoModal: () => void;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isGoogleLoggedIn?: boolean;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
  onOpenGoogleDriveModal?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  counts?: {
    rdos: number;
    projects: number;
    companies: number;
    team: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  userProfile,
  setUserProfile,
  onOpenVoiceModal,
  onOpenNewRdoModal,
  onLogout,
  isOpenMobile,
  onCloseMobile,
  isGoogleLoggedIn,
  onGoogleLogin,
  onGoogleLogout,
  onOpenGoogleDriveModal,
  isCollapsed = false,
  onToggleCollapse,
  counts = { rdos: 0, projects: 0, companies: 0, team: 0 },
}) => {
  const toggleRole = () => {
    const nextRole: SystemRole = userProfile.systemRole === 'Editor' ? 'Visualizador' : 'Editor';
    setUserProfile((prev) => ({
      ...prev,
      systemRole: nextRole,
    }));
  };

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      description: 'Visão Geral e Indicadores',
      icon: FolderGit2,
      badge: null,
    },
    {
      id: 'rdos' as const,
      label: 'Diários de Obra',
      description: 'Relatórios Diários (RDO)',
      icon: FileText,
      badge: counts.rdos,
    },
    {
      id: 'projects' as const,
      label: 'Obras e Canteiros',
      description: 'Gestão de Projetos',
      icon: HardHat,
      badge: counts.projects,
    },
    {
      id: 'companies' as const,
      label: 'Empresas',
      description: 'Construtoras e Empreiteiras',
      icon: Building2,
      badge: counts.companies,
    },
    {
      id: 'team' as const,
      label: 'Equipe Técnica',
      description: 'Engenheiros e Mestres',
      icon: Users,
      badge: counts.team,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900 border-r border-slate-800 flex flex-col justify-between text-slate-100 shadow-2xl transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64 xl:w-72'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Top Section: Brand, Expand/Collapse & Quick Actions */}
        <div className="flex flex-col">
          {/* Logo & Header (Clicking Logo toggles Expand / Collapse) */}
          <div
            className={`h-16 border-b border-slate-800 flex items-center transition-all ${
              isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
            }`}
          >
            <button
              onClick={onToggleCollapse}
              title={
                isCollapsed
                  ? 'Clique na logo para EXPANDIR o painel lateral'
                  : 'Clique na logo para CONTRAIR o painel lateral'
              }
              className={`flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden transition-all ${
                isCollapsed ? 'justify-center w-full' : ''
              }`}
            >
              {/* Logo Icon with subtle chevron indicator */}
              <div className="relative w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
                <HardHat className="w-5 h-5 text-slate-950" />
                <div
                  className="hidden md:flex absolute -bottom-1 -right-1 w-4 h-4 bg-slate-900 text-amber-400 rounded-full items-center justify-center border border-amber-500/40 shadow-xs"
                  title={isCollapsed ? 'Expandir' : 'Contrair'}
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-2.5 h-2.5" />
                  ) : (
                    <ChevronLeft className="w-2.5 h-2.5" />
                  )}
                </div>
              </div>

              {/* Full Brand Text (Hidden when collapsed) */}
              {!isCollapsed && (
                <div className="flex flex-col animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black tracking-tight text-white leading-tight">
                      OBRACERT <span className="text-amber-500">RDO</span>
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider">
                    ENGENHARIA CIVIL
                  </span>
                </div>
              )}
            </button>

            {/* Mobile Close Button */}
            {!isCollapsed && (
              <button
                onClick={onCloseMobile}
                className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Quick Primary Actions */}
          <div
            className={`border-b border-slate-800/80 transition-all ${
              isCollapsed ? 'p-2 space-y-2 flex flex-col items-center' : 'p-3.5 space-y-2'
            }`}
          >
            {/* Gravar por Voz (IA) */}
            <button
              onClick={() => {
                onOpenVoiceModal();
                onCloseMobile();
              }}
              disabled={userProfile.systemRole === 'Visualizador'}
              title="Gravar RDO por Voz (IA)"
              className={`bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer group ${
                isCollapsed
                  ? 'w-11 h-11 rounded-xl flex items-center justify-center'
                  : 'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center ${
                    isCollapsed ? '' : 'w-6 h-6 rounded-md bg-slate-950/15'
                  }`}
                >
                  <Mic className="w-4 h-4 text-slate-950" />
                </div>
                {!isCollapsed && <span>Gravar por Voz (IA)</span>}
              </div>
              {!isCollapsed && (
                <Sparkles className="w-3.5 h-3.5 text-slate-950/70 group-hover:scale-110 transition-transform" />
              )}
            </button>

            {/* Novo RDO Manual */}
            <button
              onClick={() => {
                onOpenNewRdoModal();
                onCloseMobile();
              }}
              disabled={userProfile.systemRole === 'Visualizador'}
              title="Novo RDO Manual"
              className={`bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 hover:text-white font-bold border border-slate-700/80 active:scale-95 transition-all cursor-pointer ${
                isCollapsed
                  ? 'w-11 h-11 rounded-xl flex items-center justify-center'
                  : 'w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs'
              }`}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                {!isCollapsed && <span>Novo RDO Manual</span>}
              </div>
              {!isCollapsed && <span className="text-[10px] text-slate-400 font-mono">F2</span>}
            </button>
          </div>

          {/* Navigation Links List */}
          <div className={`transition-all ${isCollapsed ? 'p-2' : 'p-3'}`}>
            {!isCollapsed && (
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Navegação
              </div>
            )}

            <nav className={`space-y-1.5 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                if (isCollapsed) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        onCloseMobile();
                      }}
                      title={`${item.label} (${item.description})`}
                      className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 scale-105'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.badge !== null && item.badge > 0 && (
                        <span
                          className={`absolute -top-1 -right-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full tabular-nums ${
                            isActive
                              ? 'bg-slate-950 text-amber-400'
                              : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="leading-tight">{item.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal leading-tight">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    {item.badge !== null && item.badge > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold tabular-nums ${
                          isActive
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Cloud Google Drive Status Box */}
          <div className={`pt-2 transition-all ${isCollapsed ? 'px-2 flex justify-center' : 'px-3'}`}>
            {isCollapsed ? (
              <button
                onClick={isGoogleLoggedIn ? onGoogleLogout : onGoogleLogin}
                title={
                  isGoogleLoggedIn
                    ? 'Google Drive Conectado (Clique para desconectar)'
                    : 'Conectar ao Google Drive'
                }
                className={`relative w-11 h-11 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                  isGoogleLoggedIn
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <FolderOpen className="w-5 h-5" />
                {isGoogleLoggedIn && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            ) : (
              <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>Google Drive</span>
                  </div>
                  {isGoogleLoggedIn ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Ativo
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Offline</span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-tight">
                  {isGoogleLoggedIn
                    ? 'Backup automático de PDFs e fotos de campo ativo.'
                    : 'Sincronize sua 2ª Memória técnica em nuvem.'}
                </p>

                {isGoogleLoggedIn ? (
                  <button
                    onClick={onGoogleLogout}
                    className="w-full text-center py-1 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors font-medium cursor-pointer"
                  >
                    Desconectar Drive
                  </button>
                ) : (
                  <button
                    onClick={onGoogleLogin}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>Conectar Google Drive</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: User Profile & Logout */}
        <div
          className={`border-t border-slate-800 bg-slate-950/50 transition-all ${
            isCollapsed ? 'p-2 flex flex-col items-center space-y-2' : 'p-3 space-y-2'
          }`}
        >
          {isCollapsed ? (
            <>
              {/* Collapsed User Avatar */}
              <button
                onClick={toggleRole}
                title={`${userProfile.displayName} · Perfil: ${userProfile.systemRole} (Clique para alternar)`}
                className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center cursor-pointer shadow-xs hover:scale-105 transition-transform"
              >
                {userProfile.displayName
                  ? userProfile.displayName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'LF'}
              </button>

              {/* Collapsed Drive Button */}
              <button
                onClick={onOpenGoogleDriveModal}
                title={userProfile.googleDriveConnected ? `Google Drive Conectado: ${userProfile.googleDriveEmail || userProfile.email}` : 'Conectar ao Google Drive'}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors cursor-pointer relative ${
                  userProfile.googleDriveConnected
                    ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                {userProfile.googleDriveConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 animate-pulse"></span>
                )}
              </button>

              {/* Collapsed Logout Button */}
              <button
                onClick={onLogout}
                title="Sair do Aplicativo"
                className="w-10 h-10 flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {/* Full User Profile Card */}
              <div className="bg-slate-850 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {userProfile.displayName
                      ? userProfile.displayName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'LF'}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-white truncate">
                      {userProfile.displayName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {userProfile.email}
                    </div>
                  </div>
                </div>

                {/* Quick Role Toggle */}
                <button
                  onClick={toggleRole}
                  title={`Alternar para ${userProfile.systemRole === 'Editor' ? 'Visualizador' : 'Editor'}`}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                    userProfile.systemRole === 'Editor'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  }`}
                >
                  {userProfile.systemRole}
                </button>
              </div>

              {/* Google Drive Account Button (Per-User) */}
              <button
                onClick={onOpenGoogleDriveModal}
                className={`w-full flex items-center justify-between py-2 px-3 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                  userProfile.googleDriveConnected
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
                    : 'bg-slate-850 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${userProfile.googleDriveConnected ? 'text-emerald-400' : 'text-blue-400'}`} />
                  <span className="truncate">
                    {userProfile.googleDriveConnected
                      ? (userProfile.googleDriveEmail || 'Drive Conectado')
                      : 'Conectar meu Drive'}
                  </span>
                </div>
                {userProfile.googleDriveConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                )}
              </button>

              {/* Sair do Sistema Button */}
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Sair do Aplicativo</span>
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
