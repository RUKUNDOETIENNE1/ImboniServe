import { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { IremboPayService } from '@/lib/services/irembopay.service'
import { prisma } from '@/lib/prisma'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { invoiceNumber, phoneNumber, provider } = req.body

  // Validate inputs
  if (!invoiceNumber || !phoneNumber || !provider) {
    return res.status(400).json({ error: 'Missing required fields: invoiceNumber, phoneNumber, provider' })
  }

  if (!/^07\d{8}$/.test(phoneNumber)) {
    return res.status(400).json({ error: 'Invalid phone number format. Must be 07XXXXXXXX (10 digits starting with 07)' })
  }

  if (!['MTN', 'AIRTEL'].includes(provider)) {
    return res.status(400).json({ error: 'Invalid provider. Must be MTN or AIRTEL' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const isAdmin = (ctx.roles || []).includes('ADMIN')

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { invoiceNumber },
    })

    if (!transaction) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    if (!isAdmin && transaction.businessId !== ctx.businessId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (transaction.currency !== 'RWF') {
      return res.status(400).json({ error: 'MoMo push only supports RWF currency' })
    }

    if (transaction.status === 'SUCCESS') {
      return res.status(400).json({ error: 'Invoice already paid' })
    }

    if (transaction.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Invoice has expired. Please create a new invoice' })
    }

    // Initiate MoMo push
    const result = await IremboPayService.initiateMomoPush({
      invoiceNumber,
      accountIdentifier: phoneNumber,
      paymentProvider: provider as 'MTN' | 'AIRTEL'
    })

    // Update transaction
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        paymentMethod: 'MOMO_PUSH',
        paymentProvider: provider as 'MTN' | 'AIRTEL',
        payerPhone: phoneNumber,
        referenceId: result.referenceId,
        status: 'PENDING'
      }
    })

    return res.status(200).json({
      success: true,
      data: {
        referenceId: result.referenceId,
        message: 'MoMo push initiated successfully. Please approve the payment on your phone.'
      }
    })
  } catch (error: any) {
    console.error('MoMo push error:', error)
    
    // Parse IremboPay error messages
    let errorMessage = error.message || 'Failed to initiate MoMo push'
    
    if (errorMessage.includes('INVOICE_EXPIRED')) {
      errorMessage = 'Invoice has expired. Please create a new invoice.'
    } else if (errorMessage.includes('INVOICE_ALREADY_PAID')) {
      errorMessage = 'Invoice has already been paid.'
    } else if (errorMessage.includes('BAD_PHONE_NUMBER')) {
      errorMessage = 'Invalid phone number for the selected provider.'
    } else if (errorMessage.includes('PAYMENT_PROVIDER_ERROR')) {
      errorMessage = 'Phone number does not match the selected provider (MTN/Airtel).'
    }
    
    return res.status(500).json({ 
      error: errorMessage
    })
  }
}

export default requirePermission('payments.create')(handler)
