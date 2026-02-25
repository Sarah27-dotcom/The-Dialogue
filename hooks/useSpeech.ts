'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const recognitionRef = useRef<any>(null);
  const voicesCacheRef = useRef<SpeechSynthesisVoice[]>([]);
  const selectedVoiceRef = useRef<Map<string, SpeechSynthesisVoice>>(new Map());
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartPendingRef = useRef(false);

  const SILENCE_DELAY_MS = 2000; // Wait 2 seconds of silence before processing

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;     // Keep listening
      recognitionRef.current.interimResults = true;  // Get partial results

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const resultTranscript = event.results[current][0].transcript;
        const isFinal = event.results[current].isFinal;

        // Always update transcript with latest result
        setTranscript(resultTranscript);

        // Clear existing timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        // If this is a final result, set timeout to process after silence delay
        if (isFinal) {
          silenceTimeoutRef.current = setTimeout(() => {
            setIsListening(false); // This triggers transcript processing in Simulator
          }, SILENCE_DELAY_MS);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        // Clear timeout when recognition ends
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        // If restart was requested, start recognition again
        if (restartPendingRef.current) {
          restartPendingRef.current = false;
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
            setIsListening(false);
          }
        }
      };
    }
  }, []);

  // Load voices asynchronously to ensure consistent voice selection
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          voicesCacheRef.current = voices;
          setVoicesLoaded(true);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const startListening = useCallback((language: string = 'English') => {
    if (recognitionRef.current) {
      // Clear any existing silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      setTranscript('');
      setIsListening(true);
      // Set language for speech recognition
      const langCode = language === 'Indonesian' ? 'id-ID' : 'en-US';
      recognitionRef.current.lang = langCode;

      // Check if recognition is already running
      // If so, stop it and request restart via onend
      try {
        recognitionRef.current.start();
      } catch (e: any) {
        if (e.message?.includes('already started') || e.name === 'InvalidStateError') {
          // Already running - stop and set flag to restart in onend
          restartPendingRef.current = true;
          recognitionRef.current.stop();
        } else {
          console.error('Speech recognition error:', e);
          setIsListening(false);
        }
      }
    } else {
      alert('Speech recognition not supported in this browser.');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      // Clear timeout and restart flag
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      restartPendingRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const speak = useCallback((text: string, language: string = 'English', onEnd?: () => void) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Clean text from tags for cleaner speech
      // Remove [WAVE:ON] tag and everything from [FINISH] onwards (including newlines)
      let cleanText = text.replace(/\[WAVE:ON\]/g, '').trim();
      const finishIndex = cleanText.indexOf('[FINISH]');
      if (finishIndex !== -1) {
        cleanText = cleanText.substring(0, finishIndex).trim();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };

      // Select voice based on language
      const langCode = language === 'Indonesian' ? 'id-ID' : 'en-US';

      // Use cached voice if available, otherwise find from cache
      if (selectedVoiceRef.current.has(langCode)) {
        utterance.voice = selectedVoiceRef.current.get(langCode);
        utterance.lang = langCode;
      } else {
        // Find and cache voice for this language
        const preferredVoice = voicesCacheRef.current.find(v => v.lang.includes(langCode));
        if (preferredVoice) {
          selectedVoiceRef.current.set(langCode, preferredVoice);
          utterance.voice = preferredVoice;
          utterance.lang = langCode;
        }
      }

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    isSpeaking,
    cancelSpeech
  } as const;
}
