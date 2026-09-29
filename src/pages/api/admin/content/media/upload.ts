import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { PlatformMediaService } from '@/lib/content/platform-media.service'
import { hasEditorialAccess, getEditorialUser, isAdmin } from '@/lib/content/auth'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: { bodyParser: false },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })
  if (!hasEditorialAccess(session)) return res.status(403).json({ error: 'Editorial access required' })

  const editorialUser = getEditorialUser(session)!

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const form = formidable({
    maxFileSize: 50 * 1024 * 1024,
  })

  try {
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    const file = files.file?.[0] || files.file
    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    const fileBuffer = fs.readFileSync(file.filepath)
    const mimeType = file.mimetype || 'application/octet-stream'
    const filename = file.originalFilename || 'upload'

    const altText = fields.altText?.[0] || fields.altText || undefined
    const caption = fields.caption?.[0] || fields.caption || undefined
    const attribution = fields.attribution?.[0] || fields.attribution || undefined
    const tagsStr = fields.tags?.[0] || fields.tags || ''
    const tags = tagsStr ? String(tagsStr).split(',').map((t: string) => t.trim()).filter(Boolean) : []

    const media = await PlatformMediaService.upload(fileBuffer, filename, mimeType, editorialUser.id, {
      altText: altText || undefined,
      caption: caption || undefined,
      attribution: attribution || undefined,
      tags,
    })

    fs.unlinkSync(file.filepath)

    return res.status(201).json({ media })
  } catch (err: any) {
    if (err.message.includes('Invalid') || err.message.includes('too large') || err.message.includes('Unsupported')) {
      return res.status(400).json({ error: err.message })
    }
    return res.status(500).json({ error: err.message })
  }
}
