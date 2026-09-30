import React, { useState } from 'react';
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
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  LogIn,
  KeyRound,
  LogOut
} from 'lucide-react';
import { SystemRole, UserProfile } from '../types';

interface NavbarProps {
  currentTab: 'dashboard' | 'rdos' | 'projects' | 'companies' | 'team';
  setCurrentTab: (tab: 'dashboard' | 'rdos' | 'projects' | 'companies' | 'team') => void;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onOpenVoiceModal: () => void;
  onOpenNewRdoModal: () => void;
  onLogout: () => void;
  isGoogleLoggedIn?: boolean;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  userProfile,
  setUserProfile,
  onOpenVoiceModal,
  onOpenNewRdoModal,
  onLogout,
  isGoogleLoggedIn,
  onGoogleLogin,
  onGoogleLogout,
  onOpenAuthModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const toggleRole = (newRole: SystemRole) => {
    setUserProfile((prev) => ({
      ...prev,
      systemRole: newRole,
    }));
    setRoleDropdownOpen(false);
  };

  const navLinks: { id: 'dashboard' | 'rdos' | 'projects' | 'companies' | 'team'; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: FolderGit2 },
    { id: 'rdos', label: 'Diários (RDO)', icon: FileText },
    { id: 'projects', label: 'Obras', icon: HardHat },
    { id: 'companies', label: 'Empresas', icon: Building2 },
    { id: 'team', label: 'Equipe', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-hidden group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-xs transition-transform group-hover:scale-105">
                <HardHat className="w-5 h-5 text-slate-950" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
                  OBRACERT <span className="text-amber-600 font-black">RDO</span>
                </span>
                <span className="text-[10px] text-slate-700 tracking-wider font-semibold">
                  ENGENHARIA CIVIL
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Clean 4-6 text navigation links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-100 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions & Role / User Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Audio RDO button */}
            <button
              onClick={onOpenVoiceModal}
              disabled={userProfile.systemRole === 'Visualizador'}
              title={
                userProfile.systemRole === 'Visualizador'
                  ? 'Modo Visualizador: Apenas leitura'
                  : 'Criar RDO falando por áudio com IA'
              }
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-xs ${
                userProfile.systemRole === 'Visualizador'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-600/20 active:scale-98'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
              <span className="whitespace-nowrap">RDO por Voz (IA)</span>
            </button>

            {/* New RDO manual button */}
            <button
              onClick={onOpenNewRdoModal}
              disabled={userProfile.systemRole === 'Visualizador'}
              className={`hidden lg:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                userProfile.systemRole === 'Visualizador'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs active:scale-98'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">+ Novo RDO</span>
            </button>

            {/* Profile & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                  LF
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {userProfile.displayName}
                  </span>
                  <span className="text-[10px] text-slate-700">
                    {userProfile.systemRole}
                  </span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    userProfile.systemRole === 'Editor'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {userProfile.systemRole}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-2.5 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-2 py-1.5 border-b border-slate-100 mb-1.5">
                    <p className="text-xs font-bold text-slate-900">{userProfile.displayName}</p>
                    <p className="text-[11px] text-slate-700 truncate">{userProfile.email}</p>
                    <p className="text-[10px] text-amber-700 mt-0.5 font-medium">CREA-SP 506.123/D</p>
                  </div>

                  <p className="px-2 text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1">
                    Alternar Perfil de Acesso
                  </p>

                  <button
                    onClick={() => toggleRole('Editor')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors ${
                      userProfile.systemRole === 'Editor'
                        ? 'bg-amber-50 text-amber-900 font-semibold border border-amber-200'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <div className="text-left">
                        <div className="text-xs font-semibold">Perfil Editor</div>
                        <div className="text-[10px] text-slate-700">Cria, grava por áudio e edita RDOs</div>
                      </div>
                    </div>
                    {userProfile.systemRole === 'Editor' && (
                      <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-bold">
                        Ativo
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => toggleRole('Visualizador')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors mt-1 ${
                      userProfile.systemRole === 'Visualizador'
                        ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-200'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <div className="text-left">
                        <div className="text-xs font-semibold">Perfil Visualizador</div>
                        <div className="text-[10px] text-slate-700">Consulta relatórios e auditoria</div>
                      </div>
                    </div>
                    {userProfile.systemRole === 'Visualizador' && (
                      <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">
                        Ativo
                      </span>
                    )}
                  </button>

                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                    {onOpenAuthModal && (
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          onOpenAuthModal();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-2.5 py-1.5 text-xs text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors font-bold cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                        <span>Entrar com E-mail e Senha</span>
                      </button>
                    )}

                    {isGoogleLoggedIn ? (
                      <div>
                        <div className="flex items-center gap-1.5 px-2 py-1 mb-1 text-[11px] text-emerald-800 font-semibold bg-emerald-50 rounded-md">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                          <span>Google Drive Conectado</span>
                        </div>
                        <button
                          onClick={onGoogleLogout}
                          className="w-full text-center px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-semibold cursor-pointer"
                        >
                          Desconectar Conta Google
                        </button>
                      </div>
                    ) : (
                      <div>
                        <button
                          onClick={onGoogleLogin}
                          className="w-full flex items-center justify-center gap-2 px-2.5 py-2 text-xs text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors font-bold cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span>Conectar Google e Drive</span>
                        </button>
                        <p className="text-[10px] text-slate-500 text-center px-1 mt-1.5 leading-tight">
                          💡 Na tela do Google, clique em <strong>Continuar</strong> para liberar o salvamento no Drive.
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-2.5 py-2 text-xs text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-lg transition-colors font-bold cursor-pointer mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>Sair do Aplicativo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Logout Button in Top Bar */}
            <button
              onClick={onLogout}
              title="Sair do aplicativo"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors font-semibold cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Sair</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-lg ${
                  isActive
                    ? 'bg-slate-100 text-slate-950 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 text-slate-500" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenVoiceModal();
                setMobileMenuOpen(false);
              }}
              disabled={userProfile.systemRole === 'Visualizador'}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg"
            >
              <Mic className="w-4 h-4 text-slate-950" />
              <span>Gravar Áudio</span>
            </button>

            <button
              onClick={() => {
                onOpenNewRdoModal();
                setMobileMenuOpen(false);
              }}
              disabled={userProfile.systemRole === 'Visualizador'}
              className="flex items-center justify-center gap-1 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Novo RDO</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-lg cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Sair do Aplicativo</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
