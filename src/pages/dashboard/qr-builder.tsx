import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { GetServerSideProps } from 'next'
import DashboardLayout from '@/components/DashboardLayout'
import QRCode from 'qrcode'
import { Save, Download, ExternalLink, Copy, Trash2, Copy as CopyIcon } from 'lucide-react'

type TemplateListItem = {
  id: string
  name: string
  category: string
  previewUrl?: string | null
}

type BusinessData = {
  id: string
  name: string
  phone?: string | null
  address?: string | null
  email?: string | null
}

type DesignListItem = {
  id: string
  name: string
  customData?: any
  createdAt: string
  templateName?: string | null
  templateCategory?: string | null
  token?: string | null
  qrType?: string | null
  scanCount?: number | null
  lastScannedAt?: string | null
}

export default function QrBuilderPage() {
  const { data: session, status } = useSession()
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [templateSvg, setTemplateSvg] = useState<string>('')

  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [tables, setTables] = useState<Array<{id: string; number: string; capacity: number}>>([])

  const [qrType, setQrType] = useState<'table'|'branch'|'preorder'|'pickup'>('table')
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [primaryColor, setPrimaryColor] = useState<string>('#0ea5e9')
  const [message, setMessage] = useState<string>('Scan to order')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [showBranding, setShowBranding] = useState<boolean>(false)
  const [errors, setErrors] = useState<string | null>(null)
  const [embedAsDataUrl, setEmbedAsDataUrl] = useState<boolean>(false)
  const [embeddedLogoDataUrl, setEmbeddedLogoDataUrl] = useState<string | null>(null)
  const [isEmbedding, setIsEmbedding] = useState<boolean>(false)
  const [embedError, setEmbedError] = useState<string | null>(null)

  const [shortUrl, setShortUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [designs, setDesigns] = useState<DesignListItem[]>([])
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const loadTemplates = async () => {
      const r = await fetch('/api/qr/templates')
      if (r.ok) {
        const data = await r.json()
        const list = data.templates as TemplateListItem[]
        setTemplates(list)
        if (list.length && !selectedTemplateId) setSelectedTemplateId(list[0].id)
      }
    }
    loadTemplates()
  }, [])

  useEffect(() => {
    const loadBusiness = async () => {
      const r = await fetch('/api/business/current')
      if (r.ok) {
        const b = await r.json()
        setBusiness(b)
      }
    }
    const loadTables = async () => {
      const r = await fetch('/api/tables/list')
      if (r.ok) {
        const data = await r.json()
        setTables(data.tables || [])
        if (data.tables?.length > 0) setSelectedTableId(data.tables[0].id)
      }
    }
    if (status === 'authenticated' && session?.user) {
      loadBusiness()
      loadTables()
    }
  }, [status, session])

  const loadDesigns = async () => {
    setIsLoadingDesigns(true)
    try {
      const r = await fetch('/api/qr/designs')
      if (r.ok) {
        const data = await r.json()
        setDesigns(data.designs || [])
      }
    } finally {
      setIsLoadingDesigns(false)
    }
  }

  useEffect(() => {
    loadDesigns()
  }, [])

  useEffect(() => {
    setEmbedError(null)
    setEmbeddedLogoDataUrl(null)
  }, [logoUrl])

  const onDeleteDesign = async (designId: string) => {
    if (!confirm('Delete this QR design? This cannot be undone.')) return
    setDeletingId(designId)
    try {
      const r = await fetch(`/api/qr/designs/${designId}`, { method: 'DELETE' })
      if (r.ok) {
        loadDesigns()
      } else {
        alert('Failed to delete design')
      }
    } catch (e) {
      console.error(e)
      alert('Failed to delete design')
    } finally {
      setDeletingId(null)
    }
  }

  const onDuplicateDesign = async (designId: string) => {
    setDuplicatingId(designId)
    try {
      const r = await fetch(`/api/qr/designs/${designId}`, { method: 'POST' })
      if (r.ok) {
        loadDesigns()
      } else {
        alert('Failed to duplicate design')
      }
    } catch (e) {
      console.error(e)
      alert('Failed to duplicate design')
    } finally {
      setDuplicatingId(null)
    }
  }

  useEffect(() => {
    const loadTemplate = async () => {
      if (!selectedTemplateId) return
      const r = await fetch(`/api/qr/templates/${selectedTemplateId}`)
      if (r.ok) {
        const { template } = await r.json()
        setTemplateSvg(template.svgTemplate as string)
      }
    }
    loadTemplate()
  }, [selectedTemplateId])

  const computedTargetUrl = useMemo(() => {
    if (!business) return ''
    const mode = qrType === 'table' || qrType === 'branch' ? 'invenue' : qrType
    if (qrType === 'table' && selectedTableId) {
      return `/order?branchId=${business.id}&tableId=${selectedTableId}&mode=${mode}`
    }
    return `/order?branchId=${business.id}&mode=${mode}`
  }, [business, qrType, selectedTableId])

  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  useEffect(() => {
    const make = async () => {
      const text = shortUrl || computedTargetUrl || 'about:blank'
      const data = await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: { dark: '#000000', light: '#00000000' },
        scale: 6,
      })
      setQrDataUrl(data)
    }
    make()
  }, [shortUrl, computedTargetUrl])

  const renderedSvg = useMemo(() => {
    if (!templateSvg || !business) return ''
    let svg = templateSvg
    const selectedTable = tables.find(t => t.id === selectedTableId)
    const logoSrc = (embedAsDataUrl && embeddedLogoDataUrl) ? embeddedLogoDataUrl : (logoUrl || '')
    const map: Record<string, string> = {
      'business.name': business.name,
      'business.phone': business.phone ?? '',
      'business.address': business.address ?? '',
      'business.logoUrl': logoSrc,
      'custom.primaryColor': primaryColor,
      'custom.message': message,
      'custom.tableNumber': selectedTable?.number || '',
      'custom.logoUrl': logoSrc,
      'custom.imageUrl': logoSrc,
      'image.url': logoSrc,
      'image': logoSrc,
      'qr.dataUrl': qrDataUrl,
    }
    for (const [k, v] of Object.entries(map)) {
      const pattern = new RegExp(`\\{\\{${k.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\}\\}`, 'g')
      svg = svg.replace(pattern, String(v))
    }
    svg = svg.replace(/\{\{[^}]+\}\}/g, '')
    // Fallback: if template has no image placeholders but a logo/image URL is provided,
    // inject a small logo block near the top-left to support "Business Card" style.
    if (logoSrc && !svg.includes(logoSrc)) {
      const closingTagRegex = new RegExp("</svg>\\s*$", "i")
      const overlay = `<image href="${logoSrc}" x="24" y="24" width="180" height="180" preserveAspectRatio="xMidYMid meet" />\n</svg>`
      svg = svg.replace(closingTagRegex, overlay)
    }
    return svg
  }, [templateSvg, business, primaryColor, message, selectedTableId, tables, qrDataUrl, logoUrl, embedAsDataUrl, embeddedLogoDataUrl])

  const onSave = async () => {
    setErrors(null)
    if (!selectedTemplateId) { setErrors('Please select a template'); return }
    if (!business) { setErrors('Business context missing'); return }
    if (qrType === 'table' && !selectedTableId) { setErrors('Please select a table for Table QR'); return }
    setIsSaving(true)
    try {
      const r = await fetch('/api/qr/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          qrType,
          primaryColor,
          message,
          tableId: qrType === 'table' ? selectedTableId : undefined,
          mode: qrType === 'table' || qrType === 'branch' ? 'invenue' : qrType
        })
      })
      if (r.ok) {
        const data = await r.json()
        setShortUrl(data.shortUrl as string)
        loadDesigns()
      } else {
        const e = await r.json().catch(() => ({}))
        alert(`Failed to save: ${e.error || r.statusText}`)
      }
    } catch (e) {
      console.error(e)
      alert('Failed to save design')
    } finally {
      setIsSaving(false)
    }
  }

  const onDownloadPng = async () => {
    if (!renderedSvg) return
    setIsDownloading(true)
    try {
      const svgBlob = new Blob([renderedSvg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = url
      })
      const scale = 2
      const width = img.naturalWidth || 1200
      const height = img.naturalHeight || 1600
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(width * scale)
      canvas.height = Math.floor(height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)

      const pngUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = pngUrl
      a.download = `${business?.name || 'qr-design'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert('Failed to generate PNG')
    } finally {
      setIsDownloading(false)
    }
  }

  const onDownloadSvg = () => {
    if (!renderedSvg) return
    try {
      const svgBlob = new Blob([renderedSvg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${business?.name || 'qr-design'}.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('Failed to download SVG')
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">QR Menu Builder</h1>
        <p className="text-gray-600 mb-6">Create a branded QR design in minutes. Choose a template, customize a few fields, save, and download.</p>
        <div className="mb-6 text-sm bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-700">
          <div className="font-semibold mb-1">How to use</div>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Select a template on the left. This tool creates printable/shareable QR posters or cards.</li>
            <li>Pick QR Type (Table, Branch, Preorder, Pickup). For Table, select the table to embed in the QR link.</li>
            <li>Customize color, message, and optional logo/image URL. The menu and items are managed elsewhere in Dashboard → Menu.</li>
            <li>Click Save Design (optional), then Download PNG or SVG to print or share.</li>
          </ol>
          <div className="mt-2 text-xs text-slate-500">Note: This does not build your menu. It only generates designs that link to your existing menu flow.</div>
          <div className="mt-3">
            <a href="/docs/go-live-checklist.html" target="_blank" rel="noreferrer" className="text-teal-700 hover:text-teal-800 underline">Open Go‑Live Checklist</a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="font-semibold mb-1">Templates</h2>
              <p className="text-xs text-slate-500 mb-2">Tip: Some templates support images. Paste a URL in “Logo / Image URL” to include your logo.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {templates.map(t => (
                  <button key={t.id} onClick={() => setSelectedTemplateId(t.id)} className={`border rounded-lg overflow-hidden text-left hover:shadow transition ${selectedTemplateId===t.id?'ring-2 ring-teal-600':''}`}>
                    {t.previewUrl ? (
                      <img
                        src={t.previewUrl}
                        alt={t.name}
                        className="w-full aspect-[3/4] object-contain bg-gray-50"
                        onError={(e) => {
                          const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='400'><rect fill='%23f1f5f9' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23607484' font-size='14'>No preview</text></svg>`
                          ;(e.currentTarget as HTMLImageElement).src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
                        }}
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-gray-100" />
                    )}
                    <div className="p-2"><div className="text-sm font-medium">{t.name}</div><div className="text-xs text-gray-500 capitalize">{t.category.replace('_',' ')}</div></div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Preview</h2>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-gray-900 rounded-md p-8 flex items-center justify-center min-h-[480px]">
                {renderedSvg ? (
                  <div className="w-full max-w-[720px]">
                    <div dangerouslySetInnerHTML={{ __html: renderedSvg }} />
                    {showBranding && (
                      <div className="text-center text-xs text-slate-500 mt-2">Empowered by ImboniServe</div>
                    )}
                  </div>
                ) : (
                  <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Template</h3>
                    <p className="text-sm text-gray-500">Choose a template from the list above to preview your QR code design</p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                {errors && (
                  <div className="w-full text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{errors}</div>
                )}
                <button onClick={onSave} disabled={isSaving || !selectedTemplateId} className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-50 hover:bg-teal-700">
                  <Save size={16} /> {isSaving ? 'Saving...' : 'Save Design'}
                </button>
                <button onClick={onDownloadPng} disabled={isDownloading || !renderedSvg} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 hover:bg-gray-800">
                  <Download size={16} /> {isDownloading ? 'Generating...' : 'Download PNG'}
                </button>
                <button onClick={onDownloadSvg} disabled={!renderedSvg} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50">
                  <Download size={16} /> SVG
                </button>
                <button
                  onClick={async () => {
                    try {
                      setErrors(null)
                      if (!business) { setErrors('Business context missing'); return }
                      if (qrType !== 'table') { setErrors('Bulk download is available for Table QR type'); return }
                      if (!templateSvg) { setErrors('Please select a template'); return }
                      if (!tables || tables.length === 0) { setErrors('No tables found to generate'); return }
                      setIsDownloading(true)
                      for (const t of tables) {
                        const link = `/order?branchId=${business.id}&tableId=${t.id}&mode=invenue`
                        const dataUrl = await QRCode.toDataURL(link, {
                          errorCorrectionLevel: 'M',
                          margin: 1,
                          color: { dark: '#000000', light: '#00000000' },
                          scale: 6,
                        })
                        let svg = templateSvg as string
                        const logoSrcBulk = (embedAsDataUrl && embeddedLogoDataUrl) ? embeddedLogoDataUrl : (logoUrl || '')
                        const map: Record<string, string> = {
                          'business.name': business.name,
                          'business.phone': business.phone ?? '',
                          'business.address': business.address ?? '',
                          'business.logoUrl': logoSrcBulk,
                          'custom.primaryColor': primaryColor,
                          'custom.message': message,
                          'custom.tableNumber': String(t.number || ''),
                          'custom.logoUrl': logoSrcBulk,
                          'custom.imageUrl': logoSrcBulk,
                          'image.url': logoSrcBulk,
                          'image': logoSrcBulk,
                          'qr.dataUrl': dataUrl,
                        }
                        for (const [k, v] of Object.entries(map)) {
                          const pattern = new RegExp(`\\{\\{${k.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\}\\}`,'g')
                          svg = svg.replace(pattern, String(v))
                        }
                        svg = svg.replace(/\\{\\{[^}]+\\}\\}/g, '')
                        // Fallback injection for bulk export as well
                        if (logoSrcBulk && !svg.includes(logoSrcBulk)) {
                          const closingTagRegex2 = new RegExp("</svg>\\s*$", "i")
                          const overlay2 = `<image href=\"${logoSrcBulk}\" x=\"24\" y=\"24\" width=\"180\" height=\"180\" preserveAspectRatio=\"xMidYMid meet\" />\\n</svg>`
                          svg = svg.replace(closingTagRegex2, overlay2)
                        }
                        // Convert to PNG and download
                        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
                        const url = URL.createObjectURL(svgBlob)
                        const img = new Image()
                        await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = url })
                        const canvas = document.createElement('canvas')
                        const scale = 2
                        const width = img.naturalWidth || 1200
                        const height = img.naturalHeight || 1600
                        canvas.width = Math.floor(width * scale)
                        canvas.height = Math.floor(height * scale)
                        const ctx = canvas.getContext('2d')!
                        ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height)
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                        URL.revokeObjectURL(url)
                        const pngUrl = canvas.toDataURL('image/png')
                        const a = document.createElement('a')
                        a.href = pngUrl
                        a.download = `${business.name}-table-${t.number}.png`
                        document.body.appendChild(a); a.click(); document.body.removeChild(a)
                      }
                    } catch (e) {
                      console.error(e)
                      alert('Bulk download failed')
                    } finally {
                      setIsDownloading(false)
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Download size={16} /> Bulk PNG (All Tables)
                </button>
                {shortUrl && (
                  <a href={shortUrl} target="_blank" rel="noreferrer" className="ml-auto text-teal-700 underline hover:text-teal-800">Open Short Link</a>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">QR Type</label>
                  <select value={qrType} onChange={e=>setQrType(e.target.value as any)} className="mt-1 w-full border rounded px-3 py-2 bg-white dark:bg-gray-900">
                    <option value="table">Table (In-Venue)</option>
                    <option value="branch">Branch (In-Venue - Any Table)</option>
                    <option value="preorder">Remote Preorder</option>
                    <option value="pickup">Remote Pickup</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {qrType === 'table' && 'Customers scan at a specific table'}
                    {qrType === 'branch' && 'Customers can choose any table when ordering'}
                    {qrType === 'preorder' && 'Customers order ahead for scheduled pickup'}
                    {qrType === 'pickup' && 'Customers order for immediate pickup'}
                  </p>
                </div>
                {qrType==='table' && (
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Select Table</label>
                    {tables.length > 0 ? (
                      <select value={selectedTableId} onChange={e=>setSelectedTableId(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 bg-white dark:bg-gray-900">
                        {tables.map(table => (
                          <option key={table.id} value={table.id}>
                            Table {table.number} (Cap: {table.capacity})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">No tables found. Create tables first.</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600">Primary Color</label>
                  <input type="color" value={primaryColor} onChange={e=>setPrimaryColor(e.target.value)} className="mt-1 h-10 w-20 p-0 border rounded bg-white dark:bg-gray-900" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Message</label>
                  <input value={message} onChange={e=>setMessage(e.target.value)} maxLength={100} className="mt-1 w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" placeholder="Short tagline" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Logo / Image URL</label>
                  <input value={logoUrl || ''} onChange={e=>setLogoUrl(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" placeholder="https://.../logo.png" />
                  <p className="text-xs text-gray-500 mt-1">Optional. Used by templates with an image placeholder.</p>
                  <div className="mt-2 flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={embedAsDataUrl} onChange={e=>setEmbedAsDataUrl(e.target.checked)} />
                      <span>Embed image as data URL</span>
                    </label>
                    <button
                      onClick={async () => {
                        if (!logoUrl) return
                        setIsEmbedding(true)
                        setEmbedError(null)
                        try {
                          const r = await fetch(`/api/utils/fetch-image-dataurl?url=${encodeURIComponent(logoUrl)}`)
                          if (!r.ok) {
                            const e = await r.json().catch(() => ({} as any))
                            throw new Error(e.error || 'Failed to convert image')
                          }
                          const data = await r.json()
                          setEmbeddedLogoDataUrl(data.dataUrl as string)
                        } catch (e: any) {
                          setEmbeddedLogoDataUrl(null)
                          setEmbedError(e?.message || 'Conversion failed')
                        } finally {
                          setIsEmbedding(false)
                        }
                      }}
                      disabled={!logoUrl || isEmbedding}
                      className="text-xs px-2 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isEmbedding ? 'Converting…' : 'Convert to Data URL'}
                    </button>
                  </div>
                  {embedAsDataUrl && !embeddedLogoDataUrl && (
                    <p className="text-xs text-amber-600 mt-1">Enable conversion and click "Convert" to avoid broken images when exporting.</p>
                  )}
                  {embeddedLogoDataUrl && (
                    <p className="text-xs text-teal-700 mt-1">Embedded image ready.</p>
                  )}
                  {embedError && (
                    <p className="text-xs text-red-600 mt-1">{embedError}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input id="branding" type="checkbox" checked={showBranding} onChange={e=>setShowBranding(e.target.checked)} />
                  <label htmlFor="branding" className="text-sm text-gray-700">Show “Empowered by ImboniServe” branding under preview</label>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Business Info</h2>
              {business ? (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Business Name</div>
                    <div className="font-medium">{business.name}</div>
                  </div>
                  {business.phone && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Phone</div>
                      <div>{business.phone}</div>
                    </div>
                  )}
                  {business.address && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Address</div>
                      <div className="text-sm">{business.address}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">My Designs</h2>
                <button onClick={loadDesigns} className="text-sm text-teal-700 hover:underline">Refresh</button>
              </div>
              {isLoadingDesigns ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ) : designs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">No QR Codes Yet</p>
                  <p className="text-xs text-gray-500">Create your first QR code by selecting a template and clicking "Save Design"</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {designs.map(d => {
                    const short = d.token ? `/q/${d.token}` : null
                    return (
                      <li key={d.id} className="py-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{d.name || d.templateName || 'QR Design'}</div>
                          <div className="text-xs text-gray-500 capitalize">
                            {(d.templateCategory || '').replace('_',' ')} • {d.qrType || 'menu'} • scans: {d.scanCount ?? 0}
                            {d.lastScannedAt && (
                              <> • last: {new Date(d.lastScannedAt).toLocaleDateString()}</>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {short && (
                            <>
                              <a href={short} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-900 text-white hover:bg-gray-800">
                                <ExternalLink size={14} /> Open
                              </a>
                              <button
                                onClick={async () => {
                                  try {
                                    const href = (typeof window !== 'undefined' ? window.location.origin : '') + short
                                    await navigator.clipboard.writeText(href)
                                    setCopiedToken(d.token || null)
                                    setTimeout(() => setCopiedToken(null), 1500)
                                  } catch {}
                                }}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-gray-50"
                                title="Copy short link"
                              >
                                <Copy size={14} /> {copiedToken === d.token ? 'Copied' : 'Copy'}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => onDuplicateDesign(d.id)}
                            disabled={duplicatingId === d.id}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
                            title="Duplicate design"
                          >
                            <CopyIcon size={14} /> {duplicatingId === d.id ? '...' : 'Dup'}
                          </button>
                          <button
                            onClick={() => onDeleteDesign(d.id)}
                            disabled={deletingId === d.id}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                            title="Delete design"
                          >
                            <Trash2 size={14} /> {deletingId === d.id ? '...' : 'Del'}
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session) {
    return {
      redirect: { destination: '/login', permanent: false }
    }
  }
  return { props: {} }
}
