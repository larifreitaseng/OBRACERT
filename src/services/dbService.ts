import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Company, Project, TeamMember, Rdo } from '../types';

// Mock initial construction data for first run if database is empty
const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    name: 'Alfa Engenharia e Construções Ltda',
    tradeName: 'Alfa Engenharia',
    cnpj: '12.345.678/0001-90',
    email: 'contato@alfaengenharia.com.br',
    phone: '(11) 3245-8900',
    address: 'Av. Paulista, 1842 - 14º andar, São Paulo - SP',
    responsibleEngineer: 'Eng. Larissa Freitas',
    crea: 'CREA-SP 506.123/D',
    createdAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'comp-2',
    name: 'Estrutural Montagens e Premoldados',
    tradeName: 'Estrutural Obras',
    cnpj: '98.765.432/0001-12',
    email: 'obras@estruturalmontagens.com.br',
    phone: '(11) 98765-4321',
    address: 'Rodovia Anhanguera, Km 45, Jundiaí - SP',
    responsibleEngineer: 'Eng. Carlos Mendonça',
    crea: 'CREA-SP 432.889/D',
    createdAt: '2026-02-01T10:00:00.000Z',
  }
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    code: 'OBRA-2026-01',
    name: 'Residencial Horizonte - Torre A',
    companyId: 'comp-1',
    companyName: 'Alfa Engenharia',
    address: 'Rua das Palmeiras, 450 - Jardins, São Paulo - SP',
    residentEngineer: 'Eng. Larissa Freitas',
    crea: 'CREA-SP 506.123/D',
    startDate: '2026-02-01',
    expectedEndDate: '2027-08-30',
    status: 'Em andamento',
    overallProgressPercent: 34,
    googleDriveFolderUrl: '',
    createdBy: 'system',
    createdAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'proj-2',
    code: 'OBRA-2026-02',
    name: 'Centro Comercial Alameda Sul',
    companyId: 'comp-1',
    companyName: 'Alfa Engenharia',
    address: 'Av. Ibirapuera, 1200 - Moema, São Paulo - SP',
    residentEngineer: 'Eng. Carlos Mendonça',
    crea: 'CREA-SP 432.889/D',
    startDate: '2026-03-10',
    expectedEndDate: '2026-12-20',
    status: 'Em andamento',
    overallProgressPercent: 18,
    googleDriveFolderUrl: '',
    createdBy: 'system',
    createdAt: '2026-03-10T08:00:00.000Z',
  }
];

const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'team-1',
    name: 'Larissa Freitas',
    role: 'Engenheira Residente',
    email: 'larifreitaseng@gmail.com',
    phone: '(11) 99123-4567',
    creaOrCau: 'CREA-SP 506.123/D',
    systemRole: 'Editor',
    companyId: 'comp-1',
    companyName: 'Alfa Engenharia',
    projectId: 'proj-1',
    createdAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'team-2',
    name: 'Carlos Mendonça',
    role: 'Engenheiro de Produção',
    email: 'carlos.mendonca@alfaengenharia.com.br',
    phone: '(11) 98234-5678',
    creaOrCau: 'CREA-SP 432.889/D',
    systemRole: 'Editor',
    companyId: 'comp-1',
    companyName: 'Alfa Engenharia',
    projectId: 'proj-2',
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'team-3',
    name: 'Raimundo Nonato',
    role: 'Mestre de Obras Geral',
    email: 'mestre.raimundo@alfaengenharia.com.br',
    phone: '(11) 97345-6789',
    creaOrCau: '',
    systemRole: 'Editor',
    companyId: 'comp-1',
    companyName: 'Alfa Engenharia',
    projectId: 'proj-1',
    createdAt: '2026-02-05T09:00:00.000Z',
  },
  {
    id: 'team-4',
    name: 'Beatriz Vasconcelos',
    role: 'Auditora Técnica / Cliente',
    email: 'beatriz.fiscalizacao@empreendimentos.com',
    phone: '(11) 96456-7890',
    creaOrCau: 'CREA-SP 612.345/D',
    systemRole: 'Visualizador',
    companyId: 'comp-1',
    companyName: 'Alfa Engenharia',
    projectId: 'proj-1',
    createdAt: '2026-02-10T14:00:00.000Z',
  }
];

