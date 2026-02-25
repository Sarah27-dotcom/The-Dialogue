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
  X,
  FileText,
  Home,
  Sparkles
} from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { getGeminiResponse } from '@/lib/gemini';
import { logUsage } from '@/lib/supabase';

type Mode = 'Interview' | 'Consultant' | 'IELTS' | null;

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
    consultingArea: 'Business Strategy',
    problemDescription: '',
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
    } else if (mode === 'Consultant') {
      category = options.consultingArea;
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
      initialPrompt = `Start session: [Mode: Interview], [Job: ${options.jobTitle}], [Industry: ${options.industry}], [Language: ${options.language}]`;
    } else if (mode === 'Consultant') {
      initialPrompt = `Start session: [Mode: AI Consultant], [Area: ${options.consultingArea}], [Language: ${options.language}]`;
    } else {
      initialPrompt = `Start session: [Mode: IELTS], [Part: ${options.ieltsPart}], [Language: ${options.language}]`;
    }

    try {
      const response = await getGeminiResponse(initialPrompt, []);
      setAiResponse(response || '');
      setHistory([{ role: 'user', parts: [{ text: initialPrompt }] }, { role: 'model', parts: [{ text: response }] }]);
      setStatus('speaking');
      speak(response || '', options.language, () => setStatus('idle'));
    } catch (error) {
      console.error(error);
      setStatus('idle');
    }
  };

  const handlePushToTalk = () => {
    if (status === 'idle') {
      transcriptProcessed.current = false;
      setStatus('listening');
      startListening(options.language);
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
      speak(response || '', options.language, () => {
        if (response?.includes('[FINISH]')) {
          // Use regex to handle any whitespace around [FINISH] and ensure clean extraction
          const finishMatch = response.match(/\[FINISH\]\s*(.+)$/s);
          const summaryPart = finishMatch ? finishMatch[1].trim() : null;
          setSummary(summaryPart || 'Session completed.');
          setStep('finished');
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
  }, [history, turnCount, speak, options.language]);

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
      <header className="bg-gradient-to-r from-[#1A1A1A] via-[#0078D7] to-[#00A86B] px-6 py-4 flex items-center justify-between shadow-xl relative overflow-hidden">
        {/* Animated gradient line */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <button
          onClick={handleBack}
          className="flex items-center gap-2 hover:text-white/80 transition-colors text-white z-10"
        >
          <ChevronLeft size={20} />
          <span className="font-medium">Back</span>
        </button>
        <h1 className="text-xl font-bold tracking-tight text-white">
          {mode === 'Consultant' ? 'AI Consultant' : `${mode?.toUpperCase()} SIMULATOR`}
        </h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col relative">
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 -z-10 pointer-events-none"
        >
          <motion.div
            className="absolute top-0 left-1/4 w-96 h-96 bg-[#0078D7]/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00A86B]/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -30, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 relative overflow-hidden"
            >
              {/* Corner accent decorations */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-[#0078D7]/20 rounded-tl-3xl" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-[#00A86B]/20 rounded-br-3xl" />

              <h2 className="text-2xl font-bold mb-2 text-[#1A1A1A]">Session Configuration</h2>
              <motion.p
                className="text-sm text-[#1A1A1A]/60 mb-6"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Customize your consultation experience
              </motion.p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {mode === 'Interview' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#1A1A1A]/70 uppercase tracking-wide">Job Title</label>
                      <select
                        value={options.jobTitle}
                        onChange={(e) => setOptions({ ...options, jobTitle: e.target.value })}
                        className="w-full p-3 rounded-xl border border-[#E0E0E0] focus:ring-2 focus:ring-[#0078D7] focus:border-transparent outline-none transition-all bg-white hover:border-[#0078D7]"
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
                      <label className="text-sm font-semibold text-[#1A1A1A]/70 uppercase tracking-wide">Industry</label>
                      <select
                        value={options.industry}
                        onChange={(e) => setOptions({ ...options, industry: e.target.value })}
                        className="w-full p-3 rounded-xl border border-[#E0E0E0] focus:ring-2 focus:ring-[#0078D7] focus:border-transparent outline-none transition-all bg-white hover:border-[#0078D7]"
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

                {mode === 'Consultant' && (
                  <>
                    <div className="space-y-2 col-span-full">
                      <label className="text-sm font-bold text-[#1A1A1A]/80 uppercase tracking-wide flex items-center gap-2">
                        <Briefcase size={16} className="text-[#0078D7]" />
                        Consulting Area
                      </label>
                      <select
                        value={options.consultingArea}
                        onChange={(e) => setOptions({ ...options, consultingArea: e.target.value })}
                        className="w-full p-4 rounded-2xl border-2 border-[#E0E0E0] bg-white/80 backdrop-blur focus:ring-2 focus:ring-[#0078D7]/50 focus:border-[#0078D7] outline-none transition-all hover:border-[#0078D7]/50 shadow-sm hover:shadow-md"
                      >
                        <option>Business Strategy</option>
                        <option>Marketing & Growth</option>
                        <option>Operations & Efficiency</option>
                        <option>Product Development</option>
                        <option>Team Management</option>
                        <option>Financial Planning</option>
                        <option>Digital Transformation</option>
                        <option>Customer Experience</option>
                        <option>Organizational Change</option>
                        <option>Risk Management</option>
                      </select>
                    </div>
                    <div className="space-y-2 col-span-full">
                      <label className="text-sm font-bold text-[#1A1A1A]/80 uppercase tracking-wide flex items-center gap-2">
                        <FileText size={16} className="text-[#00A86B]" />
                        Problem Description <span className="text-[#1A1A1A]/40 normal-case">(Optional)</span>
                      </label>
                      <textarea
                        value={options.problemDescription}
                        onChange={(e) => setOptions({ ...options, problemDescription: e.target.value })}
                        placeholder="Briefly describe your business problem..."
                        rows={3}
                        className="w-full p-4 rounded-2xl border-2 border-[#E0E0E0] bg-white/80 backdrop-blur focus:ring-2 focus:ring-[#00A86B]/50 focus:border-[#00A86B] outline-none transition-all hover:border-[#00A86B]/50 resize-none shadow-sm hover:shadow-md"
                      />
                    </div>
                  </>
                )}

                {mode === 'IELTS' && (
                  <div className="space-y-2 col-span-full">
                    <label className="text-sm font-semibold text-[#1A1A1A]/70 uppercase tracking-wide">IELTS Part</label>
                    <select
                      value={options.ieltsPart}
                      onChange={(e) => setOptions({ ...options, ieltsPart: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#E0E0E0] focus:ring-2 focus:ring-[#0078D7] focus:border-transparent outline-none transition-all bg-white hover:border-[#0078D7]"
                    >
                      <option>Part 1</option>
                      <option>Part 2</option>
                      <option>Part 3</option>
                    </select>
                  </div>
                )}

                {mode === 'IELTS' && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Proficiency Level</label>
                    <select
                      value={options.difficulty}
                      onChange={(e) => setOptions({ ...options, difficulty: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#E0E0E0] focus:ring-2 focus:ring-[#0078D7] focus:border-transparent outline-none transition-all bg-white hover:border-[#0078D7]"
                    >
                      <option>A1 (Beginner)</option>
                      <option>A2 (Elementary)</option>
                      <option>B1 (Intermediate)</option>
                      <option>B2 (Upper Intermediate)</option>
                      <option>C1 (Advanced)</option>
                      <option>C2 (Proficiency)</option>
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Language</label>
                  <select
                    value={options.language}
                    onChange={(e) => setOptions({ ...options, language: e.target.value })}
                    disabled={mode === 'IELTS'}
                    className="w-full p-3 rounded-xl border border-[#E0E0E0] focus:ring-2 focus:ring-[#0078D7] focus:border-transparent outline-none transition-all bg-white hover:border-[#0078D7] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="English">English</option>
                    {mode !== 'IELTS' && <option value="Indonesian">Indonesian</option>}
                  </select>
                  {mode === 'IELTS' && (
                    <p className="text-xs text-gray-400 italic">IELTS is only available in English</p>
                  )}
                </div>
              </div>

              <motion.button
                onClick={startSession}
                className="w-full bg-gradient-to-r from-[#0078D7] to-[#00A86B] text-white py-4 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="relative z-10">START SESSION</span>
                <Sparkles size={20} className="relative z-10" />
              </motion.button>
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
                <motion.div
                  className="w-36 h-36 rounded-full bg-gradient-to-br from-[#0078D7] to-[#00A86B] border-4 border-white/50 flex items-center justify-center overflow-hidden shadow-2xl relative"
                  animate={{
                    boxShadow: [
                      "0 0 30px rgba(0, 120, 215, 0.3)",
                      "0 0 50px rgba(0, 168, 107, 0.4)",
                      "0 0 30px rgba(0, 120, 215, 0.3)",
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {/* Pulsing rings */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0078D7] to-[#00A86B]"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <User size={72} className="text-white relative z-10" />
                </motion.div>
                {status === 'speaking' && (
                  <motion.div
                    className="absolute -bottom-2 -right-2 bg-[#00A86B] p-3 rounded-full shadow-xl border-2 border-white"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <TrendingUp size={20} className="text-white" />
                  </motion.div>
                )}
              </div>

              {/* Waveform Animation */}
              <div className="w-full h-32 flex items-center justify-center gap-1.5 px-8">
                {waveformValues.map((val, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: status === 'speaking' || status === 'listening'
                        ? [20, val.height, 20]
                        : 10,
                      opacity: status === 'idle' ? 0.4 : 1
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: val.duration,
                      ease: [0.4, 0, 0.2, 1],
                      delay: i * 0.02
                    }}
                    className="w-2.5 bg-gradient-to-t from-[#0078D7] via-[#00A86B] to-[#0080FF] rounded-full shadow-lg shadow-[#0078D7]/30"
                  />
                ))}
              </div>

              {/* AI Response Display */}
              <div className="w-full max-w-2xl bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50 min-h-[140px] flex items-center justify-center text-center relative">
                {/* Decorative glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-[#0078D7]/5 to-[#00A86B]/5 rounded-3xl -z-10"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                {status === 'processing' ? (
                  <motion.div
                    className="flex items-center gap-3 text-[#0078D7] font-semibold"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <RefreshCw className="animate-spin" size={24} />
                    Consultant is analyzing...
                  </motion.div>
                ) : (
                  <p className="text-lg font-medium leading-relaxed text-[#1A1A1A]/90">
                    {aiResponse.replace(/\[WAVE:ON\]|\[FINISH\].*$/g, '').trim() || "Ready to begin your consultation."}
                  </p>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col items-center gap-4 w-full">
                <motion.div
                  className="text-sm font-bold text-white bg-gradient-to-r from-[#0078D7] to-[#00A86B] px-6 py-2 rounded-full shadow-lg"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(0, 120, 215, 0.3)",
                      "0 0 30px rgba(0, 168, 107, 0.4)",
                      "0 0 20px rgba(0, 120, 215, 0.3)",
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {mode === 'Consultant' ? (
                    turnCount === 0 ? (
                      'Connecting...'
                    ) : turnCount < 5 ? (
                      `Information Gathering • Turn ${turnCount}/5`
                    ) : (
                      'Solution Delivery'
                    )
                  ) : (
                    `TURN ${turnCount} / 5`
                  )}
                </motion.div>

                <motion.button
                  onClick={handlePushToTalk}
                  disabled={status === 'processing' || status === 'speaking'}
                  whileHover={{ scale: status === 'listening' ? 1 : 1.05 }}
                  whileTap={{ scale: status === 'listening' ? 1 : 0.95 }}
                  className={`
                    relative w-28 h-28 rounded-full flex items-center justify-center
                    ${status === 'listening'
                      ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-xl shadow-red-500/30'
                      : 'bg-gradient-to-br from-[#0078D7] to-[#00A86B] shadow-xl shadow-[#0078D7]/30'}
                    ${(status === 'processing' || status === 'speaking') ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {/* Pulsing ring */}
                  {status !== 'listening' && (status !== 'processing' && status !== 'speaking') && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0078D7] to-[#00A86B]"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  {status === 'listening' ? (
                    <Square size={36} className="text-white" />
                  ) : (
                    <Mic size={36} className="text-white" />
                  )}
                </motion.button>

                <p className="text-sm font-semibold text-[#1A1A1A]/60 uppercase tracking-wide">
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
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/50 text-center relative overflow-y-auto max-h-[calc(100vh-200px)]"
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-[#0078D7]/5 to-[#00A86B]/5 pointer-events-none"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-[#0078D7]/30 rounded-tl-3xl" />
              <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-[#00A86B]/30 rounded-br-3xl" />

              <motion.div
                className="w-24 h-24 bg-gradient-to-br from-[#0078D7] to-[#00A86B] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <CheckCircle2 size={48} className="text-white" />
                </motion.div>
              </motion.div>

              <motion.h2
                className="text-3xl font-bold text-[#1A1A1A] mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Consultation Complete
              </motion.h2>

              <motion.div
                className="bg-gradient-to-br from-[#F8F9FA] to-[#E0F2FE] p-8 rounded-2xl mb-6 border border-[#0078D7]/20 shadow-inner"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {/* AI Solution Section */}
                <h3 className="text-sm font-bold text-[#0078D7] uppercase tracking-wide mb-5 flex items-center justify-center gap-2">
                  <FileText size={16} />
                  AI Solution
                </h3>
                <div className="text-left space-y-4 text-[#1A1A1A] leading-relaxed">
                  {(() => {
                    // Enhanced parsing for AI summary with better readability
                    const text = summary.trim();

                    // Check if text contains numbered list pattern (1., 2., etc.)
                    const numberedItemsPattern = /(?:^|\n)\s*(\d+)[\.\)]\s+/g;
                    const hasNumberedList = numberedItemsPattern.test(text);

                    if (hasNumberedList) {
                      // Split by numbered list pattern and extract items
                      const items = text.split(/(?:^|\n)\s*\d+[\.\)]\s+/).filter(item => item.trim());

                      // Get all the numbers
                      const numbers = [];
                      let match;
                      const regex = /(?:^|\n)\s*(\d+)[\.\)]\s+/g;
                      while ((match = regex.exec(text)) !== null) {
                        numbers.push(match[1]);
                      }

                      return items.map((item, idx) => {
                        const cleanItem = item.trim();
                        // Check if it's a header (ends with colon or is short uppercase)
                        if (cleanItem.endsWith(':') || (cleanItem.length < 50 && cleanItem === cleanItem.toUpperCase())) {
                          return (
                            <h4 key={idx} className="font-bold text-[#0078D7] text-base mt-6 first:mt-0">
                              {cleanItem}
                            </h4>
                          );
                        }
                        // Regular numbered item - each on new line with better spacing
                        return (
                          <div key={idx} className="flex items-start gap-4 py-2">
                            <span className="text-[#0078D7] font-bold text-xl min-w-[32px] flex-shrink-0">
                              {numbers[idx] || idx + 1}
                            </span>
                            <span className="flex-1 text-base pt-0.5">{cleanItem}</span>
                          </div>
                        );
                      });
                    }

                    // Fallback: split by newlines for non-numbered text
                    const lines = text.split('\n').filter(line => line.trim());
                    return lines.map((line, idx) => {
                      const trimmedLine = line.trim();

                      // Handle bullet points
                      if (trimmedLine.match(/^[\-\*•]\s+/)) {
                        return (
                          <div key={idx} className="flex items-start gap-3 py-2">
                            <span className="text-[#0078D7] font-bold text-xl">•</span>
                            <span className="flex-1 text-base pt-0.5">{trimmedLine.replace(/^[\-\*•]\s+/, '')}</span>
                          </div>
                        );
                      }

                      // Handle headers
                      if (trimmedLine.endsWith(':') || (trimmedLine.length < 50 && trimmedLine === trimmedLine.toUpperCase())) {
                        return (
                          <h4 key={idx} className="font-bold text-[#0078D7] text-base mt-6 first:mt-0">
                            {trimmedLine}
                          </h4>
                        );
                      }

                      // Regular paragraph - each on new line
                      return (
                        <p key={idx} className="text-base py-2">
                          {trimmedLine}
                        </p>
                      );
                    });
                  })()}
                </div>
              </motion.div>

              {/* Upcoming Programs Message */}
              <motion.div
                className="bg-gradient-to-r from-[#0078D7]/10 to-[#00A86B]/10 p-4 rounded-xl mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.48 }}
              >
                <p className="text-sm text-[#1A1A1A]/80">
                  Want to learn more? Join our upcoming programs at{' '}
                  <a
                    href="https://prasmul-eli.co/id/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0078D7] font-semibold hover:underline"
                  >
                    prasmul-eli.co.id
                  </a>
                </p>
              </motion.div>

              <motion.div
                className="flex gap-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={resetSession}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-[#0078D7] to-[#00A86B] text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  Try Again
                </motion.button>
                <motion.button
                  onClick={onBack}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 border-2 border-[#0078D7] text-[#0078D7] py-4 rounded-2xl font-bold hover:bg-gradient-to-r hover:from-[#0078D7] hover:to-[#00A86B] hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Home size={20} />
                  Back to Home
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="p-4 text-center text-xs font-semibold text-[#1A1A1A]/50 uppercase tracking-wide">
        Work Reimagined in The Age of AI
      </footer>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-[#1A1A1A]/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={cancelExit}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-[#E0E0E0]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle size={24} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A]">Exit Session?</h3>
              </div>

              <p className="text-[#1A1A1A]/70 mb-6 leading-relaxed">
                Are you sure you want to stop this session? Your progress will be lost.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelExit}
                  className="flex-1 border-2 border-[#E0E0E0] text-[#1A1A1A]/70 py-3 rounded-xl font-bold hover:bg-[#F8F9FA] transition-all"
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
