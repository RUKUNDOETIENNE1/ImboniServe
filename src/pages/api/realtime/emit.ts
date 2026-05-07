import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { triggerEvent } from '@/lib/pusher-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const { channel, event, data } = req.body
  if (!channel || !event) return res.status(400).json({ error: 'channel and event required' })

  await triggerEvent(channel, event, data)
  return res.status(200).json({ ok: true })
}
