import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { Company, SystemRole } from '../types';

interface CompaniesManagerProps {
  companies: Company[];
  systemRole: SystemRole;
  onSaveCompany: (company: Company) => Promise<void>;
  onDeleteCompany: (id: string) => Promise<void>;
}

export const CompaniesManager: React.FC<CompaniesManagerProps> = ({
  companies,
  systemRole,
  onSaveCompany,
  onDeleteCompany,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [responsibleEngineer, setResponsibleEngineer] = useState('');
  const [crea, setCrea] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenNew = () => {
    setEditingCompany(null);
    setName('');
    setTradeName('');
    setCnpj('');
    setEmail('');
    setPhone('');
    setAddress('');
    setResponsibleEngineer('');
    setCrea('');
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Company) => {
    setEditingCompany(c);
    setName(c.name);
    setTradeName(c.tradeName);
    setCnpj(c.cnpj);
    setEmail(c.email);
    setPhone(c.phone);
    setAddress(c.address);
    setResponsibleEngineer(c.responsibleEngineer);
    setCrea(c.crea);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const payload: Company = {
        id: editingCompany?.id || `comp-${Date.now()}`,
        name: name.trim(),
        tradeName: tradeName.trim() || name.trim(),
        cnpj: cnpj.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        responsibleEngineer: responsibleEngineer.trim(),
        crea: crea.trim(),
        createdAt: editingCompany?.createdAt || new Date().toISOString(),
      };

      await onSaveCompany(payload);
      setModalOpen(false);
    } catch (err: any) {
      alert(`Erro ao salvar empresa: ${err.message}`);
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
            Cadastro de Empresas e Construtoras
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie as construtoras responsáveis, empreiteiras e dados fiscais/técnicos.
          </p>
        </div>

        {systemRole === 'Editor' && (
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>+ Cadastrar Empresa</span>
          </button>
        )}
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-amber-500 flex items-center justify-center font-bold text-sm shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {company.tradeName || company.name}
                    </h3>
                    <p className="text-xs text-slate-500">{company.name}</p>
                    <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block font-semibold">
                      CNPJ: {company.cnpj}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-3 border-t border-slate-100">
                <p className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    <strong className="text-slate-700">Responsável Técnico:</strong>{' '}
                    {company.responsibleEngineer || 'Não informado'} ({company.crea || 'CREA'})
                  </span>
                </p>

                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{company.email || 'contato@empresa.com.br'}</span>
                </p>

                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{company.phone || '(11) 3000-0000'}</span>
                </p>

                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{company.address || 'Endereço da sede'}</span>
                </p>
              </div>
            </div>

            {systemRole === 'Editor' && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleOpenEdit(company)}
                  className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-slate-50 rounded-md transition-colors"
                  title="Editar empresa"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Deseja realmente excluir a empresa "${company.name}"?`)) {
                      onDeleteCompany(company.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Excluir empresa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal New / Edit Company */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">
                  {editingCompany ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Alfa Engenharia e Construções Ltda"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    placeholder="Ex: Alfa Engenharia"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Responsável Técnico
                  </label>
                  <input
                    type="text"
                    value={responsibleEngineer}
                    onChange={(e) => setResponsibleEngineer(e.target.value)}
                    placeholder="Engenheiro(a) responsável"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    CREA do Responsável
                  </label>
                  <input
                    type="text"
                    value={crea}
                    onChange={(e) => setCrea(e.target.value)}
                    placeholder="CREA-SP 506.123/D"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    E-mail de Contato
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@empresa.com.br"
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
                    placeholder="(11) 3245-8900"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Endereço da Sede
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Paulista, 1842 - São Paulo - SP"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
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
                  <span>{isSaving ? 'Salvando...' : 'Salvar Empresa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
