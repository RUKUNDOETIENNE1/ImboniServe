import { useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import { ArrowLeft, Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Card from '@/components/ui/Card'
import Link from 'next/link'

export default function ImportContactsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError('')
      setResult(null)
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const contacts = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const contact: any = {}

      headers.forEach((header, index) => {
        const value = values[index]
        if (!value) return

        // Map CSV headers to contact fields
        switch (header) {
          case 'name':
          case 'contact name':
          case 'full name':
            contact.name = value
            break
          case 'email':
          case 'email address':
            contact.email = value
            break
          case 'phone':
          case 'phone number':
          case 'mobile':
            contact.phone = value
            break
          case 'type':
          case 'contact type':
            contact.type = value.toUpperCase()
            break
          case 'status':
            contact.status = value.toUpperCase()
            break
          case 'city':
          case 'location':
            contact.city = value
            break
          case 'district':
            contact.district = value
            break
          case 'role':
            contact.role = value
            break
          case 'job title':
          case 'jobtitle':
          case 'title':
            contact.jobTitle = value
            break
          case 'address':
            contact.address = value
            break
          case 'whatsapp':
          case 'whatsapp number':
            contact.whatsappNumber = value
            break
          case 'alternate phone':
          case 'alternate':
            contact.alternatePhone = value
            break
          case 'tags':
            contact.tags = value.split(';').map((t: string) => t.trim())
            break
          case 'notes':
          case 'description':
            contact.notes = value
            break
        }
      })

      // Validate required fields
      if (contact.name && contact.phone) {
        // Set defaults
        if (!contact.type) contact.type = 'CLIENT'
        if (!contact.status) contact.status = 'ACTIVE'
        if (!contact.country) contact.country = 'RW'
        
        contacts.push(contact)
      }
    }

    return contacts
  }

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const text = await file.text()
      const contacts = parseCSV(text)

      if (contacts.length === 0) {
        setError('No valid contacts found in file. Please check the format.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/contacts/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Import failed')
      }

      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `name,email,phone,type,status,city,district,role,job title,address,whatsapp,alternate phone,tags,notes
John Doe,john@example.com,+250788123456,CLIENT,ACTIVE,Kigali,Gasabo,Manager,Operations Manager,KG 123 St,+250788123456,,vip;kigali,Important client
Jane Smith,jane@example.com,+250788999888,SUPPLIER,ACTIVE,Kigali,Nyarugenge,Owner,CEO,KN 456 Ave,+250788999888,+250788111222,supplier;verified,Reliable supplier`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/contacts"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {t('cms.actions.import', 'Import Contacts')}
              </h1>
              <p className="text-sm text-slate-600">
                Upload a CSV file to bulk import contacts
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Import Instructions</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• CSV file must have headers in the first row</li>
                <li>• Required fields: <strong>name</strong> and <strong>phone</strong></li>
                <li>• Optional fields: email, type, status, city, district, role, job title, address, whatsapp, tags, notes</li>
                <li>• Contact type must be: CLIENT, SUPPLIER, STAFF, CUSTOMER, PARTNER, or LEAD</li>
                <li>• Status must be: ACTIVE, INACTIVE, LEAD, or BLOCKED</li>
                <li>• Tags should be separated by semicolons (e.g., "vip;kigali;restaurant")</li>
                <li>• Download the template below for the correct format</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Download Template */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Download CSV Template</h3>
                <p className="text-sm text-slate-600">Get a sample file with the correct format</p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>
        </Card>

        {/* Upload Section */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">Upload CSV File</h3>
          
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-12 h-12 text-slate-400 mb-3" />
              <p className="text-slate-700 font-medium mb-1">
                {file ? file.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-slate-500">CSV files only</p>
            </label>
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
              <XCircle className="w-5 h-5 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Import Completed!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Successfully imported {result.success} contacts
                    {result.failed > 0 && ` (${result.failed} failed)`}
                  </p>
                </div>
              </div>
              
              {result.errors && result.errors.length > 0 && (
                <div className="mt-3 p-3 bg-white rounded border border-green-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">Errors:</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {result.errors.slice(0, 5).map((err: string, i: number) => (
                      <li key={i}>• {err}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-slate-500">... and {result.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="mt-4">
                <Link
                  href="/dashboard/contacts"
                  className="text-sm text-green-700 hover:text-green-800 font-medium"
                >
                  View imported contacts →
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="px-6 py-3 bg-imboni-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              {loading ? 'Importing...' : 'Import Contacts'}
            </button>
          </div>
        </Card>

        {/* Supported Fields */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Supported CSV Headers</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'name', 'email', 'phone', 'type', 'status', 'city', 
              'district', 'role', 'job title', 'address', 'whatsapp',
              'alternate phone', 'tags', 'notes'
            ].map(field => (
              <div key={field} className="px-3 py-2 bg-slate-50 rounded text-sm font-mono text-slate-700">
                {field}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
