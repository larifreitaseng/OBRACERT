export type SystemRole = 'Editor' | 'Visualizador';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  systemRole: SystemRole;
  photoURL?: string;
}

export interface Company {
  id: string;
  name: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  responsibleEngineer: string;
  crea: string;
  createdAt: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  companyId: string;
  companyName: string;
  address: string;
  residentEngineer: string;
  crea: string;
  startDate: string;
  expectedEndDate: string;
  status: 'Em andamento' | 'Paralisada' | 'Concluída';
  overallProgressPercent: number;
  googleDriveFolderUrl: string;
  createdBy: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string; // Ex: "Engenheiro Residente", "Mestre de Obras", "Técnico de Segurança", "Estagiário"
  email: string;
  phone: string;
  creaOrCau?: string;
  systemRole: SystemRole;
  companyId?: string;
  companyName?: string;
  projectId?: string;
  createdAt: string;
}

export type WeatherCondition = 'Ensolarado' | 'Nublado' | 'Chuvoso' | 'Chuva Forte' | 'Impraticável';

export interface WorkforceItem {
  id: string;
  role: string;
  count: number;
  type: 'própria' | 'terceirizada';
}

export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  status: 'operando' | 'parado';
}

export interface ActivityItem {
  id: string;
  description: string;
  location: string;
  progressPercent: number;
  status: 'Iniciado' | 'Em andamento' | 'Concluído' | 'Paralisado';
}

export interface MaterialItem {
  id: string;
  item: string;
  quantity: number;
  unit: string; // ex: "scs", "m³", "kg", "unid"
  supplierOrInvoice?: string;
}

export interface PhotoAttachment {
  id: string;
  url: string;
  caption: string;
  timestamp: string;
  stage?: string;
  googleDriveUrl?: string;
}

export interface Rdo {
  id: string;
  rdoNumber: string; // Ex: "RDO-2026-042"
  projectId: string;
  projectName: string;
  date: string; // YYYY-MM-DD
  weatherMorning: WeatherCondition;
  weatherAfternoon: WeatherCondition;
  weatherNight: WeatherCondition;
  workforce: WorkforceItem[];
  totalWorkers: number;
  equipment: EquipmentItem[];
  activities: ActivityItem[];
  materials: MaterialItem[];
  occurrences: string;
  generalNotes: string;
  photoAttachments: PhotoAttachment[];
  googleDriveLink?: string;
  audioTranscript?: string;
  createdBy: string;
  authorName: string;
  authorEmail: string;
  status: 'Rascunho' | 'Finalizado';
  createdAt: string;
  updatedAt: string;
}

export interface ParsedRdoFromAi {
  activities: {
    description: string;
    location: string;
    progressPercent: number;
    status: 'Iniciado' | 'Em andamento' | 'Concluído' | 'Paralisado';
  }[];
  workforce: {
    role: string;
    count: number;
    type: 'própria' | 'terceirizada';
  }[];
  totalWorkers: number;
  weatherMorning: WeatherCondition;
  weatherAfternoon: WeatherCondition;
  weatherNight: WeatherCondition;
  materials: {
    item: string;
    quantity: number;
    unit: string;
    supplierOrInvoice?: string;
  }[];
  equipment: {
    name: string;
    quantity: number;
    status: 'operando' | 'parado';
  }[];
  occurrences: string;
  generalNotes: string;
  transcriptText: string;
}

export const DEFAULT_LOCATIONS: string[] = [
  'Fundação / Baldrames',
  'Subsolo 2',
  'Subsolo 1',
  'Térreo',
  'Mezanino',
  '1º Pavimento',
  '2º Pavimento',
  '3º Pavimento',
  '4º Pavimento',
  '5º Pavimento',
  'Pavimento Tipo',
  'Cobertura / Telhado',
  'Área Externa / Canteiro',
  'Fachada Norte',
  'Fachada Sul',
  'Fachada Leste',
  'Fachada Oeste',
  'Hall de Entrada',
  'Garagem',
  "Caixa d'Água / Barrilete",
];

export const DEFAULT_WORKFORCE_ROLES: string[] = [
  'Pedreiros / Alvenaria',
  'Carpinteiros',
  'Armadores',
  'Ajudantes Gerais / Serventes',
  'Concretistas',
  'Eletricistas',
  'Encanadores / Hidráulica',
  'Pintores',
  'Gesseiros',
  'Serralheiros',
  'Mestre de Obras',
  'Encarregado Geral',
  'Técnico de Segurança do Trabalho',
  'Operador de Bomba / Betoneira',
  'Operador de Grua / Guincho',
  'Azulejista / Revestimento',
  'Montador de Estruturas Metálicas',
  'Apontador de Obras',
];
