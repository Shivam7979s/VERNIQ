import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Terminal, Sparkles } from 'lucide-react';

export const LandingHeader: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#08090C]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#12151D] border border-white/[0.1] flex items-center justify-center text-primary group-hover:border-primary/50 transition-colors">
            <Terminal className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold tracking-wider text-base text-white">
              VERNIQ
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3B82F6]" />
          </div>
        </Link>

        {/* Center: Navigation Pills (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-[#12151D] border border-white/[0.08]">
          <Link
            to="/roadmaps"
            className="px-3.5 py-1.5 rounded-full text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            Curriculum DAG
          </Link>
          <Link
            to="/app/diagnostic"
            className="px-3.5 py-1.5 rounded-full text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Empirical Diagnostic</span>
          </Link>
          <Link
            to="/ide"
            className="px-3.5 py-1.5 rounded-full text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            Online IDE
          </Link>
          <Link
            to="/leaderboard"
            className="px-3.5 py-1.5 rounded-full text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            Campus Standings
          </Link>
        </nav>

        {/* Right: Action Group */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/app/dashboard"
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-medium text-blue-300 bg-blue-950/40 border border-blue-500/40 hover:border-blue-400 hover:bg-blue-900/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all duration-200"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="tracking-wide">Launch Mission Control</span>
              <span className="text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150">↗</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-mono font-medium text-neutral-300 hover:text-white px-3.5 py-1.5 rounded-full hover:bg-white/[0.06] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/app/diagnostic"
                className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-medium text-white bg-blue-600/30 border border-blue-500/40 hover:border-blue-400 hover:bg-blue-600/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] backdrop-blur-md transition-all duration-200"
              >
                <span>Start Assessment</span>
                <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform duration-150">→</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
