import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { FileText, Send, Download, Eye, Search, Filter } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { useTranslation } from '@/lib/i18n'

export default function SmartDiningSlips() {
  const [slips, setSlips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSlip, setSelectedSlip] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [sendingSlip, setSendingSlip] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    fetchSlips()
  }, [])

  const fetchSlips = async () => {
    try {
      const response = await fetch('/api/smart-dining-slips')
      const data = await response.json()
      setSlips(data.slips || [])
    } catch (error) {
      showToast('error', 'Failed to load Smart Dining Slips™')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async (slipId: string) => {
    const phone = prompt('Enter WhatsApp number (with country code):')
    if (!phone) return

    setSendingSlip(slipId)
    try {
      const response = await fetch(`/api/smart-dining-slips/${slipId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend', phone }),
      })

      if (response.ok) {
        showToast('success', 'Smart Dining Slip™ sent successfully')
      } else {
        showToast('error', 'Failed to send Smart Dining Slip™')
      }
    } catch (error) {
      showToast('error', 'Failed to send Smart Dining Slip™')
    } finally {
      setSendingSlip(null)
    }
  }

  const handleDownload = async (slipId: string, slipNumber: string) => {
    try {
      const response = await fetch(`/api/smart-dining-slips/${slipId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download' }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `smart-dining-slip-${slipNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast('success', 'Smart Dining Slip™ downloaded')
      } else {
        showToast('error', 'Failed to download Smart Dining Slip™')
      }
    } catch (error) {
      showToast('error', 'Failed to download Smart Dining Slip™')
    }
  }

  const filteredSlips = slips.filter(
    (slip) =>
      slip.slipNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.businessName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Smart Dining Slips™</h1>
          <p className="text-gray-600 mt-2">
            Manage and resend your digital dining records
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by slip number or business..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSlips.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Smart Dining Slips™ yet
            </h3>
            <p className="text-gray-600">
              Smart Dining Slips™ will appear here when orders are completed
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slip Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSlips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {slip.slipNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(slip.paymentTime).toLocaleDateString('en-RW')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      <CurrencyDisplay amount={slip.grandTotalCents / 100} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {slip.templateType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {slip.sentViaWhatsApp ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Sent
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Not Sent
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(slip.id, slip.slipNumber)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResend(slip.id)}
                          disabled={sendingSlip === slip.id}
                          className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 disabled:opacity-50"
                          title="Send via WhatsApp"
                        >
                          {sendingSlip === slip.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
