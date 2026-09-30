import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Upload,
  FolderOpen,
  ExternalLink,
  SunMedium,
  CloudRain,
  Cloud,
  CloudLightning,
  AlertTriangle,
  HardHat,
  Users,
  Package,
  Wrench,
  Camera,
  Calendar,
  Sparkles,
  Info,
  Download
} from 'lucide-react';
import {
  Project,
  Rdo,
  WeatherCondition,
  WorkforceItem,
  EquipmentItem,
  ActivityItem,
  MaterialItem,
  PhotoAttachment,
  UserProfile,
  Company,
  DEFAULT_LOCATIONS,
  DEFAULT_WORKFORCE_ROLES
} from '../types';
import {
  findOrCreateObraFolder,
  uploadRdoAttachmentToDrive,
  extractFolderIdFromUrl,
  backupRdoToDrive,
} from '../services/driveService';
import { VoiceFieldRecorder } from './VoiceFieldRecorder';
import { SelectOrCreateCombobox } from './SelectOrCreateCombobox';
import { generateRdoPdf } from '../services/pdfService';
import { compressImageFile } from '../utils/imageCompressor';

interface RdoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rdo: Rdo) => Promise<void>;
  projects: Project[];
  companies?: Company[];
  initialRdo?: Rdo | null;
  userProfile: UserProfile;
}

