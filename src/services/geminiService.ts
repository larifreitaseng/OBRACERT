import { ParsedRdoFromAi } from '../types';

export async function parseRdoWithAi(params: {
  text?: string;
  audioBlob?: Blob;
}): Promise<ParsedRdoFromAi> {
  let audioBase64: string | undefined;
  let mimeType: string | undefined;

  if (params.audioBlob) {
    mimeType = params.audioBlob.type || 'audio/webm';
    const buffer = await params.audioBlob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    audioBase64 = btoa(binary);
  }

  const response = await fetch('/api/parse-audio-rdo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: params.text,
      audioBase64,
      mimeType,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Falha na interpretação do RDO pela IA (${response.status})`);
  }

  const data = await response.json();
  return data as ParsedRdoFromAi;
}
