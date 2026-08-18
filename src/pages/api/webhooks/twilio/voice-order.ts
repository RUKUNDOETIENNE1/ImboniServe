import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import twilio from 'twilio'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

/**
 * Voice Ordering via WhatsApp AI
 * Supports English, French, and Kinyarwanda
 * 
 * Flow:
 * 1. Customer sends voice message on WhatsApp
 * 2. Twilio forwards to this webhook
 * 3. Download voice file
 * 4. Transcribe with Whisper API
 * 5. Extract intent with GPT-4
 * 6. Match menu items
 * 7. Create order
 * 8. Send confirmation
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { From, MediaUrl0, Body } = req.body

    // If it's a voice message, MediaUrl0 will contain the audio file
    if (MediaUrl0) {
      return await handleVoiceMessage(From, MediaUrl0, res)
    }

    // If it's text, process as text order
    if (Body) {
      return await handleTextOrder(From, Body, res)
    }

    return res.status(400).json({ error: 'No voice or text message found' })
  } catch (error: any) {
    console.error('Voice order error:', error)
    return res.status(500).json({ error: 'Failed to process voice order' })
  }
}

async function handleVoiceMessage(from: string, mediaUrl: string, res: NextApiResponse) {
  try {
    // Step 1: Download audio file from Twilio
    const audioResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`
      }
    })

    if (!audioResponse.ok) {
      throw new Error('Failed to download audio')
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    const audioFile = new File([audioBuffer], 'voice.ogg', { type: 'audio/ogg' })

    // Step 2: Transcribe with Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'auto' // Auto-detect language (en, fr, rw)
    })

    const transcribedText = transcription.text

    // Step 3: Process the transcribed text as an order
    return await handleTextOrder(from, transcribedText, res)
  } catch (error: any) {
    console.error('Voice transcription error:', error)
    await sendWhatsAppMessage(from, 'Sorry, I couldn\'t understand your voice message. Please try again or send a text message.')
    return res.status(500).json({ error: 'Voice transcription failed' })
  }
}

async function handleTextOrder(from: string, text: string, res: NextApiResponse) {
  try {
    // Find customer by phone
    const phoneNumber = from.replace('whatsapp:', '')
    const customer = await prisma.customer.findFirst({
      where: { phone: phoneNumber }
    })

    if (!customer) {
      await sendWhatsAppMessage(from, 'Welcome! Please register first by visiting our website or scanning our QR code.')
      return res.status(200).json({ message: 'Customer not found' })
    }

    // Get business menu
    const business = await prisma.business.findUnique({
      where: { id: customer.businessId },
      include: {
        menuItems: {
          where: { isAvailable: true },
          select: {
            id: true,
            name: true,
            description: true,
            priceCents: true,
            category: true,
          },
        }
      }
    })

    if (!business) {
      await sendWhatsAppMessage(from, 'Sorry, we couldn\'t find your restaurant information.')
      return res.status(200).json({ message: 'Business not found' })
    }

    // Step 4: Use GPT-4 to extract order intent
    const menuContext = business.menuItems.map(item => 
      `${item.name} - ${item.description || ''} - ${item.priceCents / 100} RWF (ID: ${item.id})`
    ).join('\n')

    const prompt = `You are an AI assistant for a restaurant. Extract the order from this customer message.
    
Menu:
${menuContext}

Customer message: "${text}"

Extract:
1. Items ordered (match to menu IDs)
2. Quantities
3. Any special instructions

Respond in JSON format:
{
  "items": [{"menuItemId": "id", "quantity": number, "instructions": "optional"}],
  "language": "en|fr|rw",
  "confidence": 0-1
}

If the message is not an order (e.g., greeting, question), set items to empty array.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const orderData = JSON.parse(completion.choices[0].message.content || '{}')

    if (!orderData.items || orderData.items.length === 0) {
      // Not an order - might be a question or greeting
      const responsePrompt = `You are a friendly restaurant AI assistant. Respond to this customer message in ${orderData.language || 'en'}.
      
Customer: "${text}"

Provide a helpful, friendly response. Keep it brief (1-2 sentences).`

      const responseCompletion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: responsePrompt }],
        temperature: 0.7
      })

      const response = responseCompletion.choices[0].message.content || 'How can I help you?'
      await sendWhatsAppMessage(from, response)
      return res.status(200).json({ message: 'Responded to customer' })
    }

    const owner = await prisma.user.findFirst({
      where: {
        businessId: business.id,
        roles: { has: 'OWNER' },
      },
      select: { id: true },
    })

    if (!owner) {
      await sendWhatsAppMessage(from, 'Sorry, we could not route your order right now. Please try again.')
      return res.status(500).json({ error: 'Business owner user not found' })
    }

    // Step 5: Create order
    const orderItems = orderData.items.map((item: any) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      specialInstructions: item.instructions || null
    }))

    // Calculate total
    const total = await calculateOrderTotal(orderItems)

    const sale = await prisma.sale.create({
      data: {
        businessId: business.id,
        userId: owner.id,
        customerId: customer.id,
        totalAmountCents: total,
        status: 'PENDING',
        orderNumber: `WA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        paymentMethod: 'CASH',
        paymentStatus: 'PENDING',
        items: {
          create: orderItems.map((item: any) => {
            const menuItem = business.menuItems.find((m) => m.id === item.menuItemId)
            const unitPriceCents = menuItem?.priceCents || 0
            return {
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPriceCents,
              totalPriceCents: unitPriceCents * item.quantity,
              instructions: item.specialInstructions
            }
          })
        }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    // Step 6: Send confirmation in customer's language
    const confirmationMessage = await generateConfirmation(sale, orderData.language || 'en')
    await sendWhatsAppMessage(from, confirmationMessage)

    return res.status(200).json({ success: true, orderId: sale.id })
  } catch (error: any) {
    console.error('Text order processing error:', error)
    await sendWhatsAppMessage(from, 'Sorry, there was an error processing your order. Please try again.')
    return res.status(500).json({ error: 'Order processing failed' })
  }
}

async function calculateOrderTotal(items: any[]): Promise<number> {
  let total = 0
  for (const item of items) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: item.menuItemId },
      select: { priceCents: true }
    })
    if (menuItem) {
      total += menuItem.priceCents * item.quantity
    }
  }
  return total
}

async function generateConfirmation(sale: any, language: string): Promise<string> {
  const itemsList = sale.items.map((item: any) => 
    `${item.quantity}x ${item.menuItem.name}`
  ).join('\n')

  const total = sale.totalAmountCents / 100

  const templates: Record<string, string> = {
    en: `✅ Order Confirmed! #${sale.id.slice(-6)}

${itemsList}

Total: ${total} RWF

We'll prepare your order shortly. Reply CANCEL to cancel.`,
    fr: `✅ Commande Confirmée! #${sale.id.slice(-6)}

${itemsList}

Total: ${total} RWF

Nous préparerons votre commande sous peu. Répondez ANNULER pour annuler.`,
    rw: `✅ Itumiza Ryemejwe! #${sale.id.slice(-6)}

${itemsList}

Igiteranyo: ${total} RWF

Tuzateguza itumiza ryanyu vuba. Subiza HAGARIKA kugirango uhagarike.`
  }

  return templates[language] || templates.en
}

async function sendWhatsAppMessage(to: string, message: string) {
  try {
    const fromNumber = (process.env.TWILIO_WHATSAPP_NUMBER || '').replace(/^whatsapp:/, '')
    await twilioClient.messages.create({
      from: `whatsapp:${fromNumber}`,
      to,
      body: message
    })
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error)
  }
}