export const RdoFormModal: React.FC<RdoFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projects,
  companies = [],
  initialRdo,
  userProfile,
}) => {
  const [projectId, setProjectId] = useState('');
  const [rdoNumber, setRdoNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weatherMorning, setWeatherMorning] = useState<WeatherCondition>('Ensolarado');
  const [weatherAfternoon, setWeatherAfternoon] = useState<WeatherCondition>('Ensolarado');
  const [weatherNight, setWeatherNight] = useState<WeatherCondition>('Ensolarado');

  // Google Drive Second Memory Backup states
  const [backupToDrive, setBackupToDrive] = useState(true);
  const [isBackingUpDrive, setIsBackingUpDrive] = useState(false);
  const [backupProgressMsg, setBackupProgressMsg] = useState<string | null>(null);
  const [backupSuccessLink, setBackupSuccessLink] = useState<string | null>(null);

  const [workforce, setWorkforce] = useState<WorkforceItem[]>([
    { id: '1', role: 'Pedreiros / Alvenaria', count: 4, type: 'própria' },
    { id: '2', role: 'Carpinteiros', count: 3, type: 'própria' },
    { id: '3', role: 'Armadores', count: 3, type: 'própria' },
    { id: '4', role: 'Ajudantes Gerais', count: 4, type: 'própria' },
  ]);

  const [equipment, setEquipment] = useState<EquipmentItem[]>([
    { id: '1', name: 'Betoneira 400L', quantity: 1, status: 'operando' },
    { id: '2', name: 'Vibrador de concreto', quantity: 2, status: 'operando' },
  ]);

  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: '1',
      description: 'Concretagem e cura de vigas estruturais',
      location: '2º Pavimento',
      progressPercent: 70,
      status: 'Em andamento',
    },
  ]);

  const [materials, setMaterials] = useState<MaterialItem[]>([
    { id: '1', item: 'Cimento CP II-F-32', quantity: 50, unit: 'sacos', supplierOrInvoice: 'NF 44821' },
  ]);

  const [occurrences, setOccurrences] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [photos, setPhotos] = useState<PhotoAttachment[]>([]);
  const [googleDriveLink, setGoogleDriveLink] = useState('');
  const [status, setStatus] = useState<'Rascunho' | 'Finalizado'>('Finalizado');
  const [audioTranscript, setAudioTranscript] = useState<string | undefined>(undefined);

  const [activeTab, setActiveTab] = useState<'geral' | 'atividades' | 'equipe' | 'materiais' | 'fotos'>('geral');
  const [isSaving, setIsSaving] = useState(false);
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoStage, setNewPhotoStage] = useState('');
  const [newPhotoDriveUrl, setNewPhotoDriveUrl] = useState('');
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [isLocatingDriveFolder, setIsLocatingDriveFolder] = useState(false);
  const [driveSyncMessage, setDriveSyncMessage] = useState<string | null>(null);

  // Load initial Rdo or defaults
  useEffect(() => {
    if (initialRdo) {
      setProjectId(initialRdo.projectId);
      setRdoNumber(initialRdo.rdoNumber);
      setDate(initialRdo.date);
      setWeatherMorning(initialRdo.weatherMorning);
      setWeatherAfternoon(initialRdo.weatherAfternoon);
      setWeatherNight(initialRdo.weatherNight);
      setWorkforce(initialRdo.workforce || []);
      setEquipment(initialRdo.equipment || []);
      setActivities(initialRdo.activities || []);
      setMaterials(initialRdo.materials || []);
      setOccurrences(initialRdo.occurrences || '');
      setGeneralNotes(initialRdo.generalNotes || '');
      setPhotos(initialRdo.photoAttachments || []);
      setGoogleDriveLink(initialRdo.googleDriveLink || '');
      setStatus(initialRdo.status);
      setAudioTranscript(initialRdo.audioTranscript);
    } else {
      const defaultProj = projects[0];
      setProjectId(defaultProj?.id || '');
      setGoogleDriveLink(defaultProj?.googleDriveFolderUrl || '');
      const randomNum = Math.floor(10 + Math.random() * 90);
      setRdoNumber(`RDO #${randomNum}`);
      setDate(new Date().toISOString().split('T')[0]);
      setWeatherMorning('Ensolarado');
      setWeatherAfternoon('Ensolarado');
      setWeatherNight('Ensolarado');
      setOccurrences('');
      setGeneralNotes('');
      setPhotos([]);
      setAudioTranscript(undefined);
    }
  }, [initialRdo, projects, isOpen]);

  // Sync googleDriveLink when project changes if empty
  const handleProjectChange = (id: string) => {
    setProjectId(id);
    const selected = projects.find((p) => p.id === id);
    if (selected?.googleDriveFolderUrl && !googleDriveLink) {
      setGoogleDriveLink(selected.googleDriveFolderUrl);
    }
  };

  const selectedProject = projects.find((p) => p.id === projectId);

  // Workforce helpers
  const handleAddWorkforce = () => {
    setWorkforce([
      ...workforce,
      {
        id: Date.now().toString(),
        role: '',
        count: 1,
        type: 'própria',
      },
    ]);
  };

  const handleRemoveWorkforce = (id: string) => {
    setWorkforce(workforce.filter((w) => w.id !== id));
  };

  const handleUpdateWorkforce = (id: string, field: keyof WorkforceItem, val: any) => {
    setWorkforce(
      workforce.map((w) => (w.id === id ? { ...w, [field]: val } : w))
    );
  };

  // Activities helpers
  const handleAddActivity = () => {
    setActivities([
      ...activities,
      {
        id: Date.now().toString(),
        description: '',
        location: '',
        progressPercent: 50,
        status: 'Em andamento',
      },
    ]);
  };

  const handleRemoveActivity = (id: string) => {
    setActivities(activities.filter((a) => a.id !== id));
  };

  const handleUpdateActivity = (id: string, field: keyof ActivityItem, val: any) => {
    setActivities(
      activities.map((a) => (a.id === id ? { ...a, [field]: val } : a))
    );
  };

  // Materials helpers
  const handleAddMaterial = () => {
    setMaterials([
      ...materials,
      {
        id: Date.now().toString(),
        item: '',
        quantity: 1,
        unit: 'unid',
        supplierOrInvoice: '',
      },
    ]);
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
  };

  const handleUpdateMaterial = (id: string, field: keyof MaterialItem, val: any) => {
    setMaterials(
      materials.map((m) => (m.id === id ? { ...m, [field]: val } : m))
    );
  };

  // Equipment helpers
  const handleAddEquipment = () => {
    setEquipment([
      ...equipment,
      {
        id: Date.now().toString(),
        name: '',
        quantity: 1,
        status: 'operando',
      },
    ]);
  };

  const handleRemoveEquipment = (id: string) => {
    setEquipment(equipment.filter((e) => e.id !== id));
  };

  const handleUpdateEquipment = (id: string, field: keyof EquipmentItem, val: any) => {
    setEquipment(
      equipment.map((e) => (e.id === id ? { ...e, [field]: val } : e))
    );
  };

  // Photo upload local (with automatic client-side compression for high speed and minimal payload)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressImageFile(file);
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const newPhoto: PhotoAttachment = {
        id: Date.now().toString(),
        url: base64,
        caption: newPhotoCaption || file.name,
        timestamp: timeStr,
        stage: newPhotoStage || 'Canteiro de Obras',
        googleDriveUrl: newPhotoDriveUrl || '',
      };
      setPhotos([...photos, newPhoto]);
      setNewPhotoCaption('');
      setNewPhotoStage('');
      setNewPhotoDriveUrl('');
    } catch (err) {
      console.warn('Image compression note:', err);
    }
  };

  // Direct upload to Google Drive obra folder
  const handleUploadDirectlyToDrive = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingToDrive(true);
    setDriveSyncMessage('Conectando ao Google Drive e enviando foto...');
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const caption = newPhotoCaption || file.name;
    const stage = newPhotoStage || 'Canteiro de Obras';

    try {
      const folderId = extractFolderIdFromUrl(googleDriveLink) || undefined;
      const uploaded = await uploadRdoAttachmentToDrive({
        file,
        fileName: `${rdoNumber || 'RDO'}_${file.name}`,
        mimeType: file.type || 'image/jpeg',
        folderId,
        rdoNumber,
        projectName: selectedProject?.name,
        caption,
      });

      const newPhoto: PhotoAttachment = {
        id: Date.now().toString(),
        url: uploaded.thumbnailLink || uploaded.webViewLink,
        caption,
        timestamp: timeStr,
        stage,
        googleDriveUrl: uploaded.webViewLink,
      };

      setPhotos((prev) => [...prev, newPhoto]);
      setDriveSyncMessage(`Foto salva com sucesso no Google Drive: ${uploaded.name}`);
      setNewPhotoCaption('');
      setNewPhotoStage('');
      setNewPhotoDriveUrl('');
    } catch (err: any) {
      console.error('Erro no upload para Google Drive:', err);
      alert(`Falha no upload para o Google Drive: ${err.message}. A foto será carregada em cópia local.`);
      // Fallback to local with compression
      try {
        const base64 = await compressImageFile(file);
        const newPhoto: PhotoAttachment = {
          id: Date.now().toString(),
          url: base64,
          caption,
          timestamp: timeStr,
          stage,
          googleDriveUrl: '',
        };
        setPhotos((prev) => [...prev, newPhoto]);
      } catch (e) {}
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  // Auto-locate or create Google Drive folder for this project
  const handleFindOrCreateDriveFolder = async () => {
    if (!selectedProject) {
      alert('Selecione uma obra antes de buscar a pasta no Google Drive.');
      return;
    }

    setIsLocatingDriveFolder(true);
    setDriveSyncMessage('Buscando ou criando pasta da obra no Google Drive...');
    try {
      const folder = await findOrCreateObraFolder(selectedProject.name, selectedProject.code);
      setGoogleDriveLink(folder.webViewLink);
      setDriveSyncMessage(`Pasta vinculada com sucesso: "${folder.name}"`);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed-by-user') || err?.message?.includes('fechada')) {
        setDriveSyncMessage('Conexão cancelada. Clique novamente quando quiser vincular a pasta no Drive.');
      } else {
        console.warn('Erro ao buscar pasta da obra:', err);
        alert(`Erro na integração com Google Drive: ${err.message}`);
      }
    } finally {
      setIsLocatingDriveFolder(false);
    }
  };

  const handleAddDriveAttachment = () => {
    if (!newPhotoDriveUrl.trim()) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newAttachment: PhotoAttachment = {
      id: Date.now().toString(),
      url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&auto=format&fit=crop&q=80',
      caption: newPhotoCaption || 'Arquivo Google Drive da Obra',
      timestamp: timeStr,
      stage: newPhotoStage || 'Google Drive',
      googleDriveUrl: newPhotoDriveUrl.trim(),
    };
    setPhotos([...photos, newAttachment]);
    setNewPhotoCaption('');
    setNewPhotoStage('');
    setNewPhotoDriveUrl('');
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(photos.filter((p) => p.id !== id));
  };

  // Total workers count
  const calculatedTotalWorkers = workforce.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      alert('Selecione uma obra para o RDO.');
      return;
    }

    setIsSaving(true);
    try {
      const finalRdo: Rdo = {
        id: initialRdo?.id || `rdo-${Date.now()}`,
        rdoNumber: rdoNumber || `RDO #${Math.floor(Math.random() * 900)}`,
        projectId,
        projectName: selectedProject?.name || 'Obra',
        date,
        weatherMorning,
        weatherAfternoon,
        weatherNight,
        workforce: workforce.map((w) => ({
          id: w.id,
          role: w.role || '',
          count: Number(w.count) || 1,
          type: w.type || 'própria',
        })),
        totalWorkers: calculatedTotalWorkers,
        equipment: equipment.map((eq) => ({
          id: eq.id,
          name: eq.name || '',
          quantity: Number(eq.quantity) || 1,
          status: eq.status || 'operando',
        })),
        activities: activities.map((act) => ({
          id: act.id,
          description: act.description || '',
          location: act.location || '',
          progressPercent: Number(act.progressPercent) || 0,
          status: act.status || 'Em andamento',
        })),
        materials: materials.map((m) => ({
          id: m.id,
          item: m.item || '',
          quantity: Number(m.quantity) || 1,
          unit: m.unit || 'unid',
          supplierOrInvoice: m.supplierOrInvoice || '',
        })),
        occurrences: occurrences || '',
        generalNotes: generalNotes || '',
        photoAttachments: photos.map((p) => ({
          id: p.id,
          url: p.url || '',
          caption: p.caption || '',
          timestamp: p.timestamp || '',
          stage: p.stage || 'Geral',
          googleDriveUrl: p.googleDriveUrl || '',
        })),
        googleDriveLink: googleDriveLink || selectedProject?.googleDriveFolderUrl || '',
        audioTranscript: audioTranscript || '',
        createdBy: userProfile.uid,
        authorName: userProfile.displayName,
        authorEmail: userProfile.email,
        status,
        createdAt: initialRdo?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(finalRdo);

      if (backupToDrive) {
        const selectedCompany = companies.find((c) => c.id === selectedProject?.companyId) || companies[0];
        backupRdoToDrive(finalRdo, selectedProject, selectedCompany).then(async (res) => {
          if (res.success) {
            await onSave(res.updatedRdo);
          }
        }).catch((err) => {
          console.warn('Background Drive backup warning:', err);
        });
      }

      onClose();
    } catch (err: any) {
      alert(`Erro ao salvar RDO: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDirectDriveBackup = async () => {
    setIsBackingUpDrive(true);
    setBackupProgressMsg('Conectando ao Google Drive...');
    try {
      const selectedCompany = companies.find((c) => c.id === selectedProject?.companyId) || companies[0];
      const tempRdo: Rdo = {
        id: initialRdo?.id || `rdo-${Date.now()}`,
        rdoNumber: rdoNumber || 'RDO',
        projectId,
        projectName: selectedProject?.name || 'Obra',
        date,
        weatherMorning,
        weatherAfternoon,
        weatherNight,
        workforce,
        totalWorkers: calculatedTotalWorkers,
        equipment,
        activities,
        materials,
        occurrences,
        generalNotes,
        photoAttachments: photos,
        googleDriveLink: googleDriveLink || selectedProject?.googleDriveFolderUrl || '',
        audioTranscript: audioTranscript || '',
        createdBy: userProfile.uid,
        authorName: userProfile.displayName,
        authorEmail: userProfile.email,
        status,
        createdAt: initialRdo?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = await backupRdoToDrive(tempRdo, selectedProject, selectedCompany, (step) => {
        setBackupProgressMsg(step);
      });

      if (res.success) {
        setGoogleDriveLink(res.folderUrl);
        setBackupSuccessLink(res.folderUrl);
        if (res.updatedRdo?.photoAttachments) {
          setPhotos(res.updatedRdo.photoAttachments);
        }
        await onSave(res.updatedRdo);
        alert(`✅ Segunda Memória criada com sucesso no Google Drive!\n\nPasta da Obra: ${res.folderName}\nRelatório PDF: ${res.pdfName || 'Criado'}\nFotos sincronizadas: ${res.photosUploaded}`);
      } else {
        if (!res.error?.includes('cancelad')) {
          alert(`Aviso: ${res.error}`);
        }
      }
    } catch (err: any) {
      if (!err?.message?.includes('cancelad') && err?.code !== 'auth/popup-closed-by-user') {
        alert(`Erro no backup para Google Drive: ${err.message}`);
      }
    } finally {
      setIsBackingUpDrive(false);
      setBackupProgressMsg(null);
    }
  };

  const handleGeneratePdfFromForm = async () => {
    const tempRdo: Rdo = {
      id: initialRdo?.id || `rdo-${Date.now()}`,
      rdoNumber: rdoNumber || 'RDO',
      projectId,
      projectName: selectedProject?.name || 'Obra',
      date,
      weatherMorning,
      weatherAfternoon,
      weatherNight,
      workforce,
      totalWorkers: calculatedTotalWorkers,
      equipment,
      activities,
      materials,
      occurrences,
      generalNotes,
      photoAttachments: photos,
      googleDriveLink,
      audioTranscript,
      createdBy: userProfile.uid,
      authorName: userProfile.displayName,
      authorEmail: userProfile.email,
      status,
      createdAt: initialRdo?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await generateRdoPdf(tempRdo, selectedProject);
  };

  if (!isOpen) return null;

  const weatherOptions: { label: WeatherCondition; icon: any }[] = [
    { label: 'Ensolarado', icon: SunMedium },
    { label: 'Nublado', icon: Cloud },
    { label: 'Chuvoso', icon: CloudRain },
    { label: 'Chuva Forte', icon: CloudLightning },
    { label: 'Impraticável', icon: AlertTriangle },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                {initialRdo ? 'Editar RDO' : 'Novo Relatório Diário de Obra'}
              </span>
              {audioTranscript && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Preenchido via Áudio IA (Revise antes de salvar)
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {rdoNumber || 'RDO'} · {selectedProject?.name || 'Selecione a Obra'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'geral'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Dados Gerais e Clima
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('atividades')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'atividades'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Atividades Executadas ({activities.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('equipe')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'equipe'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Mão de Obra ({calculatedTotalWorkers} op.)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('materiais')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'materiais'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4. Materiais e Equipamentos
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fotos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'fotos'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            5. Fotos e Google Drive ({photos.length})
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: GERAL & CLIMA */}
          {activeTab === 'geral' && (
            <div className="space-y-6">
              {audioTranscript && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Relato falado original (interpretado por IA):
                  </div>
                  <p className="italic text-slate-700">"{audioTranscript}"</p>
                  <p className="text-[11px] text-amber-800 font-medium pt-1">
                    Você pode editar livremente qualquer informação abaixo antes de salvar.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Obra
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                    required
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Identificação do Relatório
                  </label>
                  <input
                    type="text"
                    value={rdoNumber}
                    onChange={(e) => setRdoNumber(e.target.value)}
                    placeholder="Ex: RDO #042"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Data do Diário
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Weather Conditions */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-4">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Condições Climáticas dos Turnos
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Morning */}
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Período da Manhã:
                    </span>
                    <select
                      value={weatherMorning}
                      onChange={(e) => setWeatherMorning(e.target.value as WeatherCondition)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                    >
                      {weatherOptions.map((opt) => (
                        <option key={opt.label} value={opt.label}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Afternoon */}
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Período da Tarde:
                    </span>
                    <select
                      value={weatherAfternoon}
                      onChange={(e) => setWeatherAfternoon(e.target.value as WeatherCondition)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                    >
                      {weatherOptions.map((opt) => (
                        <option key={opt.label} value={opt.label}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Night */}
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Período da Noite:
                    </span>
                    <select
                      value={weatherNight}
                      onChange={(e) => setWeatherNight(e.target.value as WeatherCondition)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                    >
                      {weatherOptions.map((opt) => (
                        <option key={opt.label} value={opt.label}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Occurrences e General Notes */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Ocorrências, Acidentes ou Paralisações no Turno
                    </label>
                    <VoiceFieldRecorder
                      currentValue={occurrences}
                      onTranscript={(txt) => setOccurrences(txt)}
                      label="Gravar Áudio para Ocorrências"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={occurrences}
                    onChange={(e) => setOccurrences(e.target.value)}
                    placeholder="Ex: Chuva na parte da manhã atrasou a concretagem em 1h30... Fiscalização do trabalho presente... Nenhum acidente registrado."
                    className="w-full text-xs p-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Observações e Recomendações Técnicas
                    </label>
                    <VoiceFieldRecorder
                      currentValue={generalNotes}
                      onTranscript={(txt) => setGeneralNotes(txt)}
                      label="Gravar Áudio para Observações"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    placeholder="Observações complementares do engenheiro residente..."
                    className="w-full text-xs p-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATIVIDADES EXECUTADAS */}
          {activeTab === 'atividades' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Etapas e Atividades do Dia</h3>
                  <p className="text-xs text-slate-500">
                    Discrimine os serviços realizados, localização no canteiro e percentual atingido.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddActivity}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Atividade</span>
                </button>
              </div>

              <div className="space-y-3">
                {activities.map((act, index) => (
                  <div
                    key={act.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Item {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveActivity(act.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remover atividade"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-5 min-w-0">
                        <div className="flex items-center justify-between mb-1 h-6">
                          <label className="text-[11px] font-semibold text-slate-600">
                            Descrição da Atividade
                          </label>
                          <VoiceFieldRecorder
                            currentValue={act.description}
                            onTranscript={(txt) =>
                              handleUpdateActivity(act.id, 'description', txt)
                            }
                            label="Ditar Atividade"
                          />
                        </div>
                        <input
                          type="text"
                          value={act.description}
                          onChange={(e) =>
                            handleUpdateActivity(act.id, 'description', e.target.value)
                          }
                          placeholder="Ex: Concretagem das vigas e laje"
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium h-9 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-4 min-w-0">
                        <div className="flex items-center justify-between mb-1 h-6">
                          <label className="text-[11px] font-semibold text-slate-600">
                            Localização / Pavimento
                          </label>
                        </div>
                        <SelectOrCreateCombobox
                          value={act.location}
                          onChange={(val) =>
                            handleUpdateActivity(act.id, 'location', val)
                          }
                          options={DEFAULT_LOCATIONS}
                          placeholder="Selecione o local..."
                          createLabel="+ Criar Novo Local / Pavimento..."
                          storageKey="rdo_locations"
                        />
                      </div>

                      <div className="md:col-span-3 min-w-0">
                        <div className="flex items-center justify-between mb-1 h-6">
                          <label className="text-[11px] font-semibold text-slate-600 truncate">
                            Progresso
                          </label>
                          <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                            {act.progressPercent}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2 h-9 bg-white border border-slate-300 rounded-lg px-2.5">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={act.progressPercent}
                            onChange={(e) =>
                              handleUpdateActivity(
                                act.id,
                                'progressPercent',
                                Number(e.target.value)
                              )
                            }
                            className="w-full min-w-0 accent-amber-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {activities.length === 0 && (
                  <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                    <p className="text-xs text-slate-500">Nenhuma atividade adicionada.</p>
                    <button
                      type="button"
                      onClick={handleAddActivity}
                      className="mt-2 text-xs font-bold text-amber-700 hover:underline"
                    >
                      + Clique para adicionar a primeira atividade
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MÃO DE OBRA */}
          {activeTab === 'equipe' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Mão de Obra e Efetivo no Canteiro
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total em campo: <span className="font-mono font-bold text-slate-900">{calculatedTotalWorkers} trabalhadores</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddWorkforce}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Função</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {workforce.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3"
                  >
                    <div className="flex-1">
                      <SelectOrCreateCombobox
                        value={item.role}
                        onChange={(val) =>
                          handleUpdateWorkforce(item.id, 'role', val)
                        }
                        options={DEFAULT_WORKFORCE_ROLES}
                        placeholder="Selecione a função..."
                        createLabel="+ Criar Nova Função / Cargo..."
                        storageKey="rdo_workforce_roles"
                      />
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        value={item.count}
                        onChange={(e) =>
                          handleUpdateWorkforce(item.id, 'count', Number(e.target.value))
                        }
                        placeholder="Qtd"
                        className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-center"
                        required
                      />
                    </div>

                    <div className="w-32">
                      <select
                        value={item.type}
                        onChange={(e) =>
                          handleUpdateWorkforce(item.id, 'type', e.target.value)
                        }
                        className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700"
                      >
                        <option value="própria">Própria</option>
                        <option value="terceirizada">Terceirizada</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveWorkforce(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MATERIAIS & EQUIPAMENTOS */}
          {activeTab === 'materiais' && (
            <div className="space-y-6">
              {/* Materials */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Materiais Recebidos ou Utilizados
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Material</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {materials.map((mat) => (
                    <div
                      key={mat.id}
                      className="grid grid-cols-12 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 items-center"
                    >
                      <div className="col-span-5 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={mat.item}
                          onChange={(e) => handleUpdateMaterial(mat.id, 'item', e.target.value)}
                          placeholder="Material (ex: Cimento CP II-32, Areia, Concreto)"
                          className="flex-1 min-w-0 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                          required
                        />
                        <VoiceFieldRecorder
                          currentValue={mat.item}
                          onTranscript={(txt) => handleUpdateMaterial(mat.id, 'item', txt)}
                          label="Voz"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="any"
                          value={mat.quantity}
                          onChange={(e) =>
                            handleUpdateMaterial(mat.id, 'quantity', Number(e.target.value))
                          }
                          placeholder="Qtd"
                          className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={mat.unit}
                          onChange={(e) => handleUpdateMaterial(mat.id, 'unit', e.target.value)}
                          placeholder="Unid (scs, m³)"
                          className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={mat.supplierOrInvoice || ''}
                          onChange={(e) =>
                            handleUpdateMaterial(mat.id, 'supplierOrInvoice', e.target.value)
                          }
                          placeholder="Fornecedor / NF"
                          className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(mat.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipments */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Equipamentos em Canteiro
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddEquipment}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Equipamento</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {equipment.map((eq) => (
                    <div
                      key={eq.id}
                      className="grid grid-cols-12 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 items-center"
                    >
                      <div className="col-span-6 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={eq.name}
                          onChange={(e) => handleUpdateEquipment(eq.id, 'name', e.target.value)}
                          placeholder="Equipamento (ex: Bomba de concreto, Guincho)"
                          className="flex-1 min-w-0 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                          required
                        />
                        <VoiceFieldRecorder
                          currentValue={eq.name}
                          onTranscript={(txt) => handleUpdateEquipment(eq.id, 'name', txt)}
                          label="Voz"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={eq.quantity}
                          onChange={(e) =>
                            handleUpdateEquipment(eq.id, 'quantity', Number(e.target.value))
                          }
                          placeholder="Qtd"
                          className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <select
                          value={eq.status}
                          onChange={(e) =>
                            handleUpdateEquipment(eq.id, 'status', e.target.value as any)
                          }
                          className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700"
                        >
                          <option value="operando">Operando</option>
                          <option value="parado">Parado / Manutenção</option>
                        </select>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveEquipment(eq.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FOTOS & GOOGLE DRIVE */}
          {activeTab === 'fotos' && (
            <div className="space-y-6">
              {/* Google Drive Folder Integration Box */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-blue-700 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                        Pasta da Obra no Google Drive
                      </h4>
                      <p className="text-[11px] text-blue-800">
                        Pasta para sincronização de fotos em alta resolução, plantas e anexos.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleFindOrCreateDriveFolder}
                      disabled={isLocatingDriveFolder || !selectedProject}
                      className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isLocatingDriveFolder ? 'Buscando no Drive...' : 'Buscar/Criar Pasta no Drive'}</span>
                    </button>

                    {googleDriveLink && (
                      <a
                        href={googleDriveLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <span>Abrir Pasta</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <input
                    type="url"
                    value={googleDriveLink}
                    onChange={(e) => setGoogleDriveLink(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full text-xs px-3 py-2 bg-white border border-blue-300 rounded-lg text-slate-900 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Cole o link do Google Drive ou clique em "Buscar/Criar Pasta no Drive" para conectar automaticamente.
                  </p>
                </div>

                {driveSyncMessage && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-medium">
                    ✓ {driveSyncMessage}
                  </div>
                )}
              </div>

              {/* Segunda Memória Google Drive Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-xs">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Segunda Memória no Google Drive</span>
                        <span className="px-1.5 py-0.5 text-[9px] bg-blue-100 text-blue-800 rounded font-bold uppercase tracking-wider">
                          Backup Duplo
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Salva automaticamente uma cópia do relatório técnico em PDF e de todas as fotos de campo na pasta da obra no Drive, além da base Firebase.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDirectDriveBackup}
                    disabled={isBackingUpDrive}
                    className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isBackingUpDrive ? 'Sincronizando...' : 'Fazer Backup no Drive Agora'}</span>
                  </button>
                </div>

                {backupProgressMsg && (
                  <div className="bg-white border border-blue-200 rounded-lg p-2.5 text-xs text-blue-900 flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                      <span className="font-semibold">{backupProgressMsg}</span>
                    </div>
                    {backupSuccessLink && (
                      <a
                        href={backupSuccessLink}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline text-blue-700 flex items-center gap-1 hover:text-blue-900"
                      >
                        <span>Abrir Pasta</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                <div className="text-[10px] text-slate-600 bg-white/70 border border-blue-100 p-2 rounded-lg leading-relaxed">
                  💡 <strong>Dica de Permissão:</strong> Ao conectar sua conta Google, se o Google exibir a tela <em>"O Google não verificou este app"</em>, clique em <strong>Continuar</strong> (no canto inferior esquerdo) para autorizar a criação da pasta da obra e o upload dos relatórios no seu Google Drive.
                </div>
              </div>

              {/* Local and Drive Photo Upload for RDO */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Registro Fotográfico no Relatório</h3>
                    <p className="text-xs text-slate-500">
                      Adicione fotos registradas no canteiro para o diário técnico e sincronize com a nuvem.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Legenda da Foto / Anexo
                        </label>
                        <VoiceFieldRecorder
                          currentValue={newPhotoCaption}
                          onTranscript={(txt) => setNewPhotoCaption(txt)}
                          label="Ditar Legenda"
                        />
                      </div>
                      <input
                        type="text"
                        value={newPhotoCaption}
                        onChange={(e) => setNewPhotoCaption(e.target.value)}
                        placeholder="Ex: Concretagem viga V-204"
                        className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Etapa Relacionada
                      </label>
                      <input
                        type="text"
                        value={newPhotoStage}
                        onChange={(e) => setNewPhotoStage(e.target.value)}
                        placeholder="Ex: Estrutura / Alvenaria"
                        className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Link no Google Drive (opcional)
                      </label>
                      <input
                        type="url"
                        value={newPhotoDriveUrl}
                        onChange={(e) => setNewPhotoDriveUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/..."
                        className="w-full text-xs px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleAddDriveAttachment}
                      disabled={!newPhotoDriveUrl.trim()}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                        newPhotoDriveUrl.trim()
                          ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300 cursor-pointer'
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Anexar pelo Link do Drive</span>
                    </button>

                    <label className={`flex items-center justify-center gap-1.5 py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-xs ${isUploadingToDrive ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingToDrive ? 'Enviando ao Drive...' : 'Upload Direto para Google Drive'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleUploadDirectlyToDrive}
                        className="hidden"
                        disabled={isUploadingToDrive}
                      />
                    </label>

                    <label className="flex items-center justify-center gap-1.5 py-1.5 px-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-xs">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload Foto Local</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Photo grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photos.map((p) => (
                    <div
                      key={p.id}
                      className="relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs group"
                    >
                      <img
                        src={p.url}
                        alt={p.caption}
                        className="w-full h-32 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="p-2 space-y-1">
                        <p className="text-[11px] font-bold text-slate-900 truncate">
                          {p.caption}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {p.stage || 'Geral'} · {p.timestamp}
                        </p>
                        {p.googleDriveUrl && (
                          <a
                            href={p.googleDriveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 hover:underline truncate"
                          >
                            <FolderOpen className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>Ver no Drive</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(p.id)}
                        className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {photos.length === 0 && (
                    <div className="col-span-full text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-500">Nenhuma foto adicionada ainda.</p>
                      <p className="text-[11px] text-slate-400">
                        Selecione fotos do canteiro ou use a pasta do Google Drive acima.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Status:</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-md font-bold text-slate-800"
                >
                  <option value="Finalizado">Finalizado / Oficial</option>
                  <option value="Rascunho">Rascunho</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-blue-50/80 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={backupToDrive}
                  onChange={(e) => setBackupToDrive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Segunda Memória no Google Drive</span>
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleGeneratePdfFromForm}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer shadow-xs"
                title="Baixar Relatório RDO em PDF"
              >
                <Download className="w-3.5 h-3.5 text-amber-700" />
                <span>Gerar PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Relatório RDO'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
