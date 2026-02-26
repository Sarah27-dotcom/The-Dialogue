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
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          voicesCacheRef.current = voices;
          setVoicesLoaded(true);
        }
      };

      if (isIOS) {
        // iOS-specific: Use polling since onvoiceschanged is unreliable
        const pollVoices = setInterval(() => {
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            voicesCacheRef.current = voices;
            setVoicesLoaded(true);
            clearInterval(pollVoices);
            console.log('[iOS TTS] Voices loaded via polling:', voices.length);
          }
        }, 100);

        // Stop polling after 5 seconds and use whatever voices are available
        setTimeout(() => {
          clearInterval(pollVoices);
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0 && !voicesLoaded) {
            voicesCacheRef.current = voices;
            setVoicesLoaded(true);
            console.log('[iOS TTS] Voices loaded via timeout:', voices.length);
          }
        }, 5000);
      } else {
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Helper function to identify voice gender from name patterns
  const getVoiceGender = (voiceName: string): 'male' | 'female' | 'unknown' => {
    const name = voiceName.toLowerCase();
    const maleKeywords = [
      'male', 'david', 'john', 'mark', 'daniel', 'guy', 'adam', 'james',
      'google indonesia', 'google bahasa', 'bahasa indonesia', 'indonesia',
      'indonesian', 'indo', 'bahasaid'
    ];
    const femaleKeywords = ['female', 'zira', 'susan', 'karen', 'linda', 'google us english', 'samantha'];

    if (maleKeywords.some(k => name.includes(k))) return 'male';
    if (femaleKeywords.some(k => name.includes(k))) return 'female';
    return 'unknown';
  };

  const startListening = useCallback((language: string = 'English') => {
    // iOS Audio Priming: Keep Security Window open for async speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

      if (isIOS) {
        // PRIME: Play empty utterance to maintain audio permission
        // Without this, speak() called later (after API) will be blocked
        const silentUtterance = new SpeechSynthesisUtterance('');
        silentUtterance.volume = 0;
        window.speechSynthesis.speak(silentUtterance);
        console.log('[iOS TTS] Audio primed with silent utterance');
      }
    }

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

  const speak = useCallback(async (text: string, language: string = 'English', onEnd?: () => void) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

      // iOS fix: Ensure speech synthesis is ready
      if (isIOS) {
        window.speechSynthesis.cancel();
        await new Promise(resolve => setTimeout(resolve, 50));
      } else {
        // Cancel any ongoing speech for non-iOS
        window.speechSynthesis.cancel();
      }

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

      // Only use cache for English - for Indonesian, always find fresh voice
      if (langCode === 'en-US' && selectedVoiceRef.current.has(langCode)) {
        utterance.voice = selectedVoiceRef.current.get(langCode) || null;
        utterance.lang = langCode;
      } else {
        // For Indonesian (or uncached), always search fresh with gender preference
        const preferredGender = language === 'Indonesian' ? 'male' : 'female';

        let selectedVoice = voicesCacheRef.current.find(v => {
          if (!v.lang.includes(langCode)) return false;
          const gender = getVoiceGender(v.name);
          console.log(`Checking voice: ${v.name} - Gender: ${gender}`);
          return gender === preferredGender;
        });

        console.log(`Selected voice for ${langCode}: ${selectedVoice?.name || 'none'}`);

        if (!selectedVoice) {
          selectedVoice = voicesCacheRef.current.find(v => v.lang.includes(langCode));
          console.log(`Fallback voice for ${langCode}: ${selectedVoice?.name || 'none'}`);
        }

        // iOS fallback: If voice selection fails, use the first available voice matching language
        if (isIOS && !selectedVoice && voicesCacheRef.current.length > 0) {
          const baseLang = langCode.split('-')[0];
          selectedVoice = voicesCacheRef.current.find(v => v.lang.startsWith(baseLang));
          console.log(`[iOS TTS] Using base language fallback: ${selectedVoice?.name || 'none'}`);
        }

        if (selectedVoice) {
          selectedVoiceRef.current.set(langCode, selectedVoice);
          utterance.voice = selectedVoice;
          utterance.lang = langCode;
        }
      }

      // iOS debug logging
      if (isIOS) {
        console.log('[iOS TTS] Speaking:', cleanText.substring(0, 50));
        console.log('[iOS TTS] Available voices:', voicesCacheRef.current.length);
        console.log('[iOS TTS] Selected voice:', utterance.voice?.name || 'default');
      }

      window.speechSynthesis.speak(utterance);

      // iOS fix: Resume if paused (iOS sometimes auto-pauses)
      if (isIOS) {
        setTimeout(() => {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            console.log('[iOS TTS] Resumed paused speech');
          }
        }, 100);
      }
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
