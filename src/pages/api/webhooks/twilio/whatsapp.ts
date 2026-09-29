import type { NextApiRequest, NextApiResponse } from 'next'
import { WhatsAppOrderService } from '@/lib/services/whatsapp-order.service'
import { logger } from '@/lib/logger'
import { maskPhone } from '@/lib/utils/phone'
import { escapeXml } from '@/lib/utils/xml'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import twilio from 'twilio'

const log = logger.child({ api: 'twilio-whatsapp-webhook' })

/**
 * Twilio WhatsApp inbound webhook — staff-assisted ORDER commands.
 *
 * Security (WhatsApp Foundation Phase 1):
 * - FAIL-CLOSED: TWILIO_AUTH_TOKEN must be configured, x-twilio-signature
 *   must be present, and the signature must validate. Any deviation → reject.
 * - MessageSid is forwarded for database-level deduplication.
 * - Phone numbers are masked in logs; message bodies are not logged.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    log.error('TWILIO_AUTH_TOKEN not configured — rejecting webhook')
    return res.status(503).json({ error: 'Webhook not configured' })
  }

  try {
    // Read raw body (bodyParser is disabled below) and verify Twilio signature
    const rawBody = await getRawBody(req)
    const twilioSignature = req.headers['x-twilio-signature'] as string | undefined
    const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/twilio/whatsapp`

    // Parse params for easier downstream usage
    let params: Record<string, any> = {}
    const contentType = (req.headers['content-type'] || '').toString()
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const sp = new URLSearchParams(rawBody)
      sp.forEach((v, k) => { params[k] = v })
    } else {
      try { params = JSON.parse(rawBody) } catch { params = {} }
    }

    if (!twilioSignature) {
      log.warn('Rejected Twilio webhook — missing signature header')
      return res.status(403).json({ error: 'Missing signature' })
    }

    const isValid = twilio.validateRequest(authToken, twilioSignature, webhookUrl, params)
    if (!isValid) {
      log.warn('Invalid Twilio signature')
      return res.status(403).json({ error: 'Invalid signature' })
    }

    const { From, Body, MessageSid } = params as any

    log.info('WhatsApp webhook received', {
      from: maskPhone(From),
      bodyLength: typeof Body === 'string' ? Body.length : 0,
      messageSid: MessageSid || undefined,
    })

    // Process the message (MessageSid enables idempotent handling)
    const result = await WhatsAppOrderService.processIncomingMessage(From, Body, {
      messageSid: MessageSid || undefined,
    })

    // Send TwiML response (escaped — reply contains user-derived text)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(result.reply)}</Message>
</Response>`

    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(twiml)
  } catch (error) {
    log.error('WhatsApp webhook error', { error: String(error) })

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, an error occurred processing your order. Please try again or contact support.</Message>
</Response>`

    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(errorTwiml)
  }
}

// Helper to read the raw body stream
function getRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

// Disable Next.js body parser so we can verify Twilio signatures against the exact raw payload
export const config = { api: { bodyParser: false } }

// Rate-limit inbound webhook bursts (in-memory limiter, same pattern as other endpoints)
export default withRateLimit(async (req, res) => { await handler(req, res) }, { windowMs: 60 * 1000, maxRequests: 60 })
