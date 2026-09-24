/**
 * UNIT TESTS: Provider Policy Routing
 *
 * Verifies the policy-based ProviderRouter selects the correct provider
 * for each document type and falls back correctly on failures.
 *
 * Coverage:
 *   - Each policy (Menu, Invoice, DeliveryNote, Receipt, Generic)
 *   - ProviderRouter primary selection + providerUsed stamping
 *   - Fallback behavior on provider exception
 *   - Fallback behavior on unsupported MIME type
 *   - All-providers-failed error
 *   - Registry default fallback to Generic
 */
import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  ProviderPolicyRegistry,
} from '@/lib/die/provider/policy/registry'
import { ProviderRouter } from '@/lib/die/provider/policy/router'
import { GenericPolicy } from '@/lib/die/provider/policy/policies/generic.policy'
import { MenuPolicy } from '@/lib/die/provider/policy/policies/menu.policy'
import { InvoicePolicy } from '@/lib/die/provider/policy/policies/invoice.policy'
import { DeliveryNotePolicy } from '@/lib/die/provider/policy/policies/delivery-note.policy'
import { ReceiptPolicy } from '@/lib/die/provider/policy/policies/receipt.policy'
import { countPdfPages } from '@/lib/die/provider/policy/pdf-page-count'
import type {
  ProviderGateway,
  ExtractInput,
  ProviderResult,
} from '@/lib/die/provider/gateway'
import type { ProviderName, ProviderPolicy, PolicyInput, ProviderRanking } from '@/lib/die/provider/policy/types'

// ---------------------------------------------------------------------------
// Test helpers — fake providers
// ---------------------------------------------------------------------------

function makeFakeProvider(
  name: ProviderName,
  opts: {
    supports?: string[]                   // supported MIME types; default all
    result?: ProviderResult
    throwOnExtract?: Error
  } = {},
): ProviderGateway & { callCount: number; lastInput?: ExtractInput } {
  const supported = opts.supports
  const fake: any = {
    name,
    callCount: 0,
    lastInput: undefined,
    supportsMime(mime: string) {
      if (!supported) return true
      return supported.includes(mime)
    },
    async extract(input: ExtractInput): Promise<ProviderResult> {
      fake.callCount += 1
      fake.lastInput = input
      if (opts.throwOnExtract) throw opts.throwOnExtract
      return opts.result ?? { rawPayload: {}, fields: [], lines: [] }
    },
  }
  return fake
}

function buildRegistry(): ProviderPolicyRegistry {
  const registry = new ProviderPolicyRegistry(GenericPolicy)
  registry.register(GenericPolicy)
  registry.register(MenuPolicy)
  registry.register(InvoicePolicy)
  registry.register(DeliveryNotePolicy)
  registry.register(ReceiptPolicy)
  return registry
}

// ---------------------------------------------------------------------------
// Policy unit tests — pure routing logic, no providers involved
// ---------------------------------------------------------------------------

