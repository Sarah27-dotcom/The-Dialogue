'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  TrendingUp,
  GraduationCap,
  MessageSquare,
  Sparkles,
  Zap,
  Target
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

// Floating animation for background elements
const floatingShape = {
  animate: {
    y: [0, -20, 0],
    rotate: [0, 5, 0]
  },
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: "easeInOut" as const
  }
};

export default function Page() {
  const [selectedMode, setSelectedMode] = useState<'Interview' | 'Consultant' | 'IELTS' | null>(null);

  if (selectedMode) {
    return <Simulator mode={selectedMode} onBack={() => setSelectedMode(null)} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#F8F9FA] via-[#E0F2FE] to-[#F0FDF4]" />
        <motion.div
          className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-[#0078D7]/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-[#00A86B]/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px] bg-[#0080FF]/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </motion.div>
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-white/80 backdrop-blur-xl border-b border-white/20 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg"
      >
        {/* Animated gradient line */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#0078D7] via-[#00A86B] to-[#0080FF]"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <div className="flex items-center gap-2 md:gap-3">
          <motion.img
            src="https://prasmul-eli.co/logo-prasmul-eli.png"
            alt="Prasmul Eli"
            className="h-8 w-8 md:h-10 md:w-10 object-contain"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          />
          <span className="text-[#0078D7] text-lg md:text-xl font-black">×</span>
          <motion.img
            src="https://framerusercontent.com/images/mBV1A2ME2EGmwwEgreOk4Thkr0.webp"
            alt="Leverate Group"
            className="h-8 w-8 md:h-10 md:w-10 object-contain"
            whileHover={{ scale: 1.05, rotate: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          />
          <div className="h-6 w-[1px] bg-[#E0E0E0] mx-0.5 md:mx-1 hidden sm:block" />
          <h1 className="hidden sm:block text-base md:text-lg lg:text-xl font-bold tracking-tight text-[#1A1A1A]">Work Reimagined In The Age of AI</h1>
          <h1 className="sm:hidden text-xs font-bold tracking-tight text-[#1A1A1A]">Work Reimagined</h1>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#1A1A1A]/70 uppercase tracking-wide">
          {/* <motion.a
            href="#about"
            className="hover:text-[#0078D7] transition-colors cursor-pointer relative"
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            About
            <motion.span
              className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0078D7]"
              whileHover={{ width: "100%" }}
              transition={{ duration: 0.3 }}
            />
          </motion.a> */}
          {/* <motion.a
            href="#resources"
            className="hover:text-[#0078D7] transition-colors cursor-pointer relative"
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Resources
            <motion.span
              className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0078D7]"
              whileHover={{ width: "100%" }}
              transition={{ duration: 0.3 }}
            />
          </motion.a> */}
          {/* <motion.button
            className="bg-gradient-to-r from-[#0078D7] to-[#00A86B] text-white px-4 py-2 rounded-full hover:opacity-90 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Login
          </motion.button> */}
        </div>
      </motion.header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 md:py-12">
        {/* Hero Section */}
        <motion.section
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="text-center mb-12 md:mb-20 relative"
        >
          {/* Floating decorative elements */}
          <motion.div
            {...floatingShape}
            className="absolute -top-6 -left-4 sm:-top-10 sm:-left-10 w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-[#0078D7]/20 to-[#00A86B]/20 rounded-2xl -z-10"
          />
          <motion.div
            {...floatingShape}
            className="absolute -top-3 -right-3 sm:-top-5 sm:-right-5 w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-[#00A86B]/20 to-[#0080FF]/20 rounded-full -z-10"
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div variants={fadeInUp} className="flex flex-col items-center w-full">
            <motion.h2
              variants={fadeInUp}
              className="text-[10px] sm:text-xs md:text-sm font-semibold text-[#0078D7] uppercase tracking-[0.2em] md:tracking-[0.3em] mb-6 md:mb-10"
            >
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✦
              </motion.span>
              {" "}Future Ready Workforce{" "}
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                ✦
              </motion.span>
            </motion.h2>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 w-full max-w-3xl mx-auto relative">
              <motion.div
                variants={fadeInUp}
                className="flex-shrink-0 flex items-center justify-center w-24 sm:w-32 md:w-48"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <motion.div
                  className="relative"
                  whileHover={{ rotate: 5 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <img
                    src="https://prasmul-eli.co/logo-prasmul-eli.png"
                    alt="Prasmul Eli"
                    className="h-16 sm:h-20 md:h-28 object-contain drop-shadow-xl relative z-10"
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-[#0078D7]/30 to-[#00A86B]/30 rounded-full blur-xl -z-10"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.div>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="flex-shrink-0 relative"
                whileHover={{ scale: 1.15, rotate: 90 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <motion.div
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#0078D7] via-[#00A86B] to-[#0080FF] flex items-center justify-center shadow-2xl ring-4 ring-white"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(0, 120, 215, 0.3)",
                      "0 0 40px rgba(0, 168, 107, 0.5)",
                      "0 0 20px rgba(0, 120, 215, 0.3)",
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span className="text-white text-xl sm:text-2xl md:text-3xl font-bold">×</span>
                </motion.div>
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0078D7] to-[#00A86B]"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="flex-shrink-0 flex items-center justify-center w-24 sm:w-32 md:w-48"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <motion.div
                  className="relative"
                  whileHover={{ rotate: -5 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <img
                    src="https://framerusercontent.com/images/mBV1A2ME2EGmwwEgreOk4Thkr0.webp"
                    alt="Leverate Group"
                    className="h-12 sm:h-16 md:h-24 object-contain drop-shadow-xl relative z-10"
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A]/20 to-[#E0E0E0]/50 rounded-full blur-xl -z-10"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  />
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              variants={fadeInUp}
              className="w-24 md:w-32 h-0.5 bg-gradient-to-r from-transparent via-[#0078D7] to-transparent mt-8 mb-6 relative"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00A86B] to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>

            <motion.p
              variants={fadeInUp}
              className="text-sm md:text-base lg:text-lg font-medium text-[#1A1A1A]/80"
            >
              <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Tomorrow
              </motion.span>
              <br />
              The conversation starts.
            </motion.p>
          </motion.div>
        </motion.section>

        {/* Navigation Cards */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="flex justify-center relative"
        >
          {/* Background glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-[#0078D7]/10 to-[#00A86B]/10 rounded-3xl blur-3xl -z-10"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <ModeCard
            title="AI Consultant"
            description="Get expert guidance on business strategy, problem-solving, and professional development through interactive AI conversations."
            icon={<TrendingUp size={28} className="sm:w-7 sm:h-7 md:w-8 md:h-8" />}
            onClick={() => setSelectedMode('Consultant')}
          />
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        >
          {[
            { icon: Sparkles, label: "AI-Powered", desc: "Advanced AI technology for realistic simulations" },
            { icon: Zap, label: "Real-Time", desc: "Immediate responses and interactive coaching" },
            { icon: Target, label: "Instant Feedback", desc: "Get actionable insights right after each session" }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 md:p-6 text-center border border-white/50"
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#0078D7]/10 to-[#00A86B]/10 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3"
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              >
                <feature.icon className="text-[#0078D7]" size={20} strokeWidth={2.5} />
              </motion.div>
              <h4 className="font-bold text-sm md:text-base text-[#1A1A1A] mb-1">{feature.label}</h4>
              <p className="text-xs sm:text-sm text-[#1A1A1A]/60">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats/Info Section
        <section className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-[#1A1A1A]">Why THE DIALOGUE?</h3>
            <p className="text-gray-600 leading-relaxed">
              Developed in collaboration with industry experts, our AI simulator provides real-time feedback,
              challenging scenarios, and professional coaching to help you excel in any speaking environment.
            </p>
            <ul className="space-y-4">
              {['Real-time AI Feedback', 'Industry-Specific Scenarios', '5-Turn High-Intensity Drills'].map((item) => (
                <li key={item} className="flex items-center gap-3 font-bold text-[#1A1A1A]">
                  <div className="bg-[#0078D7] p-1 rounded-full text-white">
                    <MessageSquare size={16} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-[#0078D7] to-[#00A86B] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center p-12">
              <div className="text-center space-y-4">
                <div className="text-white text-6xl font-black">98%</div>
                <div className="text-white font-bold uppercase tracking-widest">User Confidence Boost</div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-[#0078D7] to-[#00A86B] rounded-2xl -z-10 opacity-50" />
          </div>
        </section> */}
      </main>

      {/* Footer */}
      {/* <footer className="bg-gradient-to-r from-[#1A1A1A] to-[#0078D7] text-white py-12 px-6 mt-24">
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
                className="hover:text-[#00A86B] transition-colors relative"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {link}
              </motion.a>
            ))}
          </div>
        </div>
      </footer> */}
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
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{
        y: -12,
        scale: 1.02,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative bg-white p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl border border-white/50 cursor-pointer overflow-hidden group"
    >
      {/* Animated gradient overlay on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#0078D7]/5 to-[#00A86B]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 opacity-0 group-hover:opacity-100"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* Corner accent decorations */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#0078D7]/20 rounded-tl-3xl group-hover:border-[#0078D7] transition-colors duration-300" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#00A86B]/20 rounded-br-3xl group-hover:border-[#00A86B] transition-colors duration-300" />

      {/* Icon with enhanced animations */}
      <motion.div
        className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-[#F8F9FA] to-[#E0E0E0] rounded-2xl flex items-center justify-center text-[#1A1A1A] mb-4 md:mb-6 relative z-10 group-hover:bg-gradient-to-br group-hover:from-[#0078D7] group-hover:to-[#00A86B] group-hover:text-white transition-all duration-500"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {icon}
        </motion.div>
        {/* Sparkle effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              style={{
                top: `${20 + i * 30}%`,
                left: `${20 + i * 30}%`,
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        <motion.h3
          className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-2 md:mb-3 group-hover:text-[#0078D7] transition-colors duration-300"
          whileHover={{ x: 5 }}
        >
          {title}
        </motion.h3>
        <motion.p
          className="text-xs sm:text-sm text-[#1A1A1A]/60 mb-4 md:mb-6 font-medium leading-relaxed"
          whileHover={{ x: 5 }}
          transition={{ delay: 0.05 }}
        >
          {description}
        </motion.p>

        {/* CTA with enhanced animation */}
        <motion.div
          className="flex items-center gap-1.5 md:gap-2 font-semibold text-[#0078D7] uppercase tracking-wide text-xs md:text-sm group-hover:text-[#00A86B] transition-colors duration-300"
          whileHover={{ x: 5 }}
          transition={{ delay: 0.1 }}
        >
          <span>Start Training</span>
          <motion.span
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            className="group-hover:text-[#00A86B]"
          >
            →
          </motion.span>
        </motion.div>
      </div>

      {/* Floating particles */}
      <motion.div
        className="absolute top-4 right-4 w-2 h-2 bg-[#0078D7]/30 rounded-full"
        animate={{
          y: [0, -10, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-[#00A86B]/30 rounded-full"
        animate={{
          y: [0, 10, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />
    </motion.div>
  );
}
