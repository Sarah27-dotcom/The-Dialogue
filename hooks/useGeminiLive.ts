'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  GoogleGenAI,
  Modality,
  type Session,
  type LiveServerMessage,
} from '@google/genai';

const SYSTEM_INSTRUCTION = `You are the 'AI Consultant'. You are a high-performance training assistant for professionals.

CORE MODES:
1. INTERVIEW COACH: Act as a high-level HR Director. Tone: Critical, professional, and challenging.
2. AI CONSULTANT: Act as a professional business consultant helping users solve business problems.
   - Tone: Helpful, inquisitive, analytical, solution-oriented.
   - Turn 1: Greet warmly and ask user to describe their business problem.
   - Turns 2-4: Ask focused clarifying questions to understand context, constraints, stakeholders.
   - Turn 5: Provide TWO outputs:
     1) First, give a brief solution summary (under 40 words) that will be spoken
     2) Then add [FINISH] followed by a detailed, comprehensive solution with 3-5 concrete, actionable steps
3. PRESENTATION WARM-UP (The 5-Turn Drill): Act as a supportive Mentor.
   - Turn 1: Ask for the opening/hook.
   - Turn 3: Give 1 specific technical fix (e.g., 'Slow down,' 'Pause for effect'). Ask them to repeat.
   - Turn 5: Final high-energy pep talk.

CONSTRAINTS:
- TURN LIMIT: Exactly 5 turns per session.
- VOICE OPTIMIZATION: Your first response in Turn 5 MUST be under 40 words (for speaking).
- NO FORMATTING: Do NOT use bold (**), italics, bullet points, or emojis.
- TAGGING SYSTEM:
  - ALWAYS start every response with the tag [WAVE:ON].
  - On the 5th response, provide a brief summary, then add [FINISH] followed by your detailed solution.
- LANGUAGE: Adapt to the user's language (Indonesian or English). Maintain a professional, academic, yet agile business tone.`;

const CONNECTION_TIMEOUT_MS = 15_000;

interface GeminiLiveConfig {
  language: string;
  mode: string;
  area?: string;
  jobTitle?: string;
  industry?: string;
  ieltsPart?: string;
}

