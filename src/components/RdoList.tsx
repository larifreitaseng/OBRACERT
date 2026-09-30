import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Mic,
  Calendar,
  SunMedium,
  CloudRain,
  Users,
  HardHat,
  Eye,
  Edit,
  Trash2,
  FolderOpen,
  ExternalLink,
  Sparkles,
  ChevronDown,
  Download
} from 'lucide-react';
import { Rdo, Project, Company, SystemRole } from '../types';
import { generateRdoPdf } from '../services/pdfService';
import { backupRdoToDrive } from '../services/driveService';

interface RdoListProps {
  rdos: Rdo[];
  projects: Project[];
  companies?: Company[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  systemRole: SystemRole;
  onSelectRdo: (rdo: Rdo) => void;
  onEditRdo: (rdo: Rdo) => void;
  onDeleteRdo: (id: string) => Promise<void>;
  onSaveRdo?: (rdo: Rdo) => Promise<void>;
  onOpenVoiceModal: () => void;
  onOpenNewRdo: () => void;
}

export const RdoList: React.FC<RdoListProps> = ({
  rdos,
  projects,
  companies = [],
  selectedProjectId,
  setSelectedProjectId,
  systemRole,
  onSelectRdo,
  onEditRdo,
  onDeleteRdo,
  onSaveRdo,
  onOpenVoiceModal,
  onOpenNewRdo,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Finalizado' | 'Rascunho'>('Todos');
  const [syncingRdoId, setSyncingRdoId] = useState<string | null>(null);

  const handleBackupRdo = async (rdo: Rdo) => {
    setSyncingRdoId(rdo.id);
    try {
      const proj = projects.find((p) => p.id === rdo.projectId);
      const comp = companies.find((c) => c.id === proj?.companyId) || companies[0];
      const res = await backupRdoToDrive(rdo, proj, comp);
      if (res.success) {
        if (onSaveRdo && res.updatedRdo) {
          await onSaveRdo(res.updatedRdo);
        }
        alert(`✅ RDO ${rdo.rdoNumber} salvo no Google Drive com sucesso!\n\nPasta da Obra: ${res.folderName}\nPDF Oficial: ${res.pdfName || 'Gerado'}\nFotos sincronizadas: ${res.photosUploaded}`);
      } else {
        if (!res.error?.includes('cancelad')) {
          alert(`Aviso: ${res.error}`);
        }
      }
    } catch (err: any) {
      if (!err?.message?.includes('cancelad') && err?.code !== 'auth/popup-closed-by-user') {
        alert(`Erro ao sincronizar com Google Drive: ${err.message}`);
      }
    } finally {
      setSyncingRdoId(null);
    }
  };

  // Filtered RDOs
  const filteredRdos = rdos.filter((rdo) => {
    if (selectedProjectId && rdo.projectId !== selectedProjectId) return false;
    if (dateFilter && rdo.date !== dateFilter) return false;
    if (statusFilter !== 'Todos' && rdo.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNumber = rdo.rdoNumber.toLowerCase().includes(q);
      const matchProject = rdo.projectName.toLowerCase().includes(q);
      const matchNotes = rdo.generalNotes.toLowerCase().includes(q);
      const matchOccurrences = rdo.occurrences.toLowerCase().includes(q);
      const matchActivities = rdo.activities.some((a) =>
        a.description.toLowerCase().includes(q)
      );
      if (!matchNumber && !matchProject && !matchNotes && !matchOccurrences && !matchActivities) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Relatórios Diários de Obra (RDO)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulte, audite e gere diários de obras com registro fotográfico e IA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenVoiceModal}
            disabled={systemRole === 'Visualizador'}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all shadow-xs ${
              systemRole === 'Visualizador'
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-98'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-slate-950" />
            <span>Gerar por Áudio (IA)</span>
          </button>

          <button
            onClick={onOpenNewRdo}
            disabled={systemRole === 'Visualizador'}
            className={`flex items-center gap-1 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              systemRole === 'Visualizador'
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs active:scale-98'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Novo RDO</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por atividade, material..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="">Todas as Obras ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['Todos', 'Finalizado', 'Rascunho'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {(searchTerm || dateFilter || selectedProjectId) && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Filtrando resultados: <strong className="text-slate-900">{filteredRdos.length}</strong> encontrados
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter('');
                setSelectedProjectId('');
                setStatusFilter('Todos');
              }}
              className="text-amber-700 hover:underline font-semibold"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* RDOs Grid / Table */}
      <div className="space-y-3">
        {filteredRdos.map((rdo) => (
          <div
            key={rdo.id}
            className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Column: Number, Date, Project & Activities */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {rdo.rdoNumber}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-600 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {rdo.date}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {rdo.projectName}
                  </span>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      rdo.status === 'Finalizado'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {rdo.status}
                  </span>

                  {rdo.audioTranscript && (
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Áudio IA
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-700 space-y-1 pt-1">
                  <div className="flex items-center gap-1 font-medium">
                    <span className="text-slate-500">Atividades:</span>
                    <span>
                      {rdo.activities.map((a) => `${a.description} (${a.progressPercent}%)`).join(', ') || 'Nenhuma'}
                    </span>
                  </div>

                  {rdo.occurrences && (
                    <p className="text-slate-600 italic line-clamp-1">
                      <span className="font-semibold text-slate-700 not-italic">Ocorrência:</span> {rdo.occurrences}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Weather, Workers, Drive & Actions */}
              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
                  <div className="flex items-center gap-1" title={`Manhã: ${rdo.weatherMorning}`}>
                    {rdo.weatherMorning === 'Chuvoso' || rdo.weatherMorning === 'Chuva Forte' ? (
                      <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <SunMedium className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>{rdo.weatherMorning}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{rdo.totalWorkers} op.</span>
                  </div>

                  {rdo.googleDriveLink && (
                    <a
                      href={rdo.googleDriveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 hover:text-blue-800 flex items-center gap-1 font-sans"
                      title="Abrir pasta no Google Drive"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Drive</span>
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleBackupRdo(rdo)}
                    disabled={syncingRdoId === rdo.id}
                    className="px-2.5 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Salvar PDF e fotos na pasta da obra no Google Drive (Segunda Memória)"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>{syncingRdoId === rdo.id ? 'Enviando...' : 'Drive'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const proj = projects.find((p) => p.id === rdo.projectId);
                      generateRdoPdf(rdo, proj);
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="Baixar Relatório em PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-700" />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={() => onSelectRdo(rdo)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar</span>
                  </button>

                  {systemRole === 'Editor' && (
                    <>
                      <button
                        onClick={() => onEditRdo(rdo)}
                        className="p-1.5 text-slate-600 hover:text-amber-800 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-lg transition-colors"
                        title="Editar RDO"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir o ${rdo.rdoNumber}?`)) {
                            onDeleteRdo(rdo.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
                        title="Excluir RDO"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredRdos.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">Nenhum RDO encontrado</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Ajuste os filtros de busca ou crie um novo diário de obra por áudio ou formulário.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
