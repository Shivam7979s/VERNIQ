import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Submission, ProgrammingLanguage } from '@/types';

const JUDGE_WORKER_URL =
  import.meta.env.VITE_JUDGE_SERVICE_URL || 'http://127.0.0.1:8080';

// In-memory active submissions store and listeners
const activeSubmissions = new Map<string, Submission>();
const submissionListeners = new Map<string, Set<(sub: Submission) => void>>();

export function subscribeToMockSubmission(
  submissionId: string,
  callback: (sub: Submission) => void
): () => void {
  if (!submissionListeners.has(submissionId)) {
    submissionListeners.set(submissionId, new Set());
  }
  const set = submissionListeners.get(submissionId)!;
  set.add(callback);

  const existing = activeSubmissions.get(submissionId);
  if (existing) {
    callback(existing);
  }

  return () => {
    set.delete(callback);
    if (set.size === 0) {
      submissionListeners.delete(submissionId);
    }
  };
}

function updateSubmissionState(sub: Submission) {
  activeSubmissions.set(sub.id, sub);
  const set = submissionListeners.get(sub.id);
  if (set) {
    set.forEach((cb) => cb(sub));
  }
}

/**
 * Executes code against the live judge execution worker.
 */
async function executeViaJudgeWorker(
  submissionId: string,
  language: ProgrammingLanguage,
  code: string,
  stdin: string,
  isCustomRun: boolean,
  testCases?: Array<{ input: string; expected_output?: string; is_sample?: boolean }>
): Promise<Submission> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(`${JUDGE_WORKER_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language,
        source_code: code,
        stdin_input: stdin,
        is_custom_run: isCustomRun,
        test_cases: testCases,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Worker responded with status ${response.status}`);
    }

    const result = await response.json();

    const completedSub: Submission = {
      id: submissionId,
      user_id: 'local-user',
      language,
      source_code: code,
      stdin_input: stdin,
      verdict: result.verdict,
      runtime_ms: result.runtime_ms || 0,
      memory_kb: result.memory_kb || 0,
      stdout_output: result.stdout_output || null,
      stderr_output: result.stderr_output || null,
      compile_output: result.compile_output || null,
      test_cases_passed: result.test_cases_passed ?? (result.verdict === 'accepted' ? 1 : 0),
      total_test_cases: result.total_test_cases ?? 1,
      is_custom_run: isCustomRun,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    updateSubmissionState(completedSub);
    return completedSub;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isTimeout = (err as Error)?.name === 'AbortError';
    const errorMsg = isTimeout
      ? '[ERROR] Judge worker request timed out after 10 seconds.'
      : '[ERROR] Judge worker is offline. Please ensure the backend execution worker daemon is running.';

    const failedSub: Submission = {
      id: submissionId,
      user_id: 'local-user',
      language,
      source_code: code,
      stdin_input: stdin,
      verdict: 'internal_error',
      runtime_ms: 0,
      memory_kb: 0,
      stdout_output: errorMsg,
      stderr_output: errorMsg,
      compile_output: null,
      test_cases_passed: 0,
      total_test_cases: testCases?.length || 1,
      is_custom_run: isCustomRun,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    updateSubmissionState(failedSub);
    return failedSub;
  }
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

  // Set initial 'pending' state
  const initialSub: Submission = {
    id: submissionId,
    user_id: 'anonymous',
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

  updateSubmissionState(initialSub);

  // Transition to 'running'
  setTimeout(() => {
    updateSubmissionState({
      ...initialSub,
      verdict: 'running',
    });
  }, 100);

  // If user is authenticated with Supabase, record in public.submissions
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('submissions').insert({
          id: submissionId,
          user_id: user.id,
          problem_id: null,
          language,
          source_code: code,
          stdin_input: stdin,
          is_custom_run: true,
          verdict: 'pending',
        });
      }
    } catch {
      // Non-blocking: continue execution via judge worker
    }
  }

  // Execute directly with real compiler worker
  const completedSub = await executeViaJudgeWorker(
    submissionId,
    language,
    code,
    stdin,
    true
  );

  // Sync execution results to Supabase
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('submissions')
          .update({
            verdict: completedSub.verdict,
            runtime_ms: completedSub.runtime_ms || 0,
            memory_kb: completedSub.memory_kb || 0,
            stdout_output: completedSub.stdout_output || null,
            stderr_output: completedSub.stderr_output || null,
            compile_output: completedSub.compile_output || null,
            completed_at: new Date().toISOString(),
          })
          .eq('id', submissionId);
      }
    } catch {
      // Non-blocking
    }
  }

  return { submissionId, submission: completedSub };
}

/**
 * Submits an official problem solution to the isolated judge worker.
 */
export async function submitSolution(
  problemId: string,
  code: string,
  language: ProgrammingLanguage
): Promise<{ submissionId: string; submission?: Submission }> {
  const submissionId = crypto.randomUUID();

  // Fetch real test cases from Supabase if available
  let testCases: Array<{ input: string; expected_output?: string; is_sample?: boolean }> = [];
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from('test_cases')
        .select('input, expected_output, is_sample')
        .eq('problem_id', problemId)
        .order('order_index', { ascending: true });

      if (data && data.length > 0) {
        testCases = data;
      }
    } catch {
      // Fallback
    }
  }

  const initialSub: Submission = {
    id: submissionId,
    user_id: 'anonymous',
    problem_id: problemId,
    language,
    source_code: code,
    verdict: 'pending',
    runtime_ms: 0,
    memory_kb: 0,
    test_cases_passed: 0,
    total_test_cases: testCases.length || 1,
    is_custom_run: false,
    created_at: new Date().toISOString(),
  };

  updateSubmissionState(initialSub);

  setTimeout(() => {
    updateSubmissionState({
      ...initialSub,
      verdict: 'running',
    });
  }, 100);

  // If user is authenticated with Supabase, record submission row
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('submissions').insert({
          id: submissionId,
          user_id: user.id,
          problem_id: problemId,
          language,
          source_code: code,
          is_custom_run: false,
          verdict: 'pending',
        });
      }
    } catch {
      // Non-blocking
    }
  }

  // Execute against all test cases with real compiler
  const completedSub = await executeViaJudgeWorker(
    submissionId,
    language,
    code,
    '',
    false,
    testCases.length > 0 ? testCases : undefined
  );

  // Sync terminal execution results back to Supabase
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('submissions')
          .update({
            verdict: completedSub.verdict,
            runtime_ms: completedSub.runtime_ms || 0,
            memory_kb: completedSub.memory_kb || 0,
            stdout_output: completedSub.stdout_output || null,
            stderr_output: completedSub.stderr_output || null,
            compile_output: completedSub.compile_output || null,
            test_cases_passed: completedSub.test_cases_passed || 0,
            total_test_cases: completedSub.total_test_cases || 1,
            completed_at: new Date().toISOString(),
          })
          .eq('id', submissionId);

        if (completedSub.verdict === 'accepted') {
          await supabase.from('user_problem_progress').upsert(
            {
              user_id: user.id,
              problem_id: problemId,
              status: 'solved',
              solved_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,problem_id' }
          );
        }
      }
    } catch (err) {
      console.warn('Failed to sync completed submission to Supabase:', err);
    }
  }

  return { submissionId, submission: completedSub };
}

/**
 * Fetches submission details by ID.
 */
export async function getSubmission(submissionId: string): Promise<Submission | null> {
  const local = activeSubmissions.get(submissionId);
  if (local) return local;

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
    } catch {
      // Silently fall back
    }
  }

  return null;
}
