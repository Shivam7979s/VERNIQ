import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/ui/layout/DashboardLayout';
import { Button } from '@/components/ui/actions/Button';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { FALLBACK_PROBLEMS } from '@/lib/curriculumData';
import type { ConfidenceLevel } from '@/types';
import {
  Brain,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  id: number;
  topic: string;
  categoryTag: string;
  question: string;
  codeSnippet?: string;
  options: {
    key: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  invariantTitle: string;
}

const DIAGNOSTIC_QUESTIONS: Question[] = [
  {
    id: 1,
    topic: 'Arrays & Hash Maps',
    categoryTag: 'Arrays',
    question:
      'In an unsorted array of size n, you need to find if any two numbers sum to target T in O(n) time. What mathematical loop invariant guarantees each potential match is checked without quadratic comparisons?',
    options:
      [
        {
          key: 'A',
          text: 'At index i, look up (T - nums[i]) in a hash map of elements previously seen; if present, the complement invariant is satisfied immediately in O(1) amortized lookup.',
          isCorrect: true,
          explanation:
            'The complement hash map maintains the invariant that all previously inspected elements are indexed, preventing duplicate scanning.',
        },
        {
          key: 'B',
          text: 'Sort the array in O(n log n) and run binary search on all prefix sum variations.',
          isCorrect: false,
          explanation: 'Sorting requires O(n log n) time and breaks the strict O(n) runtime bound.',
        },
        {
          key: 'C',
          text: 'Compute cumulative bitwise XOR and verify if nums[i] ^ T equals the array parity sum.',
          isCorrect: false,
          explanation: 'Bitwise XOR does not preserve additive arithmetic sums for arbitrary targets.',
        },
        {
          key: 'D',
          text: 'Maintain a fixed-size priority queue and evict elements whose remainder modulo n is negative.',
          isCorrect: false,
          explanation: 'Modulo remainders do not guarantee unique pair sum identification.',
        },
      ],
    invariantTitle: 'Complement Inverted Index Invariant',
  },
  {
    id: 2,
    topic: 'Two Pointers',
    categoryTag: 'Two Pointers',
    question:
      'In the Two-Pointer Container With Most Water problem where Area = min(h[L], h[R]) * (R - L), why is it mathematically proven correct to always advance the pointer pointing to the shorter vertical bar?',
    options:
      [
        {
          key: 'A',
          text: 'Because moving the taller boundary inward shrinks width (R - L) while height remains capped by the shorter line, which cannot possibly produce a larger area.',
          isCorrect: true,
          explanation:
            'Since area is constrained by min(h[L], h[R]), shrinking width while height is bounded by the current minimum can only decrease or maintain area. Only moving the shorter line can find a taller boundary.',
        },
        {
          key: 'B',
          text: 'Moving the shorter boundary guarantees that the distance (R - L) increases on subsequent iterations.',
          isCorrect: false,
          explanation: 'The distance (R - L) always decreases as pointers converge inward.',
        },
        {
          key: 'C',
          text: 'Both boundaries must be shifted symmetrically to preserve array parity in memory.',
          isCorrect: false,
          explanation: 'Symmetric dual movement skips potential optimal intermediate rectangles.',
        },
        {
          key: 'D',
          text: 'It reduces CPU instruction cache misses on contiguous array iterations.',
          isCorrect: false,
          explanation: 'This is a cache-line optimization, not a mathematical correctness proof.',
        },
      ],
    invariantTitle: 'Monotonic Boundary Contraction Invariant',
  },
  {
    id: 3,
    topic: 'Binary Search',
    categoryTag: 'Binary Search',
    question:
      'When finding the minimum element in a rotated sorted array with distinct numbers, what invariant condition comparing nums[mid] and nums[right] determines the subproblem partition?',
    options:
      [
        {
          key: 'A',
          text: 'If nums[mid] > nums[right], the pivot (minimum) must reside strictly in the right half (mid, right]; otherwise, it is in [left, mid].',
          isCorrect: true,
          explanation:
            'Because the array is sorted and rotated, if nums[mid] > nums[right], the discontinuity inflection point must lie to the right of mid.',
        },
        {
          key: 'B',
          text: 'If nums[mid] > nums[left], the minimum is strictly in [left, mid).',
          isCorrect: false,
          explanation: 'If nums[mid] > nums[left], the left half could be simply sorted while rotation happened in the right half.',
        },
        {
          key: 'C',
          text: 'Always test whether nums[mid] equals the arithmetic mean of nums[left] and nums[right].',
          isCorrect: false,
          explanation: 'Arithmetic mean does not guarantee sorted array partition bounds.',
        },
        {
          key: 'D',
          text: 'Check if nums[mid] is negative; if negative, bisect the left half.',
          isCorrect: false,
          explanation: 'Sign of values is irrelevant to rotational ordering.',
        },
      ],
    invariantTitle: 'Rotated Pivot Monotonic Bisection Invariant',
  },
  {
    id: 4,
    topic: 'Monotonic Stack',
    categoryTag: 'Monotonic Stack',
    question:
      'To compute the Next Greater Element for all elements in an array in O(n) total time, what property must the stack preserve during array traversal?',
    options:
      [
        {
          key: 'A',
          text: 'A strictly decreasing stack of candidate values/indices, where any encountered element larger than stack top pops and resolves smaller waiting elements.',
          isCorrect: true,
          explanation:
            'A monotonic decreasing stack guarantees each element is pushed once and popped at most once, yielding amortized O(1) operations per element.',
        },
        {
          key: 'B',
          text: 'A FIFO circular queue maintaining sorted element arrival timestamps.',
          isCorrect: false,
          explanation: 'A FIFO queue cannot resolve arbitrary next greater elements in reverse monotonic order.',
        },
        {
          key: 'C',
          text: 'An ascending stack that never pops elements until the end of the array.',
          isCorrect: false,
          explanation: 'Without popping, waiting elements cannot receive their nearest greater right-hand bound.',
        },
        {
          key: 'D',
          text: 'A doubly linked list of size 2 tracking only global minimum and maximum.',
          isCorrect: false,
          explanation: 'A pair of bounds cannot resolve individual element-wise next greater relationships.',
        },
      ],
    invariantTitle: 'Monotonic Decreasing Candidate Invariant',
  },
  {
    id: 5,
    topic: 'Dynamic Programming',
    categoryTag: 'Dynamic Programming',
    question:
      'In optimal subproblem formulations (such as House Robber or Kadane’s Maximum Subarray), what condition ensures that Bellman’s Principle of Optimality holds?',
    options:
      [
        {
          key: 'A',
          text: 'The optimal choice for subproblem i depends strictly on optimal solutions to previous disjoint subproblems without circular backward dependencies.',
          isCorrect: true,
          explanation:
            'Optimal substructure and acyclic dependency (DAG of states) guarantee that local decisions compose into the global optimum.',
        },
        {
          key: 'B',
          text: 'Every state transition must evaluate all 2^n possible subsets in exponential time.',
          isCorrect: false,
          explanation: 'Dynamic programming eliminates exponential subproblem evaluation through memoization/tabulation.',
        },
        {
          key: 'C',
          text: 'The input numbers must all be strictly positive integers.',
          isCorrect: false,
          explanation: 'Optimal substructure applies regardless of numerical polarity.',
        },
        {
          key: 'D',
          text: 'The recurrence relation must contain a modulo hashing function.',
          isCorrect: false,
          explanation: 'Hashing is auxiliary; DP relies on state recurrence and acyclic ordering.',
        },
      ],
    invariantTitle: 'Optimal Substructure & DAG State Invariant',
  },
  {
    id: 6,
    topic: 'Trees & BST',
    categoryTag: 'Trees',
    question:
      'Why is simply checking (node.left.val < node.val && node.right.val > node.val) locally at every node insufficient to prove a binary tree is a valid Binary Search Tree (BST)?',
    options:
      [
        {
          key: 'A',
          text: 'Because local checks do not enforce that every node in a right subtree must also be strictly smaller than ancestral upper bounds set higher up the tree.',
          isCorrect: true,
          explanation:
            'A valid BST requires range bounding [low, high] passed down recursively, ensuring descendants never violate global ancestral bounds.',
        },
        {
          key: 'B',
          text: 'Because BST invariants only apply to self-balancing AVL or Red-Black trees.',
          isCorrect: false,
          explanation: 'The BST invariant is fundamental to all binary search trees, balanced or unbalanced.',
        },
        {
          key: 'C',
          text: 'Because in-order traversal of a valid BST must always yield values in descending order.',
          isCorrect: false,
          explanation: 'In-order traversal of a valid BST yields strictly ascending order.',
        },
        {
          key: 'D',
          text: 'Because binary trees cannot contain leaf nodes with null child pointers.',
          isCorrect: false,
          explanation: 'All leaf nodes inherently terminate with null child pointers.',
        },
      ],
    invariantTitle: 'Ancestral Global Range Bounding Invariant [low, high]',
  },
  {
    id: 7,
    topic: 'Sliding Window',
    categoryTag: 'Sliding Window',
    question:
      'In the Longest Substring Without Repeating Characters, what invariant allows the left pointer L to jump directly forward rather than incrementing one by one?',
    options:
      [
        {
          key: 'A',
          text: 'L can jump to max(L, last_seen[char] + 1), instantaneously contracting the window past the duplicate character in O(1) amortized time.',
          isCorrect: true,
          explanation:
            'Storing the last seen index of each character allows the window to purge the duplicate with a single jump while preserving valid candidates.',
        },
        {
          key: 'B',
          text: 'The right pointer R must reset to 0 whenever a character collision occurs.',
          isCorrect: false,
          explanation: 'Resetting R creates unnecessary quadratic runtime.',
        },
        {
          key: 'C',
          text: 'The input string must only contain lowercase ASCII characters.',
          isCorrect: false,
          explanation: 'Sliding window with map applies to full Unicode character sets.',
        },
        {
          key: 'D',
          text: 'Window contraction requires sorting all characters inside the current window.',
          isCorrect: false,
          explanation: 'Sorting the window takes O(k log k) time and destroys contiguous substring order.',
        },
      ],
    invariantTitle: 'Sliding Window Disjoint Jump Invariant',
  },
  {
    id: 8,
    topic: 'Greedy Algorithms',
    categoryTag: 'Greedy',
    question:
      'In the Jump Game problem, what running invariant allows a single-pass greedy solution in O(n) time and O(1) space to verify reachability?',
    options:
      [
        {
          key: 'A',
          text: 'Maintain max_reachable = max(max_reachable, i + nums[i]); if current index i exceeds max_reachable, the index is unreachable and execution terminates.',
          isCorrect: true,
          explanation:
            'The reachable frontier expands monotonically with each valid step. Any index beyond the running maximum frontier cannot be reached.',
        },
        {
          key: 'B',
          text: 'Explore all possible branch paths with recursive backtracking to count permutations.',
          isCorrect: false,
          explanation: 'Branching results in exponential O(2^n) time complexity.',
        },
        {
          key: 'C',
          text: 'Check only whether nums[0] is greater than or equal to the array length n.',
          isCorrect: false,
          explanation: 'Intermediate jumps can easily chain together to cross larger distances.',
        },
        {
          key: 'D',
          text: 'Sort jump numbers in descending order before inspecting index 0.',
          isCorrect: false,
          explanation: 'Sorting disrupts the chronological spatial order of the array indices.',
        },
      ],
    invariantTitle: 'Monotonic Reachability Frontier Invariant',
  },
];

export const DiagnosticView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [savingDiagnostics, setSavingDiagnostics] = useState<boolean>(false);
  const [diagnosticResults, setDiagnosticResults] = useState<
    {
      topic: string;
      categoryTag: string;
      score: number;
      confidence: ConfidenceLevel;
      correctCount: number;
      totalCount: number;
    }[]
  >([]);

  // Current Question
  const currentQuestion = DIAGNOSTIC_QUESTIONS[currentQuestionIndex];
  const totalQuestions = DIAGNOSTIC_QUESTIONS.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  // Check if existing diagnostics exist for this user
  useEffect(() => {
    const fetchExistingDiagnostics = async () => {
      if (!user || !isSupabaseConfigured()) return;
      try {
        const { data, error } = await supabase
          .from('user_diagnostics')
          .select('*')
          .eq('user_id', user.id);

        if (!error && data && data.length > 0) {
          const mapped = data.map((d: any) => ({
            topic: d.tag_name,
            categoryTag: d.tag_name,
            score: Number(d.mastery_score),
            confidence: d.confidence_level as ConfidenceLevel,
            correctCount: Math.round((Number(d.mastery_score) / 100) * 1),
            totalCount: 1,
          }));
          setDiagnosticResults(mapped);
          setIsCompleted(true);
        }
      } catch (err) {
        console.warn('Could not load existing diagnostics:', err);
      }
    };

    fetchExistingDiagnostics();
  }, [user]);

  // Answer selection handler
  const handleSelectOption = (optionKey: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionKey,
    }));
  };

  // Evaluation & Upsert to Supabase
  const handleCompleteAssessment = async () => {
    const topicScores: Record<string, { correct: number; total: number }> = {};

    DIAGNOSTIC_QUESTIONS.forEach((q) => {
      if (!topicScores[q.categoryTag]) {
        topicScores[q.categoryTag] = { correct: 0, total: 0 };
      }
      topicScores[q.categoryTag].total += 1;
      const chosen = selectedAnswers[q.id];
      const opt = q.options.find((o) => o.key === chosen);
      if (opt?.isCorrect) {
        topicScores[q.categoryTag].correct += 1;
      }
    });

    const evaluatedResults = Object.entries(topicScores).map(([category, stats]) => {
      const score = Math.round((stats.correct / stats.total) * 100);
      let confidence: ConfidenceLevel = 'novice';
      if (score >= 80) confidence = 'proficient';
      else if (score >= 50) confidence = 'intermediate';

      return {
        topic: category,
        categoryTag: category,
        score,
        confidence,
        correctCount: stats.correct,
        totalCount: stats.total,
      };
    });

    setDiagnosticResults(evaluatedResults);
    setIsCompleted(true);

    // Upsert into public.user_diagnostics
    if (user && isSupabaseConfigured()) {
      try {
        setSavingDiagnostics(true);
        for (const item of evaluatedResults) {
          await supabase.from('user_diagnostics').upsert(
            {
              user_id: user.id,
              tag_name: item.categoryTag,
              mastery_score: item.score,
              confidence_level: item.confidence,
              evaluated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,tag_name' }
          );
        }
      } catch (err) {
        console.error('Failed to upsert diagnostics:', err);
      } finally {
        setSavingDiagnostics(false);
      }
    }
  };

  // Action: Generate Adaptive Sprints
  const handleGenerateAdaptiveSprints = async () => {
    if (!user) {
      navigate('/app/plan');
      return;
    }

    try {
      setSavingDiagnostics(true);

      // Find lowest confidence topics to prioritize
      const weakTopics = [...diagnosticResults].sort((a, b) => a.score - b.score);
      const primaryTopic = weakTopics[0]?.categoryTag || 'Arrays';

      // 1. Create a study sprint in public.study_sprints
      const today = new Date();
      const sprintEndDate = new Date();
      sprintEndDate.setDate(sprintEndDate.getDate() + 7);

      const startDateStr = today.toISOString().split('T')[0];
      const endDateStr = sprintEndDate.toISOString().split('T')[0];

      if (isSupabaseConfigured()) {
        // Deactivate existing active sprints
        await supabase
          .from('study_sprints')
          .update({ status: 'completed' })
          .eq('user_id', user.id)
          .eq('status', 'active');

        // Insert new active sprint
        const { data: newSprint, error: sprintErr } = await supabase
          .from('study_sprints')
          .insert({
            user_id: user.id,
            sprint_number: 1,
            title: `Sprint 01: ${primaryTopic} Invariants`,
            primary_topic: primaryTopic,
            target_hours: 8.5,
            start_date: startDateStr,
            end_date: endDateStr,
            status: 'active',
          })
          .select()
          .single();

        if (sprintErr) throw sprintErr;

        // 2. Compile tasks into public.sprint_tasks
        const pool = FALLBACK_PROBLEMS;
        const taskTypes = [
          { type: 'learn_concept', title: `Learn: ${primaryTopic} Loop Invariants`, minutes: 25 },
          { type: 'practice_problem', title: `Practice: ${pool[0].title}`, minutes: 40, problem_id: pool[0].id },
          { type: 'spaced_revision', title: `Revision: ${pool[1].title}`, minutes: 20, problem_id: pool[1].id },
          { type: 'practice_problem', title: `Practice: ${pool[2].title}`, minutes: 45, problem_id: pool[2].id },
          { type: 'mistake_retrial', title: `Mistake Retrial: Boundary Verification`, minutes: 25 },
          { type: 'practice_problem', title: `Practice: ${pool[3].title}`, minutes: 45, problem_id: pool[3].id },
          { type: 'sprint_assessment', title: `Sprint 01 Invariant Benchmark Test`, minutes: 35 },
        ];

        const taskRows = taskTypes.map((t, idx) => {
          const taskDate = new Date();
          taskDate.setDate(taskDate.getDate() + idx);
          return {
            sprint_id: newSprint.id,
            user_id: user.id,
            problem_id: t.problem_id || null,
            task_type: t.type,
            title: t.title,
            estimated_minutes: t.minutes,
            scheduled_date: taskDate.toISOString().split('T')[0],
            is_completed: false,
            order_index: idx,
          };
        });

        await supabase.from('sprint_tasks').insert(taskRows);
      }

      // Navigate to Sprint Horizon
      navigate('/app/plan');
    } catch (err) {
      console.error('Failed to generate adaptive sprints:', err);
      navigate('/app/plan');
    } finally {
      setSavingDiagnostics(false);
    }
  };

  const getConfidenceBadge = (confidence: ConfidenceLevel) => {
    switch (confidence) {
      case 'master':
      case 'proficient':
        return {
          label: 'Proficient',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
      case 'intermediate':
        return {
          label: 'Intermediate',
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      case 'novice':
      default:
        return {
          label: 'Novice',
          badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        };
    }
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Student Workspace', href: '/app/dashboard' },
        { label: 'Diagnostic Assessment Engine' },
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header Section */}
        <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20">
                High-Signal Readiness
              </span>
              <span className="text-xs text-text-muted font-mono">Formal Pattern Invariants</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
              Algorithmic Diagnostic Engine
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Test your algorithmic mental models and formal invariant proofs. The engine synthesizes your empirical competence vector to compile adaptive weekly sprints.
            </p>
          </div>

          {isCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAnswers({});
                setIsCompleted(false);
                setCurrentQuestionIndex(0);
              }}
              leftIcon={<RefreshCw className="w-4 h-4 text-text-muted" />}
            >
              Retake Assessment
            </Button>
          )}
        </div>

        {/* ACTIVE QUESTIONNAIRE VIEW */}
        {!isCompleted && (
          <div className="space-y-6">
            {/* Progress Header Bar */}
            <div className="p-4 rounded-xl border border-white/[0.08] bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <Brain className="w-4 h-4 text-primary" />
                <span className="font-semibold text-text-primary">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <span className="text-text-muted font-mono">({currentQuestion.topic})</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-48">
                <div className="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden border border-white/[0.05]">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="font-mono text-text-muted shrink-0">{progressPercent}%</span>
              </div>
            </div>

            {/* Question Card */}
            <div className="p-6 md:p-8 rounded-2xl border border-white/[0.08] bg-surface shadow-elevation-1 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-elevated border border-white/[0.06] text-text-secondary">
                    {currentQuestion.categoryTag}
                  </span>
                  <span className="text-xs text-text-muted font-mono">
                    Pattern Invariant: <strong className="text-text-primary">{currentQuestion.invariantTitle}</strong>
                  </span>
                </div>

                <h2 className="text-lg md:text-xl font-bold tracking-tight text-text-primary leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Options Stack */}
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === option.key;

                  return (
                    <div
                      key={option.key}
                      onClick={() => handleSelectOption(option.key)}
                      className={cn(
                        'p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5',
                        isSelected
                          ? 'border-primary bg-primary/[0.08] ring-1 ring-primary/40'
                          : 'border-white/[0.08] bg-surface hover:border-white/20 hover:bg-surface-elevated'
                      )}
                    >
                      <div
                        className={cn(
                          'w-6 h-6 rounded-md border flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 transition-colors',
                          isSelected
                            ? 'border-primary bg-primary text-text-inverse'
                            : 'border-white/20 bg-surface-elevated text-text-muted'
                        )}
                      >
                        {option.key}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm leading-relaxed transition-colors',
                            isSelected ? 'text-text-primary font-medium' : 'text-text-secondary'
                          )}
                        >
                          {option.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Actions */}
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex((p) => Math.max(0, p - 1))}
                  disabled={currentQuestionIndex === 0}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>

                {currentQuestionIndex < totalQuestions - 1 ? (
                  <Button
                    variant="primary"
                    onClick={() => setCurrentQuestionIndex((p) => Math.min(totalQuestions - 1, p + 1))}
                    disabled={!selectedAnswers[currentQuestion.id]}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleCompleteAssessment}
                    disabled={answeredCount < totalQuestions}
                    leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
                  >
                    Submit Diagnostic Assessment
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS & REALTIME EVIDENCE VECTOR VIEW */}
        {isCompleted && (
          <div className="space-y-6 animate-fadeIn">
            {/* Vector Card */}
            <div className="p-6 md:p-8 rounded-2xl border border-white/[0.08] bg-surface shadow-elevation-1 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-text-primary">
                      Empirical Diagnostic Competence Vector
                    </h2>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Realtime telemetry synthesized from your invariant responses across core algorithmic domains.
                  </p>
                </div>

                <Button
                  variant="primary"
                  onClick={handleGenerateAdaptiveSprints}
                  disabled={savingDiagnostics}
                  rightIcon={
                    savingDiagnostics ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )
                  }
                  className="bg-primary hover:bg-primary-hover text-white shadow-elevation-1"
                >
                  {savingDiagnostics ? 'Synthesizing...' : 'Generate Adaptive Sprints →'}
                </Button>
              </div>

              {/* Competence Vector Bars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diagnosticResults.map((item) => {
                  const meta = getConfidenceBadge(item.confidence);
                  return (
                    <div
                      key={item.categoryTag}
                      className="p-4 rounded-xl border border-white/[0.06] bg-surface-elevated space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-sm font-semibold text-text-primary block">
                            {item.topic}
                          </span>
                          <span className="text-[10px] font-mono text-text-muted">
                            Mastery Score: {item.score}%
                          </span>
                        </div>

                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border',
                            meta.badgeClass
                          )}
                        >
                          {meta.label}
                        </span>
                      </div>

                      {/* Mini Bar */}
                      <div className="h-2 w-full bg-surface-subtle rounded-full overflow-hidden border border-white/[0.04]">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            item.score >= 80
                              ? 'bg-emerald-400'
                              : item.score >= 50
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          )}
                          style={{ width: `${Math.max(8, item.score)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pedagogical Guidance Box */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.04] flex items-start gap-3 text-xs text-text-secondary leading-relaxed">
                <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p>
                  Your diagnostic telemetry has been persisted to{' '}
                  <code className="text-primary font-mono font-semibold">public.user_diagnostics</code>.
                  Clicking <strong>Generate Adaptive Sprints</strong> compiles a personalized 7-day milestone
                  focusing on your highest-yield growth domains.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
export default DiagnosticView;
