import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

export default function MarketplacePage() {
  const [data, setData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/die/plugins/marketplace')
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const act = useCallback(async (id: string, action: 'install' | 'enable' | 'disable') => {
    await fetch(`/api/die/plugins/marketplace/${id}/${action}`, { method: 'POST' })
    await load()
  }, [load])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Plugin Marketplace</h1>
      <p className="text-sm text-gray-600 mb-4">Discover and manage DIE plugins. This is a minimal functional UI.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data ?? []).map((p: any) => (
          <div key={p.id} className="border rounded p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">{p.name} <span className="text-xs text-gray-500">v{p.version ?? '1.0'}</span></h2>
                <p className="text-sm text-gray-600">{p.description}</p>
                <div className="text-xs text-gray-500 mt-1">Category: {p.category} · Pricing: {p.pricingModel}</div>
                {p.tags?.length ? <div className="text-xs mt-1">Tags: {p.tags.join(', ')}</div> : null}
                <div className="text-xs mt-1">Status: <span className="font-mono">{p.status}</span></div>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 text-sm border rounded" onClick={() => act(p.id, 'install')}>Install</button>
                <button className="px-2 py-1 text-sm border rounded" onClick={() => act(p.id, 'enable')}>Enable</button>
                <button className="px-2 py-1 text-sm border rounded" onClick={() => act(p.id, 'disable')}>Disable</button>
              </div>
            </div>
            {p.id === 'qr-menu' && (
              <div className="mt-3 text-xs">
                <Link href="/dashboard/die/plugins/qr-menu" className="text-blue-600 underline">Open QR Menu Dashboard</Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
