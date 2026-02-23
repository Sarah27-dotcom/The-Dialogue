'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  TrendingUp,
  GraduationCap,
  MessageSquare
} from 'lucide-react';
import Simulator from '@/components/Simulator';

// Smooth animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

export default function Page() {
  const [selectedMode, setSelectedMode] = useState<'Interview' | 'Sales' | 'IELTS' | null>(null);

  if (selectedMode) {
    return <Simulator mode={selectedMode} onBack={() => setSelectedMode(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <motion.img
            src="https://www.prasetiyamulya.ac.id/wp-content/uploads/2020/02/logo-universitas-prasetiya-mulya-300x300.png"
            alt="Prasetiya Mulya"
            className="h-10 w-10 object-contain"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          />
          <span className="text-[#0a1628] text-xl font-black">×</span>
          <motion.img
            src="https://backend.chatbase.co/storage/v1/object/public/chat-icons/01f5b9f3-3cc3-48bd-87ef-bfcba3e60798/kVXuNq1mKc13vD5qYHMb4.jpg"
            alt="Leverate Group"
            className="h-10 w-10 object-contain rounded-full"
            whileHover={{ scale: 1.05, rotate: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          />
          <div className="h-6 w-[1px] bg-gray-200 mx-1" />
          <h1 className="text-lg md:text-xl font-black tracking-tighter text-[#0a1628]">THE DIALOGUE</h1>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-bold text-[#0a1628] uppercase tracking-widest">
          <motion.a
            href="#about"
            className="hover:text-[#1e3a5f] transition-colors cursor-pointer relative"
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            About
            <motion.span
              className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1e3a5f]"
              whileHover={{ width: "100%" }}
              transition={{ duration: 0.3 }}
            />
          </motion.a>
          <motion.a
            href="#resources"
            className="hover:text-[#1e3a5f] transition-colors cursor-pointer relative"
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Resources
            <motion.span
              className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1e3a5f]"
              whileHover={{ width: "100%" }}
              transition={{ duration: 0.3 }}
            />
          </motion.a>
          <motion.button
            className="bg-[#0a1628] text-white px-4 py-2 rounded-full hover:bg-[#07101e] transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Login
          </motion.button>
        </div>
      </motion.header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {/* Hero Section */}
        <motion.section
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="text-center mb-20"
        >
          <motion.div variants={fadeInUp} className="flex flex-col items-center w-full">
            <motion.h2
              variants={fadeInUp}
              className="text-xs md:text-sm font-bold text-[#0a1628] uppercase tracking-[0.35em] mb-10"
            >
              A Collaboration
            </motion.h2>

            <div className="flex items-center justify-center gap-4 md:gap-8 w-full max-w-3xl mx-auto">
              <motion.div
                variants={fadeInUp}
                className="flex-shrink-0 flex items-center justify-center w-32 md:w-48"
              >
                <img
                  src="https://www.prasetiyamulya.ac.id/wp-content/uploads/2020/01/Logo-Universitas-Prasetiya-Mulya.png"
                  alt="Prasetiya Mulya"
                  className="h-20 md:h-28 object-contain drop-shadow-xl"
                />
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="flex-shrink-0 relative"
                whileHover={{ scale: 1.1, rotate: 90 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#1e3a5f] via-[#2d4a6c] to-[#0a1628] flex items-center justify-center shadow-xl ring-4 ring-white">
                  <span className="text-white text-2xl md:text-3xl font-black">×</span>
                </div>
                <div className="absolute inset-0 rounded-full bg-[#1e3a5f] opacity-20 blur-xl" />
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="flex-shrink-0 flex items-center justify-center w-32 md:w-48"
              >
                <img
                  src="https://framerusercontent.com/images/mBV1A2ME2EGmwwEgreOk4Thkr0.webp"
                  alt="Leverate Group"
                  className="h-16 md:h-24 object-contain drop-shadow-xl"
                />
              </motion.div>
            </div>

            <motion.div
              variants={fadeInUp}
              className="w-24 md:w-32 h-0.5 bg-gradient-to-r from-transparent via-[#0a1628] to-transparent mt-8 mb-6"
            />

            <motion.p
              variants={fadeInUp}
              className="text-base md:text-lg font-semibold text-[#0a1628]"
            >
              Empowering Tomorrow's Leaders
            </motion.p>
          </motion.div>
        </motion.section>

        {/* Navigation Cards */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <ModeCard
            title="Interview Practice"
            description="Simulate high-stakes job interviews with critical HR directors."
            icon={<Briefcase size={32} />}
            onClick={() => setSelectedMode('Interview')}
          />
          <ModeCard
            title="Sales Trainer"
            description="Practice handling objections and closing deals with skeptical clients."
            icon={<TrendingUp size={32} />}
            onClick={() => setSelectedMode('Sales')}
          />
          <ModeCard
            title="IELTS Prep"
            description="Sharpen your speaking skills for all parts of the IELTS exam."
            icon={<GraduationCap size={32} />}
            onClick={() => setSelectedMode('IELTS')}
          />
        </motion.div>

        {/* Stats/Info Section */}
        <section className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-[#0a1628]">Why THE DIALOGUE?</h3>
            <p className="text-gray-600 leading-relaxed">
              Developed in collaboration with industry experts, our AI simulator provides real-time feedback,
              challenging scenarios, and professional coaching to help you excel in any speaking environment.
            </p>
            <ul className="space-y-4">
              {['Real-time AI Feedback', 'Industry-Specific Scenarios', '5-Turn High-Intensity Drills'].map((item) => (
                <li key={item} className="flex items-center gap-3 font-bold text-[#0a1628]">
                  <div className="bg-[#1e3a5f] p-1 rounded-full text-[#0a1628]">
                    <MessageSquare size={16} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-video bg-[#0a1628] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center p-12">
              <div className="text-center space-y-4">
                <div className="text-[#1e3a5f] text-6xl font-black">98%</div>
                <div className="text-white font-bold uppercase tracking-widest">User Confidence Boost</div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-[#1e3a5f] to-[#0a1628] rounded-2xl -z-10 opacity-50" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0a1628] text-white py-12 px-6 mt-24">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h4 className="text-2xl font-black mb-2 tracking-tighter">THE DIALOGUE</h4>
            <p className="text-gray-400 text-sm">Prasetiya Mulya x Leverate Collaboration</p>
          </div>
          <div className="flex gap-8 text-sm font-bold uppercase tracking-widest">
            {['Privacy', 'Terms', 'Contact'].map((link) => (
              <motion.a
                key={link}
                href="#"
                className="hover:text-[#1e3a5f] transition-colors relative"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {link}
              </motion.a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function ModeCard({ title, description, icon, onClick }: {
  title: string,
  description: string,
  icon: React.ReactNode,
  onClick: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 cursor-pointer hover:shadow-2xl transition-all group"
    >
      <div className="w-16 h-16 bg-[#F8F9FA] rounded-2xl flex items-center justify-center text-[#0a1628] mb-6 group-hover:bg-[#0a1628] group-hover:text-[#1e3a5f] transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-[#0a1628] mb-3">{title}</h3>
      <p className="text-gray-500 mb-6 font-medium leading-relaxed">
        {description}
      </p>
      <div className="flex items-center gap-2 font-bold text-[#0a1628] uppercase tracking-widest text-sm">
        Start Training
        <motion.span
          animate={{ x: [0, 8, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        >
          →
        </motion.span>
      </div>
    </motion.div>
  );
}