describe('Provider Policies', () => {
  const imageInput: PolicyInput = {
    documentType: 'GENERIC',
    mime: 'image/jpeg',
    pageCount: undefined,
    fileSizeBytes: 100_000,
  }
  const singlePagePdfInput: PolicyInput = {
    documentType: 'GENERIC',
    mime: 'application/pdf',
    pageCount: 1,
    fileSizeBytes: 100_000,
  }
  const multiPagePdfInput: PolicyInput = {
    documentType: 'GENERIC',
    mime: 'application/pdf',
    pageCount: 5,
    fileSizeBytes: 500_000,
  }

  describe('MenuPolicy', () => {
    it('selects OpenAI as primary with no fallback', () => {
      const ranking = MenuPolicy.select(imageInput)
      expect(ranking.primary).toBe('openai')
      expect(ranking.fallbacks).toEqual([])
    })
  })

  describe('InvoicePolicy', () => {
    it('selects OpenAI primary with Azure fallback', () => {
      const ranking = InvoicePolicy.select(imageInput)
      expect(ranking.primary).toBe('openai')
      expect(ranking.fallbacks).toEqual(['azure_document_intelligence'])
    })
  })

  describe('DeliveryNotePolicy', () => {
    it('selects OpenAI primary with Azure fallback', () => {
      const ranking = DeliveryNotePolicy.select(imageInput)
      expect(ranking.primary).toBe('openai')
      expect(ranking.fallbacks).toEqual(['azure_document_intelligence'])
    })
  })

  describe('ReceiptPolicy', () => {
    it('selects Azure primary with OpenAI fallback', () => {
      const ranking = ReceiptPolicy.select(imageInput)
      expect(ranking.primary).toBe('azure_document_intelligence')
      expect(ranking.fallbacks).toEqual(['openai'])
    })
  })

  describe('GenericPolicy', () => {
    it('routes images to OpenAI primary', () => {
      const ranking = GenericPolicy.select(imageInput)
      expect(ranking.primary).toBe('openai')
      expect(ranking.fallbacks).toEqual(['azure_document_intelligence'])
    })

    it('routes single-page PDFs to OpenAI primary', () => {
      const ranking = GenericPolicy.select(singlePagePdfInput)
      expect(ranking.primary).toBe('openai')
      expect(ranking.fallbacks).toEqual(['azure_document_intelligence'])
    })

    it('routes multi-page PDFs (>3 pages) to Azure primary', () => {
      const ranking = GenericPolicy.select(multiPagePdfInput)
      expect(ranking.primary).toBe('azure_document_intelligence')
      expect(ranking.fallbacks).toEqual(['openai'])
    })

    it('treats pageCount at the threshold (3) as single-page routing', () => {
      const at: PolicyInput = { ...multiPagePdfInput, pageCount: 3 }
      const ranking = GenericPolicy.select(at)
      expect(ranking.primary).toBe('openai')
    })

    it('includes a human-readable reason', () => {
      const ranking = GenericPolicy.select(imageInput)
      expect(typeof ranking.reason).toBe('string')
      expect(ranking.reason.length).toBeGreaterThan(0)
    })
  })
})

// ---------------------------------------------------------------------------
// Registry tests
// ---------------------------------------------------------------------------

describe('ProviderPolicyRegistry', () => {
  it('resolves a registered policy by documentType', () => {
    const registry = buildRegistry()
    expect(registry.resolve('MENU')).toBe(MenuPolicy)
    expect(registry.resolve('SUPPLIER_INVOICE')).toBe(InvoicePolicy)
    expect(registry.resolve('RECEIPT')).toBe(ReceiptPolicy)
  })

  it('falls back to GenericPolicy for unknown documentType', () => {
    const registry = buildRegistry()
    expect(registry.resolve('GENERIC')).toBe(GenericPolicy)
  })

  it('falls back to GenericPolicy when documentType is undefined', () => {
    const registry = buildRegistry()
    expect(registry.resolve(undefined)).toBe(GenericPolicy)
  })

  it('select() delegates to the resolved policy', () => {
    const registry = buildRegistry()
    const ranking = registry.select({
      documentType: 'MENU',
      mime: 'image/jpeg',
      fileSizeBytes: 100,
    })
    expect(ranking.primary).toBe('openai')
    expect(ranking.fallbacks).toEqual([])
  })

  it('allows registering a custom policy that overrides a built-in', () => {
    const registry = buildRegistry()
    const custom: ProviderPolicy = {
      documentType: 'MENU',
      select: () => ({ primary: 'azure_document_intelligence', fallbacks: [], reason: 'custom' }),
    }
    registry.register(custom)
    expect(registry.resolve('MENU')).toBe(custom)
  })
})

// ---------------------------------------------------------------------------
// ProviderRouter tests — integration of policy + providers
// ---------------------------------------------------------------------------

