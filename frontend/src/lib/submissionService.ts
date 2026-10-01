import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Submission, ProgrammingLanguage } from '@/types';

const JUDGE_WORKER_URL =
  import.meta.env.VITE_JUDGE_SERVICE_URL || 'http://127.0.0.1:8080';

// In-memory active submissions store and listeners
const activeSubmissions = new Map<string, Submission>();
const submissionListeners = new Map<string, Set<(sub: Submission) => void>>();
const activeControllers = new Map<string, AbortController>();

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
 * Cancels an ongoing code execution both locally and on the judge worker.
 */
export async function cancelExecution(submissionId: string): Promise<boolean> {
  const controller = activeControllers.get(submissionId);
  if (controller) {
    controller.abort();
    activeControllers.delete(submissionId);
  }

  // Notify backend worker to kill isolated process tree
  try {
    await fetch(`${JUDGE_WORKER_URL}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ execution_id: submissionId }),
    });
  } catch {
    // Best-effort backend notification
  }

  const existing = activeSubmissions.get(submissionId);
  if (existing && (existing.verdict === 'pending' || existing.verdict === 'running')) {
    const cancelledSub: Submission = {
      ...existing,
      verdict: 'cancelled',
      stderr_output: 'Execution was cancelled by user.',
      completed_at: new Date().toISOString(),
    };
    updateSubmissionState(cancelledSub);
    return true;
  }
  return false;
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
  testCases?: Array<{ input: string; expected_output?: string; is_sample?: boolean }>,
  mode: 'RUN' | 'SUBMIT' = 'RUN',
  problemId?: string
): Promise<Submission> {
  const controller = new AbortController();
  const wallTimeoutMs = mode === 'SUBMIT' ? 180000 : 30000;
  const timeoutId = setTimeout(() => controller.abort(), wallTimeoutMs);

  try {
    const response = await fetch(`${JUDGE_WORKER_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        execution_id: submissionId,
        language,
        source_code: code,
        stdin_input: stdin,
        is_custom_run: isCustomRun,
        problem_id: problemId,
        test_cases: testCases,
        mode,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    activeControllers.delete(submissionId);

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
      telemetry: result.telemetry || null,
      first_failed_test: result.first_failed_test || result.firstFailedTest || null,
      firstFailedTest: result.firstFailedTest || result.first_failed_test || null,
      sample_test_results: result.sample_test_results || null,
    };

    updateSubmissionState(completedSub);
    return completedSub;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    activeControllers.delete(submissionId);
    const isAbort = (err as Error)?.name === 'AbortError';

    const failedSub: Submission = {
      id: submissionId,
      user_id: 'local-user',
      language,
      source_code: code,
      stdin_input: stdin,
      verdict: isAbort ? 'cancelled' : 'internal_error',
      runtime_ms: 0,
      memory_kb: 0,
      stdout_output: isAbort ? null : '[ERROR] Execution service temporarily unavailable. Please try again.',
      stderr_output: isAbort ? 'Execution was cancelled.' : '[ERROR] Judge worker is offline or timed out.',
      compile_output: null,
      test_cases_passed: 0,
      total_test_cases: testCases?.length || 1,
      is_custom_run: isCustomRun,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      telemetry: null,
    };

    updateSubmissionState(failedSub);
    return failedSub;
  }
}

/**
 * Triggers a custom Run Code execution (ephemeral, zero database persistence).
 * Purpose: Ultra-fast developer iteration.
 */
export async function runCode(
  code: string,
  language: ProgrammingLanguage,
  stdin: string = '',
  testCases?: Array<{ input: string; expected_output?: string; is_sample?: boolean }>,
  submissionIdOverride?: string
): Promise<{ submissionId: string; submission?: Submission }> {
  const submissionId = submissionIdOverride || crypto.randomUUID();

  // Instant UI state transition to running
  const initialSub: Submission = {
    id: submissionId,
    user_id: 'ephemeral',
    problem_id: null,
    language,
    source_code: code,
    stdin_input: stdin,
    verdict: 'running',
    runtime_ms: 0,
    memory_kb: 0,
    test_cases_passed: 0,
    total_test_cases: testCases?.length || 1,
    is_custom_run: true,
    created_at: new Date().toISOString(),
  };

  updateSubmissionState(initialSub);

  // Directly execute against judge worker (no Supabase blocking roundtrips)
  const completedSub = await executeViaJudgeWorker(
    submissionId,
    language,
    code,
    stdin,
    true,
    testCases,
    'RUN'
  );

  return { submissionId, submission: completedSub };
}

/**
 * Submits an official problem solution.
 * Purpose: Canonical evaluation with asynchronous background persistence.
 */
export async function submitSolution(
  problemId: string,
  code: string,
  language: ProgrammingLanguage,
  userId?: string,
  testCasesList?: Array<{ input: string; expected_output?: string; is_sample?: boolean }>,
  submissionIdOverride?: string,
  canonicalCount?: number
): Promise<{ submissionId: string; submission?: Submission }> {
  const submissionId = submissionIdOverride || crypto.randomUUID();

  // If explicit testCasesList was supplied, use it; otherwise judge worker will load full canonical suite using service_role on backend
  const hasExplicitCases = Boolean(testCasesList && testCasesList.length > 0);
  const initialTotal = hasExplicitCases ? testCasesList!.length : (canonicalCount || 1);

  if (import.meta.env.DEV) {
    console.log('[VERNIQ SUBMIT TRACE]', {
      stage: 'submitSolution',
      problemId,
      hasExplicitCases,
      explicitCasesCount: testCasesList?.length ?? 0,
      canonicalCount: canonicalCount ?? 0,
      mode: 'SUBMIT',
    });
  }

  const initialSub: Submission = {
    id: submissionId,
    user_id: userId || 'anonymous',
    problem_id: problemId,
    language,
    source_code: code,
    verdict: 'running',
    runtime_ms: 0,
    memory_kb: 0,
    test_cases_passed: 0,
    total_test_cases: initialTotal,
    is_custom_run: false,
    created_at: new Date().toISOString(),
  };

  updateSubmissionState(initialSub);

  // Execute against canonical test suite with isolated compiler worker
  // When testCasesList is undefined, worker loads the full canonical suite securely on the backend
  const completedSub = await executeViaJudgeWorker(
    submissionId,
    language,
    code,
    '',
    false,
    hasExplicitCases ? testCasesList : undefined,
    'SUBMIT',
    problemId
  );

  // Asynchronous non-blocking background persistence to Supabase
  if (isSupabaseConfigured() && userId) {
    (async () => {
      try {
        await supabase.from('submissions').insert({
          id: submissionId,
          user_id: userId,
          problem_id: problemId,
          language,
          source_code: code,
          is_custom_run: false,
          verdict: completedSub.verdict,
          runtime_ms: completedSub.runtime_ms || 0,
          memory_kb: completedSub.memory_kb || 0,
          stdout_output: completedSub.stdout_output || null,
          stderr_output: completedSub.stderr_output || null,
          compile_output: completedSub.compile_output || null,
          test_cases_passed: completedSub.test_cases_passed || 0,
          total_test_cases: completedSub.total_test_cases || 1,
          completed_at: completedSub.completed_at || new Date().toISOString(),
        });

        if (completedSub.verdict === 'accepted') {
          await supabase.from('user_problem_progress').upsert(
            {
              user_id: userId,
              problem_id: problemId,
              status: 'solved',
              solved_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,problem_id' }
          );
        }
      } catch (err) {
        console.warn('Asynchronous submission background persistence warning:', err);
      }
    })();
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
