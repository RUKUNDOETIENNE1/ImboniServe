/**
 * WhatsAppService — truthful failure + opt-in safety (Foundation Phase 1)
 *
 * - sendMessage must NOT report success when the provider is unconfigured
 * - hasOptedIn must fail CLOSED on lookup errors (never treat an unsafe
 *   opt-out state as opted-in)
 */

jest.mock('@/lib/prisma', () => ({
  prisma: { whatsAppMessage: { findFirst: jest.fn() } },
}))
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), child: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }) },
}))

import { WhatsAppService } from '@/lib/services/whatsapp.service'

describe('WhatsAppService.sendMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Ensure unconfigured state
    delete process.env.WHATSAPP_API_URL
    delete process.env.WHATSAPP_API_KEY
  })

  it('returns failure (not fake success) when provider is unconfigured', async () => {
    const r = await WhatsAppService.sendMessage({ to: '+250788000001', body: 'hi' })
    expect(r.success).toBe(false)
    expect(r.error).toBe('WHATSAPP_NOT_CONFIGURED')
  })

  it('reports provider failures truthfully', async () => {
    process.env.WHATSAPP_API_URL = 'https://provider.example/send'
    process.env.WHATSAPP_API_KEY = 'k'
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: false, text: async () => 'provider error' } as any)
    const r = await WhatsAppService.sendMessage({ to: '+250788000001', body: 'hi' })
    expect(r.success).toBe(false)
    expect(r.error).toBe('provider error')
    fetchSpy.mockRestore()
  })
})

describe('WhatsAppService.hasOptedIn', () => {
  const { prisma } = require('@/lib/prisma')

  it('returns true when no preference record exists (default opted-in)', async () => {
    prisma.whatsAppMessage.findFirst.mockResolvedValue(null)
    expect(await WhatsAppService.hasOptedIn('+250788000001')).toBe(true)
  })

  it('returns false when OPT_OUT is recorded', async () => {
    prisma.whatsAppMessage.findFirst.mockResolvedValue({ message: 'OPT_OUT' })
    expect(await WhatsAppService.hasOptedIn('+250788000001')).toBe(false)
  })

  it('fails CLOSED on database errors — unsafe state never appears opted-in', async () => {
    prisma.whatsAppMessage.findFirst.mockRejectedValue(new Error('db down'))
    expect(await WhatsAppService.hasOptedIn('+250788000001')).toBe(false)
  })
})
