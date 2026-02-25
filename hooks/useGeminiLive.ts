'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface GeminiLiveConfig {
  language: string;
  mode: string;
  area?: string;
  jobTitle?: string;
  industry?: string;
  ieltsPart?: string;
}

export function useGeminiLive() {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef(false);
  const mimeTypeRef = useRef<string>('audio/wav');

  const [connected, setConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiText, setAiText] = useState('');
  const [turnCount, setTurnCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const onTurnCompleteRef = useRef<((turnCount: number, text: string) => void) | null>(null);
  const onConnectedRef = useRef<(() => void) | null>(null);

  // Determine WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/gemini-live`;
  }, []);

  const connect = useCallback(async (config: GeminiLiveConfig) => {
    setError(null);

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(getWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket Client] Connected to server');
        setConnected(true);
        setError(null);
        // Send config
        const configMsg = {
          type: 'config',
          ...config
        };
        console.log('[WebSocket Client] Sending config:', configMsg);
        ws.send(JSON.stringify(configMsg));
      };

      ws.onmessage = async (event: MessageEvent) => {
        console.log('[WebSocket Client] Message received:', event.data.substring(0, 100));
        try {
          const msg = JSON.parse(event.data);
          console.log('[WebSocket Client] Parsed message type:', msg.type);

          if (msg.type === 'connected') {
            console.log('[WebSocket Client] Connected confirmation received');
            onConnectedRef.current?.();
            setConnected(true);
          } else if (msg.type === 'audio') {
            console.log('[WebSocket Client] Audio chunk received, queue size:', audioQueueRef.current.length);
            // Queue audio chunk
            audioQueueRef.current.push(msg.data);
            mimeTypeRef.current = msg.mimeType || 'audio/wav';

            // Play if not already playing
            if (!isPlayingRef.current) {
              console.log('[WebSocket Client] Starting audio playback');
              playAudioQueue();
            }
          } else if (msg.type === 'text') {
            console.log('[WebSocket Client] Text received:', msg.text);
            setAiText(msg.text);
          } else if (msg.type === 'turnComplete') {
            console.log('[WebSocket Client] Turn complete:', msg.turnCount);
            setTurnCount(msg.turnCount);
            // Wait a bit to ensure all audio chunks are processed
            setTimeout(() => {
              onTurnCompleteRef.current?.(msg.turnCount, aiText);
            }, 100);
          } else if (msg.type === 'error') {
            console.error('[WebSocket Client] Error received:', msg.message);
            setError(msg.message);
          }
        } catch (err) {
          console.error('[WebSocket Client] Error parsing message:', err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        setIsRecording(false);
        setIsPlaying(false);
        // Stop any playing audio
        if (currentSourceRef.current) {
          try {
            currentSourceRef.current.stop();
          } catch (e) {
            // Already stopped
          }
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket Client] WebSocket error:', error);
        setError('WebSocket connection error');
        setConnected(false);
      };

    } catch (err: any) {
      setError(err?.message || 'Failed to connect');
      setConnected(false);
    }
  }, [getWebSocketUrl, aiText]);

  const playAudioQueue = useCallback(async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);

    const base64Data = audioQueueRef.current.shift()!;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);

      // Stop any currently playing source
      if (currentSourceRef.current) {
        try {
          currentSourceRef.current.stop();
        } catch (e) {
          // Already stopped
        }
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      currentSourceRef.current = source;

      source.onended = () => {
        currentSourceRef.current = null;
        playAudioQueue();
      };

      source.start();
    } catch (err) {
      console.error('Error playing audio:', err);
      // Skip this chunk and try the next one
      playAudioQueue();
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      let mimeType = 'audio/webm;codecs=opus';

      // Check browser support for different mime types
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg'
      ];

      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 16000
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          chunks.push(event.data);

          // Convert chunk to base64 and send
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            try {
              wsRef.current!.send(JSON.stringify({
                type: 'audio',
                data: base64,
                mimeType
              }));
            } catch (e) {
              console.error('Error sending audio:', e);
            }
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Send any remaining chunks
        if (chunks.length > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const blob = new Blob(chunks, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            try {
              wsRef.current!.send(JSON.stringify({
                type: 'audio',
                data: base64,
                mimeType
              }));
            } catch (e) {
              console.error('Error sending final audio chunk:', e);
            }
          };
          reader.readAsDataURL(blob);
        }
        chunks.length = 0;
      };

      mediaRecorder.start(100); // Send chunks every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError(err?.message || 'Failed to access microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const sendText = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text',
        text
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    stopRecording();

    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      currentSourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
    setIsPlaying(false);
    audioQueueRef.current = [];
  }, [stopRecording]);

  const setOnTurnComplete = useCallback((callback: (turnCount: number, text: string) => void) => {
    onTurnCompleteRef.current = callback;
  }, []);

  const setOnConnected = useCallback((callback: () => void) => {
    onConnectedRef.current = callback;
  }, []);

  const stopAudio = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      currentSourceRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

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
    setOnConnected
  };
}
