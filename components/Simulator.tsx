'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Square, 
  RefreshCw, 
  ChevronLeft, 
  User, 
  Briefcase, 
  TrendingUp, 
  GraduationCap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { getGeminiResponse } from '@/lib/gemini';
import confetti from 'canvas-confetti';

type Mode = 'Interview' | 'Sales' | 'IELTS' | null;

interface SimulatorProps {
  mode: Mode;
  onBack: () => void;
}

export default function Simulator({ mode, onBack }: SimulatorProps) {
  const [step, setStep] = useState<'setup' | 'active' | 'finished'>('setup');
  const [options, setOptions] = useState({
    jobTitle: 'Marketing Manager',
    industry: 'Technology',
    productName: 'SaaS Cloud Solution',
    difficulty: 'Normal',
    language: 'English',
    ieltsPart: 'Part 1'
  });
  
  const [turnCount, setTurnCount] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [aiResponse, setAiResponse] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [summary, setSummary] = useState('');
  
  const { isListening, transcript, startListening, stopListening, speak, isSpeaking, cancelSpeech } = useSpeech();
  const transcriptProcessed = useRef(false);

  // Pre-generate random values for waveform
  const waveformValues = React.useMemo(() => [...Array(20)].map((_, i) => ({
    height: 40 + (i % 5) * 10, // Deterministic but varied
    duration: 0.6 + (i % 3) * 0.2
  })), []);

  const startSession = async () => {
    setStep('active');
    setStatus('processing');
    setTurnCount(1);
    
    let initialPrompt = '';
    if (mode === 'Interview') {
      initialPrompt = `Start session: [Mode: Interview], [Job: ${options.jobTitle}], [Industry: ${options.industry}], [Difficulty: ${options.difficulty}], [Language: ${options.language}]`;
    } else if (mode === 'Sales') {
      initialPrompt = `Start session: [Mode: Sales], [Product: ${options.productName}], [Difficulty: ${options.difficulty}], [Language: ${options.language}]`;
    } else {
      initialPrompt = `Start session: [Mode: IELTS], [Part: ${options.ieltsPart}], [Language: ${options.language}]`;
    }

    try {
      const response = await getGeminiResponse(initialPrompt, []);
      setAiResponse(response || '');
      setHistory([{ role: 'user', parts: [{ text: initialPrompt }] }, { role: 'model', parts: [{ text: response }] }]);
      setStatus('speaking');
      speak(response || '', () => setStatus('idle'));
    } catch (error) {
      console.error(error);
      setStatus('idle');
    }
  };

  const handlePushToTalk = () => {
    if (status === 'idle') {
      transcriptProcessed.current = false;
      setStatus('listening');
      startListening();
    } else if (status === 'listening') {
      stopListening();
    }
  };
  
  const processUserMessage = useCallback(async (text: string) => {
    setStatus('processing');
    const newHistory = [...history, { role: 'user', parts: [{ text }] }];
    
    try {
      const response = await getGeminiResponse(text, history);
      setAiResponse(response || '');
      setHistory([...newHistory, { role: 'model', parts: [{ text: response }] }]);
      
      const newTurnCount = turnCount + 1;
      setTurnCount(newTurnCount);

      setStatus('speaking');
      speak(response || '', () => {
        if (response?.includes('[FINISH]')) {
          const summaryPart = response.split('[FINISH]')[1]?.trim();
          setSummary(summaryPart || 'Session completed.');
          setStep('finished');
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#003366', '#FFCC00', '#F8F9FA']
          });
        } else if (newTurnCount >= 5) {
          setSummary('Maximum turns reached. Session completed.');
          setStep('finished');
        } else {
          setStatus('idle');
        }
      });
    } catch (error) {
      console.error(error);
      setStatus('idle');
    }
  }, [history, turnCount, speak]);

  // Handle transcript completion
  useEffect(() => {
    if (!isListening && transcript && !transcriptProcessed.current && status === 'listening') {
      transcriptProcessed.current = true;
      // Defer to avoid synchronous setState in effect
      setTimeout(() => {
        processUserMessage(transcript);
      }, 0);
    }
  }, [isListening, transcript, status, processUserMessage]);

  const resetSession = () => {
    cancelSpeech();
    setStep('setup');
    setTurnCount(0);
    setHistory([]);
    setAiResponse('');
    setStatus('idle');
    setSummary('');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
      <header className="bg-[#003366] text-white p-4 flex items-center justify-between shadow-lg">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 hover:text-[#FFCC00] transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="font-medium">Back</span>
        </button>
        <h1 className="text-xl font-bold tracking-tight">
          {mode?.toUpperCase()} SIMULATOR
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col">
        <AnimatePresence mode="wait">
          {step === 'setup' && (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
            >
              <h2 className="text-2xl font-bold mb-6 text-[#003366]">Session Configuration</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {mode === 'Interview' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Job Title</label>
                      <input 
                        type="text" 
                        value={options.jobTitle}
                        onChange={(e) => setOptions({...options, jobTitle: e.target.value})}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Industry</label>
                      <input 
                        type="text" 
                        value={options.industry}
                        onChange={(e) => setOptions({...options, industry: e.target.value})}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </>
                )}

                {mode === 'Sales' && (
                  <div className="space-y-2 col-span-full">
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Product/Service Name</label>
                    <input 
                      type="text" 
                      value={options.productName}
                      onChange={(e) => setOptions({...options, productName: e.target.value})}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                )}

                {mode === 'IELTS' && (
                  <div className="space-y-2 col-span-full">
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">IELTS Part</label>
                    <select 
                      value={options.ieltsPart}
                      onChange={(e) => setOptions({...options, ieltsPart: e.target.value})}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
                    >
                      <option>Part 1</option>
                      <option>Part 2</option>
                      <option>Part 3</option>
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Difficulty</label>
                  <select 
                    value={options.difficulty}
                    onChange={(e) => setOptions({...options, difficulty: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
                  >
                    <option>Normal</option>
                    <option>Hard</option>
                    <option>Expert</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Language</label>
                  <select 
                    value={options.language}
                    onChange={(e) => setOptions({...options, language: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
                  >
                    <option>English</option>
                    <option>Indonesian</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={startSession}
                className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#002244] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                START SESSION
              </button>
            </motion.div>
          )}

          {step === 'active' && (
            <motion.div 
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-between py-8"
            >
              {/* AI Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-[#003366] border-4 border-[#FFCC00] flex items-center justify-center overflow-hidden shadow-2xl">
                  <User size={64} className="text-[#FFCC00]" />
                </div>
                {status === 'speaking' && (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -bottom-2 -right-2 bg-[#FFCC00] p-2 rounded-full shadow-lg"
                  >
                    <TrendingUp size={20} className="text-[#003366]" />
                  </motion.div>
                )}
              </div>

              {/* Waveform Animation */}
              <div className="w-full h-32 flex items-center justify-center gap-1">
                {waveformValues.map((val, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: status === 'speaking' || status === 'listening' 
                        ? [20, val.height, 20] 
                        : 10 
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: val.duration,
                      ease: "easeInOut"
                    }}
                    className="w-2 bg-[#FFCC00] rounded-full"
                  />
                ))}
              </div>

              {/* AI Response Display */}
              <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-md border border-gray-100 min-h-[120px] flex items-center justify-center text-center">
                {status === 'processing' ? (
                  <div className="flex items-center gap-3 text-gray-400 italic">
                    <RefreshCw className="animate-spin" size={20} />
                    Coach is thinking...
                  </div>
                ) : (
                  <p className="text-lg font-medium leading-relaxed">
                    {aiResponse.replace(/\[WAVE:ON\]|\[FINISH\].*$/g, '').trim() || "Ready to begin."}
                  </p>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="text-sm font-bold text-[#003366] bg-[#FFCC00] px-4 py-1 rounded-full">
                  TURN {turnCount} / 5
                </div>
                
                <button 
                  onClick={handlePushToTalk}
                  disabled={status === 'processing' || status === 'speaking'}
                  className={`
                    w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all
                    ${status === 'listening' 
                      ? 'bg-red-500 hover:bg-red-600 scale-110' 
                      : 'bg-[#003366] hover:bg-[#002244]'}
                    ${(status === 'processing' || status === 'speaking') ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                  `}
                >
                  {status === 'listening' ? (
                    <Square size={32} className="text-white" />
                  ) : (
                    <Mic size={32} className="text-white" />
                  )}
                </button>
                
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                  {status === 'listening' ? "Listening..." : "Push to Talk"}
                </p>
              </div>
            </motion.div>
          )}

          {step === 'finished' && (
            <motion.div 
              key="finished"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl p-10 border-4 border-[#FFCC00] text-center"
            >
              <div className="w-20 h-20 bg-[#003366] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-[#FFCC00]" />
              </div>
              
              <h2 className="text-3xl font-bold text-[#003366] mb-4">Session Complete</h2>
              
              <div className="bg-[#F8F9FA] p-6 rounded-2xl mb-8 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Coach Evaluation</h3>
                <p className="text-xl font-medium text-[#003366] italic">
                  &quot;{summary}&quot;
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={resetSession}
                  className="flex-1 bg-[#003366] text-white py-4 rounded-xl font-bold hover:bg-[#002244] transition-all"
                >
                  TRY AGAIN
                </button>
                <button 
                  onClick={onBack}
                  className="flex-1 border-2 border-[#003366] text-[#003366] py-4 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  DASHBOARD
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="p-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
        Prasetiya Mulya x Leverate Collaboration
      </footer>
    </div>
  );
}
