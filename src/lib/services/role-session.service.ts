/**
 * Role Session Override Service
 * Allows temporary session-level role switching
 * Reality Gap Fix: Priority 6
 * 
 * BEHAVIOR:
 * - Session-based only
 * - No permanent role change
 * - Resets on logout/session end
 * - Matches real kitchen behavior (fluid staffing)
 */

export type SessionRole = 'KITCHEN' | 'BAR' | 'EXPO' | 'WAITER' | 'MANAGER'

export interface RoleSession {
  userId: string
  originalRoles: string[]
  sessionRole: SessionRole
  sessionStartedAt: Date
  expiresAt: Date
}

export class RoleSessionService {
  private static sessions = new Map<string, RoleSession>()

  /**
   * Start role session override
   */
  static startRoleSession(
    userId: string,
    originalRoles: string[],
    sessionRole: SessionRole,
    durationMinutes: number = 480 // 8 hours default
  ): RoleSession {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000)

    const session: RoleSession = {
      userId,
      originalRoles,
      sessionRole,
      sessionStartedAt: now,
      expiresAt,
    }

    this.sessions.set(userId, session)

    console.log(`[RoleSession] Started ${sessionRole} session for user ${userId}`)

    return session
  }

  /**
   * End role session (revert to original roles)
   */
  static endRoleSession(userId: string): void {
    const session = this.sessions.get(userId)

    if (session) {
      this.sessions.delete(userId)
      console.log(`[RoleSession] Ended ${session.sessionRole} session for user ${userId}`)
    }
  }

  /**
   * Get active role session
   */
  static getActiveSession(userId: string): RoleSession | null {
    const session = this.sessions.get(userId)

    if (!session) return null

    // Check if expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(userId)
      console.log(`[RoleSession] Expired ${session.sessionRole} session for user ${userId}`)
      return null
    }

    return session
  }

  /**
   * Get effective role (session role if active, otherwise original)
   */
  static getEffectiveRole(userId: string, originalRoles: string[]): SessionRole | null {
    const session = this.getActiveSession(userId)
    return session ? session.sessionRole : null
  }

  /**
   * Check if user has session role
   */
  static hasSessionRole(userId: string, role: SessionRole): boolean {
    const session = this.getActiveSession(userId)
    return session ? session.sessionRole === role : false
  }

  /**
   * Switch role (end current, start new)
   */
  static switchRole(
    userId: string,
    originalRoles: string[],
    newRole: SessionRole,
    durationMinutes?: number
  ): RoleSession {
    this.endRoleSession(userId)
    return this.startRoleSession(userId, originalRoles, newRole, durationMinutes)
  }

  /**
   * Get all active sessions (for admin monitoring)
   */
  static getAllActiveSessions(): RoleSession[] {
    const now = new Date()
    const activeSessions: RoleSession[] = []

    for (const [userId, session] of this.sessions.entries()) {
      if (now <= session.expiresAt) {
        activeSessions.push(session)
      } else {
        // Clean up expired
        this.sessions.delete(userId)
      }
    }

    return activeSessions
  }

  /**
   * Extend session duration
   */
  static extendSession(userId: string, additionalMinutes: number): boolean {
    const session = this.sessions.get(userId)

    if (!session) return false

    session.expiresAt = new Date(session.expiresAt.getTime() + additionalMinutes * 60 * 1000)

    console.log(`[RoleSession] Extended ${session.sessionRole} session for user ${userId}`)

    return true
  }

  /**
   * Get session time remaining
   */
  static getTimeRemaining(userId: string): number | null {
    const session = this.getActiveSession(userId)

    if (!session) return null

    const remaining = session.expiresAt.getTime() - Date.now()
    return Math.max(0, remaining)
  }

  /**
   * Format time remaining for display
   */
  static formatTimeRemaining(userId: string): string | null {
    const remaining = this.getTimeRemaining(userId)

    if (remaining === null) return null

    const hours = Math.floor(remaining / (60 * 60 * 1000))
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }

    return `${minutes}m`
  }

  /**
   * Cleanup expired sessions (run periodically)
   */
  static cleanupExpired(): void {
    const now = new Date()
    let cleaned = 0

    for (const [userId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(userId)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[RoleSession] Cleaned up ${cleaned} expired sessions`)
    }
  }

  /**
   * Get role display name
   */
  static getRoleDisplayName(role: SessionRole): string {
    const names: Record<SessionRole, string> = {
      KITCHEN: 'Kitchen Staff',
      BAR: 'Bar Staff',
      EXPO: 'Expo/Pass',
      WAITER: 'Waiter/Server',
      MANAGER: 'Manager',
    }

    return names[role] || role
  }

  /**
   * Get available roles for session
   */
  static getAvailableRoles(): SessionRole[] {
    return ['KITCHEN', 'BAR', 'EXPO', 'WAITER', 'MANAGER']
  }
}
