import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  CloudRain,
  SunMedium,
  Users,
  Package,
  Wrench,
  ArrowRight,
  RotateCcw,
  Volume2,
  UploadCloud,
  FileAudio,
  Play,
  Pause
} from 'lucide-react';
import { Project, ParsedRdoFromAi } from '../types';
import { parseRdoWithAi } from '../services/geminiService';

interface AudioRdoModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  selectedProjectId: string;
  onApplyParsedData: (data: ParsedRdoFromAi, projectId: string) => void;
}

export const AudioRdoModal: React.FC<AudioRdoModalProps> = ({
  isOpen,
  onClose,
  projects,
  selectedProjectId,
  onApplyParsedData,
}) => {
  const [projectId, setProjectId] = useState<string>(selectedProjectId || projects[0]?.id || '');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedRdoFromAi | null>(null);
  const [micPermissionState, setMicPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (selectedProjectId) {
      setProjectId(selectedProjectId);
    } else if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [selectedProjectId, projects]);

  // Clean state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      stopRecordingCleanup();
      setParsedResult(null);
      setErrorMsg(null);
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setAudioFileName(null);
    }
  }, [isOpen]);

  const stopRecordingCleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setParsedResult(null);
    audioChunksRef.current = [];
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioFileName(null);

    try {
      // 1. Request microphone stream
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador sem suporte direto a microfone. Você pode carregar um arquivo de áudio ou digitar o relato.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      setMicPermissionState('granted');

      // 2. Select optimal audio format
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(finalBlob);
        const newUrl = URL.createObjectURL(finalBlob);
        setAudioUrl(newUrl);
        setAudioFileName(`Relato_Voz_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.webm`);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // 3. Opcional: tentar SpeechRecognition se disponível para transcrição simultânea
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'pt-BR';
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript;
            }
            if (current.trim()) {
              setTranscriptText(current);
            }
          };

          recognition.onerror = (e: any) => {
            console.warn('SpeechRecognition aviso não-bloqueante:', e.error);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn('Speech recognition não iniciado em paralelo:', e);
        }
      }
    } catch (err: any) {
      console.warn('Erro ao acessar microfone:', err);
      setMicPermissionState('denied');
      setErrorMsg(
        'Acesso ao microfone indisponível ou permissão não concedida no navegador. Você pode usar os botões de exemplo rápido, carregar um áudio gravado (WhatsApp/celular) ou digitar o relato no campo abaixo.'
      );
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  // Audio file upload handler (e.g. WhatsApp audio)
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioBlob(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setAudioFileName(file.name);
    setErrorMsg(null);
    setParsedResult(null);

    if (!transcriptText.trim()) {
      setTranscriptText(`[Áudio carregado: ${file.name} - clique em 'Interpretar com IA']`);
    }
  };

  const handleUsePromptExample = (text: string) => {
    setTranscriptText(text);
    setErrorMsg(null);
    setParsedResult(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
    setAudioFileName(null);
  };

  const handleProcessWithAi = async () => {
    const isPlaceholderText = transcriptText.startsWith('[Áudio carregado:');
    const textToSend = isPlaceholderText ? undefined : transcriptText.trim();

    if (!textToSend && !audioBlob) {
      setErrorMsg('Grave um relato no microfone, carregue um arquivo de áudio ou escolha um dos exemplos para a IA interpretar.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const result = await parseRdoWithAi({
        text: textToSend,
        audioBlob: audioBlob || undefined,
      });
      setParsedResult(result);
      if (result.transcriptText && !textToSend) {
        setTranscriptText(result.transcriptText);
      }
    } catch (err: any) {
      console.error('Erro na interpretação do RDO pela IA:', err);
      setErrorMsg(err.message || 'Erro ao processar o relato com IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndReview = () => {
    if (!parsedResult) return;
    onApplyParsedData(parsedResult, projectId);
    onClose();
  };

  if (!isOpen) return null;

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
              <Sparkles className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Geração de RDO por Áudio com IA
              </h2>
              <p className="text-xs text-slate-300">
                Fale livremente pelo microfone ou envie um áudio gravado em campo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Obra selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Selecione a Obra de Destino
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name} ({p.companyName})
                </option>
              ))}
            </select>
          </div>

          {/* Recording & Audio Controls */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-4">
            <div className="flex flex-col items-center">
              <div className="relative">
                {isRecording && (
                  <div className="absolute -inset-2 rounded-full bg-rose-500/25 animate-ping pointer-events-none" />
                )}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md relative z-10 cursor-pointer ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950 hover:scale-105 active:scale-95'
                  }`}
                  title={isRecording ? 'Clique para concluir gravação' : 'Clique para começar a falar no microfone'}
                >
                  {isRecording ? (
                    <Square className="w-6 h-6 fill-current" />
                  ) : (
                    <Mic className="w-7 h-7" />
                  )}
                </button>
              </div>

              <div className="mt-3">
                <span className="text-xs font-bold text-slate-900 block">
                  {isRecording ? 'Gravando áudio do canteiro de obras...' : 'Clique no microfone para gravar o relato'}
                </span>
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  {isRecording ? `Tempo de gravação: ${formatSeconds(recordingSeconds)}` : 'Microfone ativo com suporte a português'}
                </span>
              </div>

              {/* Animated audio bars when recording */}
              {isRecording && (
                <div className="flex items-center gap-1 mt-3">
                  <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-6 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-8 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 h-5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                  <span className="w-1 h-7 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                </div>
              )}

              {/* Player if audio was recorded */}
              {audioUrl && !isRecording && (
                <div className="mt-3 w-full max-w-md bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <FileAudio className="w-4 h-4 text-amber-600" />
                    <span className="truncate max-w-[180px]">{audioFileName || 'Relato Gravado'}</span>
                  </div>
                  <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 pt-1 border-t border-slate-200/80">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-slate-500" />
                Carregar arquivo de áudio (WhatsApp/celular)
              </button>
            </div>
          </div>

          {/* Quick Prompts / Examples */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Exemplos de relato de obra para testar
              </label>
              <span className="text-[11px] text-slate-500">Clique para preencher</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleUsePromptExample(
                    'Hoje concluímos aproximadamente 80% da concretagem das vigas do segundo pavimento. Trabalharam 12 funcionários. O período da manhã teve chuva e recebemos 50 sacos de cimento.'
                  )
                }
                className="text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-xs text-slate-700 transition-colors group cursor-pointer"
              >
                <span className="font-bold text-slate-900 block mb-0.5 group-hover:text-amber-900">
                  🏗️ Concretagem 2º Pavimento (Prompt Principal)
                </span>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  "Hoje concluímos aproximadamente 80% da concretagem das vigas do segundo pavimento. Trabalharam 12 funcionários..."
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleUsePromptExample(
                    'Iniciamos a alvenaria de vedação no primeiro andar com 90% das paredes marcadas. Tivemos 8 pedreiros e 6 serventes. Dia ensolarado o tempo todo e chegaram 3 mil blocos cerâmicos sem ocorrências.'
                  )
                }
                className="text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-xs text-slate-700 transition-colors group cursor-pointer"
              >
                <span className="font-bold text-slate-900 block mb-0.5 group-hover:text-amber-900">
                  🧱 Alvenaria e Vedação (Turno Ensolarado)
                </span>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  "Iniciamos a alvenaria de vedação no primeiro andar com 90% das paredes marcadas. Tivemos 8 pedreiros..."
                </p>
              </button>
            </div>
          </div>

          {/* Transcript / Text input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Transcrição do Relato (Pode ser editada antes da IA analisar)
            </label>
            <textarea
              rows={3}
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder="Fale no microfone acima ou escreva o relato das atividades do dia na obra..."
              className="w-full text-xs p-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-slate-400"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Process with AI Button */}
          <div>
            <button
              type="button"
              onClick={handleProcessWithAi}
              disabled={isLoading || (!transcriptText.trim() && !audioBlob)}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>A IA está interpretando o relato técnico da obra...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Interpretar Relato com IA e Estruturar RDO</span>
                </>
              )}
            </button>
          </div>

          {/* Parsed AI Results Preview */}
          {parsedResult && (
            <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-950">
                    Informações Organizadas com Sucesso pela IA
                  </span>
                </div>
                <span className="text-[11px] font-medium text-emerald-800">
                  Revise abaixo antes de aplicar ao formulário
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Clima Manhã</span>
                  <span className="font-semibold text-slate-900">{parsedResult.weatherMorning}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Clima Tarde</span>
                  <span className="font-semibold text-slate-900">{parsedResult.weatherAfternoon}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Efetivo Total</span>
                  <span className="font-semibold text-slate-900">{parsedResult.totalWorkers} trabalhadores</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Materiais</span>
                  <span className="font-semibold text-slate-900">
                    {parsedResult.materials.length > 0
                      ? `${parsedResult.materials[0].quantity} ${parsedResult.materials[0].unit}`
                      : 'Nenhum'}
                  </span>
                </div>
              </div>

              {parsedResult.activities.length > 0 && (
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200/80 text-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Atividades Detectadas:
                  </span>
                  {parsedResult.activities.map((act, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b last:border-0 border-slate-100">
                      <span className="font-medium text-slate-900 truncate pr-2">
                        {act.description} ({act.location})
                      </span>
                      <span className="font-mono font-bold text-amber-700 shrink-0">
                        {act.progressPercent}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {parsedResult.occurrences && (
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200/80 text-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Ocorrências Identificadas:
                  </span>
                  <p className="text-slate-700">{parsedResult.occurrences}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmAndReview}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Revisar e Salvar no RDO Oficial</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