const INITIAL_RDOS: Rdo[] = [
  {
    id: 'rdo-1',
    rdoNumber: 'RDO #042',
    projectId: 'proj-1',
    projectName: 'Residencial Horizonte - Torre A',
    date: '2026-09-28',
    weatherMorning: 'Chuvoso',
    weatherAfternoon: 'Nublado',
    weatherNight: 'Ensolarado',
    workforce: [
      { id: 'w-1', role: 'Carpinteiros', count: 4, type: 'própria' },
      { id: 'w-2', role: 'Armadores', count: 4, type: 'própria' },
      { id: 'w-3', role: 'Concretistas', count: 4, type: 'terceirizada' }
    ],
    totalWorkers: 12,
    equipment: [
      { id: 'eq-1', name: 'Bomba de concreto estática', quantity: 1, status: 'operando' },
      { id: 'eq-2', name: 'Vibradores de imersão 45mm', quantity: 2, status: 'operando' },
      { id: 'eq-3', name: 'Guincho de coluna', quantity: 1, status: 'parado' }
    ],
    activities: [
      {
        id: 'act-1',
        description: 'Concretagem das vigas e laje do 2º pavimento',
        location: '2º Pavimento - Eixos 1 a 6',
        progressPercent: 80,
        status: 'Em andamento'
      },
      {
        id: 'act-2',
        description: 'Desforma parcial dos pilares do 1º pavimento',
        location: '1º Pavimento',
        progressPercent: 100,
        status: 'Concluído'
      }
    ],
    materials: [
      { id: 'mat-1', item: 'Cimento CP II-F-32', quantity: 50, unit: 'sacos', supplierOrInvoice: 'Votoran - NF 44821' },
      { id: 'mat-2', item: 'Concreto Usinado FCK 30 MPa', quantity: 24, unit: 'm³', supplierOrInvoice: 'Polimix - NF 19283' }
    ],
    occurrences: 'O período da manhã teve chuva branda entre 08h30 e 10h15, ocasionando pequeno atraso no início da concretagem. Atividades retomadas plenamente após as 10h30 sem prejuízo à qualidade estrutural.',
    generalNotes: 'Trabalharam 12 funcionários no turno. Recebido lote de 50 sacos de cimento para pequenos arremates e argamassa de regularização.',
    photoAttachments: [
      {
        id: 'p-1',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80',
        caption: 'Concretagem da viga V-204 e armadura inspecionada',
        timestamp: '11:45',
        stage: 'Estrutura'
      }
    ],
    googleDriveLink: '',
    audioTranscript: 'Hoje concluímos aproximadamente 80% da concretagem das vigas do segundo pavimento. Trabalharam 12 funcionários. O período da manhã teve chuva e recebemos 50 sacos de cimento.',
    createdBy: 'system',
    authorName: 'Eng. Larissa Freitas',
    authorEmail: 'larifreitaseng@gmail.com',
    status: 'Finalizado',
    createdAt: '2026-09-28T17:30:00.000Z',
    updatedAt: '2026-09-28T18:10:00.000Z'
  }
];

const STORAGE_KEYS = {
  COMPANIES: 'obracert_companies_v1',
  PROJECTS: 'obracert_projects_v1',
  TEAM: 'obracert_team_v1',
  RDOS: 'obracert_rdos_v1',
};

function getLocalData<T>(key: string, defaultData: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultData;
    }

    // Auto-sanitize any leftover mock folder URLs from early prototypes
    return parsed.map((item: any) => {
      if (!item || typeof item !== 'object') return item;
      const copy = { ...item };
      if (typeof copy.googleDriveFolderUrl === 'string' && (copy.googleDriveFolderUrl.includes('1aBcDeFg') || copy.googleDriveFolderUrl.includes('2bCdEfGh'))) {
        copy.googleDriveFolderUrl = '';
      }
      if (typeof copy.googleDriveLink === 'string' && (copy.googleDriveLink.includes('1aBcDeFg') || copy.googleDriveLink.includes('2bCdEfGh'))) {
        copy.googleDriveLink = '';
      }
      return copy;
    });
  } catch (e) {
    return defaultData;
  }
}

function setLocalData<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

