import React, { useState } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  Eye,
  Mail,
  Phone,
  Briefcase,
  Edit,
  Trash2,
  X,
  Save,
  HardHat
} from 'lucide-react';
import { TeamMember, SystemRole, Company, Project } from '../types';
import { SelectOrCreateCombobox } from './SelectOrCreateCombobox';

const DEFAULT_TEAM_ROLES = [
  'Engenheiro(a) Residente',
  'Engenheiro(a) de Produção',
  'Mestre de Obras',
  'Técnico de Segurança (TST)',
  'Encarregado de Obras',
  'Estagiário(a) de Engenharia',
  'Auditor(a) / Fiscal',
  'Arquiteto(a)',
  'Topógrafo(a)',
  'Almoxarife',
];

interface TeamManagerProps {
  team: TeamMember[];
  companies: Company[];
  projects: Project[];
  systemRole: SystemRole;
  onSaveMember: (member: TeamMember) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
}

export const TeamManager: React.FC<TeamManagerProps> = ({
  team,
  companies,
  projects,
  systemRole,
  onSaveMember,
  onDeleteMember,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('Engenheiro(a) Residente');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [creaOrCau, setCreaOrCau] = useState('');
  const [memberSystemRole, setMemberSystemRole] = useState<SystemRole>('Editor');
  const [companyId, setCompanyId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenNew = () => {
    setEditingMember(null);
    setName('');
    setRole('Engenheiro(a) Residente');
    setEmail('');
    setPhone('');
    setCreaOrCau('');
    setMemberSystemRole('Editor');
    setCompanyId(companies[0]?.id || '');
    setProjectId(projects[0]?.id || '');
    setModalOpen(true);
  };

  const handleOpenEdit = (m: TeamMember) => {
    setEditingMember(m);
    setName(m.name);
    setRole(m.role);
    setEmail(m.email);
    setPhone(m.phone);
    setCreaOrCau(m.creaOrCau || '');
    setMemberSystemRole(m.systemRole);
    setCompanyId(m.companyId || companies[0]?.id || '');
    setProjectId(m.projectId || projects[0]?.id || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const selectedCompany = companies.find((c) => c.id === companyId);
      const payload: TeamMember = {
        id: editingMember?.id || `team-${Date.now()}`,
        name: name.trim(),
        role: role.trim(),
        email: email.trim(),
        phone: phone.trim(),
        creaOrCau: creaOrCau.trim(),
        systemRole: memberSystemRole,
        companyId,
        companyName: selectedCompany?.name || 'Alfa Engenharia',
        projectId,
        createdAt: editingMember?.createdAt || new Date().toISOString(),
      };

      await onSaveMember(payload);
      setModalOpen(false);
    } catch (err: any) {
      alert(`Erro ao salvar membro: ${err.message}`);
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
            Equipe Técnica e Controle de Acesso
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie engenheiros, mestres de obras, técnicos e seus perfis (Editor ou Visualizador).
          </p>
        </div>

        {systemRole === 'Editor' && (
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>+ Adicionar Membro da Equipe</span>
          </button>
        )}
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member) => (
          <div
            key={member.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {member.name}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">{member.role}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                    member.systemRole === 'Editor'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-blue-100 text-blue-900 border border-blue-200'
                  }`}
                >
                  {member.systemRole}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-3 border-t border-slate-100">
                {member.creaOrCau && (
                  <p className="flex items-center gap-2">
                    <HardHat className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      <strong className="text-slate-700">Registro:</strong> {member.creaOrCau}
                    </span>
                  </p>
                )}

                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{member.email || 'sem email'}</span>
                </p>

                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{member.phone || '(11) 90000-0000'}</span>
                </p>

                <p className="flex items-center gap-2 text-slate-500">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{member.companyName || 'Alfa Engenharia'}</span>
                </p>
              </div>
            </div>

            {systemRole === 'Editor' && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleOpenEdit(member)}
                  className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-slate-50 rounded-md transition-colors"
                  title="Editar membro"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Deseja realmente remover ${member.name} da equipe?`)) {
                      onDeleteMember(member.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Remover membro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal New / Edit Member */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">
                  {editingMember ? 'Editar Integrante' : 'Novo Membro da Equipe'}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cargo / Função
                  </label>
                  <SelectOrCreateCombobox
                    value={role}
                    onChange={(val) => setRole(val)}
                    options={DEFAULT_TEAM_ROLES}
                    placeholder="Selecione o cargo ou crie..."
                    createLabel="+ Criar Novo Cargo / Função..."
                    storageKey="team_roles"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Perfil no Sistema *
                  </label>
                  <select
                    value={memberSystemRole}
                    onChange={(e) => setMemberSystemRole(e.target.value as SystemRole)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  >
                    <option value="Editor">Editor (Cria e Edita RDOs)</option>
                    <option value="Visualizador">Visualizador (Apenas Leitura)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  CREA / CAU (se aplicável)
                </label>
                <input
                  type="text"
                  value={creaOrCau}
                  onChange={(e) => setCreaOrCau(e.target.value)}
                  placeholder="Ex: CREA-SP 506.123/D"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@obra.com.br"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
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
                  <span>{isSaving ? 'Salvando...' : 'Salvar Membro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
