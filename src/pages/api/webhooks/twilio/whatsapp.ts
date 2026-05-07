import type { NextApiRequest, NextApiResponse } from 'next'
import { WhatsAppOrderService } from '@/lib/services/whatsapp-order.service'
import { logger } from '@/lib/logger'
import twilio from 'twilio'

const log = logger.child({ api: 'twilio-whatsapp-webhook' })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Read raw body (bodyParser is disabled below) and verify Twilio signature
    const rawBody = await getRawBody(req)
    const twilioSignature = req.headers['x-twilio-signature'] as string
    const authToken = process.env.TWILIO_AUTH_TOKEN
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

    if (authToken && twilioSignature) {
      const isValid = twilio.validateRequest(authToken, twilioSignature, webhookUrl, params)
      if (!isValid) {
        log.warn('Invalid Twilio signature')
        return res.status(403).json({ error: 'Invalid signature' })
      }
    }

    const { From, Body, To } = params as any

    log.info('WhatsApp webhook received', { from: From, body: Body })

    // Process the message
    const result = await WhatsAppOrderService.processIncomingMessage(From, Body)

    // Send TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${result.reply}</Message>
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
