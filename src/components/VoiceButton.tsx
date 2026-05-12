import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  language: string;
  disabled?: boolean;
  lockMessage?: string;
}

export default function VoiceButton({ onTranscript, language, disabled, lockMessage }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = language === 'fr' ? 'fr-FR' : 'en-US';
      rec.continuous = false;
      rec.interimResults = true;

      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        onTranscriptRef.current(transcript);
      };

      rec.onend = () => setIsListening(false);
      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setError('Micro bloqué. Cliquez sur le cadenas 🔒 dans la barre d\'adresse pour autoriser le micro.');
        } else if (event.error === 'no-speech') {
          setError('Aucune voix détectée.');
        } else {
          setError(`Erreur: ${event.error}`);
        }
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [language]);

  const toggleListening = () => {
    if (disabled || !recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setError(null);
      
      // Explicitly request microphone permission first to handle potential blocked state
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          stream.getTracks().forEach(track => track.stop());
          try {
            recognition.start();
            setIsListening(true);
          } catch (err) {
            console.error('Failed to start recognition', err);
            setIsListening(false);
            if (err instanceof Error && err.name === 'InvalidStateError') {
              // Recognition already started or in a weird state
              recognition.stop();
            }
          }
        })
        .catch((err) => {
          console.error('Permission denied or error:', err);
          setError('Micro bloqué ou non disponible. Vérifiez vos paramètres.');
          setIsListening(false);
        });
    }
  };

  if (!recognition && !disabled) return null;

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        disabled={disabled}
        className={`absolute right-4 bottom-4 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 ${
          isListening 
            ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse' 
            : disabled 
              ? 'bg-white/5 text-gray-600 cursor-not-allowed' 
              : 'bg-violet-600/20 text-violet-400 hover:bg-violet-600 hover:text-white border border-violet-500/30'
        }`}
        title={disabled ? lockMessage : isListening ? "Cliquer pour arrêter" : "Cliquer pour parler"}
      >
        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        {disabled && <span className="absolute -top-1 -right-1 text-[8px]">🔒</span>}
      </button>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 bottom-16 bg-[#0f0f15] border border-red-500/30 px-4 py-2 rounded-xl backdrop-blur-xl whitespace-nowrap"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">En écoute... Parlez maintenant</span>
            </div>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 bottom-16 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-xl backdrop-blur-xl whitespace-nowrap"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-red-500" />
              <span className="text-[10px] font-bold text-red-500">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
