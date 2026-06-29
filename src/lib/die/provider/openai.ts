import OpenAI from 'openai'
import { ProviderGateway, ExtractInput, ProviderResult, isImage, isPdf } from './gateway'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function parseJsonFromModel(content: string): any {
  const raw = (content || '').trim()
  if (!raw) throw new Error('OpenAI returned empty response')

  try {
    return JSON.parse(raw)
  } catch {
    // Attempt to recover JSON if the model accidentally wrapped it.
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start >= 0 && end > start) {
      const slice = raw.slice(start, end + 1)
      return JSON.parse(slice)
    }
    throw new Error('OpenAI returned non-JSON output')
  }
}

async function renderPdfToPng(pdfBuffer: Buffer): Promise<Buffer> {
  const puppeteer = require('puppeteer')

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'die-pdf-'))
  const pdfPath = path.join(tmpDir, 'doc.pdf')

  let browser: any
  try {
    await fs.writeFile(pdfPath, pdfBuffer)

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 })

    const url = pathToFileURL(pdfPath).href
    await page.goto(url, { waitUntil: 'load' })

    // Give Chromium's PDF renderer a moment to paint.
    await new Promise(resolve => setTimeout(resolve, 750))

    // Force render additional pages by scrolling.
    try {
      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
      const step = 900
      for (let y = 0; y < scrollHeight; y += step) {
        await page.evaluate((yy: number) => window.scrollTo(0, yy), y)
        await new Promise(resolve => setTimeout(resolve, 120))
      }
      await page.evaluate(() => window.scrollTo(0, 0))
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch {
      // ignore
    }

    const png = await page.screenshot({ fullPage: true, type: 'png' })
    return Buffer.from(png)
  } finally {
    try {
      if (browser) await browser.close()
    } catch {
      // ignore
    }
    try {
      await fs.rm(tmpDir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  }
}

export class OpenAIVisionProvider implements ProviderGateway {
  name = 'openai'
  private client: OpenAI | null

  constructor() {
    this.client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null
  }

  supportsMime(mime: string): boolean {
    return isImage(mime) || isPdf(mime)
  }

  async extract(input: ExtractInput): Promise<ProviderResult> {
    if (!this.client) throw new Error('OpenAI API key not configured')

    const imageBuffer = isPdf(input.mime) ? await renderPdfToPng(input.buffer) : input.buffer
    const imageMime = isPdf(input.mime) ? 'image/png' : input.mime

    if (!isImage(imageMime)) {
      throw new Error(`OpenAI provider cannot render document mime=${input.mime}`)
    }

    const resp = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL_PRIMARY || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a receipt/invoice extraction engine. Output ONLY valid JSON (no markdown, no commentary). ' +
            'Schema: {"fields":[{"name":string,"value":string,"confidence":number}],"lines":[{"fields":[{"name":string,"value":string,"confidence":number}]}]}. ' +
            'Use these header field names when available: supplier, invoiceNumber, invoiceDate, totalAmount, subtotal, tax, currency. ' +
            'Use these line field names: name, quantity, unit, unitPrice, lineTotal. ' +
            'confidence must be 0..1. Values must be strings.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${imageMime};base64,${imageBuffer.toString('base64')}` },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    })

    const content = resp.choices?.[0]?.message?.content || ''
    const parsed = parseJsonFromModel(content)
    const fields = Array.isArray(parsed?.fields) ? parsed.fields : []
    const lines = Array.isArray(parsed?.lines) ? parsed.lines : []

    if (fields.length === 0 && lines.length === 0) {
      throw new Error('OpenAI returned empty extraction (fields=0, lines=0)')
    }

    return {
      rawPayload: resp,
      pages: isPdf(input.mime) ? undefined : 1,
      fields,
      lines,
    }
  }
}
