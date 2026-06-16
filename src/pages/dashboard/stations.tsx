/**
 * Station Management UI
 * Minimal admin interface for managing stations and route rules
 * Phase 2: Station Execution Layer
 */

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import { Plus, Edit2, Power, PowerOff, Save, X } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface Station {
  id: string
  name: string
  code: string
  type: string
  isActive: boolean
  displayOrder: number
}

export default function StationsManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newStation, setNewStation] = useState({ name: '', code: '', type: 'KITCHEN' })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStations()
    }
  }, [status])

  const fetchStations = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/station/manage')
      if (res.ok) {
        const data = await res.json()
        setStations(data.stations || [])
      }
    } catch (err) {
      console.error('Failed to load stations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStation = async () => {
    if (!newStation.name || !newStation.code) {
      alert('Name and code are required')
      return
    }

    try {
      const res = await fetch('/api/station/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStation),
      })

      if (res.ok) {
        setShowAddForm(false)
        setNewStation({ name: '', code: '', type: 'KITCHEN' })
        fetchStations()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create station')
      }
    } catch (err) {
      console.error('Failed to create station:', err)
      alert('Failed to create station')
    }
  }

  const toggleStationActive = async (stationId: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/station/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId, isActive: !currentActive }),
      })

      if (res.ok) {
        fetchStations()
      }
    } catch (err) {
      console.error('Failed to toggle station:', err)
    }
  }

  const initializeDefaultStations = async () => {
    try {
      const res = await fetch('/api/station/initialize', {
        method: 'POST',
      })

      if (res.ok) {
        fetchStations()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to initialize stations')
      }
    } catch (err) {
      console.error('Failed to initialize stations:', err)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('stations.title', 'Station Management')}</h1>
            <p className="text-sm text-slate-600">{t('stations.subtitle', 'Configure operational stations')}</p>
          </div>
          <div className="flex gap-2">
            {stations.length === 0 && (
              <button
                onClick={initializeDefaultStations}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
              >
                {t('stations.initializeDefaults', 'Initialize Defaults')}
              </button>
            )}
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('stations.addStation', 'Add Station')}
            </button>
          </div>
        </div>

        {/* Add Station Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">{t('stations.newStation', 'New Station')}</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('stations.name', 'Name')}
                </label>
                <input
                  type="text"
                  value={newStation.name}
                  onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                  placeholder="e.g., Bar"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('stations.code', 'Code')}
                </label>
                <input
                  type="text"
                  value={newStation.code}
                  onChange={(e) => setNewStation({ ...newStation, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., BAR"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-transparent uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('stations.type', 'Type')}
                </label>
                <select
                  value={newStation.type}
                  onChange={(e) => setNewStation({ ...newStation, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                >
                  <option value="KITCHEN">Kitchen</option>
                  <option value="BAR">Bar</option>
                  <option value="GRILL">Grill</option>
                  <option value="FRYER">Fryer</option>
                  <option value="PASTRY">Pastry</option>
                  <option value="EXPO">Expo</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleCreateStation}
                className="flex items-center gap-2 px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {t('common.save', 'Save')}
              </button>
            </div>
          </div>
        )}

        {/* Stations List */}
        {stations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-600 mb-4">{t('stations.noStations', 'No stations configured')}</p>
            <p className="text-sm text-slate-500">
              {t('stations.noStationsHint', 'Click "Initialize Defaults" to create Kitchen and Bar stations')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map((station) => (
              <div
                key={station.id}
                className={`p-4 bg-white rounded-xl border-2 transition-all ${
                  station.isActive ? 'border-imboni-blue' : 'border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{station.name}</h3>
                    <p className="text-sm text-slate-600">{station.code}</p>
                  </div>
                  <button
                    onClick={() => toggleStationActive(station.id, station.isActive)}
                    className={`p-2 rounded-lg transition-colors ${
                      station.isActive
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    title={station.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {station.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">{station.type}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    station.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {station.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">{t('stations.howItWorks', 'How It Works')}</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• {t('stations.hint1', 'Each station shows only its assigned items')}</li>
            <li>• {t('stations.hint2', 'Access station view at /dashboard/kds?station=CODE')}</li>
            <li>• {t('stations.hint3', 'Configure routing rules to assign items to stations')}</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
