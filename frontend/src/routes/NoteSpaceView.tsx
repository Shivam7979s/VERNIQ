import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { UserNote, Problem } from '@/types';
import { useToast } from '@/components/ui/feedback/Toast';
import {
  BookOpen,
  Plus,
  Star,
  Trash2,
  Edit3,
  Search,
  Clock,
  FileText,
  X,
  ArrowRight,
} from 'lucide-react';

const DIFFICULTY_STYLES: Record<string, { label: string; color: string; border: string }> = {
  easy: { label: 'Easy', color: 'text-[#00B8A3] bg-[#00B8A3]/10', border: 'border-[#00B8A3]/20' },
  medium: { label: 'Medium', color: 'text-[#FFC01E] bg-[#FFC01E]/10', border: 'border-[#FFC01E]/20' },
  hard: { label: 'Hard', color: 'text-[#FF375F] bg-[#FF375F]/10', border: 'border-[#FF375F]/20' },
};

// Simple Markdown Renderer component
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-2 text-xs text-neutral-300 leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-xs font-bold text-white tracking-tight pt-1">
              {trimmed.replace('### ', '')}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-sm font-bold text-white tracking-tight pt-1.5">
              {trimmed.replace('## ', '')}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-sm font-extrabold text-white tracking-tight pt-2">
              {trimmed.replace('# ', '')}
            </h2>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-blue-400 font-mono text-[10px] mt-0.5">•</span>
              <span>{trimmed.substring(2)}</span>
            </div>
          );
        }
        if (trimmed.startsWith('`') && trimmed.endsWith('`') && trimmed.length > 2) {
          return (
            <code
              key={idx}
              className="block font-mono text-[11px] bg-[#090B0E] border border-white/[0.06] p-2 rounded text-emerald-400 overflow-x-auto"
            >
              {trimmed.replace(/`/g, '')}
            </code>
          );
        }
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={idx}
              className="pl-3 border-l-2 border-blue-500/40 text-neutral-400 italic text-[11px]"
            >
              {trimmed.replace('> ', '')}
            </blockquote>
          );
        }
        return <p key={idx}>{line}</p>;
      })}
    </div>
  );
};

export const NoteSpaceView: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [notes, setNotes] = useState<UserNote[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [selectedProblemFilter, setSelectedProblemFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalProblemId, setModalProblemId] = useState<string>('');
  const [modalContent, setModalContent] = useState('');
  const [modalStarred, setModalStarred] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Notes
  const fetchNotes = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_notes')
        .select(`
          id,
          user_id,
          problem_id,
          title,
          markdown_content,
          is_starred,
          created_at,
          updated_at,
          problems:problem_id (
            id,
            title,
            slug,
            difficulty
          )
        `)
        .eq('user_id', user.id)
        .order('is_starred', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes((data as unknown as UserNote[]) || []);
    } catch (err) {
      console.error('Failed to load user notes:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch Problems list for dropdown selection
  const fetchProblems = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('problems')
        .select('id, title, slug, difficulty')
        .order('title', { ascending: true })
        .limit(100);

      if (error) throw error;
      setProblems((data as Problem[]) || []);
    } catch (err) {
      console.error('Failed to fetch problems for notes:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    fetchProblems();
  }, [fetchNotes, fetchProblems]);

  // Toggle Star
  const handleToggleStar = async (id: string, currentStarred: boolean) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_starred: !currentStarred } : n))
    );
    try {
      const { error } = await supabase
        .from('user_notes')
        .update({ is_starred: !currentStarred, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast({
        type: 'info',
        title: !currentStarred ? 'Note Starred' : 'Note Unstarred',
        message: !currentStarred ? 'Pinned to priority list.' : 'Removed from priority list.',
      });
      fetchNotes();
    } catch (err) {
      console.error('Failed to star note:', err);
      fetchNotes();
    }
  };

  // Delete Note
  const handleDeleteNote = async (id: string, title: string) => {
    if (!window.confirm(`Delete invariant note "${title}"?`)) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      const { error } = await supabase.from('user_notes').delete().eq('id', id);
      if (error) throw error;
      toast({
        type: 'success',
        title: 'Note Deleted',
        message: `Removed "${title}" from NoteSpace.`,
      });
    } catch (err) {
      console.error('Failed to delete note:', err);
      fetchNotes();
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingNoteId(null);
    setModalTitle('');
    setModalProblemId('');
    setModalContent(`### Algorithmic Invariant Proof
- **Loop Invariant:** The search space [left, right] always contains the target index if it exists.
- **Termination Condition:** When left > right, space is exhausted.

### Edge Case Analysis
1. Empty array or single element vector.
2. Target equals boundaries (nums[0] or nums[n-1]).
3. Rotated inflection point with duplicates.`);
    setModalStarred(false);
    setActiveTab('write');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (note: UserNote) => {
    setEditingNoteId(note.id);
    setModalTitle(note.title);
    setModalProblemId(note.problem_id || '');
    setModalContent(note.markdown_content);
    setModalStarred(note.is_starred);
    setActiveTab('write');
    setIsModalOpen(true);
  };

  // Save Note Submit
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!modalTitle.trim()) {
      toast({
        type: 'warning',
        title: 'Title Required',
        message: 'Please provide a title for your invariant note.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingNoteId) {
        // Update
        const { error } = await supabase
          .from('user_notes')
          .update({
            title: modalTitle.trim(),
            problem_id: modalProblemId || null,
            markdown_content: modalContent,
            is_starred: modalStarred,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingNoteId);

        if (error) throw error;
        toast({
          type: 'success',
          title: 'Note Updated',
          message: 'Changes saved to NoteSpace vault.',
        });
      } else {
        // Insert
        const { error } = await supabase.from('user_notes').insert({
          user_id: user.id,
          title: modalTitle.trim(),
          problem_id: modalProblemId || null,
          markdown_content: modalContent,
          is_starred: modalStarred,
        });

        if (error) throw error;
        toast({
          type: 'success',
          title: 'Note Created',
          message: `"${modalTitle}" committed to your NoteSpace.`,
        });
      }

      setIsModalOpen(false);
      fetchNotes();
    } catch (err) {
      console.error('Failed to save note:', err);
      toast({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not write note to database.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.markdown_content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.problems?.title && n.problems.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStarred = !showStarredOnly || n.is_starred;
    const matchesProblem =
      selectedProblemFilter === 'all' ||
      (selectedProblemFilter === 'linked' && Boolean(n.problem_id)) ||
      (selectedProblemFilter === 'general' && !n.problem_id);

    return matchesSearch && matchesStarred && matchesProblem;
  });

  return (
    <div className="min-h-screen bg-[#08090C] text-neutral-100 flex flex-col">
      {/* Header Horizon */}
      <header className="border-b border-white/[0.08] bg-[#0D0F15] sticky top-0 z-20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
                NoteSpace Vault
              </h1>
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 px-2.5 py-0.5 rounded-full bg-[#12151D] border border-white/[0.08]">
                {notes.length} {notes.length === 1 ? 'Note' : 'Notes'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 font-sans">
              Algorithmic invariant proofs, edge-case lemmas, and pattern synthesis notes linked to live problem sets.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Invariant Note</span>
            </button>
          </div>
        </div>
      </header>

      {/* Control Bar */}
      <div className="border-b border-white/[0.06] bg-[#0A0C10] py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notes, proofs, problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#12151D] border border-white/[0.08] focus:border-blue-500/50 rounded-lg pl-9 pr-4 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedProblemFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors shrink-0 ${
                selectedProblemFilter === 'all'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'bg-[#12151D] text-neutral-400 border border-white/[0.06] hover:text-white'
              }`}
            >
              All Notes
            </button>
            <button
              onClick={() => setSelectedProblemFilter('linked')}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors shrink-0 ${
                selectedProblemFilter === 'linked'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'bg-[#12151D] text-neutral-400 border border-white/[0.06] hover:text-white'
              }`}
            >
              Problem Linked
            </button>
            <button
              onClick={() => setSelectedProblemFilter('general')}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors shrink-0 ${
                selectedProblemFilter === 'general'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'bg-[#12151D] text-neutral-400 border border-white/[0.06] hover:text-white'
              }`}
            >
              General Patterns
            </button>

            <button
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              className={`px-3 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-colors shrink-0 ${
                showStarredOnly
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold'
                  : 'bg-[#12151D] text-neutral-400 border border-white/[0.06] hover:text-white'
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              <span>Starred</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Notes Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-[#12151D] border border-white/[0.06] rounded-xl p-5 h-64 animate-pulse"
              />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-[#0D0F15] border border-white/[0.08] rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 my-12">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">
                {searchQuery || selectedProblemFilter !== 'all' || showStarredOnly
                  ? 'No matching notes found'
                  : 'Your NoteSpace Vault is Empty'}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {searchQuery || selectedProblemFilter !== 'all' || showStarredOnly
                  ? 'Try modifying your search query or reset your filters.'
                  : 'Document invariant proofs, recurrence relations, and edge case lemmas to build intuitive algorithmic recall.'}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Write First Note</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => {
              const diffConfig = note.problems?.difficulty
                ? DIFFICULTY_STYLES[note.problems.difficulty]
                : null;

              const formattedDate = new Date(note.updated_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={note.id}
                  className="bg-[#12151D] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-5 flex flex-col justify-between transition-all group hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative"
                >
                  {/* Card Header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {/* Linked Problem or General Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {note.problems ? (
                            <Link
                              to={`/problems/${note.problems.slug}`}
                              className="inline-flex items-center gap-1.5 text-[10px] font-mono text-neutral-300 hover:text-white bg-[#181C26] border border-white/[0.08] px-2 py-0.5 rounded transition-colors group/link"
                            >
                              <FileText className="w-3 h-3 text-blue-400" />
                              <span className="truncate max-w-[150px]">{note.problems.title}</span>
                              {diffConfig && (
                                <span className={`text-[9px] uppercase px-1 rounded ${diffConfig.color}`}>
                                  {diffConfig.label}
                                </span>
                              )}
                            </Link>
                          ) : (
                            <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                              General Invariant
                            </span>
                          )}

                          {note.is_starred && (
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span>Starred</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-white tracking-tight mt-2 truncate group-hover:text-emerald-400 transition-colors">
                          {note.title}
                        </h3>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleStar(note.id, note.is_starred)}
                          title={note.is_starred ? 'Unstar note' : 'Star note'}
                          className={`p-1.5 rounded hover:bg-white/[0.06] transition-colors ${
                            note.is_starred ? 'text-amber-400' : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${note.is_starred ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(note)}
                          title="Edit note"
                          className="p-1.5 rounded hover:bg-white/[0.06] text-neutral-500 hover:text-neutral-300 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id, note.title)}
                          title="Delete note"
                          className="p-1.5 rounded hover:bg-rose-500/10 text-neutral-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Markdown Body Box */}
                    <div className="bg-[#090B0E] border border-white/[0.05] rounded-lg p-3 max-h-48 overflow-y-auto no-scrollbar">
                      <MarkdownRenderer content={note.markdown_content} />
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between gap-3 text-xs">
                    <span className="text-[11px] font-mono text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </span>

                    {note.problems ? (
                      <Link
                        to={`/problems/${note.problems.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleOpenEditModal(note)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <span>Read / Edit</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* WRITE / EDIT INVARIANT NOTE MODAL DIALOG */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#181C26] border border-white/[0.12] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {editingNoteId ? 'Edit Invariant Note' : 'Document Algorithmic Invariant'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNote} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Note Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monotonic Stack Invariant Proof"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    className="w-full bg-[#12151D] border border-white/[0.08] focus:border-emerald-500/50 rounded-lg px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Linked Problem (Optional)
                  </label>
                  <select
                    value={modalProblemId}
                    onChange={(e) => setModalProblemId(e.target.value)}
                    className="w-full bg-[#12151D] border border-white/[0.08] focus:border-emerald-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                  >
                    <option value="">General Pattern (No Specific Problem)</option>
                    {problems.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.difficulty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Editor / Preview Tabs */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                    Markdown Proof / Content
                  </label>
                  <div className="flex items-center gap-1 bg-[#12151D] p-0.5 rounded-lg border border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setActiveTab('write')}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                        activeTab === 'write' ? 'bg-[#181C26] text-white font-semibold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                        activeTab === 'preview' ? 'bg-[#181C26] text-white font-semibold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {activeTab === 'write' ? (
                  <textarea
                    rows={8}
                    required
                    value={modalContent}
                    onChange={(e) => setModalContent(e.target.value)}
                    placeholder="Write invariant lemmas, recurrence relations, complexity proofs..."
                    className="w-full bg-[#090B0E] border border-white/[0.08] focus:border-emerald-500/50 rounded-lg p-3 text-xs font-mono text-neutral-200 focus:outline-none transition-colors"
                  />
                ) : (
                  <div className="w-full bg-[#090B0E] border border-white/[0.08] rounded-lg p-3 min-h-[190px] max-h-72 overflow-y-auto">
                    <MarkdownRenderer content={modalContent || '*No content provided yet*'} />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="starNote"
                  checked={modalStarred}
                  onChange={(e) => setModalStarred(e.target.checked)}
                  className="rounded border-white/20 bg-[#12151D] text-amber-500 focus:ring-0"
                />
                <label htmlFor="starNote" className="text-xs text-neutral-300 cursor-pointer font-sans">
                  Star this note for prioritized review
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                >
                  <span>{isSubmitting ? 'Saving...' : editingNoteId ? 'Update Note' : 'Commit to NoteSpace'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default NoteSpaceView;
