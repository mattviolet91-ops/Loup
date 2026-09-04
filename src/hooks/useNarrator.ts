import { useCallback, useEffect, useRef, useState } from 'react';

export interface NarratorSettings {
  enabled: boolean;
  volume: number;
  rate: number;
  voiceURI: string | null;
}

export interface NarratorControls {
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  isSpeaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
  repeatLast: () => void;
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

  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [supported]);

  const playNext = useCallback(() => {
    if (!supported) return;
    const text = queueRef.current.shift();
    if (!text) {
      processingRef.current = false;
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.volume = Math.min(1, Math.max(0, settingsRef.current.volume));
    utterance.rate = Math.min(2, Math.max(0.5, settingsRef.current.rate));
    if (settingsRef.current.voiceURI) {
      const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === settingsRef.current.voiceURI);
      if (voice) utterance.voice = voice;
    }
    utterance.onend = () => playNext();
    utterance.onerror = () => playNext();
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !settingsRef.current.enabled || settingsRef.current.volume <= 0) return;
      lastTextRef.current = text;
      queueRef.current.push(text);
      if (!processingRef.current) {
        processingRef.current = true;
        playNext();
      }
    },
    [supported, playNext],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    queueRef.current = [];
    processingRef.current = false;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  const repeatLast = useCallback(() => {
    if (!lastTextRef.current) return;
    const text = lastTextRef.current;
    queueRef.current.push(text);
    if (!processingRef.current) {
      processingRef.current = true;
      playNext();
    }
  }, [playNext]);

  useEffect(() => stop, [stop]);

  return { supported, voices, isSpeaking, speak, stop, repeatLast };
}
