import type { NextApiRequest, NextApiResponse } from 'next'

const MAX_BYTES = 1_048_576; // 1MB limit

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const url = (req.query.url || '') as string
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only http/https URLs are supported' })
  }

  try {
    const response = await fetch(parsed.toString(), { redirect: 'follow' })
    if (!response.ok) {
      return res.status(400).json({ error: `Failed to fetch resource (${response.status})` })
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'URL is not an image' })
    }

    const contentLengthHeader = response.headers.get('content-length')
    if (contentLengthHeader) {
      const len = parseInt(contentLengthHeader, 10)
      if (!Number.isNaN(len) && len > MAX_BYTES) {
        return res.status(413).json({ error: 'Image too large (max 1MB)' })
      }
    }

    const arrayBuf = await response.arrayBuffer()
    if (arrayBuf.byteLength > MAX_BYTES) {
      return res.status(413).json({ error: 'Image too large (max 1MB)' })
    }

    const base64 = Buffer.from(arrayBuf).toString('base64')
    const dataUrl = `data:${contentType};base64,${base64}`

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ dataUrl, contentType })
  } catch (e: any) {
    return res.status(500).json({ error: 'Unexpected error fetching image' })
  }
}
