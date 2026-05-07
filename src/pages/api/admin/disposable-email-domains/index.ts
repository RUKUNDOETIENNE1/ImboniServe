import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/middleware/auth.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const page = parseInt((req.query.page as string) || '1', 10)
    const pageSize = parseInt((req.query.pageSize as string) || '20', 10)
    const q = ((req.query.q as string) || '').trim().toLowerCase()
    const where: any = q ? { domain: { contains: q } } : {}
    const [items, total] = await Promise.all([
      prisma.disposableEmailDomain.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.disposableEmailDomain.count({ where }),
    ])
    return res.status(200).json({ data: items, page, pageSize, total })
  }

  if (req.method === 'POST') {
    const body = req.body as any
    const domainsInput: string[] = Array.isArray(body?.domains)
      ? body.domains
      : body?.domain
      ? [body.domain]
      : []
    if (!domainsInput.length) return res.status(400).json({ error: 'domain or domains required' })
    const unique = Array.from(new Set(domainsInput.map((d) => String(d).trim().toLowerCase()).filter(Boolean)))
    if (!unique.length) return res.status(400).json({ error: 'No valid domains' })
    const result = await prisma.disposableEmailDomain.createMany({ data: unique.map((d) => ({ domain: d })), skipDuplicates: true })
    return res.status(201).json({ inserted: result.count })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAuth(requireRole(['ADMIN'])(handler))
