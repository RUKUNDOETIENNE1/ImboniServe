/**
 * Revenue Alert Service
 * Manages alerts for Revenue Operations Layer
 * Non-blocking notifications for admin review
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { AlertSeverity } from '@prisma/client';
import { RevenueEventService } from './revenue-event.service';

const log = logger.child({ service: 'revenue-alert' });

export class RevenueAlertService {
  /**
   * Create an alert
   */
  static async createAlert(params: {
    severity: AlertSeverity;
    type: string;
    message: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await prisma.revenueAlert.create({
        data: {
          severity: params.severity,
          type: params.type,
          message: params.message,
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: params.metadata || {}
        }
      });

      // Emit event
      await RevenueEventService.emit({
        type: 'ALERT_TRIGGERED',
        entityType: params.entityType,
        entityId: params.entityId,
        payload: {
          severity: params.severity,
          type: params.type,
          message: params.message
        }
      });

      log.warn('Revenue alert created', {
        severity: params.severity,
        type: params.type,
        entityId: params.entityId
      });
    } catch (error) {
      log.error('Failed to create revenue alert', { error, ...params });
    }
  }

  /**
   * Get unacknowledged alerts
   */
  static async getUnacknowledgedAlerts(severity?: AlertSeverity) {
    return prisma.revenueAlert.findMany({
      where: {
        acknowledged: false,
        ...(severity && { severity })
      },
      orderBy: [
        { severity: 'desc' }, // CRITICAL first
        { createdAt: 'desc' }
      ]
    });
  }

  /**
   * Get all alerts (with pagination)
   */
  static async getAlerts(params: {
    severity?: AlertSeverity;
    acknowledged?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const { severity, acknowledged, limit = 50, offset = 0 } = params;

    return prisma.revenueAlert.findMany({
      where: {
        ...(severity && { severity }),
        ...(acknowledged !== undefined && { acknowledged })
      },
      orderBy: [
        { acknowledged: 'asc' }, // Unacknowledged first
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string
  ): Promise<void> {
    await prisma.revenueAlert.update({
      where: { id: alertId },
      data: {
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: new Date()
      }
    });

    log.info('Alert acknowledged', { alertId, acknowledgedBy });
  }

  /**
   * Get alert count by severity
   */
  static async getAlertStats() {
    const [critical, warning, info, unacknowledged] = await Promise.all([
      prisma.revenueAlert.count({ where: { severity: 'CRITICAL', acknowledged: false } }),
      prisma.revenueAlert.count({ where: { severity: 'WARNING', acknowledged: false } }),
      prisma.revenueAlert.count({ where: { severity: 'INFO', acknowledged: false } }),
      prisma.revenueAlert.count({ where: { acknowledged: false } })
    ]);

    return {
      critical,
      warning,
      info,
      total: unacknowledged
    };
  }
}
