import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NarrationPhrase } from '../game-engine/types';

export interface NarratorSettings {
  enabled: boolean;
  volume: number;
  rate: number;
  pitch: number;
  voiceURI: string | null;
  /** Jouer les clips enregistrés (voix Paul K) plutôt que la synthèse vocale. */
  useRecordedVoice: boolean;
}

export interface NarratorControls {
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  /** Voix de synthèse réellement utilisée (choisie automatiquement si aucune n'est imposée). */
  activeVoice: SpeechSynthesisVoice | null;
  isSpeaking: boolean;
  speak: (phrase: NarrationPhrase) => void;
  /** Lit une phrase même si le narrateur est coupé (aperçu depuis les réglages). */
  preview: (phrase: NarrationPhrase) => void;
  /** Coupe immédiatement la phrase en cours et vide la file d'attente. */
  stop: () => void;
  repeatLast: () => void;
}

/** Silence entre deux phrases : donne au narrateur une diction posée, moins « robotique ». */
const PAUSE_BETWEEN_LINES_MS = 320;

/** Emplacement des clips enregistrés, préfixé par la base publique (`/Loup/` en production). */
function clipUrl(clip: string): string {
  return `${import.meta.env.BASE_URL}audio/${clip}.mp3`;
}

/**
 * Voix françaises masculines et graves proposées par les principales
 * plateformes : ce sont celles qui collent le mieux à l'ambiance d'un conteur
 * de veillée. Elles ne servent que de repli, quand les clips enregistrés sont
 * désactivés ou introuvables.
 */
const PREFERRED_VOICE_NAMES = [
  'thomas',
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

  if (/enhanced|premium|neural|natural|wavenet/.test(name)) score += 8;
  if (/compact|eloquence/.test(name)) score -= 6;

  return score;
}

/** Choisit la voix de synthèse la plus immersive parmi celles installées sur l'appareil. */
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
 * Narrateur vocal. Il lit en priorité les clips enregistrés (voix Paul K) et
 * retombe sur la synthèse vocale du navigateur si un clip est désactivé,
 * absent ou illisible — la partie n'est donc jamais muette.
 *
 * Le reste de l'application ne connaît que `NarratorControls` : brancher un
 * autre moteur vocal ne nécessite aucun changement ailleurs.
 */
export function useNarrator(settings: NarratorSettings): NarratorControls {
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const queueRef = useRef<NarrationPhrase[]>([]);
  const processingRef = useRef(false);
  const lastPhraseRef = useRef<NarrationPhrase | null>(null);
  const pauseTimeoutRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** Clips dont la lecture a échoué : on passe directement à la synthèse vocale ensuite. */
  const brokenClipsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!speechSupported) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [speechSupported]);

  const activeVoice = useMemo(() => {
    if (voices.length === 0) return null;
    if (settings.voiceURI) {
      return voices.find((v) => v.voiceURI === settings.voiceURI) ?? pickNarratorVoice(voices);
    }
    return pickNarratorVoice(voices);
  }, [voices, settings.voiceURI]);

  const activeVoiceRef = useRef(activeVoice);
  activeVoiceRef.current = activeVoice;

  const playNextRef = useRef<() => void>(() => {});

  const scheduleNext = useCallback(() => {
    pauseTimeoutRef.current = window.setTimeout(() => {
      pauseTimeoutRef.current = null;
      playNextRef.current();
    }, PAUSE_BETWEEN_LINES_MS);
  }, []);

  /** Lecture par la synthèse vocale de l'appareil (repli). */
  const speakWithSynthesis = useCallback(
    (phrase: NarrationPhrase) => {
      if (!speechSupported) {
        scheduleNext();
        return;
      }
      const { volume, rate, pitch } = settingsRef.current;
      const utterance = new SpeechSynthesisUtterance(phrase.text);
      utterance.lang = 'fr-FR';
      utterance.volume = Math.min(1, Math.max(0, volume));
      utterance.rate = Math.min(2, Math.max(0.5, rate));
      utterance.pitch = Math.min(2, Math.max(0, pitch));
      if (activeVoiceRef.current) {
        utterance.voice = activeVoiceRef.current;
        utterance.lang = activeVoiceRef.current.lang;
      }
      utterance.onend = scheduleNext;
      utterance.onerror = scheduleNext;
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [speechSupported, scheduleNext],
  );

  /** Lecture du clip enregistré ; retombe sur la synthèse en cas d'échec. */
  const playRecordedClip = useCallback(
    (phrase: NarrationPhrase) => {
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;

      const { volume, rate } = settingsRef.current;
      audio.src = clipUrl(phrase.clip);
      audio.volume = Math.min(1, Math.max(0, volume));
      // La hauteur enregistrée ne se module pas : on garde le timbre d'origine.
      audio.preservesPitch = true;
      audio.playbackRate = Math.min(2, Math.max(0.5, rate));
      audio.onended = scheduleNext;
      audio.onerror = () => {
        brokenClipsRef.current.add(phrase.clip);
        speakWithSynthesis(phrase);
      };

      setIsSpeaking(true);
      audio.play().catch(() => {
        brokenClipsRef.current.add(phrase.clip);
        speakWithSynthesis(phrase);
      });
    },
    [scheduleNext, speakWithSynthesis],
  );

  const playNext = useCallback(() => {
    const phrase = queueRef.current.shift();
    if (!phrase) {
      processingRef.current = false;
      setIsSpeaking(false);
      return;
    }
    const useRecorded = settingsRef.current.useRecordedVoice && !brokenClipsRef.current.has(phrase.clip);
    if (useRecorded) {
      playRecordedClip(phrase);
    } else {
      speakWithSynthesis(phrase);
    }
  }, [playRecordedClip, speakWithSynthesis]);

  playNextRef.current = playNext;

  const enqueue = useCallback(
    (phrase: NarrationPhrase) => {
      queueRef.current.push(phrase);
      if (!processingRef.current) {
        processingRef.current = true;
        playNext();
      }
    },
    [playNext],
  );

  const speak = useCallback(
    (phrase: NarrationPhrase) => {
      if (!settingsRef.current.enabled || settingsRef.current.volume <= 0) return;
      lastPhraseRef.current = phrase;
      enqueue(phrase);
    },
    [enqueue],
  );

  const stop = useCallback(() => {
    if (pauseTimeoutRef.current !== null) {
      window.clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    queueRef.current = [];
    processingRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
    }
    if (speechSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [speechSupported]);

  const preview = useCallback(
    (phrase: NarrationPhrase) => {
      stop();
      enqueue(phrase);
    },
    [stop, enqueue],
  );

  const repeatLast = useCallback(() => {
    if (lastPhraseRef.current) enqueue(lastPhraseRef.current);
  }, [enqueue]);

  useEffect(() => stop, [stop]);

  return { supported: speechSupported, voices, activeVoice, isSpeaking, speak, preview, stop, repeatLast };
}
