import { auth, googleProvider, getCachedAccessToken, setCachedAccessToken } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { generateRdoPdfBlob } from './pdfService';
import { Rdo, Project, Company } from '../types';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
];

export interface DriveFolder {
  id: string;
  name: string;
  webViewLink: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string;
  createdTime?: string;
  size?: string;
}

export interface UploadRdoAttachmentParams {
  file?: File | Blob;
  base64Data?: string;
  fileName: string;
  mimeType: string;
  folderId?: string;
  rdoNumber?: string;
  projectName?: string;
  caption?: string;
}

/**
 * Extrai o ID da pasta do Google Drive a partir da URL completa ou retorna o próprio ID
 */
export function extractFolderIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  
  // Ex: https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) return folderMatch[1];

  // Ex: https://drive.google.com/open?id=1aBcDeFgHiJkLmNoPqRsTuVwXyZ
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  // Se já for o ID puro alfanumérico do Drive
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Garante que temos um token de acesso válido para o Google Drive.
 * Se não houver em memória, solicita autenticação via popup do Google.
 */
export async function ensureDriveAccessToken(): Promise<string> {
  const currentToken = getCachedAccessToken();
  if (currentToken) {
    return currentToken;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (!token) {
      throw new Error('Não foi possível obter o token de acesso do Google Drive.');
    }
    setCachedAccessToken(token);
    return token;
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.message?.includes('popup-closed-by-user')) {
      const friendlyErr = new Error('Janela de conexão fechada pelo usuário.');
      (friendlyErr as any).code = 'auth/popup-closed-by-user';
      throw friendlyErr;
    }
    console.warn('Erro na autenticação com Google Drive:', error);
    throw new Error(
      error?.message || 'Falha ao autenticar com a conta Google para acesso ao Drive.'
    );
  }
}

/**
 * Verifica se uma pasta existe e está ativa no Google Drive do usuário
 */
export async function checkDriveFolderExists(folderId?: string | null): Promise<boolean> {
  if (!folderId || typeof folderId !== 'string') return false;
  const cleanId = extractFolderIdFromUrl(folderId) || folderId;
  if (!cleanId || cleanId.includes('1aBcDeFg') || cleanId.includes('2bCdEfGh')) {
    return false;
  }

  try {
    const token = await ensureDriveAccessToken();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${cleanId}?fields=id,name,trashed`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !data.trashed;
  } catch {
    return false;
  }
}

/**
 * Verifica se já existe um token de autenticação em memória
 */
export function isDriveAuthenticated(): boolean {
  return !!getCachedAccessToken();
}

/**
 * Busca pastas no Google Drive do usuário
 */
export async function searchDriveFolders(queryText?: string): Promise<DriveFolder[]> {
  const token = await ensureDriveAccessToken();

  let query = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
  if (queryText && queryText.trim()) {
    const sanitized = queryText.replace(/'/g, "\\'");
    query += ` and name contains '${sanitized}'`;
  }

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,webViewLink)&pageSize=20&orderBy=name`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      setCachedAccessToken(null);
      // Tentar reautenticar uma vez
      const freshToken = await ensureDriveAccessToken();
      const retryRes = await fetch(url, {
        headers: { Authorization: `Bearer ${freshToken}` },
      });
      if (!retryRes.ok) {
        throw new Error(`Erro ao buscar pastas no Google Drive (${retryRes.status})`);
      }
      const data = await retryRes.json();
      return (data.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        webViewLink: f.webViewLink || `https://drive.google.com/drive/folders/${f.id}`,
      }));
    }
    throw new Error(`Erro ao buscar pastas no Google Drive (${response.status})`);
  }

  const data = await response.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    webViewLink: f.webViewLink || `https://drive.google.com/drive/folders/${f.id}`,
  }));
}

/**
 * Localiza a pasta da obra no Google Drive pelo nome ou a cria automaticamente se não existir
 */
export async function findOrCreateObraFolder(
  projectName: string,
  projectCode?: string
): Promise<DriveFolder> {
  const token = await ensureDriveAccessToken();
  const folderName = projectCode ? `[${projectCode}] ${projectName}` : projectName;

  // 1. Procurar pasta existente com esse nome
  const sanitizedName = folderName.replace(/'/g, "\\'");
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    `mimeType = 'application/vnd.google-apps.folder' and name = '${sanitizedName}' and trashed = false`
  )}&fields=files(id,name,webViewLink)&pageSize=1`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      const existing = data.files[0];
      return {
        id: existing.id,
        name: existing.name,
        webViewLink: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`,
      };
    }
  }

  // 2. Se não existir, criar a pasta da obra
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: `Pasta de fotos e relatórios da obra ${projectName}`,
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Falha ao criar pasta da obra no Google Drive (${createRes.status})`);
  }

  const createdData = await createRes.json();
  return {
    id: createdData.id,
    name: createdData.name || folderName,
    webViewLink:
      createdData.webViewLink || `https://drive.google.com/drive/folders/${createdData.id}`,
  };
}

