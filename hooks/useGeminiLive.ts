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
   - Turn 1: Greet warmly and ask 1 focused question about their business problem.
   - Turn 2: Ask 1 clarifying question to understand context or constraints.
   - Turn 3: Ask 1 final question about stakeholders or desired outcomes.
   - Turn 4: Provide TWO outputs:
     1) First, give a brief solution summary (under 40 words) that will be spoken
     2) Then add [FINISH] followed by a detailed, comprehensive solution with 3-5 concrete, actionable steps
3. PRESENTATION WARM-UP (The 5-Turn Drill): Act as a supportive Mentor.
   - Turn 1: Ask for the opening/hook.
   - Turn 3: Give 1 specific technical fix (e.g., 'Slow down,' 'Pause for effect'). Ask them to repeat.
   - Turn 5: Final high-energy pep talk.

CONSTRAINTS:
- TURN LIMIT: Exactly 4 turns per session.
- VOICE OPTIMIZATION: Your first response in Turn 4 MUST be under 40 words (for speaking).
- NO FORMATTING: Do NOT use bold (**), italics, bullet points, or emojis.
- NO INTERNAL MONOLOGUE: NEVER output your thinking, planning, or internal state. ONLY speak directly to the user.
- NO CLOSING MESSAGES: NEVER say phrases like "Sesi ini telah selesai", "Thank you for using", "Terima kasih", or any session closing greetings. End directly with your solution.
- TAGGING SYSTEM:
  - ALWAYS start every response with the tag [WAVE:ON].
  - On the 4th response, provide a brief summary, then add [FINISH] followed by your detailed solution.
- LANGUAGE: Adapt to the user's language (Indonesian or English). Maintain a professional, academic, yet agile business tone.`;

