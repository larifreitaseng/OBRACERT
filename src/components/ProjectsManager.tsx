import React, { useState } from 'react';
import {
  HardHat,
  Plus,
  Building2,
  Calendar,
  FolderOpen,
  ExternalLink,
  Edit,
  Trash2,
  X,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Project, Company, SystemRole, UserProfile } from '../types';
import { findOrCreateObraFolder } from '../services/driveService';

interface ProjectsManagerProps {
  projects: Project[];
  companies: Company[];
  systemRole: SystemRole;
  userProfile: UserProfile;
  onSaveProject: (project: Project) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({
  projects,
  companies,
  systemRole,
  userProfile,
  onSaveProject,
  onDeleteProject,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [address, setAddress] = useState('');
  const [residentEngineer, setResidentEngineer] = useState('Eng. Larissa Freitas');
  const [crea, setCrea] = useState('CREA-SP 506.123/D');
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [status, setStatus] = useState<'Em andamento' | 'Paralisada' | 'Concluída'>('Em andamento');
  const [overallProgressPercent, setOverallProgressPercent] = useState<number>(20);
  const [googleDriveFolderUrl, setGoogleDriveFolderUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLocatingDrive, setIsLocatingDrive] = useState(false);
  const [driveMsg, setDriveMsg] = useState<string | null>(null);

  const handleAutoConnectDriveFolder = async () => {
    if (!name.trim()) {
      alert('Preencha o nome da obra antes de vincular ao Google Drive.');
      return;
    }
    setIsLocatingDrive(true);
    setDriveMsg(null);
    try {
      const folder = await findOrCreateObraFolder(name.trim(), code.trim());
      setGoogleDriveFolderUrl(folder.webViewLink);
      setDriveMsg(`Pasta vinculada: "${folder.name}"`);
    } catch (err: any) {
      console.error('Erro ao conectar pasta no Google Drive:', err);
      alert(`Falha ao conectar com Google Drive: ${err.message}`);
    } finally {
      setIsLocatingDrive(false);
    }
  };

  const handleOpenNew = () => {
    setEditingProject(null);
    setName('');
    setCode(`OBRA-${new Date().getFullYear()}-0${projects.length + 1}`);
    setCompanyId(companies[0]?.id || '');
    setAddress('');
    setResidentEngineer(userProfile.displayName || 'Eng. Larissa Freitas');
    setCrea('CREA-SP 506.123/D');
    setStartDate(new Date().toISOString().split('T')[0]);
    setExpectedEndDate('');
    setStatus('Em andamento');
    setOverallProgressPercent(0);
    setGoogleDriveFolderUrl('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setCode(p.code);
    setCompanyId(p.companyId);
    setAddress(p.address);
    setResidentEngineer(p.residentEngineer);
    setCrea(p.crea);
    setStartDate(p.startDate);
    setExpectedEndDate(p.expectedEndDate);
    setStatus(p.status);
    setOverallProgressPercent(p.overallProgressPercent);
    setGoogleDriveFolderUrl(p.googleDriveFolderUrl);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const validCompanyId = companyId || companies[0]?.id || 'comp-1';
      const selectedCompany = companies.find((c) => c.id === validCompanyId);
      const projectPayload: Project = {
        id: editingProject?.id || `proj-${Date.now()}`,
        name: name.trim(),
        code: code.trim() || `OBRA-${new Date().getFullYear()}-0${projects.length + 1}`,
        companyId: validCompanyId,
        companyName: selectedCompany?.name || 'Alfa Engenharia e Construções',
        address: address.trim() || 'Canteiro Central',
        residentEngineer: residentEngineer.trim() || userProfile.displayName || 'Eng. Larissa Freitas',
        crea: crea.trim() || 'CREA-SP 506.123/D',
        startDate: startDate || new Date().toISOString().split('T')[0],
        expectedEndDate: expectedEndDate || '',
        status: status || 'Em andamento',
        overallProgressPercent: Number(overallProgressPercent) || 0,
        googleDriveFolderUrl: googleDriveFolderUrl.trim() || '',
        createdBy: editingProject?.createdBy || userProfile.uid,
        createdAt: editingProject?.createdAt || new Date().toISOString(),
      };

      await onSaveProject(projectPayload);
      setModalOpen(false);
    } catch (err: any) {
      alert(`Erro ao salvar obra: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Cadastro e Gestão de Obras
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie canteiros, prazos, engenheiros responsáveis e pastas integradas do Google Drive.
          </p>
        </div>

        {systemRole === 'Editor' && (
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>+ Cadastrar Obra</span>
          </button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    {project.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {project.name}
                  </h3>
                  <span className="text-xs text-slate-600 block">
                    {project.companyName}
                  </span>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                    project.status === 'Em andamento'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : project.status === 'Paralisada'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {project.status}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                <p>
                  <strong className="text-slate-700">Endereço:</strong> {project.address}
                </p>
                <p>
                  <strong className="text-slate-700">Engenheiro(a):</strong> {project.residentEngineer}
                </p>
                <p>
                  <strong className="text-slate-700">CREA:</strong> {project.crea}
                </p>
                <p>
                  <strong className="text-slate-700">Início:</strong> {project.startDate} ·{' '}
                  <strong className="text-slate-700">Previsão:</strong>{' '}
                  {project.expectedEndDate || 'Não informada'}
                </p>
              </div>

              {project.googleDriveFolderUrl && (
                <div className="pt-2">
                  <a
                    href={project.googleDriveFolderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1.5 hover:underline"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pasta de Fotos no Google Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 font-medium">Avanço Físico</span>
                  <span className="font-mono font-bold text-slate-900">
                    {project.overallProgressPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${project.overallProgressPercent}%` }}
                  />
                </div>
              </div>

              {systemRole === 'Editor' && (
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    onClick={() => handleOpenEdit(project)}
                    className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-slate-50 rounded-md transition-colors"
                    title="Editar obra"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Deseja realmente excluir a obra "${project.name}"?`)) {
                        onDeleteProject(project.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Excluir obra"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal New / Edit Project */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">
                  {editingProject ? 'Editar Obra' : 'Cadastrar Nova Obra'}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nome da Obra *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Residencial Horizonte - Torre A"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Código Interno
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ex: OBRA-2026-01"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Empresa Construtora Responsável
                </label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (CNPJ: {c.cnpj})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Endereço / Localização
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro, cidade - estado"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Engenheiro(a) Residente
                  </label>
                  <input
                    type="text"
                    value={residentEngineer}
                    onChange={(e) => setResidentEngineer(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Registro CREA / CAU
                  </label>
                  <input
                    type="text"
                    value={crea}
                    onChange={(e) => setCrea(e.target.value)}
                    placeholder="Ex: CREA-SP 506.123/D"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Previsão Término
                  </label>
                  <input
                    type="date"
                    value={expectedEndDate}
                    onChange={(e) => setExpectedEndDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="Em andamento">Em andamento</option>
                    <option value="Paralisada">Paralisada</option>
                    <option value="Concluída">Concluída</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Avanço Físico Global ({overallProgressPercent}%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={overallProgressPercent}
                    onChange={(e) => setOverallProgressPercent(Number(e.target.value))}
                    className="flex-1 accent-amber-600"
                  />
                  <span className="text-xs font-mono font-bold text-slate-900 w-12 text-right">
                    {overallProgressPercent}%
                  </span>
                </div>
              </div>

              {/* Google Drive Folder Input */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-blue-950 uppercase flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-blue-700" />
                    Pasta no Google Drive (Fotos e Anexos)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoConnectDriveFolder}
                    disabled={isLocatingDrive}
                    className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <FolderOpen className="w-3 h-3 text-blue-600" />
                    <span>{isLocatingDrive ? 'Conectando...' : 'Buscar/Criar Pasta no Drive'}</span>
                  </button>
                </div>

                <input
                  type="url"
                  value={googleDriveFolderUrl}
                  onChange={(e) => setGoogleDriveFolderUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full text-xs px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-slate-900 font-mono"
                />

                {driveMsg && (
                  <p className="text-[11px] text-emerald-800 font-medium">
                    ✓ {driveMsg}
                  </p>
                )}

                <p className="text-[10px] text-blue-800">
                  Todas as fotos e arquivos anexados nos diários desta obra poderão ser salvos diretamente nesta pasta do Drive.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Obra'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
