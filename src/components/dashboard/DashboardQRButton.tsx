import { useState } from 'react'
import { QrCode } from 'lucide-react'
import { QRCodePopover } from '@/components/qr/QRCodePopover'

interface DashboardQRButtonProps {
  businessId: string
  menuId?: string
  className?: string
}

export function DashboardQRButton({ businessId, menuId, className = '' }: DashboardQRButtonProps) {
  const [showQR, setShowQR] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.APP_URL || 'http://localhost:3000'
  const qrUrl = menuId 
    ? `${baseUrl}/menu/${menuId}?qr=dashboard-${businessId}`
    : `${baseUrl}/store/${businessId}?qr=dashboard-${businessId}`

  return (
    <>
      <button
        onClick={() => setShowQR(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition ${className}`}
        title="Generate QR Code"
      >
        <QrCode size={20} />
        <span className="hidden sm:inline">QR Code</span>
      </button>

      {showQR && (
        <QRCodePopover
          url={qrUrl}
          title={menuId ? 'Menu QR Code' : 'Store QR Code'}
          onClose={() => setShowQR(false)}
        />
      )}
    </>
  )
}