const MARKETING_ANALYTICS_CURRICULUM = `
MARKETING ANALYTICS CURRICULUM - Use this as your knowledge base when providing solutions:

MODULE 1: Marketing Analytics Background & Metrics
- Role of analytics as competitive advantage
- Marketing analytics framework & maturity model
- Funnel metrics vs outcome metrics
- Customer Acquisition Cost (CAC) and Customer Lifetime Value (LTV)
- Contribution margin analysis

MODULE 2: Customer Analytics & Segmentation
- Behavioral vs demographic segmentation
- RFM (Recency, Frequency, Monetary) framework
- Cohort analysis
- Retention, churn, and customer lifetime value
- Activity: Read cohort table, identify high-value and at-risk segments

MODULE 3: Campaign & Channel Analytics
- Channel performance frameworks
- Attribution channel models (first-touch, last-touch, multi-touch)
- Paid vs organic trade-offs

MODULE 4: Experimentation & Test-and-Learn
- A/B testing methodology
- Hypothesis-driven marketing
- Activity: Design experiment for acquisition, define success criteria and risks

MODULE 5: Predictive Analytics
- Predictive use cases: churn prediction, response modeling, upsell/cross-sell
- Propensity scoring
- Activity: Identify predictive use cases in organization

MODULE 6: AI Foundations for Marketers
- Brief history of AI & evolution in marketing
- AI tool landscape for marketers
- AI model landscape selection
- Pattern recognition vs labeled data learning

MODULE 7: Prompting & Communicating with AI
- Text prompting fundamentals: structure, context & iteration
- Concepting & creative ideation for campaigns
- Marketing strategy & positioning with AI
- Activity: Craft prompts for brand or campaign

MODULE 8: Text to Image
- How text-to-image models work
- Moodboard creation: style, tone, color & composition
- Storyboarding: translating concepts to visual scenes
- Scene-by-scene prompting for consistency
- Activity: Generate moodboard & storyboard

MODULE 9: Image to Video
- How image-to-video animation models work
- Camera motion, transitions & timing
- Visual consistency across frames
- Activity: Animate storyboard into video clips

MODULE 10: Marketing Budget Optimization
- Marketing Budget strategic objectives
- Classify Marketing Spend into Buckets
- Budget Prioritization: Unit Economics & Marginal ROI

MODULE 11: Future Trends
- Next-best-action and next-best-offer concepts
- Real-time vs rule-based personalization
- Generative AI in marketing insights and content

CAPSTONE: Build Marketing Analytics Playbook
- Top 3 decisions to improve with analytics
- Key metrics & experiments

IMPORTANT: When providing solutions for Marketing & Growth, reference relevant concepts from this curriculum. Ensure your recommendations align with these frameworks and methodologies.
`;

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
  const mimeTypeRef = useRef<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
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

  /** Convert base64 PCM to a playable AudioBuffer and enqueue */
  const enqueueAudio = useCallback((base64Data: string, mime: string) => {
    mimeTypeRef.current = mime;
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
      // iOS: resume if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Parse the raw PCM data (16-bit signed LE, mono, 24kHz)
      const pcmData = new Int16Array(rawBuffer);
      const float32 = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        float32[i] = pcmData[i] / 32768;
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      // Stop any currently playing source
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
      // Skip this chunk and try the next
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
    console.log('[GeminiLive] AudioContext initialized, state:', audioContextRef.current.state);
  }, []);

  /** Stop audio playback */
  const stopAudioPlayback = useCallback(() => {
    // Stop current source
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch { /* already stopped */ }
      currentSourceRef.current = null;
    }
    // Clear audio queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsPlaying(false);
    console.log('[GeminiLive] Audio playback stopped, queue cleared');
  }, []);

  const connect = useCallback(async (config: GeminiLiveConfig) => {
    setError(null);

    // Stop any existing audio and close session
    stopAudioPlayback();
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch { /* ignore */ }
      sessionRef.current = null;
    }

    try {
      // iOS: init AudioContext during the user gesture that triggers connect
      await initAudioContext();

      // Fetch API key from server
      const keyResp = await fetch('/api/gemini-key');
      const { apiKey, error: keyError } = await keyResp.json();
      if (keyError || !apiKey) {
        setError(keyError || 'Failed to get API key');
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      // Build system instruction based on mode
      let systemInstruction = SYSTEM_INSTRUCTION;
      if (config.mode === 'Consultant' && config.area) {
        systemInstruction += `\n\nCurrent consulting area: ${config.area}`;
        if (config.area === 'Marketing & Growth') {
          systemInstruction += MARKETING_ANALYTICS_CURRICULUM;
        }
      } else if (config.mode === 'Interview' && config.jobTitle && config.industry) {
        systemInstruction += `\n\nCurrent interview context: ${config.jobTitle} position at ${config.industry} company`;
      } else if (config.mode === 'IELTS' && config.ieltsPart) {
        systemInstruction += `\n\nCurrent IELTS part: ${config.ieltsPart}`;
      }

      if (config.language === 'Indonesian') {
        systemInstruction += `\n\nIMPORTANT: You must respond ONLY in Indonesian (Bahasa Indonesia). Do NOT mix with English or any other language.`;
      } else {
        systemInstruction += `\n\nIMPORTANT: You must respond ONLY in English. Do NOT mix with any other language.`;
      }

      // Reset state
      turnTextRef.current = '';
      turnCountRef.current = 0;
      audioQueueRef.current = [];

      // Build config with optional voice setting
      const sessionConfig: any = {
        responseModalities: [Modality.AUDIO],
        systemInstruction,
        outputAudioTranscription: {},
      };

      // Indonesian → Female voice (Charon), English → Male voice (Kore - better support)
      if (config.language === 'Indonesian') {
        sessionConfig.speechConfig = {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Charon',
            },
          },
        };
        console.log('[GeminiLive] Using voice: Charon (female) for language: Indonesian');
      } else {
        sessionConfig.speechConfig = {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Kore',
            },
          },
        };
        console.log('[GeminiLive] Using voice: Kore (male) for language: English');
      }

      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: sessionConfig,
        callbacks: {
          onopen: () => {
            console.log('[GeminiLive] Session opened successfully');
            setConnected(true);
            // Wait a bit before calling onConnected to ensure session is stable
            setTimeout(() => {
              onConnectedRef.current?.();
            }, 500);
          },
          onmessage: (message: LiveServerMessage) => {
            console.log('[GeminiLive] Message received:', JSON.stringify(message).substring(0, 200));
            // Handle audio data
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  enqueueAudio(
                    part.inlineData.data,
                    part.inlineData.mimeType || 'audio/pcm;rate=24000'
                  );
                }
                // NOTE: Don't use part.text for display - it may contain internal thinking
                // Only use outputTranscription for what the user sees
              }
            }

            // Handle output audio transcription (this is what the AI actually speaks)
            if (message.serverContent?.outputTranscription?.text) {
              const text = message.serverContent.outputTranscription.text;
              turnTextRef.current += text;
              setAiText(turnTextRef.current);
              console.log('[GeminiLive] Transcription:', text.substring(0, 80));

              // Check for [FINISH] tag - stop audio but keep accumulating transcription
              if (turnTextRef.current.includes('[FINISH]') && isPlayingRef.current) {
                console.log('[GeminiLive] [FINISH] detected, stopping audio playback');
                console.log('[GeminiLive] Full text so far:', turnTextRef.current.substring(0, 200));
                // Stop only the audio playback, but don't clear the queue yet
                // This allows transcription to continue accumulating
                if (currentSourceRef.current) {
                  try { currentSourceRef.current.stop(); } catch { /* already stopped */ }
                  currentSourceRef.current = null;
                }
                isPlayingRef.current = false;
                setIsPlaying(false);
                // Clear any remaining audio chunks in queue so they don't play
                audioQueueRef.current = [];
                console.log('[GeminiLive] Audio stopped, transcription continues');
              }
            }

            // Handle turn complete
            if (message.serverContent?.turnComplete) {
              turnCountRef.current += 1;
              const currentTurn = turnCountRef.current;
              const currentText = turnTextRef.current;
              console.log('[GeminiLive] Turn complete:', currentTurn, 'Text length:', currentText.length, 'Contains [FINISH]:', currentText.includes('[FINISH]'));
              console.log('[GeminiLive] Text preview:', currentText.substring(0, 200));
              setTurnCount(currentTurn);

              // Wait a moment for any remaining transcription after [FINISH], then signal turn complete
              const checkAudioDone = () => {
                if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
                  // Give a small delay to allow final transcription chunks to arrive
                  setTimeout(() => {
                    // Capture the final accumulated text
                    const finalText = turnTextRef.current;
                    console.log('[GeminiLive] Final text for callback, length:', finalText.length, 'Contains [FINISH]:', finalText.includes('[FINISH]'));
                    onTurnCompleteRef.current?.(currentTurn, finalText);
                    // Reset accumulated text for next turn
                    turnTextRef.current = '';
                  }, 500);
                } else {
                  setTimeout(checkAudioDone, 100);
                }
              };
              setTimeout(checkAudioDone, 200);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('[GeminiLive] Error:', e.message);
            setError(e.message || 'Gemini Live session error');
          },
          onclose: (e: CloseEvent) => {
            console.log('[GeminiLive] Session closed:', e.reason);
            setConnected(false);
            setIsRecording(false);
          },
        },
      });

      sessionRef.current = session;
      console.log('[GeminiLive] Session connected successfully');
    } catch (err: any) {
      console.error('[GeminiLive] Connection failed:', err);
      setError(err?.message || 'Failed to connect to Gemini Live');
      setConnected(false);
    }
  }, [initAudioContext, enqueueAudio, stopAudioPlayback]);

  /** Send text message to the live session */
  const sendText = useCallback((text: string) => {
    if (sessionRef.current) {
      console.log('[GeminiLive] Sending text:', text.substring(0, 80));
      try {
        sessionRef.current.sendClientContent({
          turns: [
            {
              role: 'user',
              parts: [{ text }]
            }
          ]
        });
        console.log('[GeminiLive] Text sent successfully');
      } catch (err) {
        console.error('[GeminiLive] Error sending text:', err);
        setError('Failed to send message to Gemini');
      }
    } else {
      console.error('[GeminiLive] Cannot send text: no active session');
      setError('No active Gemini session');
    }
  }, []);

  /** Start recording microphone and sending audio chunks to Gemini */
  const startRecording = useCallback(async () => {
    if (!sessionRef.current) {
      console.warn('[GeminiLive] Cannot record: no active session');
      return;
    }

    try {
      setError(null);

      // Stop any playing audio when user starts speaking
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

      // Use AudioContext + ScriptProcessor/AudioWorklet to get raw PCM
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const source = audioCtx.createMediaStreamSource(stream);

      // Use ScriptProcessor for broad compatibility (including iOS Safari)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (!sessionRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Convert float32 to int16
        const int16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64
        const uint8 = new Uint8Array(int16.buffer);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64 = btoa(binary);

        // Send to Gemini Live
        sessionRef.current!.sendRealtimeInput({
          audio: {
            data: base64,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      // Store references for cleanup
      mediaRecorderRef.current = { audioCtx, source, processor } as any;
      setIsRecording(true);
      console.log('[GeminiLive] Recording started');
    } catch (err: any) {
      console.error('[GeminiLive] Error starting recording:', err);
      setError(err?.message || 'Failed to access microphone');
    }
  }, []);

  /** Stop recording */
  const stopRecording = useCallback(() => {
    const refs = mediaRecorderRef.current as any;
    if (refs) {
      try {
        refs.processor?.disconnect();
        refs.source?.disconnect();
        refs.audioCtx?.close();
      } catch { /* ignore */ }
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    console.log('[GeminiLive] Recording stopped');
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
    console.log('[GeminiLive] Disconnected');
  }, [stopRecording, stopAudioPlayback]);

  const setOnTurnComplete = useCallback((callback: (turnCount: number, text: string) => void) => {
    onTurnCompleteRef.current = callback;
  }, []);

  const setOnConnected = useCallback((callback: () => void) => {
    onConnectedRef.current = callback;
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
