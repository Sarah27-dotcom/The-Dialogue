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
  AlertCircle,
  X
} from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { getGeminiResponse } from '@/lib/gemini';
import { logUsage } from '@/lib/supabase';
import confetti from 'canvas-confetti';

type Mode = 'Interview' | 'Sales' | 'IELTS' | null;

interface SimulatorProps {
  mode: Mode;
  onBack: () => void;
}

export default function Simulator({ mode, onBack }: SimulatorProps) {
  const [step, setStep] = useState<'setup' | 'active' | 'finished'>('setup');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
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

    // Determine category based on mode
    let category = '';
    if (mode === 'Interview') {
      category = `${options.jobTitle} - ${options.industry}`;
    } else if (mode === 'Sales') {
      category = options.productName;
    } else {
      category = options.ieltsPart;
    }

    // Log usage to Supabase
    await logUsage({
      menu_type: mode || '',
      category: category,
      difficulty: options.difficulty,
      language: options.language,
    });

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
      setStatus('idle'); // Immediately update status when stopping
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
            colors: ['#0a1628', '#1e3a5f', '#F8F9FA']
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

  const handleBack = () => {
    // Only show confirmation if session is active
    if (step === 'active') {
      setShowExitConfirm(true);
    } else {
      cancelSpeech();
      onBack();
    }
  };

  const confirmExit = () => {
    cancelSpeech();
    setShowExitConfirm(false);
    onBack();
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
      <header className="bg-[#0a1628] text-white p-4 flex items-center justify-between shadow-lg">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 hover:text-[#1e3a5f] transition-colors"
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
            >
              <h2 className="text-2xl font-bold mb-6 text-[#0a1628]">Session Configuration</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {mode === 'Interview' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Job Title</label>
                      <select
                        value={options.jobTitle}
                        onChange={(e) => setOptions({...options, jobTitle: e.target.value})}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0a1628] focus:border-transparent outline-none transition-all"
                      >
                        <option>Marketing Manager</option>
                        <option>Product Manager</option>
                        <option>Software Engineer</option>
                        <option>Data Analyst</option>
                        <option>Sales Manager</option>
                        <option>Business Analyst</option>
                        <option>HR Manager</option>
                        <option>Finance Manager</option>
                        <option>Consultant</option>
                        <option>Project Manager</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Industry</label>
                      <select
                        value={options.industry}
                        onChange={(e) => setOptions({...options, industry: e.target.value})}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0a1628] focus:border-transparent outline-none transition-all"
                      >
                        <option>Technology</option>
                        <option>Finance</option>
                        <option>Healthcare</option>
                        <option>Retail</option>
                        <option>Manufacturing</option>
                        <option>Consulting</option>
                        <option>Education</option>
                        <option>Telecommunications</option>
                        <option>Banking</option>
                        <option>E-commerce</option>
                      </select>
                    </div>
                  </>
                )}

                {mode === 'Sales' && (
                  <div className="space-y-2 col-span-full">
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Product/Service Name</label>
                    <select
                      value={options.productName}
                      onChange={(e) => setOptions({...options, productName: e.target.value})}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0a1628] focus:border-transparent outline-none transition-all"
                    >
                      <option>SaaS Cloud Solution</option>
                      <option>Enterprise Software</option>
                      <option>Mobile Application</option>
                      <option>Digital Marketing Service</option>
                      <option>CRM Platform</option>
                      <option>Payment Gateway</option>
                      <option>Analytics Dashboard</option>
                      <option>IT Consulting</option>
                      <option>Cybersecurity Solution</option>
                      <option>E-commerce Platform</option>
                    </select>
                  </div>
                )}

                {mode === 'IELTS' && (
                  <div className="space-y-2 col-span-full">
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">IELTS Part</label>
                    <select 
                      value={options.ieltsPart}
                      onChange={(e) => setOptions({...options, ieltsPart: e.target.value})}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0a1628] focus:border-transparent outline-none transition-all"
                    >
                      <option>Part 1</option>
                      <option>Part 2</option>
                      <option>Part 3</option>
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    {mode === 'IELTS' ? 'Proficiency Level' : 'Difficulty'}
                  </label>
                  <select
                    value={options.difficulty}
                    onChange={(e) => setOptions({...options, difficulty: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0a1628] focus:border-transparent outline-none transition-all"
                  >
                    {mode === 'IELTS' ? (
                      <>
                        <option>A1 (Beginner)</option>
                        <option>A2 (Elementary)</option>
                        <option>B1 (Intermediate)</option>
                        <option>B2 (Upper Intermediate)</option>
                        <option>C1 (Advanced)</option>
                        <option>C2 (Proficiency)</option>
                      </>
                    ) : (
                      <>
                        <option>Normal</option>
                        <option>Hard</option>
                        <option>Expert</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Language</label>
                  <select
                    value={options.language}
                    onChange={(e) => setOptions({...options, language: e.target.value})}
                    disabled={mode === 'IELTS'}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0a1628] focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="English">English</option>
                    {mode !== 'IELTS' && <option value="Indonesian">Indonesian</option>}
                  </select>
                  {mode === 'IELTS' && (
                    <p className="text-xs text-gray-400 italic">IELTS is only available in English</p>
                  )}
                </div>
              </div>

              <button 
                onClick={startSession}
                className="w-full bg-[#0a1628] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#07101e] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col items-center justify-between py-8"
            >
              {/* AI Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-[#0a1628] border-4 border-[#1e3a5f] flex items-center justify-center overflow-hidden shadow-2xl">
                  <User size={64} className="text-[#1e3a5f]" />
                </div>
                {status === 'speaking' && (
                  <div className="absolute -bottom-2 -right-2 bg-[#1e3a5f] p-2 rounded-full shadow-lg">
                    <TrendingUp size={20} className="text-[#0a1628]" />
                  </div>
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
                      ease: [0.4, 0, 0.2, 1],
                      delay: i * 0.02
                    }}
                    className="w-2 bg-[#1e3a5f] rounded-full"
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
                <div className="text-sm font-bold text-[#0a1628] bg-[#1e3a5f] px-4 py-1 rounded-full">
                  TURN {turnCount} / 5
                </div>
                
                <button
                  onClick={handlePushToTalk}
                  disabled={status === 'processing' || status === 'speaking'}
                  className={`
                    w-24 h-24 rounded-full flex items-center justify-center shadow-2xl
                    ${status === 'listening'
                      ? 'bg-red-500'
                      : 'bg-[#0a1628] hover:bg-[#07101e]'}
                    ${(status === 'processing' || status === 'speaking') ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 transition-transform'}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl p-10 border-4 border-[#1e3a5f] text-center"
            >
              <div className="w-20 h-20 bg-[#0a1628] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-[#1e3a5f]" />
              </div>
              
              <h2 className="text-3xl font-bold text-[#0a1628] mb-4">Session Complete</h2>
              
              <div className="bg-[#F8F9FA] p-6 rounded-2xl mb-8 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Coach Evaluation</h3>
                <p className="text-xl font-medium text-[#0a1628] italic">
                  &quot;{summary}&quot;
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={resetSession}
                  className="flex-1 bg-[#0a1628] text-white py-4 rounded-xl font-bold hover:bg-[#07101e] transition-all"
                >
                  TRY AGAIN
                </button>
                <button 
                  onClick={onBack}
                  className="flex-1 border-2 border-[#0a1628] text-[#0a1628] py-4 rounded-xl font-bold hover:bg-gray-50 transition-all"
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

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={cancelExit}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle size={24} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-[#0a1628]">Exit Session?</h3>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                Are you sure you want to stop this session? Your progress will be lost.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelExit}
                  className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Keep Going
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-all"
                >
                  Yes, Exit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
