import { useState } from 'react'
import { Upload, FileText, Link as LinkIcon, Download, Check, AlertCircle } from 'lucide-react'
import { MenuImportService, MenuItemImport } from '@/lib/services/menu-import.service'

interface MenuImportWizardProps {
  businessId: string
  onComplete: (items: MenuItemImport[]) => void
  onCancel: () => void
}

export function MenuImportWizard({ businessId, onComplete, onCancel }: MenuImportWizardProps) {
  const [step, setStep] = useState<'method' | 'upload' | 'preview'>('method')
  const [importMethod, setImportMethod] = useState<'csv' | 'sheets' | null>(null)
  const [sheetsUrl, setSheetsUrl] = useState('')
  const [importResult, setImportResult] = useState<MenuItemImport[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const result = await MenuImportService.importFromCSV(file)
    setLoading(false)

    if (result.success) {
      setImportResult(result.items)
      setErrors(result.errors)
      setWarnings(result.warnings)
      setStep('preview')
    } else {
      setErrors(result.errors)
    }
  }

  const handleSheetsImport = async () => {
    if (!sheetsUrl) return

    setLoading(true)
    const result = await MenuImportService.importFromGoogleSheets(sheetsUrl)
    setLoading(false)

    if (result.success) {
      setImportResult(result.items)
      setErrors(result.errors)
      setWarnings(result.warnings)
      setStep('preview')
    } else {
      setErrors(result.errors)
    }
  }

  const handleConfirm = () => {
    const validation = MenuImportService.validateImportData(importResult)
    if (validation.valid) {
      onComplete(importResult)
    } else {
      setErrors(validation.errors)
    }
  }

  const groupedItems = MenuImportService.groupItemsByCategory(importResult)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Import Menu</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {step === 'method' && (
          <div className="space-y-4">
            <p className="text-gray-600 mb-6">Choose how you'd like to import your menu:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setImportMethod('csv')
                  setStep('upload')
                }}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition"
              >
                <FileText size={48} className="mx-auto mb-4 text-teal-600" />
                <h3 className="font-semibold mb-2">Upload CSV File</h3>
                <p className="text-sm text-gray-600">Import from a CSV file on your computer</p>
              </button>

              <button
                onClick={() => {
                  setImportMethod('sheets')
                  setStep('upload')
                }}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition"
              >
                <LinkIcon size={48} className="mx-auto mb-4 text-teal-600" />
                <h3 className="font-semibold mb-2">Google Sheets</h3>
                <p className="text-sm text-gray-600">Import from a Google Sheets URL</p>
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Download size={20} className="text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-blue-900">Need a template?</p>
                  <p className="text-sm text-blue-700 mb-2">Download our sample CSV to see the required format</p>
                  <button
                    onClick={() => MenuImportService.downloadSampleCSV()}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Download Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'upload' && importMethod === 'csv' && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('method')}
              className="text-teal-600 hover:text-teal-700 mb-4"
            >
              ← Back
            </button>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Upload size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">Drag and drop your CSV file here, or click to browse</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="inline-block px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 cursor-pointer"
              >
                Choose File
              </label>
            </div>

            {errors.length > 0 && (
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={20} className="text-red-600 mt-1" />
                  <div>
                    <p className="font-medium text-red-900">Import Errors</p>
                    <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                      {errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'upload' && importMethod === 'sheets' && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('method')}
              className="text-teal-600 hover:text-teal-700 mb-4"
            >
              ← Back
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Sheets URL
              </label>
              <input
                type="text"
                value={sheetsUrl}
                onChange={(e) => setSheetsUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-4 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Make sure your sheet is publicly accessible (Anyone with the link can view)
              </p>
            </div>

            <button
              onClick={handleSheetsImport}
              disabled={!sheetsUrl || loading}
              className="w-full px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Importing...' : 'Import from Sheets'}
            </button>

            {errors.length > 0 && (
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={20} className="text-red-600 mt-1" />
                  <div>
                    <p className="font-medium text-red-900">Import Errors</p>
                    <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                      {errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setStep('method')}
                className="text-teal-600 hover:text-teal-700"
              >
                ← Back
              </button>
              <div className="text-sm text-gray-600">
                {importResult.length} items in {groupedItems.size} categories
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle size={20} className="text-yellow-600 mt-1" />
                  <div>
                    <p className="font-medium text-yellow-900">Warnings</p>
                    <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                      {warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              {Array.from(groupedItems.entries()).map(([category, items]) => (
                <div key={category} className="border-b last:border-b-0">
                  <div className="bg-gray-50 px-4 py-2 font-semibold">{category}</div>
                  {items.map((item, i) => (
                    <div key={i} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-600">{item.description}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{(item.price / 100).toFixed(2)} RWF</div>
                        {item.available && (
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            <Check size={12} /> Available
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Import {importResult.length} Items
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
