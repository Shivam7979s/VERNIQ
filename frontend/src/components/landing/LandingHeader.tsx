import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Terminal, ArrowRight, Sparkles } from 'lucide-react';

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
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              <span>Open Mission Control</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs sm:text-sm text-neutral-300 hover:text-white px-3 py-2 transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/app/diagnostic"
                className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                <span>Start Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
