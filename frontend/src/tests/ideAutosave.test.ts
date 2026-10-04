/**
 * VERNIQ Standalone IDE Autosave Automated Verification Test Suite
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getIdeStorageKey,
  getLocalIdeState,
  saveLocalIdeState,
  clearLocalIdeState,
  ScratchTab,
} from '../lib/ideDraftService';

// Polyfill in-memory localStorage for Node test runner
const memoryStorage = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => memoryStorage.get(key) || null,
  setItem: (key: string, value: string) => memoryStorage.set(key, value),
  removeItem: (key: string) => memoryStorage.delete(key),
  clear: () => memoryStorage.clear(),
};

// @ts-ignore
globalThis.localStorage = mockLocalStorage;
// @ts-ignore
globalThis.window = globalThis;

describe('VERNIQ Standalone IDE Autosave Verification', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  // TEST 1: Storage Key Scoping
  test('1: IDE storage key correctly scopes by user or anonymous', () => {
    const keyUser = getIdeStorageKey('user-123');
    assert.equal(keyUser, 'verniq_ide_state_user-123');

    const keyAnon = getIdeStorageKey(undefined);
    assert.equal(keyAnon, 'verniq_ide_state_anonymous');
  });

  // TEST 2: Initial Save and Synchronous Retrieval
  test('2: Tabs, code, and active tab are saved and retrieved accurately', () => {
    const tabs: ScratchTab[] = [
      {
        id: 'tab-1',
        title: 'Main.java',
        language: 'java',
        code: 'public class Main { public static void main(String[] args) { System.out.println("Saved!"); } }',
        stdin: 'sample input 1',
      },
      {
        id: 'tab-2',
        title: 'test.py',
        language: 'python',
        code: 'print("Python user code")',
        stdin: '42',
      },
    ];

    const saved = saveLocalIdeState('user-1', tabs, 'tab-2', 1);
    assert.equal(saved, true);

    const loaded = getLocalIdeState('user-1');
    assert.notEqual(loaded, null);
    assert.equal(loaded?.activeTabId, 'tab-2');
    assert.equal(loaded?.tabs.length, 2);
    assert.equal(loaded?.tabs[0].code, tabs[0].code);
    assert.equal(loaded?.tabs[1].code, tabs[1].code);
    assert.equal(loaded?.tabs[1].stdin, '42');
  });

  // TEST 3: Browser Refresh Simulation (Zero Code Loss)
  test('3: Browser refresh restores user code instead of reverting to default code', () => {
    const userWrittenCode = 'function customSolution() { return 12345; }';
    const tabs: ScratchTab[] = [
      {
        id: 'tab-1',
        title: 'Code 1',
        language: 'typescript',
        code: userWrittenCode,
        stdin: 'test stdin',
      },
    ];

    saveLocalIdeState(undefined, tabs, 'tab-1', 1);

    // Simulate page refresh: new component mount reading from storage
    const refreshedState = getLocalIdeState(undefined);
    assert.notEqual(refreshedState, null);
    assert.equal(refreshedState?.tabs[0].code, userWrittenCode, 'User code must survive refresh');
    assert.notEqual(
      refreshedState?.tabs[0].code,
      '// default template',
      'Must NOT revert to default code'
    );
  });

  // TEST 4: Stale Revision Protection
  test('4: Stale save cannot overwrite newer revision in storage', () => {
    const tabsRev1: ScratchTab[] = [
      { id: 'tab-1', title: 'Code', language: 'python', code: 'print("v1")', stdin: '' },
    ];
    const tabsRev2: ScratchTab[] = [
      { id: 'tab-1', title: 'Code', language: 'python', code: 'print("v2")', stdin: '' },
    ];

    // Save revision 2 first
    saveLocalIdeState('user-1', tabsRev2, 'tab-1', 2);

    // Stale revision 1 attempts to save
    saveLocalIdeState('user-1', tabsRev1, 'tab-1', 1);

    // Loaded state should still be revision 2
    const loaded = getLocalIdeState('user-1');
    assert.equal(loaded?.tabs[0].code, 'print("v2")');
  });

  // TEST 5: Anonymous Migration to Authenticated User
  test('5: Anonymous drafts are migrated when user signs in', () => {
    const tabs: ScratchTab[] = [
      { id: 'tab-1', title: 'Code', language: 'cpp', code: 'int main() { return 0; }', stdin: '' },
    ];

    // User was anonymous when writing code
    saveLocalIdeState(undefined, tabs, 'tab-1', 1);

    // User signs in (userId: 'auth-user-999')
    const loaded = getLocalIdeState('auth-user-999');
    assert.notEqual(loaded, null);
    assert.equal(loaded?.tabs[0].code, tabs[0].code);

    // Verify key was migrated in localStorage
    const migratedRaw = mockLocalStorage.getItem('verniq_ide_state_auth-user-999');
    assert.notEqual(migratedRaw, null);
  });

  // TEST 6: Graceful Handling of Corrupted LocalStorage Data
  test('6: Corrupted localStorage data returns null without throwing', () => {
    mockLocalStorage.setItem('verniq_ide_state_anonymous', '{ invalid json: true ]');
    const loaded = getLocalIdeState(undefined);
    assert.equal(loaded, null);
  });

  // TEST 7: Clear Local State
  test('7: Clear local state removes data from localStorage', () => {
    const tabs: ScratchTab[] = [
      { id: 'tab-1', title: 'Code', language: 'go', code: 'package main', stdin: '' },
    ];
    saveLocalIdeState('user-1', tabs, 'tab-1', 1);
    clearLocalIdeState('user-1');

    const loaded = getLocalIdeState('user-1');
    assert.equal(loaded, null);
  });
});
