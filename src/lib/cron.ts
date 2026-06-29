import { ReportService } from './services/report.service'
import { NotificationService } from './services/notification.service'
import { InventoryService } from './services/inventory.service'
import { AffiliateService } from './services/affiliate.service'
import { getOrGenerateInsight } from './services/insight.service'
import { FeatureFlagService } from './services/feature-flag.service'
import { ReconciliationService } from './services/reconciliation.service'
import { InTouchService } from './services/intouch.service'
import { DiningSessionSlipService } from './services/dining-session-slip.service'
import { TapLeaveFinalizationService } from './services/tap-leave-finalization.service'
import { WhatsAppCloudService } from './services/whatsapp-cloud.service'
import { AlertDeliveryService } from './services/alert-delivery.service'
import { runAutopilotCheck } from './cron/autopilot-features'
import { prisma } from './prisma'
import { logger } from './logger'
import { PaymentTransactionStatus } from '@prisma/client'

function toLocalHHMM(date: Date, timezone: string): string {
  try {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: timezone })
  } catch {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' })
  }
}

function toLocalDateString(date: Date, timezone: string): string {
  try {
    return date.toLocaleDateString('en-CA', { timeZone: timezone })
  } catch {
    return date.toLocaleDateString('en-CA', { timeZone: 'Africa/Kigali' })
  }
}

export class CronService {
  private static intervals: Map<string, NodeJS.Timeout> = new Map()

  static start() {
    if (process.env.CRON_WORKER !== 'true') {
      logger.info('Skipping in-process cron (CRON_WORKER!=true)')
      return
    }
    if (process.env.VERCEL === '1') {
      logger.info('Skipping in-process cron on Vercel')
      return
    }
    logger.info('Starting cron jobs...')

    this.schedulePerBusinessDailyReports()
    this.scheduleStockAlerts()
    this.scheduleBackups()
    this.scheduleAffiliateApprovals()
    this.scheduleInsightGeneration()
    this.scheduleQROrderRelease()
    this.scheduleFeatureFlagCheck()
    this.scheduleReconciliation()
    this.scheduleAutopilotFeatures()
    this.scheduleSalesTrialStatusUpdate()
    this.scheduleContentPublishing()
    this.scheduleTrendingNotifications()
    this.scheduleTapLeavePaymentReconcile()
    this.scheduleTapLeaveFinalizationSweeper()
    this.scheduleWhatsappReorderFunnel()
    this.scheduleReservationNoShowForfeit()
    this.scheduleGenericPaymentWatchdog()

    logger.info('All cron jobs started')
  }

  private static scheduleTrendingNotifications() {
    const TRENDING_THRESHOLD = 20 // engagements in last hour to be considered trending

    const check = async () => {
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

        // Find published posts with high engagement in last hour
        const trendingRaw: Array<{ postId: string; cnt: bigint }> = await prisma.$queryRaw`
          SELECT pe."postId", COUNT(*) AS cnt
          FROM "PostEngagement" pe
          JOIN "ContentPost" cp ON cp.id = pe."postId"
          WHERE pe."createdAt" > ${oneHourAgo}
            AND cp.status = 'PUBLISHED'
          GROUP BY pe."postId"
          HAVING COUNT(*) >= ${TRENDING_THRESHOLD}
        `

        for (const row of trendingRaw) {
          const post: any = await (prisma as any).contentPost.findUnique({
            where: { id: row.postId },
            select: { id: true, title: true, businessId: true }
          })
          if (!post) continue

          const business = await prisma.business.findUnique({
            where: { id: post.businessId },
            select: { id: true, name: true, cmsNotifyTrending: true, phone: true }
          })
          if (!business?.cmsNotifyTrending || !business.phone) continue

          // Send WhatsApp ping via Twilio (best-effort)
          try {
            const { WhatsAppOrderService } = await import('./services/whatsapp-order.service')
            await WhatsAppOrderService.sendMessage(
              business.phone,
              `📈 *Trending Alert!*\n\nYour post "${post.title || 'Untitled'}" is trending on the Imboni feed — it has received ${Number(row.cnt)} engagements in the last hour.\n\nLog in to your CMS to see analytics: ${process.env.NEXTAUTH_URL || ''}/dashboard/cms`
            )
          } catch (sendErr) {
            logger.warn('Failed to send trending notification', { postId: post.id, sendErr: String(sendErr) })
          }
        }
      } catch (error) {
        logger.error('Trending notification scheduler error', { error: String(error) })
      }
    }