describe('ProviderRouter', () => {
  const imageInput: ExtractInput = {
    buffer: Buffer.from('fake-image'),
    mime: 'image/jpeg',
    documentType: 'MENU',
  }

  function buildRouter(
    providers: Map<ProviderName, ProviderGateway>,
    registry = buildRegistry(),
  ) {
    return new ProviderRouter(registry, providers)
  }

  it('implements ProviderGateway.name', () => {
    const router = buildRouter(new Map())
    expect(router.name).toBe('provider_router')
  })

  it('supportsMime returns true if any provider supports it', () => {
    const providers = new Map<ProviderName, ProviderGateway>([
      ['openai', makeFakeProvider('openai', { supports: ['image/jpeg'] })],
    ])
    const router = buildRouter(providers)
    expect(router.supportsMime('image/jpeg')).toBe(true)
    expect(router.supportsMime('application/pdf')).toBe(false)
  })

  it('selects the policy primary provider and stamps providerUsed', async () => {
    const openai = makeFakeProvider('openai', {
      result: { rawPayload: {}, fields: [{ name: 'dish', value: 'Pizza' }] },
    })
    const azure = makeFakeProvider('azure_document_intelligence')
    const providers = new Map<ProviderName, ProviderGateway>([
      ['openai', openai],
      ['azure_document_intelligence', azure],
    ])
    const router = buildRouter(providers)

    const result = await router.extract(imageInput)

    expect(openai.callCount).toBe(1)
    expect(azure.callCount).toBe(0) // MenuPolicy has no fallbacks
    expect(result.providerUsed).toBe('openai')
    expect(result.fields[0].value).toBe('Pizza')
  })

  it('falls back to the next provider when the primary throws', async () => {
    const openai = makeFakeProvider('openai', {
      throwOnExtract: new Error('openai down'),
    })
    const azure = makeFakeProvider('azure_document_intelligence', {
      result: { rawPayload: {}, fields: [{ name: 'vendor', value: 'Acme' }] },
    })
    const providers = new Map<ProviderName, ProviderGateway>([
      ['openai', openai],
      ['azure_document_intelligence', azure],
    ])
    const router = buildRouter(providers)

    // InvoicePolicy: openai primary, azure fallback
    const result = await router.extract({
      buffer: Buffer.from('invoice'),
      mime: 'image/jpeg',
      documentType: 'SUPPLIER_INVOICE',
    })

    expect(openai.callCount).toBe(1)
    expect(azure.callCount).toBe(1)
    expect(result.providerUsed).toBe('azure_document_intelligence')
  })

  it('skips providers that do not support the MIME type', async () => {
    const openai = makeFakeProvider('openai', { supports: ['application/pdf'] }) // does NOT support jpeg
    const azure = makeFakeProvider('azure_document_intelligence', {
      supports: ['image/jpeg'],
      result: { rawPayload: {}, fields: [] },
    })
    const providers = new Map<ProviderName, ProviderGateway>([
      ['openai', openai],
      ['azure_document_intelligence', azure],
    ])
    const router = buildRouter(providers)

    // InvoicePolicy: openai primary (skipped — no jpeg support), azure fallback
    await router.extract({
      buffer: Buffer.from('invoice'),
      mime: 'image/jpeg',
      documentType: 'SUPPLIER_INVOICE',
    })

    expect(openai.callCount).toBe(0)
    expect(azure.callCount).toBe(1)
  })

  it('skips providers not present in the providers map', async () => {
    // Only OpenAI configured — Azure env vars missing
    const openai = makeFakeProvider('openai', {
      result: { rawPayload: {}, fields: [] },
    })
    const providers = new Map<ProviderName, ProviderGateway>([
      ['openai', openai],
    ])
    const router = buildRouter(providers)

    // ReceiptPolicy: azure primary (not configured), openai fallback
    const result = await router.extract({
      buffer: Buffer.from('receipt'),
      mime: 'image/jpeg',
      documentType: 'RECEIPT',
    })

    expect(openai.callCount).toBe(1)
    expect(result.providerUsed).toBe('openai')
  })

  it('throws when all providers fail', async () => {
    const openai = makeFakeProvider('openai', {
      throwOnExtract: new Error('openai down'),
    })
    const azure = makeFakeProvider('azure_document_intelligence', {
      throwOnExtract: new Error('azure down'),
    })
    const providers = new Map<ProviderName, ProviderGateway>([
      ['openai', openai],
      ['azure_document_intelligence', azure],
    ])
    const router = buildRouter(providers)

    await expect(
      router.extract({
        buffer: Buffer.from('invoice'),
        mime: 'image/jpeg',
        documentType: 'SUPPLIER_INVOICE',
      }),
    ).rejects.toThrow(/ProviderRouter: all providers failed/)
  })

  it('throws when no providers are configured for the ranking', async () => {
    const providers = new Map<ProviderName, ProviderGateway>()
    const router = buildRouter(providers)

    await expect(
      router.extract(imageInput),
    ).rejects.toThrow(/ProviderRouter: all providers failed/)
  })

  it('uses GenericPolicy when documentType is undefined', async () => {
    const openai = makeFakeProvider('openai', {
      result: { rawPayload: {}, fields: [] },
    })
    const azure = makeFakeProvider('azure_document_intelligence')
    const providers = new Map<ProviderName, ProviderGateway>([
      ['openai', openai],
      ['azure_document_intelligence', azure],
    ])
    const router = buildRouter(providers)

    // Image with no documentType → GenericPolicy → OpenAI primary
    await router.extract({
      buffer: Buffer.from('img'),
      mime: 'image/jpeg',
    })

    expect(openai.callCount).toBe(1)
    expect(azure.callCount).toBe(0)
  })

  it('routes multi-page PDFs to Azure via GenericPolicy', async () => {
    // Build a minimal valid PDF buffer with 5 /Type /Page markers
    const pdfBuffer = Buffer.from(
      '%PDF-1.4\n' +
      '1 0 obj << /Type /Page >> endobj\n' +
      '2 0 obj << /Type /Page >> endobj\n' +
      '3 0 obj << /Type /Page >> endobj\n' +
      '4 0 obj << /Type /Page >> endobj\n' +
      '5 0 obj << /Type /Page >> endobj\n' +
      '6 0 obj << /Type /Pages /Count 5 >> endobj\n' +
      'trailer\n%%EOF',
    )
    const openai = makeFakeProvider('openai')
    const azure = makeFakeProvider('azure_document_intelligence', {
      result: { rawPayload: {}, fields: [] },
    })
    const providers = new Map<ProviderName, ProviderGateway>([
      ['openai', openai],
      ['azure_document_intelligence', azure],
    ])
    const router = buildRouter(providers)

    await router.extract({
      buffer: pdfBuffer,
      mime: 'application/pdf',
      // no documentType → GenericPolicy
    })

    expect(azure.callCount).toBe(1)
    expect(openai.callCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// PDF page count utility
// ---------------------------------------------------------------------------

describe('countPdfPages', () => {
  it('returns the number of /Type /Page markers', () => {
    const pdf = Buffer.from(
      '%PDF-1.4\n' +
      '1 0 obj << /Type /Page >> endobj\n' +
      '2 0 obj << /Type /Page >> endobj\n' +
      '3 0 obj << /Type /Pages /Count 2 >> endobj\n' +
      'trailer\n%%EOF',
    )
    expect(countPdfPages(pdf)).toBe(2)
  })

  it('excludes /Type /Pages (plural) markers', () => {
    const pdf = Buffer.from(
      '<< /Type /Pages /Count 0 >>\n<< /Type /Page >>\n',
    )
    expect(countPdfPages(pdf)).toBe(1)
  })

  it('returns undefined when no /Type /Page markers are found', () => {
    expect(countPdfPages(Buffer.from('not a pdf'))).toBeUndefined()
  })

  it('handles whitespace between /Type and /Page', () => {
    const pdf = Buffer.from('<< /Type   /Page >>\n<< /Type /Page >>\n')
    expect(countPdfPages(pdf)).toBe(2)
  })
})
