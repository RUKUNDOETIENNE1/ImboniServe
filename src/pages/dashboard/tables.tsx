import React, { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { Users, Trash2, Edit2, RefreshCw, Plus } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { useToast } from '@/components/Toast'
import { useTranslation } from '@/lib/i18n'

interface TableItem {
  id: string
  number: string
  capacity: number
  status?: string
}

export default function TablesPage() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [tables, setTables] = useState<TableItem[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)

  const [number, setNumber] = useState('')
  const [capacity, setCapacity] = useState<number | ''>('')
  const [editNumber, setEditNumber] = useState('')
  const [editCapacity, setEditCapacity] = useState<number | ''>('')

  const loadTables = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/tables/list')
      if (!r.ok) throw new Error(`Failed to load tables: ${r.status}`)
      const data = await r.json()
      setTables(data.tables || [])
    } catch (e: any) {
      showToast('error', e.message || t('tables.failed_to_load'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTables() }, [])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!number || !capacity) return
    setCreating(true)
    try {
      const r = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: String(number).trim(), capacity: Number(capacity), status: 'AVAILABLE' }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || r.statusText)
      setNumber('')
      setCapacity('')
      // t returns string; ensure payload interpolation handled by translation layer externally
      showToast('success', String(t('tables.table_created_success')))
      await loadTables()
    } catch (e: any) {
      showToast('error', e.message || t('tables.failed_to_create'))
    } finally {
      setCreating(false)
    }
  }

  const onDelete = async (id: string, tableNumber: string) => {
    if (!confirm(String(t('tables.delete_confirm')))) return
    setDeleting(id)
    try {
      const r = await fetch(`/api/tables/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('Failed to delete table')
      showToast('success', String(t('tables.table_deleted_success')))
      await loadTables()
    } catch (e: any) {
      showToast('error', e.message || t('tables.failed_to_delete'))
    } finally {
      setDeleting(null)
    }
  }

  const onEdit = async (id: string) => {
    if (!editNumber || !editCapacity) return
    try {
      const r = await fetch(`/api/tables/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: editNumber.trim(), capacity: Number(editCapacity) }),
      })
      if (!r.ok) throw new Error('Failed to update table')
      showToast('success', t('tables.table_updated_success'))
      setEditing(null)
      await loadTables()
    } catch (e: any) {
      showToast('error', e.message || t('tables.failed_to_update'))
    }
  }

  const startEdit = (table: TableItem) => {
    setEditing(table.id)
    setEditNumber(table.number)
    setEditCapacity(table.capacity)
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800" suppressHydrationWarning>{t('tables.title')}</h1>
        <p className="text-sm text-slate-500 mt-1" suppressHydrationWarning>{t('tables.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800" suppressHydrationWarning>{t('tables.add_new_table')}</h2>
          </div>
          <form onSubmit={onCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2" suppressHydrationWarning>{t('tables.table_number_name')}</label>
              <input 
                value={number} 
                onChange={e=>setNumber(e.target.value)} 
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue transition-all" 
                placeholder={t('tables.table_number_placeholder')} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2" suppressHydrationWarning>{t('tables.seating_capacity')}</label>
              <input 
                type="number" 
                min={1} 
                value={capacity} 
                onChange={e=>setCapacity(e.target.value ? Number(e.target.value) : '')} 
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue transition-all" 
                placeholder={t('tables.capacity_placeholder')} 
              />
            </div>
            <button 
              type="submit" 
              disabled={creating || !number || !capacity} 
              className="w-full bg-gradient-to-r from-imboni-blue to-blue-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {creating ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> <span suppressHydrationWarning>{t('tables.creating')}</span></>
              ) : (
                <><Plus className="w-4 h-4" /> <span suppressHydrationWarning>{t('tables.create_table')}</span></>
              )}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800" suppressHydrationWarning>{t('tables.all_tables')} ({tables.length})</h2>
            <button 
              onClick={loadTables} 
              disabled={loading}
              className="flex items-center gap-1.5 text-sm text-imboni-blue hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span suppressHydrationWarning>{t('tables.refresh')}</span>
            </button>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-16 bg-slate-100 rounded-xl" />
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium" suppressHydrationWarning>{t('tables.no_tables_yet')}</p>
              <p className="text-sm text-slate-400 mt-1" suppressHydrationWarning>{t('tables.no_tables_desc')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tables.map(table => (
                <div key={table.id} className="border border-slate-200 rounded-xl p-4 hover:border-imboni-blue/30 hover:shadow-sm transition-all">
                  {editing === table.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-slate-800" suppressHydrationWarning>{t('tables.editing_table')} {table.number}</div>
                        <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600">
                          <span className="text-sm" suppressHydrationWarning>{t('common.cancel')}</span>
                        </button>
                      </div>
                      <form onSubmit={(e) => { e.preventDefault(); onEdit(table.id) }} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1" suppressHydrationWarning>{t('tables.table_number')}</label>
                            <input
                              type="text"
                              value={editNumber}
                              onChange={(e) => setEditNumber(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1" suppressHydrationWarning>{t('tables.capacity')}</label>
                            <input
                              type="number"
                              min="1"
                              value={editCapacity}
                              onChange={(e) => setEditCapacity(e.target.value ? parseInt(e.target.value) : '')}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                              required
                            />
                          </div>
                        </div>
                        <button type="submit" className="w-full py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-medium" suppressHydrationWarning>
                          {t('tables.save_changes')}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-imboni-blue to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {table.number}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800" suppressHydrationWarning>{t('tables.table')} {table.number}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span suppressHydrationWarning>{table.capacity} {t('tables.seats')}</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              {table.status || 'AVAILABLE'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/dashboard/tables/${table.id}/seats`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span suppressHydrationWarning>{t('tables.manage_seats')}</span>
                        </Link>
                        <button 
                          onClick={() => startEdit(table)} 
                          className="p-1.5 text-slate-600 hover:text-imboni-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('tables.edit_table')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDelete(table.id, table.number)} 
                          disabled={deleting === table.id}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title={t('tables.delete_table')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}