// Helpers to track explicitly deleted items so they are not resurrected,
// while preserving all pre-existing defaults and custom entries
export function getDeletedIds(collectionName: string): string[] {
  try {
    const raw = localStorage.getItem(`obracert_deleted_${collectionName}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function recordDeletedId(collectionName: string, id: string): void {
  try {
    const current = getDeletedIds(collectionName);
    if (!current.includes(id)) {
      current.push(id);
      localStorage.setItem(`obracert_deleted_${collectionName}`, JSON.stringify(current));
    }
  } catch (e) {}
}

const alreadySyncedDocs = new Set<string>();

export function mergeWithLocalAndDefaults<T extends { id: string }>(
  collectionName: string,
  storageKey: string,
  firestoreItems: T[],
  defaultItems: T[]
): T[] {
  const deletedIds = getDeletedIds(collectionName);
  const firestoreMap = new Map<string, T>();
  firestoreItems.forEach((f) => firestoreMap.set(f.id, f));

  // Check local data for any items not yet in Firestore and not deleted
  const localExisting = getLocalData<T>(storageKey, defaultItems);
  const itemsToSync: T[] = [];

  // Start with map of firestore items (Firestore takes precedence for edited fields)
  const resultMap = new Map<string, T>(firestoreMap);

  // Add default items if not deleted and not in map
  defaultItems.forEach((def) => {
    if (!deletedIds.includes(def.id) && !resultMap.has(def.id)) {
      resultMap.set(def.id, def);
      itemsToSync.push(def);
    }
  });

  // Add local items if not deleted and not in map
  localExisting.forEach((loc) => {
    if (!deletedIds.includes(loc.id) && !resultMap.has(loc.id)) {
      resultMap.set(loc.id, loc);
      itemsToSync.push(loc);
    }
  });

  // Background non-blocking sync unpersisted items to Firestore (avoid duplicates)
  if (itemsToSync.length > 0) {
    itemsToSync.forEach((item) => {
      const key = `${collectionName}/${item.id}`;
      if (!alreadySyncedDocs.has(key)) {
        alreadySyncedDocs.add(key);
        setDoc(doc(db, collectionName, item.id), removeUndefinedValues(item), { merge: true }).catch(() => {});
      }
    });
  }

  return Array.from(resultMap.values());
}

// Global active in-memory listeners to broadcast local updates immediately
const listeners = {
  companies: new Set<(items: Company[]) => void>(),
  projects: new Set<(items: Project[]) => void>(),
  team: new Set<(items: TeamMember[]) => void>(),
  rdos: new Set<(items: Rdo[]) => void>(),
};

function notifyLocalChange(type: 'companies' | 'projects' | 'team' | 'rdos') {
  if (type === 'companies') {
    const data = getLocalData<Company>(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
    listeners.companies.forEach((cb) => cb(data));
  } else if (type === 'projects') {
    const data = getLocalData<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    listeners.projects.forEach((cb) => cb(data));
  } else if (type === 'team') {
    const data = getLocalData<TeamMember>(STORAGE_KEYS.TEAM, INITIAL_TEAM);
    listeners.team.forEach((cb) => cb(data));
  } else if (type === 'rdos') {
    const data = getLocalData<Rdo>(STORAGE_KEYS.RDOS, INITIAL_RDOS);
    data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    listeners.rdos.forEach((cb) => cb(data));
  }
}

// Helper to sanitize objects for Firestore (Firestore throws if any property is undefined)
export function removeUndefinedValues<T>(data: T): T {
  if (data === undefined) {
    return '' as unknown as T;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (data instanceof Date) {
    return data.toISOString() as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => removeUndefinedValues(item)) as unknown as T;
  }
  const res: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      res[key] = removeUndefinedValues(value);
    } else {
      res[key] = '';
    }
  }
  return res as T;
}

// Helper to seed initial collections if empty
async function seedInitialDataIfEmpty() {
  try {
    const compSnap = await getDocs(collection(db, 'companies'));
    if (compSnap.empty) {
      for (const comp of INITIAL_COMPANIES) {
        await setDoc(doc(db, 'companies', comp.id), removeUndefinedValues(comp));
      }
    }

    const projSnap = await getDocs(collection(db, 'projects'));
    if (projSnap.empty) {
      for (const proj of INITIAL_PROJECTS) {
        await setDoc(doc(db, 'projects', proj.id), removeUndefinedValues(proj));
      }
    }

    const teamSnap = await getDocs(collection(db, 'team'));
    if (teamSnap.empty) {
      for (const member of INITIAL_TEAM) {
        await setDoc(doc(db, 'team', member.id), removeUndefinedValues(member));
      }
    }

    const rdoSnap = await getDocs(collection(db, 'rdos'));
    if (rdoSnap.empty) {
      for (const rdo of INITIAL_RDOS) {
        await setDoc(doc(db, 'rdos', rdo.id), removeUndefinedValues(rdo));
      }
    }
  } catch (error) {
    console.warn('Initial seeding note (permission or network fallback):', error);
  }
}

// Trigger initial seed check safely with a deferral so initial UI render is instantaneous
setTimeout(() => {
  seedInitialDataIfEmpty();
}, 1500);

// --- COMPANIES ---
export function subscribeCompanies(
  callback: (companies: Company[]) => void,
  onError?: (err: Error) => void
) {
  listeners.companies.add(callback);
  // Send current merged cached data immediately
  const initialData = mergeWithLocalAndDefaults<Company>(
    'companies',
    STORAGE_KEYS.COMPANIES,
    [],
    INITIAL_COMPANIES
  );
  callback(initialData);

  const colRef = collection(db, 'companies');
  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const items: Company[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<Company, 'id'>) }));
      const merged = mergeWithLocalAndDefaults<Company>(
        'companies',
        STORAGE_KEYS.COMPANIES,
        items,
        INITIAL_COMPANIES
      );
      setLocalData(STORAGE_KEYS.COMPANIES, merged);
      callback(merged);
    },
    (error) => {
      console.warn('Reading companies from local storage:', error.message);
      if (onError) onError(error);
    }
  );

  return () => {
    listeners.companies.delete(callback);
    unsubscribe();
  };
}

export async function saveCompany(company: Company): Promise<void> {
  const current = getLocalData<Company>(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
  const idx = current.findIndex((c) => c.id === company.id);
  if (idx >= 0) {
    current[idx] = company;
  } else {
    current.push(company);
  }
  setLocalData(STORAGE_KEYS.COMPANIES, current);
  notifyLocalChange('companies');

  // Background non-blocking sync to Firestore
  setDoc(doc(db, 'companies', company.id), removeUndefinedValues(company), { merge: true }).catch((error) => {
    console.warn('Firestore write warning for company (saved locally):', error);
  });
}

export async function deleteCompany(id: string): Promise<void> {
  recordDeletedId('companies', id);
  const current = getLocalData<Company>(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES).filter(
    (c) => c.id !== id
  );
  setLocalData(STORAGE_KEYS.COMPANIES, current);
  notifyLocalChange('companies');

  deleteDoc(doc(db, 'companies', id)).catch((error) => {
    console.warn('Firestore delete warning for company:', error);
  });
}

// --- PROJECTS / OBRAS ---
export function subscribeProjects(
  callback: (projects: Project[]) => void,
  onError?: (err: Error) => void
) {
  listeners.projects.add(callback);
  const initialData = mergeWithLocalAndDefaults<Project>(
    'projects',
    STORAGE_KEYS.PROJECTS,
    [],
    INITIAL_PROJECTS
  );
  callback(initialData);

  const colRef = collection(db, 'projects');
  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const items: Project[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<Project, 'id'>) }));
      const merged = mergeWithLocalAndDefaults<Project>(
        'projects',
        STORAGE_KEYS.PROJECTS,
        items,
        INITIAL_PROJECTS
      );
      setLocalData(STORAGE_KEYS.PROJECTS, merged);
      callback(merged);
    },
    (error) => {
      console.warn('Reading projects from local storage:', error.message);
      if (onError) onError(error);
    }
  );

  return () => {
    listeners.projects.delete(callback);
    unsubscribe();
  };
}

export async function saveProject(project: Project): Promise<void> {
  const current = getLocalData<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const idx = current.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    current[idx] = project;
  } else {
    current.unshift(project);
  }
  setLocalData(STORAGE_KEYS.PROJECTS, current);
  notifyLocalChange('projects');

  setDoc(doc(db, 'projects', project.id), removeUndefinedValues(project), { merge: true }).catch((error) => {
    console.warn('Firestore write warning for project (saved locally):', error);
  });
}

export async function deleteProject(id: string): Promise<void> {
  recordDeletedId('projects', id);
  const current = getLocalData<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS).filter(
    (p) => p.id !== id
  );
  setLocalData(STORAGE_KEYS.PROJECTS, current);
  notifyLocalChange('projects');

  deleteDoc(doc(db, 'projects', id)).catch((error) => {
    console.warn('Firestore delete warning for project:', error);
  });
}

// --- TECHNICAL TEAM ---
export function subscribeTeam(
  callback: (team: TeamMember[]) => void,
  onError?: (err: Error) => void
) {
  listeners.team.add(callback);
  const initialData = mergeWithLocalAndDefaults<TeamMember>(
    'team',
    STORAGE_KEYS.TEAM,
    [],
    INITIAL_TEAM
  );
  callback(initialData);

  const colRef = collection(db, 'team');
  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const items: TeamMember[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<TeamMember, 'id'>) }));
      const merged = mergeWithLocalAndDefaults<TeamMember>(
        'team',
        STORAGE_KEYS.TEAM,
        items,
        INITIAL_TEAM
      );
      setLocalData(STORAGE_KEYS.TEAM, merged);
      callback(merged);
    },
    (error) => {
      console.warn('Reading team from local storage:', error.message);
      if (onError) onError(error);
    }
  );

  return () => {
    listeners.team.delete(callback);
    unsubscribe();
  };
}

export async function saveTeamMember(member: TeamMember): Promise<void> {
  const current = getLocalData<TeamMember>(STORAGE_KEYS.TEAM, INITIAL_TEAM);
  const idx = current.findIndex((t) => t.id === member.id);
  if (idx >= 0) {
    current[idx] = member;
  } else {
    current.push(member);
  }
  setLocalData(STORAGE_KEYS.TEAM, current);
  notifyLocalChange('team');

  setDoc(doc(db, 'team', member.id), removeUndefinedValues(member), { merge: true }).catch((error) => {
    console.warn('Firestore write warning for team member (saved locally):', error);
  });
}

export async function deleteTeamMember(id: string): Promise<void> {
  recordDeletedId('team', id);
  const current = getLocalData<TeamMember>(STORAGE_KEYS.TEAM, INITIAL_TEAM).filter(
    (t) => t.id !== id
  );
  setLocalData(STORAGE_KEYS.TEAM, current);
  notifyLocalChange('team');

  deleteDoc(doc(db, 'team', id)).catch((error) => {
    console.warn('Firestore delete warning for team member:', error);
  });
}

// --- RDOs ---
export function subscribeRdos(
  callback: (rdos: Rdo[]) => void,
  onError?: (err: Error) => void
) {
  listeners.rdos.add(callback);
  const initialData = mergeWithLocalAndDefaults<Rdo>(
    'rdos',
    STORAGE_KEYS.RDOS,
    [],
    INITIAL_RDOS
  );
  initialData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  callback(initialData);

  const colRef = collection(db, 'rdos');
  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const items: Rdo[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<Rdo, 'id'>) }));
      const merged = mergeWithLocalAndDefaults<Rdo>(
        'rdos',
        STORAGE_KEYS.RDOS,
        items,
        INITIAL_RDOS
      );
      merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLocalData(STORAGE_KEYS.RDOS, merged);
      callback(merged);
    },
    (error) => {
      console.warn('Reading RDOs from local storage:', error.message);
      if (onError) onError(error);
    }
  );

  return () => {
    listeners.rdos.delete(callback);
    unsubscribe();
  };
}

export async function saveRdo(rdo: Rdo): Promise<void> {
  const current = getLocalData<Rdo>(STORAGE_KEYS.RDOS, INITIAL_RDOS);
  const idx = current.findIndex((r) => r.id === rdo.id);
  if (idx >= 0) {
    current[idx] = rdo;
  } else {
    current.unshift(rdo);
  }
  current.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  setLocalData(STORAGE_KEYS.RDOS, current);
  notifyLocalChange('rdos');

  setDoc(doc(db, 'rdos', rdo.id), removeUndefinedValues(rdo), { merge: true }).catch((error) => {
    console.warn('Firestore write warning for RDO (saved locally):', error);
  });
}

export async function deleteRdo(id: string): Promise<void> {
  recordDeletedId('rdos', id);
  const current = getLocalData<Rdo>(STORAGE_KEYS.RDOS, INITIAL_RDOS).filter((r) => r.id !== id);
  setLocalData(STORAGE_KEYS.RDOS, current);
  notifyLocalChange('rdos');

  deleteDoc(doc(db, 'rdos', id)).catch((error) => {
    console.warn('Firestore delete warning for RDO:', error);
  });
}

