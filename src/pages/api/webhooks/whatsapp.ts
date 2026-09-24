import type { NextApiRequest, NextApiResponse } from 'next'
import { WhatsAppCloudService } from '@/lib/services/whatsapp-cloud.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { maskPhone } from '@/lib/utils/phone'
import { logger } from '@/lib/logger'

export const config = { api: { bodyParser: false } }

async function getRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

/**
 * Meta WhatsApp Cloud API webhook.
 *
 * Security (WhatsApp Foundation Phase 1):
 * - FAIL-CLOSED on POST: WHATSAPP_APP_SECRET must be configured, the
 *   x-hub-signature-256 header must be present, and the HMAC must validate.
 *   Inbound processing remains log-only by design (customer ordering is a
 *   later phase) — this endpoint is a secured boundary, not an order intake.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge)
    }
    return res.status(403).end()
  }

  if (req.method === 'POST') {
    if (!process.env.WHATSAPP_APP_SECRET) {
      logger.error('WHATSAPP_APP_SECRET not configured — rejecting webhook')
      return res.status(503).end()
    }

    const rawBody = await getRawBody(req)
    const signature = req.headers['x-hub-signature-256'] as string || ''

    if (!signature || !WhatsAppCloudService.verifyWebhookSignature(rawBody, signature)) {
      logger.warn('WhatsApp webhook signature invalid')
      return res.status(401).end()
    }

    try {
      const body = JSON.parse(rawBody)
      const entry = body?.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value

      if (value?.messages) {
        for (const msg of value.messages) {
          logger.info('WhatsApp inbound message', { from: maskPhone(msg.from), type: msg.type, msgId: msg.id })
        }
      }

      if (value?.statuses) {
        for (const status of value.statuses) {
          logger.info('WhatsApp message status update', { id: status.id, status: status.status })
        }
      }
    } catch (err) {
      logger.error('WhatsApp webhook parse error', { error: String(err) })
    }

    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}

export default withRateLimit(async (req, res) => { await handler(req, res) }, { windowMs: 60 * 1000, maxRequests: 60 })