export function useGeminiLive() {
  const sessionRef = useRef<Session | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef(false);
  const mediaRecorderRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [connected, setConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiText, setAiText] = useState('');
  const [turnCount, setTurnCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const onTurnCompleteRef = useRef<((turnCount: number, text: string) => void) | null>(null);
  const onConnectedRef = useRef<(() => void) | null>(null);

  // Accumulate text from transcription across a single turn
  const turnTextRef = useRef('');
  const turnCountRef = useRef(0);

  /** Convert base64 PCM to raw ArrayBuffer and enqueue for playback */
  const enqueueAudio = useCallback((base64Data: string) => {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    audioQueueRef.current.push(bytes.buffer);

    if (!isPlayingRef.current) {
      playNextChunk();
    }
  }, []);

  /** Play audio chunks sequentially via Web Audio API */
  const playNextChunk = useCallback(async function playNextChunkImpl() {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);

    const rawBuffer = audioQueueRef.current.shift()!;

    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Parse raw PCM: 16-bit signed LE, mono, 24kHz
      const pcmData = new Int16Array(rawBuffer);
      const float32 = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        float32[i] = pcmData[i] / 32768;
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch { /* already stopped */ }
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      currentSourceRef.current = source;

      source.onended = () => {
        currentSourceRef.current = null;
        void playNextChunkImpl();
      };

      source.start();
    } catch (err) {
      console.error('[GeminiLive] Error playing audio chunk:', err);
      void playNextChunkImpl();
    }
  }, []);

  /** Initialize AudioContext on user gesture (required for iOS) */
  const initAudioContext = useCallback(async () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    console.log('[GeminiLive] AudioContext state:', audioContextRef.current.state);
  }, []);

  /** Connect to Gemini Live. Returns true on success, false on failure. */
  const connect = useCallback(async (config: GeminiLiveConfig): Promise<boolean> => {
    setError(null);
    setConnected(false);

    // Close existing session
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch { /* ignore */ }
      sessionRef.current = null;
    }

    try {
      await initAudioContext();

      // Fetch API key
      console.log('[GeminiLive] Fetching API key...');
      const keyResp = await fetch('/api/gemini-key');
      if (!keyResp.ok) {
        const errText = `API key fetch failed (HTTP ${keyResp.status})`;
        console.error('[GeminiLive]', errText);
        setError(errText);
        return false;
      }
      const { apiKey, error: keyError } = await keyResp.json();
      if (keyError || !apiKey) {
        const errText = keyError || 'API key not configured on server';
        console.error('[GeminiLive]', errText);
        setError(errText);
        return false;
      }
      console.log('[GeminiLive] API key OK, connecting...');

      const ai = new GoogleGenAI({ apiKey });

      // Build system instruction
      let systemInstruction = SYSTEM_INSTRUCTION;
      if (config.mode === 'Consultant' && config.area) {
        systemInstruction += `\n\nCurrent consulting area: ${config.area}`;
      } else if (config.mode === 'Interview' && config.jobTitle && config.industry) {
        systemInstruction += `\n\nCurrent interview context: ${config.jobTitle} position at ${config.industry} company`;
      } else if (config.mode === 'IELTS' && config.ieltsPart) {
        systemInstruction += `\n\nCurrent IELTS part: ${config.ieltsPart}`;
      }
      if (config.language === 'Indonesian') {
        systemInstruction += `\n\nRespond in Indonesian (Bahasa Indonesia).`;
      }

      // Reset state
      turnTextRef.current = '';
      turnCountRef.current = 0;
      audioQueueRef.current = [];

      // Connect with timeout
      const session = await Promise.race([
        ai.live.connect({
          model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Zephyr',
                },
              },
            },
            systemInstruction,
            outputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              console.log('[GeminiLive] ✓ Session opened');
              setConnected(true);
              // NOTE: Do NOT call onConnectedRef here — session object
              // hasn't been stored yet. It's called after ai.live.connect resolves.
            },
            onmessage: (message: LiveServerMessage) => {
              // Audio data
              if (message.serverContent?.modelTurn?.parts) {
                for (const part of message.serverContent.modelTurn.parts) {
                  if (part.inlineData?.data) {
                    enqueueAudio(part.inlineData.data);
                  }
                  if (part.text) {
                    turnTextRef.current += part.text;
                    setAiText(turnTextRef.current);
                  }
                }
              }

              // Output transcription
              if (message.serverContent?.outputTranscription?.text) {
                turnTextRef.current += message.serverContent.outputTranscription.text;
                setAiText(turnTextRef.current);
              }

              // Turn complete
              if (message.serverContent?.turnComplete) {
                turnCountRef.current += 1;
                const currentTurn = turnCountRef.current;
                const currentText = turnTextRef.current;
                console.log('[GeminiLive] Turn complete:', currentTurn);
                setTurnCount(currentTurn);

                const checkAudioDone = () => {
                  if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
                    onTurnCompleteRef.current?.(currentTurn, currentText);
                    turnTextRef.current = '';
                  } else {
                    setTimeout(checkAudioDone, 100);
                  }
                };
                setTimeout(checkAudioDone, 200);
              }
            },
            onerror: (e: ErrorEvent) => {
              console.error('[GeminiLive] ✗ Session error:', e.message || e);
              setError(e.message || 'Gemini Live session error');
              setConnected(false);
            },
            onclose: (e: CloseEvent) => {
              console.log('[GeminiLive] Session closed:', e.code, e.reason);
              setConnected(false);
              setIsRecording(false);
            },
          },
        }),
        // Timeout
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timed out (15s). Check your API key and network.')), CONNECTION_TIMEOUT_MS)
        ),
      ]);

      sessionRef.current = session;
      console.log('[GeminiLive] ✓ Session stored, firing onConnected');
      // Now that sessionRef is set, it's safe to call onConnected (which triggers sendText)
      onConnectedRef.current?.();
      return true;
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to connect to Gemini Live';
      console.error('[GeminiLive] ✗ Connection failed:', errMsg);
      setError(errMsg);
      setConnected(false);
      if (sessionRef.current) {
        try { sessionRef.current.close(); } catch { /* ignore */ }
        sessionRef.current = null;
      }
      return false;
    }
  }, [initAudioContext, enqueueAudio]);

  /** Send text to the live session */
  const sendText = useCallback((text: string) => {
    if (!sessionRef.current) {
      console.warn('[GeminiLive] Cannot send text: no session');
      return;
    }
    console.log('[GeminiLive] Sending text:', text.substring(0, 60));
    sessionRef.current.sendClientContent({
      turns: text,
      turnComplete: true,
    });
  }, []);

  /** Start recording mic and streaming PCM to Gemini */
  const startRecording = useCallback(async () => {
    if (!sessionRef.current) {
      console.warn('[GeminiLive] Cannot record: no session');
      return;
    }

    try {
      setError(null);
      stopAudioPlayback();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (!sessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        const uint8 = new Uint8Array(int16.buffer);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        sessionRef.current!.sendRealtimeInput({
          audio: {
            data: btoa(binary),
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      };

      source.connect(processor);
      // Muted gain node to prevent mic echo through speakers
      const muteNode = audioCtx.createGain();
      muteNode.gain.value = 0;
      processor.connect(muteNode);
      muteNode.connect(audioCtx.destination);

      mediaRecorderRef.current = { audioCtx, source, processor };
      setIsRecording(true);
      console.log('[GeminiLive] Recording started');
    } catch (err: any) {
      console.error('[GeminiLive] Mic error:', err);
      setError(err?.message || 'Failed to access microphone');
    }
  }, []);

  /** Stop audio playback */
  const stopAudioPlayback = useCallback(() => {
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch { /* already stopped */ }
      currentSourceRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  /** Stop recording */
  const stopRecording = useCallback(() => {
    const refs = mediaRecorderRef.current;
    if (refs) {
      try {
        refs.processor?.disconnect();
        refs.source?.disconnect();
        refs.audioCtx?.close();
      } catch { /* ignore */ }
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  }, []);

  /** Disconnect and cleanup */
  const disconnect = useCallback(() => {
    stopRecording();
    stopAudioPlayback();
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch { /* ignore */ }
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch { /* ignore */ }
      audioContextRef.current = null;
    }
    setConnected(false);
    setIsPlaying(false);
    setIsRecording(false);
    turnTextRef.current = '';
    turnCountRef.current = 0;
  }, [stopRecording, stopAudioPlayback]);

  const setOnTurnComplete = useCallback((cb: (turnCount: number, text: string) => void) => {
    onTurnCompleteRef.current = cb;
  }, []);

  const setOnConnected = useCallback((cb: () => void) => {
    onConnectedRef.current = cb;
  }, []);

  const stopAudio = useCallback(() => {
    stopAudioPlayback();
  }, [stopAudioPlayback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connected,
    isRecording,
    isPlaying,
    aiText,
    turnCount,
    error,
    connect,
    startRecording,
    stopRecording,
    sendText,
    disconnect,
    stopAudio,
    setOnTurnComplete,
    setOnConnected,
  };
}
