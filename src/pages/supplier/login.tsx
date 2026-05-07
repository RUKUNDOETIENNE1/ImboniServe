export default function SupplierLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-600 rounded-2xl mb-4">
            <span className="text-3xl font-bold text-white">🚚</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Portal</h1>
          <p className="text-gray-600">Manage orders from businesses</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Phone Login - Most common in Rwanda */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">+250</span>
              <input
                type="tel"
                className="w-full pl-16 pr-4 py-2 border rounded-lg"
                placeholder="78X XXX XXX"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              We'll send a verification code via SMS
            </p>
          </div>

          <button className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 mb-4">
            Send Verification Code
          </button>

          {/* WhatsApp Login */}
          <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center">
            <span className="mr-2">📱</span>
            Login with WhatsApp
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New supplier?{' '}
              <a href="/supplier/register" className="text-orange-600 hover:text-orange-700">
                Register your business
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}