import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  city: string
  district?: string | null
  isVerified: boolean
}

interface SupplierMapProps {
  suppliers: Supplier[]
  businessLocation?: { lat: number; lon: number } | null
  onSupplierClick?: (supplierId: string) => void
  height?: string
}

export default function SupplierMap({
  suppliers,
  businessLocation,
  onSupplierClick,
  height = '500px'
}: SupplierMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)

  const suppliersWithCoords = suppliers.filter(
    (s) => s.latitude !== null && s.longitude !== null
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return

    if (suppliersWithCoords.length === 0 && !businessLocation) {
      setMapError('No location data available')
      return
    }

    const loadLeaflet = async () => {
      try {
        const L = (await import('leaflet')).default
        await import('leaflet/dist/leaflet.css')

        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
        })

        const centerLat = businessLocation?.lat || suppliersWithCoords[0]?.latitude || -1.9403
        const centerLon = businessLocation?.lon || suppliersWithCoords[0]?.longitude || 29.8739

        // Prevent "Map container is already initialized" by removing existing map
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }
        // Also ensure container is clean
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = ''
        }

        const map = L.map(mapContainerRef.current as HTMLDivElement).setView([centerLat, centerLon], 12)
        mapRef.current = map

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map)

        if (businessLocation) {
          const businessIcon = L.divIcon({
            className: 'custom-business-marker',
            html: `<div style="background: #0066CC; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
            </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })

          L.marker([businessLocation.lat, businessLocation.lon], { icon: businessIcon })
            .addTo(map)
            .bindPopup('<b>Your Business</b>')
        }

        suppliersWithCoords.forEach((supplier) => {
          if (supplier.latitude && supplier.longitude) {
            const supplierIcon = L.divIcon({
              className: 'custom-supplier-marker',
              html: `<div style="background: ${
                supplier.isVerified ? '#10B981' : '#F97316'
              }; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); cursor: pointer;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 7h-9"></path>
                  <path d="M14 17H5"></path>
                  <circle cx="17" cy="17" r="3"></circle>
                  <circle cx="7" cy="7" r="3"></circle>
                </svg>
              </div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            })

            const distance = businessLocation
              ? Math.sqrt(
                  Math.pow(supplier.latitude - businessLocation.lat, 2) +
                  Math.pow(supplier.longitude - businessLocation.lon, 2)
                ) * 111
              : null

            const popupContent = `
              <div style="min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
                <div style="margin-bottom: 8px;">
                  <strong style="font-size: 16px; color: #1f2937;">${supplier.name}</strong>
                  ${supplier.isVerified ? '<br/><span style="color: #10B981; font-size: 12px;">✓ Verified Supplier</span>' : ''}
                </div>
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">
                  📍 ${supplier.city}${supplier.district ? `, ${supplier.district}` : ''}
                  ${distance ? `<br/>📏 ${distance.toFixed(1)} km away` : ''}
                </div>
                <button 
                  onclick="window.location.href='/store/supplier/${supplier.id}'"
                  style="
                    width: 100%;
                    background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 13px;
                    cursor: pointer;
                    margin-top: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  "
                  onmouseover="this.style.background='linear-gradient(135deg, #EA580C 0%, #C2410C 100%)'"
                  onmouseout="this.style.background='linear-gradient(135deg, #F97316 0%, #EA580C 100%)'"
                >
                  🛒 View Products & Order
                </button>
              </div>
            `

            const marker = L.marker([supplier.latitude, supplier.longitude], {
              icon: supplierIcon
            })
              .addTo(map)
              .bindPopup(popupContent, {
                maxWidth: 250,
                className: 'custom-popup'
              })

            marker.on('click', () => {
              setSelectedSupplier(supplier.id)
            })
          }
        })

        if (suppliersWithCoords.length > 0 || businessLocation) {
          const bounds: [number, number][] = []
          if (businessLocation) {
            bounds.push([businessLocation.lat, businessLocation.lon])
          }
          suppliersWithCoords.forEach((s) => {
            if (s.latitude && s.longitude) {
              bounds.push([s.latitude, s.longitude])
            }
          })
          if (bounds.length > 1) {
            map.fitBounds(bounds as any, { padding: [50, 50] })
          }
        }

        return () => {
          if (mapRef.current) {
            mapRef.current.remove()
            mapRef.current = null
          }
        }
      } catch (error) {
        console.error('Error loading map:', error)
        setMapError('Failed to load map')
      }
    }

    loadLeaflet()
  }, [suppliers, businessLocation])

  if (mapError) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>{mapError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="rounded-lg" />
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
          <span>Your Business</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
          <span>Verified Supplier</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white"></div>
          <span>Supplier</span>
        </div>
      </div>
    </div>
  )
}
