/**
 * VERNIQ Problem Code Draft Persistence Service
 * Scoped by (user, problem, language).
 * Provides dual-layer persistence:
 * 1. Synchronous localStorage cache for zero-latency instant restoration on mount/refresh
 * 2. Supabase public.problem_code_drafts table for cloud vault persistence
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';

const LOCAL_STORAGE_PREFIX = 'verniq_code_draft';

export function getDraftStorageKey(
  userId: string | undefined,
  problemId: string,
  language: string
): string {
  const normalizedUser = userId || 'anonymous';
  return `${LOCAL_STORAGE_PREFIX}_${normalizedUser}_${problemId}_${language}`;
}

export interface DraftRecord {
  code: string;
  updatedAt: string;
  revision?: number;
}

/**
 * Loads the saved draft for the given user, problem, and language.
 * Checks localStorage first for instantaneous sync retrieval.
 * If authenticated and no user-specific draft exists, checks anonymous draft as fallback.
 */
export function getLocalDraft(
  userId: string | undefined,
  problemId: string,
  language: string
): string | null {
  if (typeof window === 'undefined' || !problemId || !language) return null;
  try {
    const key = getDraftStorageKey(userId, problemId, language);
    let raw = localStorage.getItem(key);

    // Fallback: If user is authenticated but has no draft yet under their user ID,
    // check if an anonymous draft exists for this problem and language.
    if (!raw && userId) {
      const anonKey = getDraftStorageKey(undefined, problemId, language);
      raw = localStorage.getItem(anonKey);
      if (raw) {
        // Migrate anonymous draft to user-scoped key
        try {
          localStorage.setItem(key, raw);
        } catch {
          // Ignore quota error
        }
      }
    }

    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.code === 'string') {
        return parsed.code;
      }
    } catch {
      // Fallback for plain string storage
      return raw;
    }
  } catch (err) {
    console.warn('[VERNIQ DRAFT] Failed to read localStorage draft:', err);
  }
  return null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUUID(val?: string | null): boolean {
  return typeof val === 'string' && UUID_REGEX.test(val);
}

/**
 * Asynchronously loads draft from Supabase database.
 * If found and different/newer than local, updates local cache and returns remote code.
 */
export async function fetchRemoteDraft(
  userId: string | undefined,
  problemId: string,
  language: string
): Promise<string | null> {
  if (!isSupabaseConfigured() || !userId || !isUUID(userId) || !isUUID(problemId) || !language) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('problem_code_drafts')
      .select('code, updated_at')
      .eq('user_id', userId)
      .eq('problem_id', problemId)
      .eq('language', language)
      .maybeSingle();

    if (error) {
      console.warn('[VERNIQ DRAFT] Error fetching remote draft:', error.message);
      return null;
    }

    if (data && typeof data.code === 'string') {
      // Cache remote draft locally
      try {
        const key = getDraftStorageKey(userId, problemId, language);
        localStorage.setItem(
          key,
          JSON.stringify({
            code: data.code,
            updatedAt: data.updated_at || new Date().toISOString(),
          })
        );
      } catch {
        // Ignore localStorage quota errors
      }
      return data.code;
    }
  } catch (err) {
    console.warn('[VERNIQ DRAFT] Unexpected error loading remote draft:', err);
  }

  return null;
}

/**
 * Saves draft code for the given user, problem, and language.
 * Saves to localStorage immediately, and syncs to Supabase.
 * Respects revision tracking to ensure stale saves cannot overwrite newer edits.
 */
export async function saveDraft(
  userId: string | undefined,
  problemId: string,
  language: string,
  code: string,
  revision?: number,
  signal?: AbortSignal
): Promise<{ success: boolean; error?: Error }> {
  if (!problemId || !language) {
    return { success: false, error: new Error('Missing problemId or language') };
  }

  const now = new Date().toISOString();
  let localWriteSucceeded = false;

  // 1. Synchronous localStorage persistence (instant survival across reloads)
  try {
    const key = getDraftStorageKey(userId, problemId, language);
    const raw = localStorage.getItem(key);
    if (raw && revision !== undefined) {
      try {
        const existing = JSON.parse(raw);
        if (existing && typeof existing.revision === 'number' && existing.revision > revision) {
          // Stale save protection: A newer revision is already saved locally!
          return { success: true };
        }
      } catch {
        // Plain string fallback
      }
    }

    localStorage.setItem(
      key,
      JSON.stringify({
        code,
        updatedAt: now,
        revision,
      })
    );
    localWriteSucceeded = true;
  } catch (err) {
    console.warn('[VERNIQ DRAFT] localStorage write failed:', err);
  }

  // 2. Cloud persistence to Supabase problem_code_drafts if authenticated and UUID valid
  if (isSupabaseConfigured() && userId && isUUID(userId) && isUUID(problemId)) {
    try {
      if (signal?.aborted) {
        return { success: false, error: new Error('Save aborted') };
      }

      let query = supabase
        .from('problem_code_drafts')
        .upsert(
          {
            user_id: userId,
            problem_id: problemId,
            language,
            code,
            updated_at: now,
          },
          { onConflict: 'user_id,problem_id,language' }
        );

      if (signal) {
        query = query.abortSignal(signal);
      }

      const { error } = await query;

      if (error) {
        console.error('[VERNIQ DRAFT] Remote upsert failed:', error.message);
        return { success: false, error: new Error(error.message) };
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError' || signal?.aborted) {
        return { success: false, error: new Error('Save aborted') };
      }
      console.error('[VERNIQ DRAFT] Cloud sync exception:', err);
      return { success: false, error: err as Error };
    }
  } else if (!localWriteSucceeded) {
    // If local write failed and remote not configured/used, report persistence failure
    return { success: false, error: new Error('Persistence write failed') };
  }

  return { success: true };
}

/**
 * Clears saved draft for the given user, problem, and language (e.g. on Reset).
 */
export async function deleteDraft(
  userId: string | undefined,
  problemId: string,
  language: string
): Promise<void> {
  if (!problemId || !language) return;

  try {
    const key = getDraftStorageKey(userId, problemId, language);
    localStorage.removeItem(key);
    // Also remove anonymous key if authenticated
    if (userId) {
      const anonKey = getDraftStorageKey(undefined, problemId, language);
      localStorage.removeItem(anonKey);
    }
  } catch {
    // Ignore
  }

  if (isSupabaseConfigured() && userId && isUUID(userId) && isUUID(problemId)) {
    try {
      await supabase
        .from('problem_code_drafts')
        .delete()
        .eq('user_id', userId)
        .eq('problem_id', problemId)
        .eq('language', language);
    } catch (err) {
      console.warn('[VERNIQ DRAFT] Failed to delete remote draft:', err);
    }
  }
}
