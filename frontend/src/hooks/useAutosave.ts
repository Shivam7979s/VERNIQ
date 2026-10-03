/**
 * VERNIQ Autosave Hook
 * Handles:
 * 1. Debounced code saving (800ms standard delay)
 * 2. Revision tracking preventing stale save race conditions
 * 3. Save status lifecycle: 'saved' | 'saving' | 'unsaved' | 'error'
 * 4. Immediate flush on unmount or navigation
 * 5. Retry on failure
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { saveDraft, deleteDraft } from '@/lib/draftService';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface UseAutosaveProps {
  userId?: string;
  problemId?: string;
  language: string;
  debounceMs?: number;
}

export function useAutosave({
  userId,
  problemId,
  language,
  debounceMs = 800,
}: UseAutosaveProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  const revisionRef = useRef<number>(0);
  const currentCodeRef = useRef<string>('');
  const lastSavedCodeRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync refs when problemId, language, or userId changes
  const activeProblemIdRef = useRef<string | undefined>(problemId);
  const activeLanguageRef = useRef<string>(language);
  const activeUserIdRef = useRef<string | undefined>(userId);

  /**
   * Internal save execution with revision validation and target isolation
   */
  const executeSave = useCallback(
    async (
      codeToSave: string,
      targetRevision: number,
      targetPid: string,
      targetLang: string,
      targetUid?: string
    ) => {
      if (!targetPid || !targetLang) return;

      // Abort previous in-flight remote network request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Only transition active view to saving if target matches active session
      if (
        activeProblemIdRef.current === targetPid &&
        activeLanguageRef.current === targetLang
      ) {
        setSaveStatus('saving');
      }

      try {
        const result = await saveDraft(
          targetUid,
          targetPid,
          targetLang,
          codeToSave,
          targetRevision,
          controller.signal
        );

        // Check race condition: if user edited again while save was in-flight, ignore stale response
        if (
          targetRevision === revisionRef.current &&
          activeProblemIdRef.current === targetPid &&
          activeLanguageRef.current === targetLang
        ) {
          if (result.success) {
            lastSavedCodeRef.current = codeToSave;
            setSaveStatus('saved');
          } else if (result.error?.message !== 'Save aborted') {
            setSaveStatus('error');
          }
        }
      } catch (err) {
        const isAbort =
          (err as Error)?.name === 'AbortError' ||
          (err as Error)?.message === 'Save aborted';
        if (
          !isAbort &&
          targetRevision === revisionRef.current &&
          activeProblemIdRef.current === targetPid &&
          activeLanguageRef.current === targetLang
        ) {
          setSaveStatus('error');
        }
      }
    },
    []
  );

  /**
   * Flush pending changes for a specific target
   */
  const flushSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const codeToSave = currentCodeRef.current;
    const pid = activeProblemIdRef.current;
    const lang = activeLanguageRef.current;
    const uid = activeUserIdRef.current;

    if (
      pid &&
      lang &&
      typeof codeToSave === 'string' &&
      codeToSave !== lastSavedCodeRef.current
    ) {
      const nextRevision = ++revisionRef.current;
      executeSave(codeToSave, nextRevision, pid, lang, uid);
    }
  }, [executeSave]);

  // When problemId, language, or userId changes, flush pending edits on previous target
  useEffect(() => {
    const prevPid = activeProblemIdRef.current;
    const prevLang = activeLanguageRef.current;
    const prevUid = activeUserIdRef.current;
    const prevCode = currentCodeRef.current;

    const targetChanged =
      prevPid !== problemId || prevLang !== language || prevUid !== userId;

    if (targetChanged) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (
        prevPid &&
        prevLang &&
        typeof prevCode === 'string' &&
        prevCode !== lastSavedCodeRef.current
      ) {
        saveDraft(prevUid, prevPid, prevLang, prevCode, revisionRef.current);
        lastSavedCodeRef.current = prevCode;
      }

      // If switching problem or language, abort in-flight remote request and reset revision
      if (prevPid !== problemId || prevLang !== language) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        revisionRef.current = 0;
        setSaveStatus('saved');
      }
    }

    activeProblemIdRef.current = problemId;
    activeLanguageRef.current = language;
    activeUserIdRef.current = userId;
  }, [problemId, language, userId]);

  /**
   * Called on every editor keystroke
   */
  const onCodeChange = useCallback(
    (newCode: string) => {
      currentCodeRef.current = newCode;
      const targetPid = activeProblemIdRef.current;
      const targetLang = activeLanguageRef.current;
      const targetUid = activeUserIdRef.current;

      if (!targetPid || !targetLang) return;

      // If code matches the last saved version, mark as saved immediately
      if (newCode === lastSavedCodeRef.current) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        setSaveStatus('saved');
        return;
      }

      // Transition to unsaved
      setSaveStatus('unsaved');

      // Reset debounce timer on every keystroke
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Cancel in-flight remote network request since new edits have occurred
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Advance revision for this edit
      const nextRevision = ++revisionRef.current;

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        executeSave(newCode, nextRevision, targetPid, targetLang, targetUid);
      }, debounceMs);
    },
    [debounceMs, executeSave]
  );

  /**
   * Initializes or restores code for an active problem and language session
   */
  const initCode = useCallback((restoredCode: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    currentCodeRef.current = restoredCode;
    lastSavedCodeRef.current = restoredCode;
    revisionRef.current = 0;
    setSaveStatus('saved');
  }, []);

  /**
   * Resets draft (e.g., clicking 'Reset to starter template')
   */
  const resetDraft = useCallback(
    async (starterCode: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      const pid = activeProblemIdRef.current;
      const lang = activeLanguageRef.current;
      const uid = activeUserIdRef.current;

      currentCodeRef.current = starterCode;
      lastSavedCodeRef.current = starterCode;
      revisionRef.current = 0;

      if (pid && lang) {
        await deleteDraft(uid, pid, lang);
      }

      setSaveStatus('saved');
    },
    []
  );

  /**
   * Retries saving after an error
   */
  const retrySave = useCallback(() => {
    const pid = activeProblemIdRef.current;
    const lang = activeLanguageRef.current;
    const uid = activeUserIdRef.current;
    if (pid && lang && typeof currentCodeRef.current === 'string') {
      const nextRevision = ++revisionRef.current;
      executeSave(currentCodeRef.current, nextRevision, pid, lang, uid);
    }
  }, [executeSave]);

  // Synchronously flush pending code on browser window beforeunload or pagehide
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      const codeToSave = currentCodeRef.current;
      const pid = activeProblemIdRef.current;
      const lang = activeLanguageRef.current;
      const uid = activeUserIdRef.current;

      if (
        pid &&
        lang &&
        typeof codeToSave === 'string' &&
        codeToSave !== lastSavedCodeRef.current
      ) {
        saveDraft(uid, pid, lang, codeToSave, revisionRef.current);
        lastSavedCodeRef.current = codeToSave;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, []);

  // Flush save on component unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const codeToSave = currentCodeRef.current;
      const pid = activeProblemIdRef.current;
      const lang = activeLanguageRef.current;
      const uid = activeUserIdRef.current;

      if (
        pid &&
        lang &&
        typeof codeToSave === 'string' &&
        codeToSave !== lastSavedCodeRef.current
      ) {
        saveDraft(uid, pid, lang, codeToSave, revisionRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    onCodeChange,
    flushSave,
    initCode,
    resetDraft,
    retrySave,
  };
}
