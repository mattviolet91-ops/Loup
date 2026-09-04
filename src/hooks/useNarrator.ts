import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface NarratorSettings {
  enabled: boolean;
  volume: number;
  rate: number;
  pitch: number;
  voiceURI: string | null;
}

export interface NarratorControls {
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  /** Voix réellement utilisée (choisie automatiquement si aucune n'est imposée). */
  activeVoice: SpeechSynthesisVoice | null;
  isSpeaking: boolean;
  speak: (text: string) => void;
  /** Lit une phrase même si le narrateur est coupé (aperçu depuis les réglages). */
  preview: (text: string) => void;
  /** Coupe immédiatement la phrase en cours et vide la file d'attente. */
  stop: () => void;
  repeatLast: () => void;
}

/** Silence entre deux phrases : donne au narrateur une diction posée, moins « robotique ». */
const PAUSE_BETWEEN_LINES_MS = 320;

/**
 * Voix françaises masculines et graves proposées par les principales
 * plateformes : ce sont celles qui collent le mieux à l'ambiance d'un conteur
 * de veillée. La liste sert uniquement de préférence — l'utilisateur peut
 * toujours imposer sa propre voix dans les réglages.
 */
const PREFERRED_VOICE_NAMES = [
  'thomas', // macOS / iOS
  'nicolas',
  'daniel',
  'paul',
  'henri',
  'mathieu',
  'guillaume',
  'rémy',
  'remy',
  'claude',
  'yannick',
];

function scoreVoice(voice: SpeechSynthesisVoice): number {
  const lang = voice.lang.toLowerCase();
  if (!lang.startsWith('fr')) return -1;

  let score = 10;
  if (lang === 'fr-fr') score += 5;

  const name = voice.name.toLowerCase();
  const preferredIndex = PREFERRED_VOICE_NAMES.findIndex((candidate) => name.includes(candidate));
  if (preferredIndex !== -1) score += 20 - preferredIndex;

  // Les voix « enhanced/premium/neural » sont nettement plus naturelles.
  if (/enhanced|premium|neural|natural|wavenet/.test(name)) score += 8;
  // Les variantes « compact » sont les plus métalliques : on les évite.
  if (/compact|eloquence/.test(name)) score -= 6;

  return score;
}

/** Choisit la voix la plus immersive parmi celles installées sur l'appareil. */
export function pickNarratorVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = 0;
  for (const voice of voices) {
    const score = scoreVoice(voice);
    if (score > bestScore) {
      best = voice;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Narrateur vocal basé sur la Web Speech API (`SpeechSynthesis`).
 * Le reste de l'application ne connaît que `NarratorControls` : remplacer ce
 * hook par un autre moteur vocal (ex. un service cloud) ne nécessite aucun
 * changement ailleurs.
 */
export function useNarrator(settings: NarratorSettings): NarratorControls {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);
  const lastTextRef = useRef<string | null>(null);
  const pauseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [supported]);

  const activeVoice = useMemo(() => {
    if (voices.length === 0) return null;
    if (settings.voiceURI) {
      return voices.find((v) => v.voiceURI === settings.voiceURI) ?? pickNarratorVoice(voices);
    }
    return pickNarratorVoice(voices);
  }, [voices, settings.voiceURI]);

  const activeVoiceRef = useRef(activeVoice);
  activeVoiceRef.current = activeVoice;

  const playNext = useCallback(() => {
    if (!supported) return;
    const text = queueRef.current.shift();
    if (!text) {
      processingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    const { volume, rate, pitch } = settingsRef.current;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.volume = Math.min(1, Math.max(0, volume));
    utterance.rate = Math.min(2, Math.max(0.5, rate));
    utterance.pitch = Math.min(2, Math.max(0, pitch));
    if (activeVoiceRef.current) {
      utterance.voice = activeVoiceRef.current;
      utterance.lang = activeVoiceRef.current.lang;
    }

    const scheduleNext = () => {
      pauseTimeoutRef.current = window.setTimeout(() => {
        pauseTimeoutRef.current = null;
        playNext();
      }, PAUSE_BETWEEN_LINES_MS);
    };
    utterance.onend = scheduleNext;
    utterance.onerror = scheduleNext;

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [supported]);

  const enqueue = useCallback(
    (text: string) => {
      queueRef.current.push(text);
      if (!processingRef.current) {
        processingRef.current = true;
        playNext();
      }
    },
    [playNext],
  );

  const speak = useCallback(
    (text: string) => {
      if (!supported || !settingsRef.current.enabled || settingsRef.current.volume <= 0) return;
      lastTextRef.current = text;
      enqueue(text);
    },
    [supported, enqueue],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    if (pauseTimeoutRef.current !== null) {
      window.clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    queueRef.current = [];
    processingRef.current = false;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  const preview = useCallback(
    (text: string) => {
      if (!supported) return;
      stop();
      enqueue(text);
    },
    [supported, stop, enqueue],
  );

  const repeatLast = useCallback(() => {
    if (!supported || !lastTextRef.current) return;
    enqueue(lastTextRef.current);
  }, [supported, enqueue]);

  useEffect(() => stop, [stop]);

  return { supported, voices, activeVoice, isSpeaking, speak, preview, stop, repeatLast };
}
