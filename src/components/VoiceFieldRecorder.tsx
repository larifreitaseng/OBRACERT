import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, Sparkles } from 'lucide-react';

interface VoiceFieldRecorderProps {
  onTranscript: (text: string) => void;
  currentValue?: string;
  appendMode?: boolean;
  label?: string;
  className?: string;
}

export const VoiceFieldRecorder: React.FC<VoiceFieldRecorderProps> = ({
  onTranscript,
  currentValue = '',
  appendMode = true,
  label = 'Ditar por áudio',
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startVoice = async () => {
    setIsListening(true);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;

        let accumulated = '';

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = 0; i < event.results.length; i++) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              accumulated += piece + ' ';
            } else {
              interim += piece;
            }
          }
          const fullText = (accumulated + interim).trim();
          if (fullText) {
            if (appendMode && currentValue.trim()) {
              onTranscript(`${currentValue.trim()} ${fullText}`);
            } else {
              onTranscript(fullText);
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('SpeechRecognition aviso:', e.error);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        return;
      } catch (e) {
        console.warn('SpeechRecognition fallback:', e);
      }
    }

    // Fallback using MediaRecorder if SpeechRecognition is not available
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Gravação de microfone não suportada neste navegador.');
        setIsListening(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            try {
              const res = await fetch('/api/parse-audio-rdo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64, mimeType: 'audio/webm' }),
              });
              if (res.ok) {
                const data = await res.json();
                const spoken = data.transcriptText || data.occurrences || data.generalNotes || '';
                if (spoken.trim()) {
                  if (appendMode && currentValue.trim()) {
                    onTranscript(`${currentValue.trim()} ${spoken.trim()}`);
                  } else {
                    onTranscript(spoken.trim());
                  }
                }
              }
            } catch (err) {
              console.error('Erro na transcrição por fallback:', err);
            } finally {
              setIsProcessing(false);
            }
          };
          reader.readAsDataURL(blob);
        } catch (e) {
          setIsProcessing(false);
        }
      };

      recorder.start();
    } catch (err) {
      console.warn('Erro ao acessar microfone:', err);
      setIsListening(false);
    }
  };

  const stopVoice = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {isListening ? (
        <button
          type="button"
          onClick={stopVoice}
          className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-md animate-pulse cursor-pointer shadow-xs"
          title="Clique para parar de gravar"
        >
          <Square className="w-3 h-3 fill-current" />
          <span>Ouvindo... Clique para concluir</span>
        </button>
      ) : isProcessing ? (
        <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 rounded-md">
          <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
          <span>Transcrevendo...</span>
        </span>
      ) : (
        <button
          type="button"
          onClick={startVoice}
          className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:text-amber-800 bg-slate-100 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 rounded-md transition-colors cursor-pointer"
          title={label}
        >
          <Mic className="w-3 h-3 text-amber-600" />
          <span>{label}</span>
        </button>
      )}
    </div>
  );
};
