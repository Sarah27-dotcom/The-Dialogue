'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Briefcase, 
  TrendingUp, 
  GraduationCap,
  MessageSquare
} from 'lucide-react';
import Simulator from '@/components/Simulator';

export default function Page() {
  const [selectedMode, setSelectedMode] = useState<'Interview' | 'Sales' | 'IELTS' | null>(null);

  if (selectedMode) {
    return <Simulator mode={selectedMode} onBack={() => setSelectedMode(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-[#003366] p-2 rounded-lg">
            <div className="text-white font-bold text-[10px] leading-tight text-center">
              PRASMUL<br/>LEVERATE
            </div>
          </div>
          <div className="h-8 w-[1px] bg-gray-200" />
          <h1 className="text-xl font-black tracking-tighter text-[#003366]">THE DIALOGUE</h1>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-bold text-[#003366] uppercase tracking-widest">
          <span>About</span>
          <span>Resources</span>
          <button className="bg-[#003366] text-white px-4 py-2 rounded-full hover:bg-[#002244] transition-all">
            Login
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-[#003366] mb-6 tracking-tight"
          >
            Master the Art of <br/>
            <span className="text-[#FFCC00] bg-[#003366] px-4 rounded-xl">Conversation.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-500 font-medium max-w-2xl mx-auto"
          >
            The ultimate AI-powered speaking coach for Prasetiya Mulya students and Leverate professionals.
          </motion.p>
        </section>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ModeCard 
            title="Interview Practice"
            description="Simulate high-stakes job interviews with critical HR directors."
            icon={<Briefcase size={32} />}
            onClick={() => setSelectedMode('Interview')}
            delay={0.2}
          />
          <ModeCard 
            title="Sales Trainer"
            description="Practice handling objections and closing deals with skeptical clients."
            icon={<TrendingUp size={32} />}
            onClick={() => setSelectedMode('Sales')}
            delay={0.3}
          />
          <ModeCard 
            title="IELTS Prep"
            description="Sharpen your speaking skills for all parts of the IELTS exam."
            icon={<GraduationCap size={32} />}
            onClick={() => setSelectedMode('IELTS')}
            delay={0.4}
          />
        </div>

        {/* Stats/Info Section */}
        <section className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-[#003366]">Why THE DIALOGUE?</h3>
            <p className="text-gray-600 leading-relaxed">
              Developed in collaboration with industry experts, our AI simulator provides real-time feedback, 
              challenging scenarios, and professional coaching to help you excel in any speaking environment.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 font-bold text-[#003366]">
                <div className="bg-[#FFCC00] p-1 rounded-full text-[#003366]"><MessageSquare size={16} /></div>
                Real-time AI Feedback
              </li>
              <li className="flex items-center gap-3 font-bold text-[#003366]">
                <div className="bg-[#FFCC00] p-1 rounded-full text-[#003366]"><MessageSquare size={16} /></div>
                Industry-Specific Scenarios
              </li>
              <li className="flex items-center gap-3 font-bold text-[#003366]">
                <div className="bg-[#FFCC00] p-1 rounded-full text-[#003366]"><MessageSquare size={16} /></div>
                5-Turn High-Intensity Drills
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-video bg-[#003366] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center p-12">
              <div className="text-center space-y-4">
                <div className="text-[#FFCC00] text-6xl font-black">98%</div>
                <div className="text-white font-bold uppercase tracking-widest">User Confidence Boost</div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#FFCC00] rounded-2xl -z-10" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#003366] text-white py-12 px-6 mt-24">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h4 className="text-2xl font-black mb-2 tracking-tighter">THE DIALOGUE</h4>
            <p className="text-gray-400 text-sm">Prasetiya Mulya x Leverate Collaboration</p>
          </div>
          <div className="flex gap-8 text-sm font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-[#FFCC00] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#FFCC00] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#FFCC00] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ModeCard({ title, description, icon, onClick, delay }: { 
  title: string, 
  description: string, 
  icon: React.ReactNode, 
  onClick: () => void,
  delay: number
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -10 }}
      onClick={onClick}
      className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 cursor-pointer hover:shadow-2xl transition-all group"
    >
      <div className="w-16 h-16 bg-[#F8F9FA] rounded-2xl flex items-center justify-center text-[#003366] mb-6 group-hover:bg-[#003366] group-hover:text-[#FFCC00] transition-all">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-[#003366] mb-3">{title}</h3>
      <p className="text-gray-500 mb-6 font-medium leading-relaxed">
        {description}
      </p>
      <div className="flex items-center gap-2 font-bold text-[#003366] uppercase tracking-widest text-sm">
        Start Training
        <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity }}>→</motion.span>
      </div>
    </motion.div>
  );
}
