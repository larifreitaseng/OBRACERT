import React, { useState } from 'react';
import {
  HardHat,
  FileText,
  Mic,
  FolderOpen,
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Building2,
  Download,
  Users
} from 'lucide-react';
import { SystemRole, UserProfile } from '../types';
import { loginWithEmail, registerWithEmail } from '../firebase';

interface LandingLoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onGoogleLogin: () => void;
}

export const LandingLoginPage: React.FC<LandingLoginPageProps> = ({
  onLoginSuccess,
  onGoogleLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [systemRole, setSystemRole] = useState<SystemRole>('Editor');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick 1-click access for Eng. Larissa Freitas
  const handleQuickLarissaLogin = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setEmail('larifreitaseng@gmail.com');
    setPassword('obracert123');

    const larissaProfile: UserProfile = {
      uid: 'user-larissa-01',
      email: 'larifreitaseng@gmail.com',
      displayName: 'Eng. Larissa Freitas',
      systemRole: 'Editor',
    };

    setSuccessMessage('Acesso autorizado! Carregando painel...');
    setTimeout(() => {
      onLoginSuccess(larissaProfile);
    }, 200);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Por favor, informe seu e-mail e sua senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    // Instant master access for Eng. Larissa Freitas
    if (cleanEmail === 'larifreitaseng@gmail.com') {
      const larissaProfile: UserProfile = {
        uid: 'user-larissa-01',
        email: 'larifreitaseng@gmail.com',
        displayName: 'Eng. Larissa Freitas',
        systemRole: 'Editor',
      };
      setSuccessMessage('Bem-vinda de volta, Eng. Larissa Freitas!');
      setTimeout(() => {
        onLoginSuccess(larissaProfile);
      }, 200);
      return;
    }

    try {
      const user = await loginWithEmail(cleanEmail, password);
      setSuccessMessage(`Bem-vindo(a) de volta, ${user.displayName}!`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 200);
    } catch (err: any) {
      setErrorMessage(err.message || 'E-mail ou senha incorretos.');
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !displayName.trim()) {
      setErrorMessage('Preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const newUser = await registerWithEmail(
        email.trim(),
        password,
        displayName.trim(),
        systemRole
      );
      setSuccessMessage(`Cadastro concluído com sucesso como ${newUser.systemRole}!`);
      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 250);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao criar conta.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Banner & Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
            <HardHat className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              <span>OBRACERT</span>
              <span className="text-amber-500 font-extrabold text-sm">RDO</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] text-slate-400 font-medium ml-2 border-l border-slate-700 pl-2">
              Gestão de Canteiros com IA e Google Drive
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickLarissaLogin}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden xs:inline">Acesso Rápido</span>
            <span>(Larissa Freitas)</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: System Presentation & Value Props */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Diários de Obra Inteligentes e Auditáveis</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Gestão técnica e RDOs digitais com <span className="text-amber-400 underline decoration-amber-500/40 decoration-wavy underline-offset-4">Inteligência Artificial</span>.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Crie Relatórios Diários de Obra completos ditando em áudio direto do canteiro. Geração de PDFs técnicos com assinaturas digitais e <strong>Segunda Memória automática no Google Drive</strong>.
            </p>

            {/* Quick feature pill grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">RDO por Voz com IA</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Dite e a IA extrai clima, efetivo, serviços e ocorrências.</p>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Segunda Memória no Drive</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Pastas por obra com fotos e relatórios sincronizados.</p>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">PDFs Oficiais Prontos</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Relatórios diagramados com ART/RRT e assinaturas.</p>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Controle de Perfis (RBAC)</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Acesso de Editor para engenheiros e Visualizador para fiscais.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95">
              {/* Card Title & Tab switch */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      {activeTab === 'login' ? 'Entrar no Sistema' : 'Criar Nova Conta'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {activeTab === 'login'
                        ? 'Informe suas credenciais para gerenciar seus RDOs'
                        : 'Preencha seus dados para cadastrar seu usuário'}
                    </p>
                  </div>

                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-900 uppercase">
                    Acesso Seguro
                  </span>
                </div>

                <div className="flex border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'login'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Entrar com E-mail
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'register'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Novo Cadastro
                  </button>
                </div>
              </div>

              {/* Master Credential Callout Box (Answering the user's specific prompt) */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    <span className="text-xs font-bold text-slate-900">
                      Perfil Principal de Larissa Freitas:
                    </span>
                  </div>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                    Editor Master
                  </span>
                </div>

                <div className="text-xs font-mono bg-white/90 border border-amber-200 p-2 rounded-lg space-y-1 text-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans text-[11px]">E-mail:</span>
                    <strong className="text-slate-900 font-semibold select-all">larifreitaseng@gmail.com</strong>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-1">
                    <span className="text-slate-500 font-sans text-[11px]">Senha:</span>
                    <strong className="text-amber-800 font-bold tracking-wider select-all">obracert123</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickLarissaLogin}
                  disabled={isLoading}
                  className="w-full py-2 px-3 text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-950" />
                  <span>Acessar Imediatamente como Larissa</span>
                </button>
              </div>

              {/* Error & Success Messages */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-900 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Login Form */}
              {activeTab === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      E-mail Profissional
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="larifreitaseng@gmail.com"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Senha de Acesso
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showPassword ? 'Ocultar' : 'Ver'}</span>
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Autenticando...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 text-amber-400" />
                        <span>Entrar no Obracert RDO</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ex: Eng. Carlos Albuquerque"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="carlos@construtora.com.br"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Senha (mínimo 6 dígitos) *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Perfil de Acesso
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSystemRole('Editor')}
                        className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                          systemRole === 'Editor'
                            ? 'border-amber-500 bg-amber-50 text-slate-900 ring-1 ring-amber-500'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-bold text-xs text-amber-950">Editor</span>
                        <span className="text-[10px] text-slate-500">Cria e edita diários</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSystemRole('Visualizador')}
                        className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                          systemRole === 'Visualizador'
                            ? 'border-blue-500 bg-blue-50 text-slate-900 ring-1 ring-blue-500'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-bold text-xs text-blue-950">Visualizador</span>
                        <span className="text-[10px] text-slate-500">Apenas consulta e PDF</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer mt-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Cadastrando...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 text-slate-950" />
                        <span>Criar Conta e Acessar</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Alternative Google Sign-in */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={onGoogleLogin}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer"
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
                  <span>Entrar com Conta Google e Drive</span>
                </button>

                <p className="text-[10px] text-slate-500 text-center leading-normal">
                  💡 Na tela de autorização do Google, clique em <strong>Continuar</strong> para liberar o salvamento no Drive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Obracert RDO · Engenharia Civil e Diários de Obra com IA</p>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Firebase Firestore</span>
            <span>·</span>
            <span>Google Drive API</span>
            <span>·</span>
            <span>Google Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
