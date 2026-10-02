import React from 'react';
import {
  X,
  Printer,
  Edit,
  FolderOpen,
  ExternalLink,
  SunMedium,
  CloudRain,
  Users,
  HardHat,
  Calendar,
  Building2,
  Sparkles,
  FileCheck,
  CheckCircle2,
  Camera,
  Download
} from 'lucide-react';
import { Rdo, Project, Company, SystemRole, UserProfile } from '../types';
import { generateRdoPdf } from '../services/pdfService';
import { backupRdoToDrive } from '../services/driveService';

interface RdoDetailModalProps {
  rdo: Rdo | null;
  project?: Project;
  company?: Company;
  systemRole: SystemRole;
  userProfile?: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (rdo: Rdo) => void;
  onSaveRdo?: (rdo: Rdo) => Promise<void>;
}

export const RdoDetailModal: React.FC<RdoDetailModalProps> = ({
  rdo,
  project,
  company,
  systemRole,
  userProfile,
  isOpen,
  onClose,
  onEdit,
  onSaveRdo,
}) => {
  const [isBackingUp, setIsBackingUp] = React.useState(false);
  const [backupStep, setBackupStep] = React.useState<string | null>(null);

  if (!isOpen || !rdo) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleBackupToDrive = async () => {
    setIsBackingUp(true);
    setBackupStep('Iniciando envio para o Google Drive...');
    try {
      const res = await backupRdoToDrive(
        rdo,
        project,
        company,
        (step) => {
          setBackupStep(step);
        },
        userProfile?.uid
      );

      if (res.success) {
        if (onSaveRdo && res.updatedRdo) {
          await onSaveRdo(res.updatedRdo);
        }
        const openNow = window.confirm(
          `✅ Relatório salvo na pasta da obra no Google Drive com sucesso!\n\n` +
          `📁 Pasta Fixa: ${res.folderName}\n` +
          `📄 PDF Técnico Oficial: ${res.pdfName || 'RDO.pdf'}\n` +
          `📸 Fotos de campo enviadas: ${res.photosUploaded}\n\n` +
          `Deseja abrir a pasta da obra no Google Drive agora?`
        );
        if (openNow && res.folderUrl) {
          window.open(res.folderUrl, '_blank');
        }
      } else {
        if (res.error?.includes('Domínios Autorizados') || res.error?.includes('autorizado')) {
          const openConsole = window.confirm(
            `${res.error}\n\nDeseja abrir o Firebase Console agora para adicionar "${window.location.hostname}"?`
          );
          if (openConsole) {
            window.open('https://console.firebase.google.com/project/gen-lang-client-0431169862/authentication/settings', '_blank');
          }
        } else if (!res.error?.includes('cancelad') && !res.error?.includes('fechada')) {
          alert(`Não foi possível salvar no Google Drive:\n\n${res.error}`);
        }
      }
    } catch (err: any) {
      if (!err?.message?.includes('cancelad') && err?.code !== 'auth/popup-closed-by-user') {
        alert(`Erro ao sincronizar com Google Drive: ${err.message}`);
      }
    } finally {
      setIsBackingUp(false);
      setBackupStep(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 print:fixed print:inset-0 print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-bold text-white tracking-tight">
              Relatório Diário de Obra · {rdo.rdoNumber}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBackupToDrive}
              disabled={isBackingUp}
              className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Salvar PDF e fotos na pasta da obra no Google Drive (Segunda Memória)"
            >
              <FolderOpen className="w-3.5 h-3.5 text-blue-200" />
              <span>{isBackingUp ? 'Sincronizando...' : 'Salvar no Drive'}</span>
            </button>

            {rdo.googleDriveLink && (
              <a
                href={rdo.googleDriveLink}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
                title="Abrir pasta no Google Drive"
              >
                <span>Ver no Drive</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}

            <button
              onClick={() => generateRdoPdf(rdo, project, company)}
              className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Baixar Relatório em PDF"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>Gerar PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            {systemRole === 'Editor' && (
              <button
                onClick={() => {
                  onEdit(rdo);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drive Backup Live Progress Notification */}
        {backupStep && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-2.5 flex items-center justify-between text-xs text-blue-900 animate-in fade-in shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
              <span className="font-semibold">{backupStep}</span>
            </div>
            {rdo.googleDriveLink && (
              <a
                href={rdo.googleDriveLink}
                target="_blank"
                rel="noreferrer"
                className="font-bold underline text-blue-700 flex items-center gap-1 hover:text-blue-900"
              >
                <span>Abrir Pasta da Obra</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Official Printable Technical Document Sheet */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-slate-900 bg-white print:p-8 print:overflow-visible">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                    <HardHat className="w-4 h-4 text-slate-950" />
                  </div>
                  <span className="text-base font-extrabold tracking-tight text-slate-900 uppercase">
                    {company?.name || 'Alfa Engenharia e Construções Ltda'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  CNPJ: {company?.cnpj || '12.345.678/0001-90'} · Responsável: {company?.responsibleEngineer || 'Eng. Larissa Freitas'} ({company?.crea || 'CREA-SP 506.123/D'})
                </p>
                <p className="text-xs text-slate-600">
                  {company?.address || 'Av. Paulista, 1842 - São Paulo - SP'}
                </p>
              </div>

              <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 text-right shrink-0 min-w-44">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                  RELATÓRIO DIÁRIO DE OBRA
                </span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  {rdo.rdoNumber}
                </span>
                <div className="text-xs font-mono text-slate-700 mt-1 flex items-center justify-end gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Data: {rdo.date}
                </div>
              </div>
            </div>

            {/* Obra specifics */}
            <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg">
              <div>
                <span className="text-slate-500 block font-semibold">Obra:</span>
                <span className="font-bold text-slate-900">{rdo.projectName}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">Endereço da Obra:</span>
                <span className="text-slate-800">{project?.address || 'Canteiro Central'}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">Engenheiro(a) Residente:</span>
                <span className="text-slate-800">{project?.residentEngineer || rdo.authorName} ({project?.crea || 'CREA-SP'})</span>
              </div>
            </div>
          </div>

          {/* AI Transcription quote if present */}
          {rdo.audioTranscript && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Relato de Campo Transcrito por Voz (IA):
              </div>
              <p className="italic text-slate-700">"{rdo.audioTranscript}"</p>
            </div>
          )}

          {/* 1. Condições Climáticas */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
              1. Condições Climáticas
            </h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Manhã:</span>
                <span className="font-bold text-slate-900">{rdo.weatherMorning}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Tarde:</span>
                <span className="font-bold text-slate-900">{rdo.weatherAfternoon}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Noite:</span>
                <span className="font-bold text-slate-900">{rdo.weatherNight}</span>
              </div>
            </div>
          </div>

          {/* 2. Mão de Obra e Efetivo */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Mão de Obra e Efetivo em Campo
              </h3>
              <span className="text-xs font-mono font-bold text-slate-700">
                Total: {rdo.totalWorkers} operários
              </span>
            </div>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-1.5 px-3">Função / Categoria</th>
                  <th className="py-1.5 px-3 text-center">Quantidade</th>
                  <th className="py-1.5 px-3">Vínculo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rdo.workforce.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-medium text-slate-900">{w.role}</td>
                    <td className="py-1.5 px-3 text-center font-mono font-bold">{w.count}</td>
                    <td className="py-1.5 px-3 capitalize text-slate-600">{w.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3. Atividades e Etapas Executadas */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
              3. Etapas e Atividades Executadas
            </h3>
            <div className="space-y-2">
              {rdo.activities.map((act, i) => (
                <div
                  key={act.id}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-start justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900">
                      3.{i + 1} {act.description}
                    </span>
                    <p className="text-slate-600">
                      Localização: <span className="font-medium text-slate-800">{act.location || 'Geral'}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-24 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full"
                        style={{ width: `${act.progressPercent}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-900 w-10 text-right">
                      {act.progressPercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Materiais e Equipamentos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Materiais */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                4. Materiais Recebidos / Utilizados
              </h3>
              <div className="space-y-1.5">
                {rdo.materials.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-200"
                  >
                    <span className="font-medium text-slate-900">{m.item}</span>
                    <span className="font-mono font-bold text-slate-700">
                      {m.quantity} {m.unit}
                    </span>
                  </div>
                ))}
                {rdo.materials.length === 0 && (
                  <p className="text-xs text-slate-500 italic">Nenhum material registrado no dia.</p>
                )}
              </div>
            </div>

            {/* Equipamentos */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                5. Equipamentos no Canteiro
              </h3>
              <div className="space-y-1.5">
                {rdo.equipment.map((eq) => (
                  <div
                    key={eq.id}
                    className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-200"
                  >
                    <span className="font-medium text-slate-900">{eq.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-600">{eq.quantity} unid</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          eq.status === 'operando'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {eq.status}
                      </span>
                    </div>
                  </div>
                ))}
                {rdo.equipment.length === 0 && (
                  <p className="text-xs text-slate-500 italic">Nenhum equipamento registrado.</p>
                )}
              </div>
            </div>
          </div>

          {/* 5. Ocorrências e Observações Gerais */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
              6. Ocorrências, Paralisações e Observações Técnicas
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
              {rdo.occurrences ? (
                <p className="text-slate-800">
                  <span className="font-bold text-slate-900">Ocorrências:</span> {rdo.occurrences}
                </p>
              ) : (
                <p className="text-slate-500 italic">Sem ocorrências ou acidentes registrados no dia.</p>
              )}

              {rdo.generalNotes && (
                <p className="text-slate-800 pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Observações:</span> {rdo.generalNotes}
                </p>
              )}
            </div>
          </div>

          {/* 6. Registro Fotográfico */}
          {rdo.photoAttachments && rdo.photoAttachments.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                7. Registro Fotográfico do Canteiro
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {rdo.photoAttachments.map((photo) => (
                  <div
                    key={photo.id}
                    className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-36 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="p-2 text-[11px] space-y-1">
                      <p className="font-bold text-slate-900">{photo.caption}</p>
                      <p className="text-slate-500">{photo.stage || 'Canteiro'} · {photo.timestamp}</p>
                      {photo.googleDriveUrl && (
                        <a
                          href={photo.googleDriveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 hover:underline pt-0.5"
                        >
                          <FolderOpen className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>Abrir no Google Drive</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Google Drive Link Box */}
          {rdo.googleDriveLink && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-700" />
                <span className="font-semibold text-blue-900">
                  Pasta de Fotos e Anexos no Google Drive:
                </span>
              </div>
              <a
                href={rdo.googleDriveLink}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 hover:underline"
              >
                <span>Acessar Pasta</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Signatures Block for Official Engineering Report */}
          <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-center text-xs mt-6">
            <div>
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1.5" />
              <p className="font-bold text-slate-900">{rdo.authorName || 'Engenheiro Residente'}</p>
              <p className="text-slate-600">Engenheiro(a) Civil Responsável</p>
              <p className="text-[10px] text-slate-500">CREA-SP 506.123/D</p>
            </div>

            <div>
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1.5" />
              <p className="font-bold text-slate-900">Fiscalização / Gestor de Obra</p>
              <p className="text-slate-600">Contratante / Coordenação Técnica</p>
              <p className="text-[10px] text-slate-500">Visto Técnico</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
