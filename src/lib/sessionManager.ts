/**
 * Table Session Management
 * Handles group ordering sessions with localStorage persistence
 */

import { v4 as uuidv4 } from 'uuid';

const TEMP_ID_KEY = 'imboni_participant_temp_id';
const SESSION_KEY = 'imboni_active_session';

export interface SessionInfo {
  sessionId: string;
  participantId: string;
  tempId: string;
  tableId: string;
  tableName?: string;
  participantName?: string;
}

/**
 * Get or create a unique temporary ID for this device/browser
 */
export function getTempId(): string {
  if (typeof window === 'undefined') return uuidv4();

  try {
    let tempId = localStorage.getItem(TEMP_ID_KEY);
    if (!tempId) {
      tempId = uuidv4();
      localStorage.setItem(TEMP_ID_KEY, tempId);
    }
    return tempId;
  } catch (error) {
    console.error('Failed to get/create tempId:', error);
    return uuidv4();
  }
}

/**
 * Save active session info
 */
export function saveSessionInfo(sessionInfo: SessionInfo): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionInfo));
  } catch (error) {
    console.error('Failed to save session info:', error);
  }
}

/**
 * Get active session info
 */
export function getSessionInfo(): SessionInfo | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get session info:', error);
    return null;
  }
}

/**
 * Clear session info (when session is closed)
 */
export function clearSessionInfo(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear session info:', error);
  }
}

/**
 * Join or create a table session
 */
export async function joinTableSession(
  tableId: string,
  branchId: string,
  name?: string
): Promise<SessionInfo | null> {
  try {
    const tempId = getTempId();

    const response = await fetch('/api/session/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId,
        branchId,
        tempId,
        name,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to join session');
    }

    const data = await response.json();
    const sessionInfo: SessionInfo = {
      sessionId: data.sessionId,
      participantId: data.participantId,
      tempId,
      tableId,
      tableName: data.tableName,
      participantName: data.participantName,
    };

    saveSessionInfo(sessionInfo);
    return sessionInfo;
  } catch (error) {
    console.error('Failed to join table session:', error);
    return null;
  }
}

/**
 * Check if session is still active
 */
export async function validateSession(sessionId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/session/validate?sessionId=${sessionId}`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.isActive;
  } catch (error) {
    console.error('Failed to validate session:', error);
    return false;
  }
}

/**
 * Get group order summary for current session
 */
export async function getGroupOrderSummary(sessionId: string) {
  try {
    const response = await fetch(`/api/session/summary?sessionId=${sessionId}`);
    if (!response.ok) throw new Error('Failed to get summary');
    return await response.json();
  } catch (error) {
    console.error('Failed to get group order summary:', error);
    return null;
  }
}

/**
 * Update participant name locally and on server
 */
export async function setParticipantName(name: string): Promise<void> {
  const info = getSessionInfo();
  if (!info) return;
  const next = { ...info, participantName: name };
  saveSessionInfo(next);

  // Persist to server
  try {
    await fetch('/api/session/update-participant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: info.participantId,
        name,
      }),
    });
  } catch (error) {
    console.error('Failed to update participant name on server:', error);
  }
}
