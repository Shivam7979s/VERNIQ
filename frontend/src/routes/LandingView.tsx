import React from 'react';
import { Link } from 'react-router-dom';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingCockpitMockup } from '@/components/landing/LandingCockpitMockup';
import {
  Brain,
  RotateCcw,
  Repeat,
  ArrowRight,
  Code2,
  Cpu,
} from 'lucide-react';

export const LandingView: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08090C] text-neutral-100 flex flex-col selection:bg-blue-500/20 selection:text-blue-300">
      {/* Top Navigation */}
      <LandingHeader />

      {/* Main Content */}
      <main className="flex-1">
        {/* HERO SECTION (Split 55% / 45% Layout) */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
          {/* Subtle Ambient Studio Lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-blue-600/10 via-indigo-500/5 to-transparent blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Stage (55% / 7 cols) */}
              <div className="lg:col-span-7 text-left space-y-6">
                {/* Micro-Eyebrow Badge */}
                <div>
                  <span className="text-[11px] font-mono tracking-wider uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span>EMPIRICAL ALGORITHMIC COCKPIT • NO VIBE-CODING</span>
                  </span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] text-white leading-[1.08] font-sans">
                  The High-Performance Engineering Curriculum for SDEs.
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-neutral-400 max-w-xl leading-relaxed font-sans">
                  Master data structures, distributed systems, and algorithmic invariant proofs.
                  Built with empirical diagnostic evaluation, adaptive weekly sprints, and isolated
                  Docker execution.
                </p>

                {/* Interactive CTA Group */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  <Link to="/app/diagnostic">
                    <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all shadow-[0_0_25px_rgba(37,99,235,0.4)]">
                      <span>Take Diagnostic Test</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>

                  <Link to="/ide">
                    <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#12151D] border border-white/[0.08] hover:border-white/20 text-neutral-200 hover:text-white px-6 py-3 rounded-lg text-sm font-medium transition-all">
                      <Code2 className="w-4 h-4 text-neutral-400" />
                      <span>Open Standalone IDE</span>
                    </button>
                  </Link>
                </div>

                {/* Trust & Proof Metrics Bar */}
                <div className="pt-6 border-t border-white/[0.06] space-y-2.5">
                  <p className="text-xs text-neutral-400 font-mono">
                    Verified by university campus leagues & independent engineers.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-neutral-300">
                    <span className="px-2.5 py-1 rounded bg-[#12151D] border border-white/[0.08]">
                      0.0s Sandbox Overhead
                    </span>
                    <span className="text-neutral-600">•</span>
                    <span className="px-2.5 py-1 rounded bg-[#12151D] border border-white/[0.08]">
                      256MB Hard Limits
                    </span>
                    <span className="text-neutral-600">•</span>
                    <span className="px-2.5 py-1 rounded bg-[#12151D] border border-white/[0.08]">
                      Zero Synthetic Data
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Stage (45% / 5 cols) */}
              <div className="lg:col-span-5 relative">
                <LandingCockpitMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ARCHITECTURAL PILLARS (Bento Grid) */}
        <section className="py-16 md:py-24 border-t border-white/[0.06] bg-[#0A0C10]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                Architectural Standards
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Engineered for Algorithmic Rigor
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Replaces passive video lectures with mathematical invariant proofs, live isolated compilers, and adaptive cognitive pacing.
              </p>
            </div>

            {/* 4 Bento Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Pillar 1 */}
              <div className="bg-[#12151D] border border-white/[0.08] hover:border-white/[0.15] p-6 sm:p-8 rounded-2xl transition-all space-y-4 group">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white">
                    Empirical Diagnostic Engine
                  </h3>
                  <p className="text-xs font-mono text-blue-400">Proves skill before scheduling</p>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Rapid invariant verification tests examine your mental models across Arrays, Binary Search, Trees, and Dynamic Programming. Compiles an empirical competence vector rather than relying on self-reported guesses.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="bg-[#12151D] border border-white/[0.08] hover:border-white/[0.15] p-6 sm:p-8 rounded-2xl transition-all space-y-4 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white">
                    Isolated Execution Sandbox
                  </h3>
                  <p className="text-xs font-mono text-emerald-400">Strict container resource controls</p>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Real Docker-based judge supporting OpenJDK 21, GCC 14, Python 3.12, and TypeScript 5.7. Enforces 2.0s time limits, 256MB RAM constraints, and unbuffered stdout/stderr streams with zero synthetic simulations.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="bg-[#12151D] border border-white/[0.08] hover:border-white/[0.15] p-6 sm:p-8 rounded-2xl transition-all space-y-4 group">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white">
                    Adaptive Sprints & Non-Punitive Rebalancer
                  </h3>
                  <p className="text-xs font-mono text-purple-400">Smart redistribution without burnout</p>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Missed two study days? The closed-loop rebalancer squeezes low-priority concept drills, preserves core medium problems, and smoothly redistributes upcoming workload to protect your cognitive bandwidth.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="bg-[#12151D] border border-white/[0.08] hover:border-white/[0.15] p-6 sm:p-8 rounded-2xl transition-all space-y-4 group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Repeat className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white">
                    Ebbinghaus Spaced Repetition
                  </h3>
                  <p className="text-xs font-mono text-amber-400">Day 1, 3, 7, 21 recall cycles</p>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Every accepted solve automatically enrolls into an automated decay curve queue. Review invariant hint drawers and re-solve previously mastered patterns to build panic-free intuition for high-stakes FAANG interviews.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#08090C] py-8 text-neutral-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-white tracking-wider">VERNIQ</span>
            <span>— Obsidian Carbon Engineering Studio</span>
          </div>
          <div className="flex items-center gap-6 font-mono text-[11px]">
            <Link to="/roadmaps" className="hover:text-white transition-colors">
              Roadmaps
            </Link>
            <Link to="/ide" className="hover:text-white transition-colors">
              Online IDE
            </Link>
            <Link to="/leaderboard" className="hover:text-white transition-colors">
              Leaderboard
            </Link>
            <Link to="/architecture" className="hover:text-white transition-colors">
              Architecture
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingView;
