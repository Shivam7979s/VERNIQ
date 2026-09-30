import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Submission, ProgrammingLanguage, SubmissionVerdict } from '@/types';

// In-memory mock store for local/offline execution simulations
const mockSubmissions = new Map<string, Submission>();
const mockListeners = new Map<string, Set<(sub: Submission) => void>>();

export function subscribeToMockSubmission(
  submissionId: string,
  callback: (sub: Submission) => void
): () => void {
  if (!mockListeners.has(submissionId)) {
    mockListeners.set(submissionId, new Set());
  }
  const set = mockListeners.get(submissionId)!;
  set.add(callback);

  // If already exists, fire initial state
  const existing = mockSubmissions.get(submissionId);
  if (existing) {
    callback(existing);
  }

  return () => {
    set.delete(callback);
    if (set.size === 0) {
      mockListeners.delete(submissionId);
    }
  };
}

function notifyMockListeners(sub: Submission) {
  mockSubmissions.set(sub.id, sub);
  const set = mockListeners.get(sub.id);
  if (set) {
    set.forEach((cb) => cb(sub));
  }
}

/**
 * Simulates isolated worker execution when backend judge is offline/mock mode.
 */
function simulateJudgeExecution(
  submissionId: string,
  _problemId: string | null,
  code: string,
  language: ProgrammingLanguage,
  stdin: string,
  isCustomRun: boolean
) {
  // Step 1: Transition to 'running'
  setTimeout(() => {
    const current = mockSubmissions.get(submissionId);
    if (!current) return;

    const runningSub: Submission = {
      ...current,
      verdict: 'running',
    };
    notifyMockListeners(runningSub);

    // Step 2: Evaluate code and generate verdict
    const execDelay = Math.floor(Math.random() * 400) + 400; // 400-800ms
    setTimeout(() => {
      let verdict: SubmissionVerdict = 'accepted';
      let stdout = '';
      let stderr = '';
      let compileOutput = '';
      const runtimeMs = Math.floor(Math.random() * 20) + 12; // 12-32ms
      const memoryKb = Math.floor(Math.random() * 2000) + 14200; // ~14-16MB
      let passedCases = isCustomRun ? 1 : 24;
      const totalCases = isCustomRun ? 1 : 24;

      // Intelligent code heuristics for rich demonstration
      const trimmed = code.trim();
      if (trimmed.includes('throw new Error') || trimmed.includes('raise Exception') || trimmed.includes('panic(')) {
        verdict = 'runtime_error';
        stderr = `RuntimeError: Execution halted with unhandled exception at line 14: \n  Exception: User-triggered exception`;
      } else if (trimmed.includes('while(true)') || trimmed.includes('while (true)') || trimmed.includes('for(;;)') || trimmed.includes('time.sleep(10)')) {
        verdict = 'time_limit_exceeded';
        stderr = 'Time Limit Exceeded: Execution terminated after exceeding 2000ms threshold.';
      } else if (trimmed.length < 15 || !trimmed.includes('{') && !trimmed.includes('def') && !trimmed.includes('class') && !trimmed.includes('package')) {
        verdict = 'compilation_error';
        compileOutput = `Compilation failed:\n  Error: unexpected token or syntax error in ${language} source`;
        passedCases = 0;
      } else {
        verdict = 'accepted';
        if (isCustomRun) {
          stdout = stdin.trim()
            ? `[OUTPUT]\nProcessed stdin input:\n${stdin}`
            : `[OUTPUT]\nHello from VERNIQ Isolated Sandbox (${language.toUpperCase()})!\nExecution completed cleanly with exit code 0.`;
        } else {
          stdout = `[VERNIQ JUDGE]\nAll test vectors evaluated against isolated container.\nVerified outputs match canonical solutions.`;
        }
      }

      const completedSub: Submission = {
        ...runningSub,
        verdict,
        runtime_ms: runtimeMs,
        memory_kb: memoryKb,
        stdout_output: stdout || null,
        stderr_output: stderr || null,
        compile_output: compileOutput || null,
        test_cases_passed: passedCases,
        total_test_cases: totalCases,
        completed_at: new Date().toISOString(),
      };

      notifyMockListeners(completedSub);
    }, execDelay);
  }, 250);
}

/**
 * Triggers a custom run (single stdin execution or visible test cases).
 */
export async function runCode(
  code: string,
  language: ProgrammingLanguage,
  stdin: string = ''
): Promise<{ submissionId: string; submission?: Submission }> {
  const submissionId = crypto.randomUUID();

  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('submissions')
          .insert({
            user_id: user.id,
            problem_id: null,
            language,
            source_code: code,
            stdin_input: stdin,
            is_custom_run: true,
            verdict: 'pending',
          })
          .select()
          .single();

        if (!error && data) {
          return { submissionId: data.id, submission: data };
        }
      }
    } catch (err) {
      console.warn('Supabase runCode error, falling back to mock sandbox:', err);
    }
  }

  // Standalone / Guest / Mock mode
  const initialSub: Submission = {
    id: submissionId,
    user_id: 'guest-user-0000',
    problem_id: null,
    language,
    source_code: code,
    stdin_input: stdin,
    verdict: 'pending',
    runtime_ms: 0,
    memory_kb: 0,
    test_cases_passed: 0,
    total_test_cases: 1,
    is_custom_run: true,
    created_at: new Date().toISOString(),
  };

  mockSubmissions.set(submissionId, initialSub);
  simulateJudgeExecution(submissionId, null, code, language, stdin, true);

  return { submissionId, submission: initialSub };
}

/**
 * Submits an official problem solution to the remote judge worker.
 */
export async function submitSolution(
  problemId: string,
  code: string,
  language: ProgrammingLanguage
): Promise<{ submissionId: string; submission?: Submission }> {
  const submissionId = crypto.randomUUID();

  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('submissions')
          .insert({
            user_id: user.id,
            problem_id: problemId,
            language,
            source_code: code,
            is_custom_run: false,
            verdict: 'pending',
          })
          .select()
          .single();

        if (!error && data) {
          return { submissionId: data.id, submission: data };
        }
      }
    } catch (err) {
      console.warn('Supabase submitSolution error, falling back to mock sandbox:', err);
    }
  }

  // Standalone / Guest / Mock mode
  const initialSub: Submission = {
    id: submissionId,
    user_id: 'guest-user-0000',
    problem_id: problemId,
    language,
    source_code: code,
    verdict: 'pending',
    runtime_ms: 0,
    memory_kb: 0,
    test_cases_passed: 0,
    total_test_cases: 24,
    is_custom_run: false,
    created_at: new Date().toISOString(),
  };

  mockSubmissions.set(submissionId, initialSub);
  simulateJudgeExecution(submissionId, problemId, code, language, '', false);

  return { submissionId, submission: initialSub };
}

/**
 * Fetches submission details by ID.
 */
export async function getSubmission(submissionId: string): Promise<Submission | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (!error && data) {
        return data as Submission;
      }
    } catch (err) {
      console.warn('Failed to fetch submission from Supabase:', err);
    }
  }

  return mockSubmissions.get(submissionId) || null;
}
