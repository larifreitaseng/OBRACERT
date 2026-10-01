import React from 'react';
import {
  Menu,
  FolderGit2,
  FileText,
  HardHat,
  Building2,
  Users,
  LogOut,
  FolderOpen,
  Calendar,
  ShieldCheck,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { SystemRole, UserProfile } from '../types';

interface TopHeaderProps {
  currentTab: 'dashboard' | 'rdos' | 'projects' | 'companies' | 'team';
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onOpenMobileSidebar: () => void;
  onLogout: () => void;
  isGoogleLoggedIn?: boolean;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
  onOpenGoogleDriveModal?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  userProfile,
  setUserProfile,
  onOpenMobileSidebar,
  onLogout,
  isGoogleLoggedIn,
  onGoogleLogin,
  onGoogleLogout,
  onOpenGoogleDriveModal,
}) => {
  const getTabInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Dashboard de Obras',
          subtitle: 'Visão executiva, clima e avanço físico',
          icon: FolderGit2,
        };
      case 'rdos':
        return {
          title: 'Relatórios Diários de Obra (RDO)',
          subtitle: 'Histórico, fotos e diários técnicos com IA',
          icon: FileText,
        };
      case 'projects':
        return {
          title: 'Gestão de Obras e Canteiros',
          subtitle: 'Cadastro de obras, endereços e prazos',
          icon: HardHat,
        };
      case 'companies':
        return {
          title: 'Empresas e Empreiteiras',
          subtitle: 'Construtoras parceiras e prestadores',
          icon: Building2,
        };
      case 'team':
        return {
          title: 'Equipe Técnica e Operacional',
          subtitle: 'Engenheiros, mestres e encarregados',
          icon: Users,
        };
      default:
        return {
          title: 'Obracert RDO',
          subtitle: 'Engenharia Civil e Diários de Obra',
          icon: HardHat,
        };
    }
  };

  const { title, subtitle, icon: Icon } = getTabInfo();

  const toggleRole = () => {
    const nextRole: SystemRole = userProfile.systemRole === 'Editor' ? 'Visualizador' : 'Editor';
    setUserProfile((prev) => ({
      ...prev,
      systemRole: nextRole,
    }));
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between">
        {/* Left Side: Mobile Menu Button & Clean Page Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex w-9 h-9 rounded-xl bg-slate-100 text-slate-700 items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs">
              <Icon className="w-4 h-4 text-slate-800" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {title}
              </h1>
              <p className="text-[11px] text-slate-700 hidden xs:block leading-tight">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Status Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Google Drive Status Indicator (Individual User Account) */}
          {userProfile.googleDriveConnected ? (
            <button
              onClick={onOpenGoogleDriveModal}
              title={`Conta Google Conectada: ${userProfile.googleDriveEmail || userProfile.email}. Clique para gerenciar.`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <FolderOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline font-bold">
                {userProfile.googleDriveEmail ? userProfile.googleDriveEmail.split('@')[0] : 'Drive Ativo'}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenGoogleDriveModal}
              title="Conectar sua conta Google Drive pessoal ou corporativa"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 hover:text-blue-900 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Conectar meu Drive</span>
            </button>
          )}

          {/* Role Indicator / Switcher */}
          <button
            onClick={toggleRole}
            title={`Clique para alternar para ${userProfile.systemRole === 'Editor' ? 'Visualizador' : 'Editor'}`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              userProfile.systemRole === 'Editor'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200/70'
                : 'bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200/70'
            }`}
          >
            {userProfile.systemRole === 'Editor' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-blue-700" />
            )}
            <span>{userProfile.systemRole}</span>
          </button>

          {/* Quick Logout Button */}
          <button
            onClick={onLogout}
            title="Sair do aplicativo"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-rose-700 hover:text-rose-800 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/80 rounded-lg transition-colors font-semibold cursor-pointer shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
