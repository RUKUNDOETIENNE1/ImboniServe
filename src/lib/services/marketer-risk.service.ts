/**
 * Marketer Risk Service
 * Fraud detection and risk scoring (NON-BLOCKING)
 * Generates alerts but NEVER blocks payouts
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { RevenueEventService } from './revenue-event.service';
import { RevenueAlertService } from './revenue-alert.service';

const log = logger.child({ service: 'marketer-risk' });

// Risk scoring weights
const VELOCITY_WEIGHT = 20; // High payout frequency
const SPIKE_WEIGHT = 30; // Unusual payout amount
const NEW_ACCOUNT_WEIGHT = 15; // New marketer risk
const PATTERN_WEIGHT = 25; // Repeated patterns

// Thresholds
const VELOCITY_THRESHOLD = 3; // Max payouts in 24h
const SPIKE_MULTIPLIER = 3; // Payout > 3x average
const NEW_ACCOUNT_DAYS = 30; // Account age threshold
const PATTERN_SIMILARITY_PERCENT = 5; // ±5% similarity

export class MarketerRiskService {
  /**
   * Calculate risk score for a marketer
   * Returns 0-100 score (higher = riskier)
   */
  static async calculateRiskScore(marketerId: string): Promise<number> {
    const [marketer, payouts, riskProfile] = await Promise.all([
      prisma.professionalMarketer.findUnique({
        where: { id: marketerId }
      }),
      prisma.marketerPayout.findMany({
        where: { marketerId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.marketerRiskProfile.findUnique({
        where: { marketerId }
      })
    ]);

    if (!marketer || !riskProfile) {
      return 0;
    }

    let score = 0;
    const flags: string[] = [];

    // Rule 1: Velocity Check
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);
    const recentPayouts = payouts.filter(p => p.createdAt >= last24h);
    
    if (recentPayouts.length > VELOCITY_THRESHOLD) {
      score += VELOCITY_WEIGHT;
      flags.push('velocity_high');
    }

    // Rule 2: Spike Detection
    if (payouts.length > 0 && riskProfile.avgPayoutCents > 0) {
      const latestPayout = payouts[0];
      if (latestPayout.amountCents > riskProfile.avgPayoutCents * SPIKE_MULTIPLIER) {
        score += SPIKE_WEIGHT;
        flags.push('spike_detected');
      }
    }

    // Rule 3: New Account Risk
    const accountAgeDays = Math.floor(
      (Date.now() - marketer.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (accountAgeDays < NEW_ACCOUNT_DAYS && payouts.length > 0) {
      score += NEW_ACCOUNT_WEIGHT;
      flags.push('new_account');
    }

    // Rule 4: Pattern Detection
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentAmounts = payouts
      .filter(p => p.createdAt >= last7Days)
      .map(p => p.amountCents);

    if (recentAmounts.length >= 3) {
      const hasSimilarAmounts = this.detectSimilarAmounts(
        recentAmounts,
        PATTERN_SIMILARITY_PERCENT
      );
      if (hasSimilarAmounts) {
        score += PATTERN_WEIGHT;
        flags.push('pattern_detected');
      }
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (score >= 75) riskLevel = 'CRITICAL';
    else if (score >= 50) riskLevel = 'HIGH';
    else if (score >= 25) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    // Update risk profile
    await prisma.marketerRiskProfile.update({
      where: { marketerId },
      data: {
        riskScore: score,
        riskLevel,
        flags
      }
    });

    // Create alerts for high risk
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      await RevenueAlertService.createAlert({
        severity: riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        type: 'high_risk_marketer',
        message: `Marketer ${marketer.name} has ${riskLevel} risk score: ${score}`,
        entityType: 'marketer',
        entityId: marketerId,
        metadata: {
          riskScore: score,
          riskLevel,
          flags
        }
      });
    }

    // Emit event
    await RevenueEventService.emit({
      type: 'RISK_SCORE_UPDATED',
      entityType: 'marketer',
      entityId: marketerId,
      payload: {
        riskScore: score,
        riskLevel,
        flags
      }
    });

    log.info('Risk score calculated', {
      marketerId,
      riskScore: score,
      riskLevel,
      flags
    });

    return score;
  }

  /**
   * Update risk profile when payout is requested
   */
  static async updateRiskOnPayoutRequest(
    marketerId: string,
    amountCents: number
  ): Promise<void> {
    // Recalculate risk score
    await this.calculateRiskScore(marketerId);

    log.info('Risk updated on payout request', {
      marketerId,
      amountCents
    });
  }

  /**
   * Update risk profile when payout succeeds
   */
  static async updateRiskOnPayoutSuccess(
    marketerId: string,
    amountCents: number
  ): Promise<void> {
    const riskProfile = await prisma.marketerRiskProfile.findUnique({
      where: { marketerId }
    });

    if (!riskProfile) return;

    // Update payout stats
    const newTotal = riskProfile.totalPayouts + 1;
    const newAvg = Math.round(
      ((riskProfile.avgPayoutCents * riskProfile.totalPayouts) + amountCents) / newTotal
    );

    await prisma.marketerRiskProfile.update({
      where: { marketerId },
      data: {
        totalPayouts: newTotal,
        avgPayoutCents: newAvg,
        lastPayoutAt: new Date()
      }
    });

    // Recalculate risk score
    await this.calculateRiskScore(marketerId);

    log.info('Risk updated on payout success', {
      marketerId,
      totalPayouts: newTotal,
      avgPayoutCents: newAvg
    });
  }

  /**
   * Get risk profile for a marketer
   */
  static async getRiskProfile(marketerId: string) {
    return prisma.marketerRiskProfile.findUnique({
      where: { marketerId }
    });
  }

  /**
   * Get high-risk marketers (for admin dashboard)
   */
  static async getHighRiskMarketers(limit: number = 20) {
    return prisma.marketerRiskProfile.findMany({
      where: {
        riskLevel: {
          in: ['HIGH', 'CRITICAL']
        }
      },
      include: {
        marketer: true
      },
      orderBy: { riskScore: 'desc' },
      take: limit
    });
  }

  /**
   * Detect similar amounts (pattern detection helper)
   */
  private static detectSimilarAmounts(
    amounts: number[],
    similarityPercent: number
  ): boolean {
    if (amounts.length < 2) return false;

    for (let i = 0; i < amounts.length - 1; i++) {
      for (let j = i + 1; j < amounts.length; j++) {
        const diff = Math.abs(amounts[i] - amounts[j]);
        const avg = (amounts[i] + amounts[j]) / 2;
        const diffPercent = (diff / avg) * 100;

        if (diffPercent <= similarityPercent) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get risk statistics (for admin dashboard)
   */
  static async getRiskStatistics() {
    const [total, low, medium, high, critical] = await Promise.all([
      prisma.marketerRiskProfile.count(),
      prisma.marketerRiskProfile.count({ where: { riskLevel: 'LOW' } }),
      prisma.marketerRiskProfile.count({ where: { riskLevel: 'MEDIUM' } }),
      prisma.marketerRiskProfile.count({ where: { riskLevel: 'HIGH' } }),
      prisma.marketerRiskProfile.count({ where: { riskLevel: 'CRITICAL' } })
    ]);

    return {
      total,
      distribution: {
        low,
        medium,
        high,
        critical
      },
      percentages: {
        low: total > 0 ? Math.round((low / total) * 100) : 0,
        medium: total > 0 ? Math.round((medium / total) * 100) : 0,
        high: total > 0 ? Math.round((high / total) * 100) : 0,
        critical: total > 0 ? Math.round((critical / total) * 100) : 0
      }
    };
  }
}
