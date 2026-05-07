import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'

interface LocationResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address: {
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
  }
}

interface LocationAutocompleteProps {
  value: string
  onChange: (location: string, coordinates?: { lat: number; lon: number }) => void
  placeholder?: string
  className?: string
  label?: string
  required?: boolean
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a location...',
  className = '',
  label,
  required = false
}: LocationAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState(value)
  const [results, setResults] = useState<LocationResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setSearchTerm(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchLocation = async (query: string) => {
    if (!query || query.length < 3) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setResults(data)
        setShowDropdown(true)
      }
    } catch (error) {
      console.error('Location search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    onChange(newValue)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      searchLocation(newValue)
    }, 500)
  }

  const handleSelectLocation = (result: LocationResult) => {
    const cityName = result.address.city || result.address.town || result.address.village || ''
    const displayName = cityName || result.display_name.split(',')[0]
    
    setSearchTerm(displayName)
    setSelectedCoords({ lat: parseFloat(result.lat), lon: parseFloat(result.lon) })
    onChange(displayName, { lat: parseFloat(result.lat), lon: parseFloat(result.lon) })
    setShowDropdown(false)
    setResults([])
  }

  const handleClear = () => {
    setSearchTerm('')
    setSelectedCoords(null)
    onChange('')
    setResults([])
    setShowDropdown(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-transparent ${className}`}
          required={required}
        />
        
        {loading && (
          <Loader2 className="absolute right-3 top-3 w-5 h-5 text-gray-400 animate-spin" />
        )}
        
        {!loading && searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.place_id}
              type="button"
              onClick={() => handleSelectLocation(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-imboni-orange mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {result.address.city || result.address.town || result.address.village || result.display_name.split(',')[0]}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {result.display_name}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedCoords && (
        <p className="mt-1 text-xs text-gray-500">
          📍 Coordinates: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lon.toFixed(6)}
        </p>
      )}
    </div>
  )
}
