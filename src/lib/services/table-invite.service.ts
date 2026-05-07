import { prisma } from '@/lib/prisma'
import { customAlphabet } from 'nanoid'

// Generate short, readable invite codes
const generateInviteCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

export class TableInviteService {
  /**
   * Generate an invite code for a table session
   */
  static async generateInvite(params: {
    sessionId: string
    inviterId: string
  }): Promise<{ success: boolean; inviteCode?: string; shareUrl?: string; error?: string }> {
    try {
      // Verify session exists and is active
      const session = await prisma.tableSession.findUnique({
        where: { id: params.sessionId },
        include: { table: true }
      })

      if (!session) {
        return { success: false, error: 'Session not found' }
      }

      if (session.status !== 'active') {
        return { success: false, error: 'Session is not active' }
      }

      // Verify inviter is a participant
      const inviter = await prisma.sessionParticipant.findUnique({
        where: { id: params.inviterId }
      })

      if (!inviter || inviter.sessionId !== params.sessionId) {
        return { success: false, error: 'Inviter not in session' }
      }

      // Generate unique invite code
      const inviteCode = generateInviteCode()

      // Create invite record
      const invite = await prisma.tableSessionInvite.create({
        data: {
          sessionId: params.sessionId,
          inviterId: params.inviterId,
          inviteCode,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      })

      const APP_URL = process.env.APP_URL || 'http://localhost:3000'
      const shareUrl = `${APP_URL}/t/${session.tableId}?invite=${inviteCode}`

      return {
        success: true,
        inviteCode: invite.inviteCode,
        shareUrl
      }
    } catch (error) {
      console.error('Error generating invite:', error)
      return { success: false, error: 'Failed to generate invite' }
    }
  }

  /**
   * Accept an invite and join the session
   */
  static async acceptInvite(params: {
    inviteCode: string
    inviteeId: string
  }): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      // Find invite
      const invite = await prisma.tableSessionInvite.findUnique({
        where: { inviteCode: params.inviteCode },
        include: {
          session: true,
          inviter: true
        }
      })

      if (!invite) {
        return { success: false, error: 'Invalid invite code' }
      }

      // Check if expired
      if (invite.expiresAt < new Date()) {
        await prisma.tableSessionInvite.update({
          where: { id: invite.id },
          data: { status: 'EXPIRED' }
        })
        return { success: false, error: 'Invite has expired' }
      }

      // Check if already accepted
      if (invite.status === 'ACCEPTED') {
        return { success: false, error: 'Invite already used' }
      }

      // Check if session is still active
      if (invite.session.status !== 'active') {
        return { success: false, error: 'Session is no longer active' }
      }

      // Verify invitee is a participant
      const invitee = await prisma.sessionParticipant.findUnique({
        where: { id: params.inviteeId }
      })

      if (!invitee) {
        return { success: false, error: 'Invitee not found' }
      }

      // Mark invite as accepted
      await prisma.tableSessionInvite.update({
        where: { id: invite.id },
        data: {
          inviteeId: params.inviteeId,
          status: 'ACCEPTED',
          acceptedAt: new Date()
        }
      })

      return {
        success: true,
        sessionId: invite.sessionId
      }
    } catch (error) {
      console.error('Error accepting invite:', error)
      return { success: false, error: 'Failed to accept invite' }
    }
  }

  /**
   * Check if inviter qualifies for reward (2+ accepted invites)
   */
  static async checkInviteReward(inviterId: string): Promise<{
    qualifies: boolean
    acceptedCount: number
    rewardEarned: boolean
  }> {
    try {
      const acceptedInvites = await prisma.tableSessionInvite.findMany({
        where: {
          inviterId,
          status: 'ACCEPTED',
          rewardStatus: { in: ['PENDING', 'EARNED'] }
        }
      })

      const qualifies = acceptedInvites.length >= 2
      const rewardEarned = acceptedInvites.some(inv => inv.rewardStatus === 'EARNED')

      // If qualifies and hasn't earned yet, mark as earned
      if (qualifies && !rewardEarned) {
        await prisma.tableSessionInvite.updateMany({
          where: {
            inviterId,
            status: 'ACCEPTED',
            rewardStatus: 'PENDING'
          },
          data: {
            rewardStatus: 'EARNED'
          }
        })

        return {
          qualifies: true,
          acceptedCount: acceptedInvites.length,
          rewardEarned: true
        }
      }

      return {
        qualifies,
        acceptedCount: acceptedInvites.length,
        rewardEarned
      }
    } catch (error) {
      console.error('Error checking invite reward:', error)
      return {
        qualifies: false,
        acceptedCount: 0,
        rewardEarned: false
      }
    }
  }

  /**
   * Get invite statistics for a participant
   */
  static async getInviteStats(participantId: string) {
    try {
      const [sent, accepted, pending] = await Promise.all([
        prisma.tableSessionInvite.count({
          where: { inviterId: participantId }
        }),
        prisma.tableSessionInvite.count({
          where: {
            inviterId: participantId,
            status: 'ACCEPTED'
          }
        }),
        prisma.tableSessionInvite.count({
          where: {
            inviterId: participantId,
            status: 'PENDING',
            expiresAt: { gte: new Date() }
          }
        })
      ])

      return {
        sent,
        accepted,
        pending,
        conversionRate: sent > 0 ? (accepted / sent) * 100 : 0
      }
    } catch (error) {
      console.error('Error fetching invite stats:', error)
      throw error
    }
  }
}