    // Run every hour
    const interval = setInterval(check, 60 * 60 * 1000)
    this.intervals.set('trending-notifications', interval)
  }

  private static scheduleContentPublishing() {
    const tick = async () => {
      try {
        const now = new Date()
        // Publish
        await (prisma as any).contentPost.updateMany({
          where: {
            status: { in: ['APPROVED', 'SCHEDULED'] },
            publishAt: { lte: now },
            OR: [
              { expireAt: null },
              { expireAt: { gt: now } },
            ],
          },
          data: { status: 'PUBLISHED' },
        })

        // Expire
        await (prisma as any).contentPost.updateMany({
          where: {
            status: 'PUBLISHED',
            expireAt: { lte: now },
          },
          data: { status: 'EXPIRED' },
        })
      } catch (error) {
        logger.error('Content publishing scheduler error', { error: String(error) })
      }
    }

    const interval = setInterval(tick, 60 * 1000)
    this.intervals.set('content-publishing', interval)
    tick()
  }

  private static scheduleSalesTrialStatusUpdate() {
    const check = async () => {
      try {
        const now = new Date()
        const threeDaysAhead = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

        // 1) Fast path: businesses with explicit trialEndDate within 3 days
        const updateManyArgs: any = {
          where: {
            salesStatus: 'Trial Active',
            trialEndDate: { gte: now, lte: threeDaysAhead },
          },
          data: { salesStatus: 'Trial Ending Soon' },
        }
        await prisma.business.updateMany(updateManyArgs)

        // 2) Derive end date from trialStartDate when trialEndDate is null
        const findArgs: any = {
          where: {
            salesStatus: 'Trial Active',
            trialEndDate: null,
            trialStartDate: { not: null },
          },
          select: { id: true, trialStartDate: true },
        }
        const candidates: any[] = await prisma.business.findMany(findArgs)

        for (const biz of candidates) {
          if (!biz.trialStartDate) continue
          const end = new Date(new Date(biz.trialStartDate).getTime() + 14 * 24 * 60 * 60 * 1000)
          if (end.getTime() >= now.getTime() && end.getTime() <= threeDaysAhead.getTime()) {
            await prisma.business.update({ where: { id: biz.id }, data: { salesStatus: 'Trial Ending Soon' } } as any)
          }
        }
      } catch (err) {
        logger.error('Sales trial status update scheduler error', { error: String(err) })
      }
    }

    const interval = setInterval(check, 60 * 60 * 1000) // hourly
    this.intervals.set('sales-trial-status-update', interval)
    check() // run once on startup
  }

  static stop() {
    logger.info('Stopping cron jobs...')
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()
  }

  private static schedulePerBusinessDailyReports() {
    const checkBusinessReports = async () => {
      try {
        const now = new Date()
        const businesses = await prisma.business.findMany({
          where: { isActive: true, dailyReportEnabled: true },
          select: {
            id: true,
            name: true,
            timezone: true,
            dailyReportLocalTime: true,
            lastDailyReportSentForDate: true,
          },
        })

        for (const business of businesses) {
          try {
            const tz = business.timezone || 'Africa/Kigali'
            const targetTime = business.dailyReportLocalTime || '07:30'
            const localHHMM = toLocalHHMM(now, tz)
            const localDate = toLocalDateString(now, tz)

            if (localHHMM === targetTime && business.lastDailyReportSentForDate !== localDate) {
              await prisma.business.update({
                where: { id: business.id },
                data: { lastDailyReportSentForDate: localDate },
              })
              const report = await ReportService.generateDailyReport(business.id, now)
              await NotificationService.sendDailyReport(business.id, report)
              logger.info(`Daily report sent for ${business.name}`, { businessId: business.id, localDate, localTime: localHHMM })
            }
          } catch (err) {
            logger.error(`Daily report failed for business ${business.id}`, { error: String(err) })
          }
        }
      } catch (err) {
        logger.error('Per-business daily report scheduler error', { error: String(err) })
      }
    }

    const interval = setInterval(checkBusinessReports, 60000)
    this.intervals.set('per-business-daily-reports', interval)
  }

  private static scheduleStockAlerts() {
    const checkStock = async () => {
      try {
        const businesses = await prisma.business.findMany({
          where: { isActive: true },
          select: { id: true }
        })

        for (const business of businesses) {
          const alerts = await InventoryService.getStockAlerts(business.id)
          if (alerts.length > 0) {
            await NotificationService.sendLowStockAlert(business.id, alerts)
          }
        }
      } catch (error) {
        console.error('Stock alert error:', error)
      }
    }

    const interval = setInterval(checkStock, 3600000)
    this.intervals.set('stock-alerts', interval)
  }

  private static scheduleBackups() {
    const performBackup = async () => {
      try {
        console.log('📦 Performing database backup...')
        
        const timestamp = new Date().toISOString().split('T')[0]
        console.log(`Backup timestamp: ${timestamp}`)
        
      } catch (error) {
        console.error('Backup error:', error)
      }
    }

    const interval = setInterval(performBackup, 86400000)
    this.intervals.set('backups', interval)
  }

  // Approve affiliate commissions after their lock period
  private static scheduleAffiliateApprovals() {
    const checkApprovals = async () => {
      try {
        const count = await AffiliateService.approveLockedCommissions()
        if (count > 0) {
          console.log(`💸 Approved ${count} affiliate commissions`)
        }
      } catch (error) {
        console.error('Affiliate approval error:', error)
      }
    }

    // Run every hour
    const interval = setInterval(checkApprovals, 3600000)
    this.intervals.set('affiliate-approvals', interval)
  }

  private static scheduleInsightGeneration() {
    const checkTime = () => {
      const now = new Date()
      const utc = now.getTime() + now.getTimezoneOffset() * 60000
      const kigali = new Date(utc + 2 * 3600000)
      const hour = kigali.getHours()
      const minute = kigali.getMinutes()

      if (hour === 1 && minute === 0) {
        this.generateInsights()
      }
    }

    const interval = setInterval(checkTime, 60000)
    this.intervals.set('insight-generation', interval)
  }

  private static async generateInsights() {
    try {
      if (!process.env.OPENAI_API_KEY) return

      console.log('🤖 Generating AI business insights...')

      const businesses = await prisma.business.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
      })

      const now = new Date()
      const isMonday = now.getDay() === 1
      const isFirstOfMonth = now.getDate() === 1

      for (const biz of businesses) {
        try {
          if (isMonday) {
            await getOrGenerateInsight({ businessId: biz.id, period: 'WEEKLY', trigger: 'AUTO' })
            console.log(`📊 Weekly insight generated for ${biz.name}`)
          }
          if (isFirstOfMonth) {
            await getOrGenerateInsight({ businessId: biz.id, period: 'MONTHLY', trigger: 'AUTO' })
            console.log(`📊 Monthly insight generated for ${biz.name}`)
          }
        } catch (error) {
          console.error(`Failed insight for ${biz.name}:`, error)
        }
      }

      console.log('✅ AI insight generation complete')
    } catch (error) {
      console.error('Insight generation error:', error)
    }
  }

  private static scheduleFeatureFlagCheck() {
    const check = async () => {
      try {
        await FeatureFlagService.checkAndAutoEnableFlags()
      } catch (err) {
        logger.error('Feature flag auto-enable check failed', { error: String(err) })
      }
    }
    const interval = setInterval(check, 60 * 60 * 1000) // every hour
    this.intervals.set('feature-flag-check', interval)
    check() // run immediately on startup
  }

  private static scheduleReconciliation() {
    const reconcile = async () => {
      try {
        const now = new Date()
        const tz = 'Africa/Kigali'
        const localHHMM = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz })
        if (localHHMM === '02:00') {
          await ReconciliationService.runNightlyReconciliation()
        }
      } catch (err) {
        logger.error('Reconciliation scheduler error', { error: String(err) })
      }
    }
    const interval = setInterval(reconcile, 60000)
    this.intervals.set('reconciliation', interval)
  }

  private static scheduleQROrderRelease() {
    const releaseOrders = async () => {
      try {
        const now = new Date()
        
        // Find scheduled orders that need to be released to kitchen
        const ordersToRelease = await prisma.sale.findMany({
          where: {
            orderSource: 'QR_REMOTE',
            paymentStatus: 'COMPLETED',
            kitchenReleasedAt: null,
            scheduledAt: { not: null }
          },
          include: {
            business: {
              select: { prepBufferMinutes: true }
            }
          }
        })

        for (const order of ordersToRelease) {
          if (!order.scheduledAt) continue
          
          const prepBuffer = order.business.prepBufferMinutes * 60000 // Convert to ms
          const releaseTime = new Date(order.scheduledAt).getTime() - prepBuffer
          
          if (now.getTime() >= releaseTime) {
            await prisma.sale.update({
              where: { id: order.id },
              data: { kitchenReleasedAt: new Date() }
            })
            
            console.log(`Released scheduled order ${order.orderNumber} to kitchen`)
          }
        }
      } catch (error) {
        console.error('QR order release error:', error)
      }
    }

    // Check every 5 minutes
    const interval = setInterval(releaseOrders, 5 * 60000)
    this.intervals.set('qr-order-release', interval)
  }

  /**
   * Reconcile Tap & Leave pending payments by polling provider and updating slips
   */
  private static scheduleTapLeavePaymentReconcile() {
    const tick = async () => {
      try {
        const now = new Date()
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

        const pending = await prisma.paymentTransaction.findMany({
          where: {
            status: 'PENDING' as any,
            gateway: 'INTOUCH' as any,
            createdAt: { gte: twoHoursAgo },
          },
        })

        for (const p of pending) {
          const meta: any = p.rawRequest || {}
          const slipId: string | undefined = meta.slipId
          const sessionId: string | undefined = meta.sessionId
          if (!slipId || !sessionId) continue

          try {
            const status = await InTouchService.getPaymentStatus(p.transactionId)
            const isSuccess = InTouchService.isSuccess(status.responsecode)
            const isPending = InTouchService.isPending(status.responsecode)

            if (isSuccess) {
              await prisma.paymentTransaction.update({
                where: { id: p.id },
                data: {
                  status: PaymentTransactionStatus.SUCCESS,
                  paidAt: new Date(),
                  rawStatus: { ...(p.rawStatus as any), reconciled: status },
                },
              })

              await TapLeaveFinalizationService.finalize(p.id, 'cron')
              continue
            }

            if (!isPending) {
              // Mark as failed
              await prisma.paymentTransaction.update({
                where: { id: p.id },
                data: { status: PaymentTransactionStatus.FAILED, rawStatus: { ...(p.rawStatus as any), reconciled: status } },
              })
              await DiningSessionSlipService.markPaymentFailed(slipId, p.id, InTouchService.getErrorMessage(status.responsecode))
              continue
            }

            // Pending too long → timeout
            const ageMs = now.getTime() - new Date(p.createdAt).getTime()
            if (ageMs > 5 * 60 * 1000) {
              await prisma.paymentTransaction.update({ where: { id: p.id }, data: { status: PaymentTransactionStatus.FAILED, rawStatus: { ...(p.rawStatus as any), timeout: true } } })
              await DiningSessionSlipService.markPaymentFailed(slipId, p.id, 'Payment timeout (reconciler)')
            }
          } catch (err) {
            logger.error('Tap&Leave reconciler error', { paymentId: p.id, error: String(err) })
          }
        }
      } catch (err) {
        logger.error('Tap&Leave reconciler tick failed', { error: String(err) })
      }
    }

    const interval = setInterval(tick, 2 * 60 * 1000)
    this.intervals.set('tap-leave-reconcile', interval)
  }

  /**
   * Finalization Sweeper: recover any SUCCESS Tap & Leave payments that missed finalization
   */
  private static scheduleTapLeaveFinalizationSweeper() {
    const tick = async () => {
      try {
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
        const candidates = await prisma.paymentTransaction.findMany({
          where: {
            status: PaymentTransactionStatus.SUCCESS,
            gateway: 'INTOUCH' as any,
            updatedAt: { lt: twoMinutesAgo },
          },
          take: 50,
          orderBy: { updatedAt: 'asc' },
        })

        let processed = 0
        for (const p of candidates) {
          if (processed >= 20) break
          const rawReq: any = p.rawRequest || {}
          const rawStatus: any = p.rawStatus || {}
          if (!rawReq.sessionId || !rawReq.slipId) continue
          if (rawStatus.finalizedAt) continue

          try {
            await TapLeaveFinalizationService.finalize(p.id, 'sweeper' as any)
            logger.info('Sweeper: finalized payment', { paymentId: p.id })
            processed++
          } catch (err) {
            logger.error('Sweeper: finalization error', { paymentId: p.id, error: String(err) })
          }
        }
      } catch (err) {
        logger.error('Sweeper: tick error', { error: String(err) })
      }
    }

    const interval = setInterval(tick, 60 * 1000)
    this.intervals.set('tap-leave-finalization-sweeper', interval)
  }

  /**
   * WhatsApp re-order funnel: message customers 7 days after a successful order
   */
  private static scheduleWhatsappReorderFunnel() {
    const tick = async () => {
      try {
        const now = new Date()
        const start = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)
        const end = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        // Only for businesses that enabled client WhatsApp messaging
        const businesses = await prisma.business.findMany({
          where: { isActive: true, whatsappClientSlipsEnabled: true },
          select: { id: true, name: true },
        })

        for (const biz of businesses) {
          const sales = await prisma.sale.findMany({
            where: {
              businessId: biz.id,
              isPaid: true,
              customerPhone: { not: null },
              createdAt: { gte: start, lte: end },
            },
            select: { customerPhone: true, customerName: true },
            distinct: ['customerPhone'],
          })

          for (const s of sales) {
            const phone = s.customerPhone as string
            const name = s.customerName || 'Friend'
            const link = `${process.env.NEXTAUTH_URL || ''}/order/reorder`
            const msg = `👋 Hi ${name}!\n\nWant your usual again? Tap here to reorder in seconds: ${link}\n\n— ${biz.name}`
            await WhatsAppCloudService.sendText({ phone, message: msg, businessId: biz.id }).catch(() => null)
          }
        }
      } catch (err) {
        logger.error('WhatsApp reorder funnel error', { error: String(err) })
      }
    }

    // Run daily at 10:00 Kigali time
    const interval = setInterval(() => {
      const now = new Date()
      const utc = now.getTime() + now.getTimezoneOffset() * 60000
      const kigali = new Date(utc + 2 * 3600000)
      if (kigali.getHours() === 10 && kigali.getMinutes() === 0) tick()
    }, 60 * 1000)
    this.intervals.set('whatsapp-reorder-funnel', interval)
  }

  /**
   * No-show forfeit: mark successful deposits as FORFEITED if guest did not show within 60 minutes after reservedAt
   */
  private static scheduleReservationNoShowForfeit() {
    const tick = async () => {
      try {
        const now = new Date()
        const cutoff = new Date(now.getTime() - 60 * 60 * 1000) // 60 minutes ago
        const toForfeit = await prisma.reservation.findMany({
          where: {
            reservedAt: { lte: cutoff },
            status: { in: ['PENDING', 'CONFIRMED'] },
            depositStatus: PaymentTransactionStatus.SUCCESS,
            completedAt: null,
            noShowReason: null,
          },
          select: { id: true, depositCents: true },
        })

        for (const r of toForfeit) {
          await prisma.reservation.update({
            where: { id: r.id },
            data: {
              depositStatus: 'FORFEITED' as any,
              forfeitCents: r.depositCents || 0,
              noShowReason: 'NO_SHOW',
              status: 'CANCELLED',
            },
          })
        }
      } catch (err) {
        logger.error('No-show forfeit job error', { error: String(err) })
      }
    }

    const interval = setInterval(tick, 10 * 60 * 1000) // every 10 minutes
    this.intervals.set('reservation-no-show-forfeit', interval)
  }

  static scheduleAutopilotFeatures() {
    const checkAutopilot = async () => {
      try {
        await runAutopilotCheck()
      } catch (error) {
        logger.error('Autopilot check error:', { error: String(error) })
      }
    }

    // Run weekly on Sundays at 2 AM
    const interval = setInterval(() => {
      const now = new Date()
      if (now.getDay() === 0 && now.getHours() === 2) {
        checkAutopilot()
      }
    }, 60 * 60000) // Check every hour

    this.intervals.set('autopilot-features', interval)
  }

  /**
   * Generic Payment Watchdog: Monitor all providers for stuck PENDING/PROCESSING payments
   */
  private static scheduleGenericPaymentWatchdog() {
    const tick = async () => {
      try {
        const PENDING_THRESHOLD_MINUTES = 10
        const PROCESSING_THRESHOLD_MINUTES = 15
        const cutoffPending = new Date(Date.now() - PENDING_THRESHOLD_MINUTES * 60 * 1000)
        const cutoffProcessing = new Date(Date.now() - PROCESSING_THRESHOLD_MINUTES * 60 * 1000)

        // Find stuck PENDING payments
        const stuckPending = await prisma.paymentTransaction.findMany({
          where: {
            status: PaymentTransactionStatus.PENDING,
            createdAt: { lt: cutoffPending },
          },
          select: { id: true, gateway: true, transactionId: true, businessId: true, amountCents: true, createdAt: true },
          take: 50,
        })

        // Find stuck PROCESSING payments
        const stuckProcessing = await prisma.paymentTransaction.findMany({
          where: {
            status: PaymentTransactionStatus.PROCESSING,
            updatedAt: { lt: cutoffProcessing },
          },
          select: { id: true, gateway: true, transactionId: true, businessId: true, amountCents: true, updatedAt: true },
          take: 50,
        })

        const stuckCount = stuckPending.length + stuckProcessing.length

        if (stuckCount > 0) {
          logger.warn('[PaymentWatchdog] Stuck payments detected', {
            pendingCount: stuckPending.length,
            processingCount: stuckProcessing.length,
          })

          // Alert on high stuck payment count
          if (stuckCount >= 10) {
            await AlertDeliveryService.deliver({
              severity: 'error',
              title: `High stuck payment count: ${stuckCount}`,
              details: {
                pendingCount: stuckPending.length,
                processingCount: stuckProcessing.length,
                pendingThresholdMinutes: PENDING_THRESHOLD_MINUTES,
                processingThresholdMinutes: PROCESSING_THRESHOLD_MINUTES,
              },
            })
          }

          // Alert on individual high-value stuck payments
          for (const p of [...stuckPending, ...stuckProcessing]) {
            if (p.amountCents >= 5000000) { // 50,000 RWF or more
              await AlertDeliveryService.deliver({
                severity: 'warning',
                title: `High-value stuck payment: ${p.amountCents / 100} RWF`,
                details: {
                  paymentId: p.id,
                  gateway: p.gateway,
                  transactionId: p.transactionId,
                  businessId: p.businessId,
                  amountCents: p.amountCents,
                },
              })
            }
          }
        }
      } catch (err) {
        logger.error('[PaymentWatchdog] Tick error', { error: String(err) })
      }
    }

    // Run every 5 minutes
    const interval = setInterval(tick, 5 * 60 * 1000)
    this.intervals.set('payment-watchdog', interval)
  }

  static async runManualReport(businessId: string) {
    const today = new Date()
    const report = await ReportService.generateDailyReport(businessId, today)
    await NotificationService.sendDailyReport(businessId, report)
    return report
  }
}

if (process.env.NODE_ENV === 'production') {
  CronService.start()
}

process.on('SIGTERM', () => {
  CronService.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  CronService.stop()
  process.exit(0)
})