/**
 * Converte base64 para Blob para envio multipart ao Google Drive
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const byteChars = atob(cleanBase64);
  const byteArray = new Uint8Array(byteChars.length);

  for (let i = 0; i < byteChars.length; i++) {
    byteArray[i] = byteChars.charCodeAt(i);
  }

  return new Blob([byteArray.buffer as ArrayBuffer], { type: mimeType });
}

/**
 * Faz o upload de foto ou arquivo de anexo vinculado ao RDO para a pasta da obra no Google Drive
 */
export async function uploadRdoAttachmentToDrive(
  params: UploadRdoAttachmentParams
): Promise<{ id: string; name: string; webViewLink: string; thumbnailLink?: string }> {
  const token = await ensureDriveAccessToken();

  let blob: Blob;
  if (params.file) {
    blob = params.file;
  } else if (params.base64Data) {
    blob = base64ToBlob(params.base64Data, params.mimeType || 'image/jpeg');
  } else {
    throw new Error('Nenhum arquivo ou dado de imagem foi fornecido para upload.');
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata: Record<string, any> = {
    name: params.fileName,
    description: `Anexo de RDO - ${params.rdoNumber || 'Diário de Obra'} - ${params.projectName || ''} - ${params.caption || ''}`,
    properties: {
      rdoNumber: params.rdoNumber || '',
      projectName: params.projectName || '',
      app: 'Obracert RDO',
    },
  };

  if (params.folderId) {
    metadata.parents = [params.folderId];
  }

  // Montagem do multipart body
  const metadataContentType = 'application/json; charset=UTF-8';
  const fileContentType = params.mimeType || 'application/octet-stream';

  const metadataPart =
    `Content-Type: ${metadataContentType}\r\n\r\n` + JSON.stringify(metadata);

  const fileReader = new FileReader();
  const fileArrayBuffer: ArrayBuffer = await new Promise((resolve, reject) => {
    fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
    fileReader.onerror = () => reject(fileReader.error);
    fileReader.readAsArrayBuffer(blob);
  });

  const encoder = new TextEncoder();
  const part1 = encoder.encode(delimiter + metadataPart + delimiter + `Content-Type: ${fileContentType}\r\n\r\n`);
  const part2 = new Uint8Array(fileArrayBuffer);
  const part3 = encoder.encode(closeDelimiter);

  const fullPayload = new Uint8Array(part1.length + part2.length + part3.length);
  fullPayload.set(part1, 0);
  fullPayload.set(part2, part1.length);
  fullPayload.set(part3, part1.length + part2.length);

  const uploadUrl =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink';

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: fullPayload,
  });

  if (!res.ok) {
    if (res.status === 401) {
      setCachedAccessToken(null);
      throw new Error('Sessão do Google Drive expirada. Por favor, conecte-se novamente.');
    }
    const errText = await res.text();
    console.warn('Erro no upload para Google Drive:', errText);

    // If 404 (File not found, meaning the specified parent folderId is invalid or deleted)
    if (res.status === 404 && params.folderId) {
      console.warn(`Pasta ${params.folderId} não encontrada no Google Drive (404). Criando pasta real da obra automaticamente...`);
      const createdFolder = await findOrCreateObraFolder(params.projectName || 'Obra');
      return uploadRdoAttachmentToDrive({
        ...params,
        folderId: createdFolder.id,
      });
    }

    throw new Error(`Falha no upload para o Google Drive (${res.status})`);
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
    thumbnailLink: data.thumbnailLink,
  };
}

/**
 * Lista arquivos anexos presentes na pasta da obra
 */
export async function listFolderFiles(folderId: string): Promise<DriveFileItem[]> {
  const token = await ensureDriveAccessToken();
  const cleanId = extractFolderIdFromUrl(folderId) || folderId;

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    `'${cleanId}' in parents and trashed = false`
  )}&fields=files(id,name,mimeType,webViewLink,thumbnailLink,createdTime,size)&pageSize=30&orderBy=createdTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Erro ao listar arquivos da pasta (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Exclusão de arquivo no Google Drive com diálogo de confirmação obrigatório
 */
export async function deleteDriveFileWithConfirm(fileId: string, fileName: string): Promise<boolean> {
  const confirmed = window.confirm(
    `Tem certeza de que deseja excluir permanentemente o arquivo "${fileName}" do Google Drive? Esta ação não pode ser desfeita.`
  );
  if (!confirmed) return false;

  const token = await ensureDriveAccessToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 204) {
    throw new Error(`Não foi possível excluir o arquivo do Google Drive (${res.status})`);
  }

  return true;
}

export interface BackupProgressCallback {
  (step: string, percent: number): void;
}

export interface BackupResult {
  success: boolean;
  folderUrl: string;
  folderName: string;
  pdfUrl?: string;
  pdfName?: string;
  photosUploaded: number;
  updatedRdo: Rdo;
  error?: string;
}

