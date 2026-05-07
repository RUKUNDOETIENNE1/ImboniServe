import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Settings } from 'lucide-react'

interface QRCodePopoverProps {
  url: string
  title?: string
  onClose: () => void
}

export function QRCodePopover({ url, title = 'Scan QR Code', onClose }: QRCodePopoverProps) {
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [qrConfig, setQrConfig] = useState({
    size: 256,
    fgColor: '#000000',
    bgColor: '#FFFFFF',
    level: 'M' as 'L' | 'M' | 'Q' | 'H',
    includeMargin: true,
    imageSettings: {
      src: '',
      height: 48,
      width: 48,
      excavate: true
    }
  })

  const downloadQR = (format: 'svg' | 'png') => {
    const svg = document.getElementById('qr-code-preview') as unknown as SVGElement
    if (!svg) return

    if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svg)
      const blob = new Blob([svgData], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `qr-code-${Date.now()}.svg`
      link.click()
      URL.revokeObjectURL(url)
    } else {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      const svgData = new XMLSerializer().serializeToString(svg)
      const blob = new Blob([svgData], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)

      img.onload = () => {
        canvas.width = qrConfig.size
        canvas.height = qrConfig.size
        ctx?.drawImage(img, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = pngUrl
            link.download = `qr-code-${Date.now()}.png`
            link.click()
            URL.revokeObjectURL(pngUrl)
          }
        })
        URL.revokeObjectURL(url)
      }
      img.src = url
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {!showCustomizer ? (
          <>
            <div className="flex justify-center mb-4 p-4 bg-gray-50 rounded-lg">
              <QRCodeSVG
                id="qr-code-preview"
                value={url}
                size={qrConfig.size}
                fgColor={qrConfig.fgColor}
                bgColor={qrConfig.bgColor}
                level={qrConfig.level}
                includeMargin={qrConfig.includeMargin}
                imageSettings={qrConfig.imageSettings.src ? qrConfig.imageSettings : undefined}
              />
            </div>

            <div className="text-center text-sm text-gray-600 mb-4 break-all">
              {url}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCustomizer(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <Settings size={18} />
                Customize
              </button>
              <button
                onClick={() => downloadQR('svg')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                <Download size={18} />
                Download SVG
              </button>
              <button
                onClick={() => downloadQR('png')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                <Download size={18} />
                Download PNG
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center mb-4 p-4 bg-gray-50 rounded-lg">
              <QRCodeSVG
                id="qr-code-preview"
                value={url}
                size={qrConfig.size}
                fgColor={qrConfig.fgColor}
                bgColor={qrConfig.bgColor}
                level={qrConfig.level}
                includeMargin={qrConfig.includeMargin}
                imageSettings={qrConfig.imageSettings.src ? qrConfig.imageSettings : undefined}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <input
                type="range"
                min="128"
                max="512"
                step="32"
                value={qrConfig.size}
                onChange={(e) => setQrConfig({ ...qrConfig, size: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{qrConfig.size}px</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foreground Color</label>
                <input
                  type="color"
                  value={qrConfig.fgColor}
                  onChange={(e) => setQrConfig({ ...qrConfig, fgColor: e.target.value })}
                  className="w-full h-10 rounded border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <input
                  type="color"
                  value={qrConfig.bgColor}
                  onChange={(e) => setQrConfig({ ...qrConfig, bgColor: e.target.value })}
                  className="w-full h-10 rounded border"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Error Correction Level</label>
              <select
                value={qrConfig.level}
                onChange={(e) => setQrConfig({ ...qrConfig, level: e.target.value as 'L' | 'M' | 'Q' | 'H' })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (optional)</label>
              <input
                type="text"
                placeholder="https://example.com/logo.png"
                value={qrConfig.imageSettings.src}
                onChange={(e) => setQrConfig({
                  ...qrConfig,
                  imageSettings: { ...qrConfig.imageSettings, src: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCustomizer(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Back
              </button>
              <button
                onClick={() => downloadQR('svg')}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
