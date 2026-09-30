import React from 'react';
import {
  HardHat,
  FileText,
  Users,
  SunMedium,
  CloudRain,
  Mic,
  Plus,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FolderOpen,
  Calendar,
  AlertTriangle,
  Building2,
  Sparkles,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { Company, Project, Rdo, SystemRole } from '../types';

interface DashboardProps {
  projects: Project[];
  rdos: Rdo[];
  companies: Company[];
  systemRole: SystemRole;
  onOpenVoiceModal: () => void;
  onOpenNewRdo: () => void;
  onOpenNewProject: () => void;
  onSelectRdo: (rdo: Rdo) => void;
  onFilterByProject: (projectId: string) => void;
  onNavigateToTab: (tab: 'dashboard' | 'rdos' | 'projects' | 'companies' | 'team') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  rdos,
  companies,
  systemRole,
  onOpenVoiceModal,
  onOpenNewRdo,
  onOpenNewProject,
  onSelectRdo,
  onFilterByProject,
  onNavigateToTab,
}) => {
  // Aggregate stats
  const activeProjects = projects.filter((p) => p.status === 'Em andamento').length;
  const totalRdos = rdos.length;

  // Calculate today or latest workers in field
  const latestRdo = rdos[0];
  const workersInField = latestRdo?.totalWorkers || 12;

  // Rain / weather occurrences count
  const rainyRdosCount = rdos.filter(
    (r) =>
      r.weatherMorning === 'Chuvoso' ||
      r.weatherMorning === 'Chuva Forte' ||
      r.weatherAfternoon === 'Chuvoso' ||
      r.weatherAfternoon === 'Chuva Forte'
  ).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner & Quick Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Painel de Engenharia
              </span>
              <span className="text-xs text-slate-700">·</span>
              <span className="text-xs text-slate-700 flex items-center gap-1 font-medium">
                {systemRole === 'Editor' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    Perfil: Editor (Permissão Total)
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-blue-700" />
                    Perfil: Visualizador (Modo Leitura)
                  </>
                )}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Gestão de Relatórios Diários de Obra
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Registre a evolução diária no canteiro, mão de obra, condições climáticas e ocorrências.
              Utilize inteligência artificial para transcrever relatos falados instantaneamente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenVoiceModal}
              disabled={systemRole === 'Visualizador'}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all shadow-xs ${
                systemRole === 'Visualizador'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-600/30 hover:shadow-md active:scale-98'
              }`}
            >
              <Mic className="w-4 h-4 text-slate-950" />
              <span>Gravar RDO por Áudio (IA)</span>
            </button>

            <button
              onClick={onOpenNewRdo}
              disabled={systemRole === 'Visualizador'}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                systemRole === 'Visualizador'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs active:scale-98'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Novo RDO Manual</span>
            </button>

            <button
              onClick={onOpenNewProject}
              disabled={systemRole === 'Visualizador'}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-200/80"
            >
              <Building2 className="w-4 h-4 text-slate-600" />
              <span>+ Cadastrar Obra</span>
            </button>
          </div>
        </div>

        {/* Decorative blueprint technical line in background */}
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none translate-x-8 translate-y-8">
          <HardHat className="w-64 h-64 text-slate-900" />
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Obras em Andamento</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {activeProjects}
            </div>
            <div className="text-[11px] text-slate-700 mt-0.5">
              de {projects.length} obras cadastradas
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">RDOs Emitidos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {totalRdos}
            </div>
            <div className="text-[11px] text-emerald-800 font-medium mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              100% histórico registrado
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Efetivo de Campo</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {workersInField} <span className="text-xs font-normal text-slate-700">operários</span>
            </div>
            <div className="text-[11px] text-slate-700 mt-0.5">
              Próprios e subcontratados
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Dias com Chuva</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <CloudRain className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {rainyRdosCount} <span className="text-xs font-normal text-slate-700">dias</span>
            </div>
            <div className="text-[11px] text-slate-700 mt-0.5">
              Com impacto climático no turno
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Projects Status + Recent RDOs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Obras Cadastradas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Obras em Acompanhamento
              </h2>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono tabular-nums font-semibold">
                {projects.length}
              </span>
            </div>
            <button
              onClick={() => onNavigateToTab('projects')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>Ver todas as obras</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs hover:border-amber-400 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-700">
                        {project.code}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {project.companyName}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-700">
                      {project.address}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        project.status === 'Em andamento'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : project.status === 'Paralisada'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {project.status}
                    </span>

                    {project.googleDriveFolderUrl && (
                      <a
                        href={project.googleDriveFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-700 hover:text-blue-800 flex items-center gap-1 font-medium hover:underline"
                        title="Abrir pasta de fotos e documentos no Google Drive"
                      >
                        <FolderOpen className="w-3 h-3 text-blue-600" />
                        <span>Google Drive</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-700">Avanço Físico Global</span>
                      <span className="font-bold text-slate-900 font-mono tabular-nums">
                        {project.overallProgressPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, project.overallProgressPercent))}%` }}
                      />
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={() => onFilterByProject(project.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
                    >
                      Ver Diários (RDO)
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Últimos RDOs Emitidos (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Últimos Diários Registrados
              </h2>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono tabular-nums font-semibold">
                {rdos.length}
              </span>
            </div>
            <button
              onClick={() => onNavigateToTab('rdos')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {rdos.slice(0, 5).map((rdo) => (
              <div
                key={rdo.id}
                onClick={() => onSelectRdo(rdo)}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {rdo.rdoNumber}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-xs text-slate-700 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {rdo.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-700">
                    {rdo.weatherMorning === 'Chuvoso' || rdo.weatherMorning === 'Chuva Forte' ? (
                      <span className="flex items-center gap-0.5 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px] font-medium">
                        <CloudRain className="w-3 h-3" /> Chuva
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] font-medium">
                        <SunMedium className="w-3 h-3" /> Bom
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {rdo.projectName}
                  </p>
                  <p className="text-xs text-slate-700 line-clamp-2 mt-1">
                    {rdo.activities[0]?.description || rdo.generalNotes || 'Sem descrição cadastrada'}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-700 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-slate-500" />
                    <span>{rdo.totalWorkers} operários</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {rdo.audioTranscript && (
                      <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                        Áudio IA
                      </span>
                    )}
                    <span className="text-slate-400">·</span>
                    <span className="text-amber-700 font-semibold hover:underline">
                      Visualizar →
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {rdos.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Nenhum RDO emitido ainda</p>
                <p className="text-xs text-slate-500 mt-1">
                  Grave um relato por voz ou crie o primeiro diário de obra.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