/**
 * Realiza o backup completo do RDO (Relatório PDF gerado + Fotos de Campo)
 * dentro da pasta da Obra no Google Drive, criando a "Segunda Memória" além do Firebase.
 */
export async function backupRdoToDrive(
  rdo: Rdo,
  project?: Project,
  company?: Company,
  onProgress?: BackupProgressCallback
): Promise<BackupResult> {
  try {
    // 1. Autenticar com o Google Drive
    onProgress?.('Verificando conexão com Google Drive...', 10);
    await ensureDriveAccessToken();

    // 2. Identificar ou criar a pasta da obra no Drive
    onProgress?.('Localizando ou criando pasta da obra no Google Drive...', 25);
    const projectName = project?.name || rdo.projectName || 'Obra';
    const projectCode = project?.code || '';

    let rawFolderLink = project?.googleDriveFolderUrl || rdo.googleDriveLink || '';
    if (rawFolderLink.includes('1aBcDeFg') || rawFolderLink.includes('2bCdEfGh')) {
      rawFolderLink = '';
    }

    let folderId = extractFolderIdFromUrl(rawFolderLink);
    let folderName = projectCode ? `[${projectCode}] ${projectName}` : projectName;
    let folderUrl = rawFolderLink;

    let folderExists = false;
    if (folderId) {
      folderExists = await checkDriveFolderExists(folderId);
    }

    if (!folderId || !folderExists) {
      const createdFolder = await findOrCreateObraFolder(projectName, projectCode);
      folderId = createdFolder.id;
      folderName = createdFolder.name;
      folderUrl = createdFolder.webViewLink;
    }

    // 3. Gerar PDF oficial do Relatório Diário de Obra
    onProgress?.('Gerando PDF do Relatório Diário de Obra...', 45);
    const { blob: pdfBlob, fileName: pdfFileName } = await generateRdoPdfBlob(rdo, project, company);

    // 4. Fazer upload do PDF gerado para a pasta da obra no Drive
    onProgress?.('Enviando PDF oficial para a pasta da obra no Drive...', 65);
    const uploadedPdf = await uploadRdoAttachmentToDrive({
      file: pdfBlob,
      fileName: pdfFileName,
      mimeType: 'application/pdf',
      folderId,
      rdoNumber: rdo.rdoNumber,
      projectName,
      caption: `Relatório Técnico Oficial - Data: ${rdo.date}`,
    });

    // 5. Fazer upload das fotos de campo que ainda não estão no Drive
    let photosUploaded = 0;
    const rawPhotos = rdo.photoAttachments || (rdo as any).photos || [];
    const updatedPhotos = [...rawPhotos];

    if (updatedPhotos.length > 0) {
      for (let i = 0; i < updatedPhotos.length; i++) {
        const p = updatedPhotos[i];
        const progressPct = 70 + Math.round(((i + 1) / updatedPhotos.length) * 25);
        onProgress?.(`Enviando foto de campo ${i + 1} de ${updatedPhotos.length} para o Drive...`, progressPct);

        // Se já tiver link no Drive e não for base64 puro, pula
        if (p.googleDriveUrl && !p.url.startsWith('data:')) {
          continue;
        }

        try {
          const photoCleanCaption = (p.caption || `foto_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
          const photoFileName = `${rdo.rdoNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_foto_${i + 1}_${photoCleanCaption}.jpg`;
          
          const uploadedPhoto = await uploadRdoAttachmentToDrive({
            base64Data: p.url,
            fileName: photoFileName,
            mimeType: 'image/jpeg',
            folderId,
            rdoNumber: rdo.rdoNumber,
            projectName,
            caption: p.caption,
          });

          updatedPhotos[i] = {
            ...p,
            googleDriveUrl: uploadedPhoto.webViewLink,
          };
          photosUploaded++;
        } catch (photoErr) {
          console.warn(`Erro ao enviar foto ${i + 1} para o Drive:`, photoErr);
        }
      }
    }

    onProgress?.('Backup na Segunda Memória do Google Drive concluído!', 100);

    const updatedRdo: Rdo = {
      ...rdo,
      photoAttachments: updatedPhotos,
      googleDriveLink: folderUrl,
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      folderUrl,
      folderName,
      pdfUrl: uploadedPdf.webViewLink,
      pdfName: uploadedPdf.name,
      photosUploaded,
      updatedRdo,
    };
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.message?.includes('popup-closed-by-user')) {
      return {
        success: false,
        folderUrl: '',
        folderName: '',
        photosUploaded: 0,
        updatedRdo: rdo,
        error: 'Conexão com o Google cancelada pelo usuário.',
      };
    }
    console.error('Erro no backup para Google Drive:', error);
    return {
      success: false,
      folderUrl: '',
      folderName: '',
      photosUploaded: 0,
      updatedRdo: rdo,
      error: error?.message || 'Falha ao sincronizar segunda memória no Google Drive',
    };
  }
}
