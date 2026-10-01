import React, { useState } from 'react';
import {
  X,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LogOut,
  RefreshCw,
  HardHat,
  ShieldCheck,
  Link2,
  Save,
  HelpCircle
} from 'lucide-react';
import { UserProfile } from '../types';
import { connectUserGoogleDrive, disconnectUserGoogleDrive, saveUserProfile } from '../firebase';

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [folderUrlInput, setFolderUrlInput] = useState(userProfile.googleDriveFolderUrl || '');
  const [isSavingFolder, setIsSavingFolder] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await connectUserGoogleDrive(userProfile);
      onUpdateProfile(res.updatedProfile);
      setSuccessMessage(`Conta Google (${res.updatedProfile.googleDriveEmail}) conectada com sucesso para ${userProfile.displayName}!`);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed-by-user')) {
        // Just closed by user, no error
        setIsLoading(false);
        return;
      }

      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'obracert.netlify.app';
        setErrorMessage(
          `Domínio '${currentHost}' precisa de autorização no Firebase Console.\n\n` +
          `Como liberar (30 seg):\n` +
          `1. Acesse https://console.firebase.google.com\n` +
          `2. Vá em Authentication > Configurações > Domínios Autorizados\n` +
          `3. Adicione '${currentHost}'.\n\n` +
          `Enquanto isso, você pode cadastrar sua pasta do Drive abaixo para acesso direto!`
        );
      } else {
        setErrorMessage(err?.message || 'Falha ao conectar ao Google Drive.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Deseja realmente desconectar sua conta do Google Drive deste usuário?')) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const updated = await disconnectUserGoogleDrive(userProfile);
      onUpdateProfile(updated);
      setSuccessMessage('Conta do Google Drive desconectada com sucesso.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao desconectar Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFolderUrl = async () => {
    setIsSavingFolder(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const updated: UserProfile = {
        ...userProfile,
        googleDriveFolderUrl: folderUrlInput.trim() || undefined,
      };
      await saveUserProfile(updated);
      onUpdateProfile(updated);
      setSuccessMessage('Link da pasta do Google Drive salvo com sucesso!');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao salvar pasta.');
    } finally {
      setIsSavingFolder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <FolderOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Google Drive Individual
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Segunda Memória
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Conexão independente por usuário para fotos e relatórios em PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* User in App Info */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-sm shadow-xs">
                {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuário do Sistema:</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    {userProfile.systemRole}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900">{userProfile.displayName}</p>
                <p className="text-xs text-slate-600">{userProfile.email}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 whitespace-pre-line">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Connection Status Section */}
          {userProfile.googleDriveConnected ? (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    ✓
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Google Drive Conectado
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {userProfile.googleDriveEmail || userProfile.email}
                    </p>
                    {userProfile.googleDriveName && (
                      <p className="text-xs text-slate-600">
                        Conta: {userProfile.googleDriveName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {userProfile.googleDriveLinkedAt && (
                <p className="text-[11px] text-slate-500">
                  Conectado em: {new Date(userProfile.googleDriveLinkedAt).toLocaleDateString('pt-BR')} às {new Date(userProfile.googleDriveLinkedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => window.open(userProfile.googleDriveFolderUrl || 'https://drive.google.com', '_blank')}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Abrir meu Google Drive</span>
                </button>

                <button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-white hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Conectar com outra conta Google"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Trocar de Conta</span>
                </button>

                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-800 bg-white hover:bg-rose-50 border border-rose-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ml-auto disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Desconectar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Sua conta Google ainda não está vinculada
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Vincule sua conta individual do Google para que os relatórios em PDF com fotos e pastas de cada obra sejam salvos diretamente na sua nuvem.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 hover:text-slate-900 text-sm font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <span>{isLoading ? 'Conectando ao Google...' : 'Conectar com Google'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Optional: Personal or Shared Obra Folder URL */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                Pasta Pessoal ou Compartilhada no Google Drive (Opcional)
              </label>
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              Cole o link da sua pasta padrão no Google Drive (ex: pasta de relatórios da construtora) para atalho direto:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={folderUrlInput}
                onChange={(e) => setFolderUrlInput(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                onClick={handleSaveFolderUrl}
                disabled={isSavingFolder}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingFolder ? '...' : 'Salvar'}</span>
              </button>
            </div>
          </div>

          {/* Informative Footer Box */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2 text-[11px] text-amber-900">
            <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Multi-usuário seguro:</strong> Cada usuário conecta e gerencia sua própria conta Google de forma independente. As credenciais nunca são expostas publicamente e a sincronização usa a permissão restrita da API do Google Drive (escopo drive.file).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
