import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import FormModal from '@/components/FormModal'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/components/Toast'
import { useTranslation } from '@/lib/i18n'
import { Users, UserPlus, Mail, Phone, Shield, Edit, Trash2, Save, Lock, Search, ChevronRight, PlusCircle, CheckCircle2, XCircle } from 'lucide-react'

export default function Staff() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CASHIER',
    branchId: '' as string | undefined,
    customRoleId: '' as string | undefined,
    newPassword: '' as string | undefined,
  })
  const [roles, setRoles] = useState<{ system: any[]; custom: any[] }>({ system: [], custom: [] })
  const [branches, setBranches] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [addStep, setAddStep] = useState<1 | 2 | 3>(1)
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false)
  const [newRole, setNewRole] = useState<{ name: string; description: string; color: string; icon: string; baseRole: string; permissions: Record<string, any> }>({ name: '', description: '', color: '', icon: '', baseRole: 'MANAGER', permissions: defaultPermissions() as any })

  useEffect(() => {
    fetchFilters()
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [roleFilter, branchFilter, statusFilter])

  function defaultPermissions() {
    return {
      dashboard: { view: true },
      orders: { read: true, create: false, update: false, refund: false },
      tables: { read: true, create: false, update: false, manageReservations: false },
      rooms: { read: true, checkin: false, checkout: false, manage: false },
      payments: { read: true, create: false, refund: false },
      reports: { view: false },
      staff: { view: false, manage: false },
      inventory: { read: false, update: false, manage: false },
      settings: { read: false, manage: false },
    }
  }

  const fetchFilters = async () => {
    try {
      const [rolesRes, branchesRes] = await Promise.all([
        fetch('/api/staff/roles'),
        fetch('/api/branches'),
      ])
      if (rolesRes.ok) {
        const data = await rolesRes.json()
        setRoles({ system: data.system || [], custom: data.custom || [] })
      }
      if (branchesRes.ok) {
        const data = await branchesRes.json()
        setBranches(data.branches || [])
      }
    } catch (e) {
      // ignore
    }
  }

  const fetchStaff = async () => {
    try {
      const params = new URLSearchParams()
      if (query) params.append('q', query)
      if (roleFilter) params.append('role', roleFilter)
      if (branchFilter) params.append('branchId', branchFilter)
      if (statusFilter) params.append('status', statusFilter)
      const res = await fetch(`/api/staff?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setStaffMembers(data.staff || [])
      }
    } catch (error) {
      showToast('error', 'Failed to fetch staff')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (addStep === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        showToast('error', 'Please fill in all required fields')
        return
      }
      setAddStep(2)
      return
    }
    if (addStep === 2) {
      // Go to permission confirmation
      setAddStep(3)
      return
    }
    if (addStep === 3) {
      try {
        const res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (res.ok) {
          showToast('success', 'Staff member added successfully!')
          setShowAddModal(false)
          setAddStep(1)
          setFormData({ name: '', email: '', phone: '', password: '', role: 'CASHIER', branchId: '', customRoleId: '', newPassword: '' })
          fetchStaff()
        } else {
          const error = await res.json()
          showToast('error', error.error || 'Failed to add staff member')
        }
      } catch (error) {
        showToast('error', 'Failed to add staff member')
      }
    }
  }

  const handleEdit = async () => {
    if (!selectedStaff) return

    try {
      const res = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          branchId: formData.branchId,
          customRoleId: formData.customRoleId,
          newPassword: formData.newPassword
        })
      })

      if (res.ok) {
        showToast('success', 'Staff member updated successfully!')
        setShowEditModal(false)
        setSelectedStaff(null)
        fetchStaff()
      } else {
        const error = await res.json()
        showToast('error', error.error || 'Failed to update staff member')
      }
    } catch (error) {
      showToast('error', 'Failed to update staff member')
    }
  }

  const handleDelete = async () => {
    if (!selectedStaff) return

    try {
      const res = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        showToast('success', 'Staff member deactivated successfully!')
        setSelectedStaff(null)
        fetchStaff()
      } else {
        showToast('error', 'Failed to deactivate staff member')
      }
    } catch (error) {
      showToast('error', 'Failed to deactivate staff member')
    }
  }

  const openEditModal = (staff: any) => {
    setSelectedStaff(staff)
    setFormData({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      password: '',
      role: staff.roles[0] || 'CASHIER',
      branchId: staff.primaryBranchId || '',
      customRoleId: '',
      newPassword: ''
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (staff: any) => {
    setSelectedStaff(staff)
    setShowDeleteModal(true)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-100 text-purple-700'
      case 'CASHIER': return 'bg-blue-100 text-blue-700'
      case 'FRONT_DESK': return 'bg-blue-100 text-blue-700'
      case 'KITCHEN_MANAGER': return 'bg-orange-100 text-orange-700'
      case 'MANAGER': return 'bg-emerald-100 text-emerald-700'
      case 'WAITER': return 'bg-pink-100 text-pink-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const getAvatarColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'from-purple-500 to-purple-700'
      case 'CASHIER': return 'from-blue-500 to-blue-700'
      case 'KITCHEN_MANAGER': return 'from-orange-500 to-orange-700'
      default: return 'from-slate-500 to-slate-700'
    }
  }

  const filteredStaff = staffMembers.filter(staff => 
    activeTab === 'all' || 
    (activeTab === 'active' && staff.isActive) ||
    (activeTab === 'inactive' && !staff.isActive)
  )

  const stats = [
    { label: 'Total Staff', value: staffMembers.length },
    { label: 'Active', value: staffMembers.filter(s => s.isActive).length },
    { label: 'Owners', value: staffMembers.filter(s => s.roles.includes('OWNER')).length },
    { label: 'Managers', value: staffMembers.filter(s => s.roles.includes('MANAGER')).length },
  ]

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('dashboard.staff.title', 'Staff Management')}</h1>
            <p className="text-sm text-slate-500 mt-1">{t('dashboard.staff.subtitle', 'Manage your business team members')}</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-imboni-blue to-blue-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 flex items-center transition-all"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {t('dashboard.staff.add_staff_member', 'Add Staff Member')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-600">{stat.label}</p>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1 flex items-center gap-2">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchStaff() }}
                placeholder="Search by name, email, phone"
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
              />
            </div>
            <button onClick={fetchStaff} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">Search</button>
          </div>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('dashboard.staff.all_staff', 'All Staff')} ({staffMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('dashboard.staff.active', 'Active')} ({staffMembers.filter(s => s.isActive).length})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'inactive'
                ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('dashboard.staff.inactive', 'Inactive')} ({staffMembers.filter(s => !s.isActive).length})
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-xl">
            <option value="">All Roles</option>
            <optgroup label="System Roles">
              <option value="OWNER">Owner</option>
              <option value="MANAGER">Manager</option>
              <option value="CASHIER">Cashier / Front Desk</option>
              <option value="FRONT_DESK">Front Desk</option>
              <option value="WAITER">Waiter / Staff</option>
              <option value="KITCHEN_MANAGER">Kitchen / Operations</option>
            </optgroup>
            {roles.custom.length > 0 && (
              <optgroup label="Custom Roles">
                {roles.custom.map((r) => (
                  <option key={r.id} value={`custom:${r.id}`}>{r.name}</option>
                ))}
              </optgroup>
            )}
          </select>
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-xl">
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-xl">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('dashboard.staff.staff_member', 'Staff Member')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('dashboard.staff.role', 'Role')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('dashboard.staff.contact', 'Contact')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('dashboard.staff.status', 'Status')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('dashboard.staff.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(staff.roles[0])} flex items-center justify-center text-white font-semibold`}>
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{staff.name}</p>
                          <p className="text-sm text-slate-500">{staff.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(staff.roles[0])}`}>
                        {staff.roles[0]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">{staff.primaryBranch?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4" />
                        {staff.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        staff.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {staff.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openEditModal(staff)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(staff)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStaff.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">{t('dashboard.staff.no_staff_found', 'No staff members found')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <FormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('dashboard.staff.add_staff_member', 'Add Staff Member')}
      >
        <div className="space-y-4">
          {addStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.staff.full_name', 'Full Name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                  placeholder="e.g., John Doe"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.staff.email', 'Email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.staff.phone', 'Phone')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                      placeholder="+250 788 123 456"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.staff.password', 'Password')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
                  <select value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue">
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={handleAdd} className="flex-1 bg-gradient-to-r from-imboni-blue to-blue-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 flex items-center justify-center transition-all">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Continue
                </button>
                <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">{t('dashboard.staff.cancel', 'Cancel')}</button>
              </div>
            </div>
          )}

          {addStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Select Role</h3>
                <button onClick={() => setShowCreateRoleModal(true)} className="text-imboni-blue flex items-center gap-1"><PlusCircle className="w-4 h-4" /> Create Custom Role</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">System Role</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-xl">
                    <option value="OWNER">Owner</option>
                    <option value="MANAGER">Manager</option>
                    <option value="CASHIER">Cashier / Front Desk</option>
                    <option value="FRONT_DESK">Front Desk</option>
                    <option value="WAITER">Waiter / Staff</option>
                    <option value="KITCHEN_MANAGER">Kitchen / Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Custom Role (optional)</label>
                  <select value={formData.customRoleId} onChange={(e) => setFormData({ ...formData, customRoleId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-xl">
                    <option value="">None</option>
                    {roles.custom.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setAddStep(1)} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">Back</button>
                <button onClick={handleAdd} className="flex-1 bg-gradient-to-r from-imboni-blue to-blue-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 flex items-center justify-center transition-all">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Continue
                </button>
              </div>
            </div>
          )}

          {addStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Confirm Permissions</h3>
              {formData.customRoleId && (
                <p className="text-sm text-slate-600">Custom role: {roles.custom.find((r) => r.id === formData.customRoleId)?.name}</p>
              )}
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {permissionSummaryForRole(formData.role).map((p) => (
                  <li key={p.label} className="flex items-center gap-2 text-sm text-slate-700">
                    {p.allowed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-slate-400" />}
                    {p.label}
                  </li>
                ))}
              </ul>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setAddStep(2)} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">Back</button>
                <button onClick={handleAdd} className="flex-1 bg-gradient-to-r from-imboni-blue to-blue-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 flex items-center justify-center transition-all">
                  <Save className="w-4 h-4 mr-2" />
                  {t('dashboard.staff.add_staff_member', 'Add Staff Member')}
                </button>
              </div>
            </div>
          )}
        </div>
      </FormModal>

      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('dashboard.staff.edit_staff_member', 'Edit Staff Member')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.staff.full_name', 'Full Name')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.staff.email', 'Email')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.staff.phone', 'Phone')}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.staff.role', 'Role')}</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
            >
              <option value="OWNER">Owner</option>
              <option value="MANAGER">Manager</option>
              <option value="CASHIER">Cashier / Front Desk</option>
              <option value="FRONT_DESK">Front Desk</option>
              <option value="WAITER">Waiter / Staff</option>
              <option value="KITCHEN_MANAGER">Kitchen / Operations</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Custom Role (optional)</label>
            <select
              value={formData.customRoleId}
              onChange={(e) => setFormData({ ...formData, customRoleId: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
            >
              <option value="">None</option>
              {roles.custom.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
            <select
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleEdit}
              className="flex-1 bg-gradient-to-r from-imboni-blue to-blue-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 flex items-center justify-center transition-all"
            >
              <Save className="w-4 h-4 mr-2" />
              {t('dashboard.staff.update_staff_member', 'Update Staff Member')}
            </button>
            <button
              onClick={() => setShowEditModal(false)}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
            >
              {t('dashboard.staff.cancel', 'Cancel')}
            </button>
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
              placeholder="Leave blank to keep current password"
            />
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Deactivate Staff Member"
        message={`Are you sure you want to deactivate "${selectedStaff?.name}"? They will no longer be able to access the system.`}
        confirmText="Deactivate"
        type="danger"
      />

      
      <FormModal
        isOpen={showCreateRoleModal}
        onClose={() => setShowCreateRoleModal(false)}
        title="Create Custom Role"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Role Name</label>
            <input value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <input value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Base Role</label>
              <select value={newRole.baseRole} onChange={(e) => setNewRole({ ...newRole, baseRole: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-xl">
                <option value="MANAGER">Manager</option>
                <option value="CASHIER">Cashier</option>
                <option value="FRONT_DESK">Front Desk</option>
                <option value="WAITER">Waiter</option>
                <option value="KITCHEN_MANAGER">Kitchen</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
              <input value={newRole.color} onChange={(e) => setNewRole({ ...newRole, color: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-xl" placeholder="#2563eb" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Permissions</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(newRole.permissions).map(([group, cfg]: any) => (
                <div key={group} className="border border-slate-200 rounded-xl p-3">
                  <p className="font-medium text-slate-800 mb-2 capitalize">{group}</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(cfg).map(([k, v]: any) => (
                      <label key={k} className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(v)}
                          onChange={(e) =>
                            setNewRole({
                              ...newRole,
                              permissions: {
                                ...(newRole.permissions as Record<string, any>),
                                [group]: {
                                  ...(newRole.permissions as Record<string, any>)[group],
                                  [k]: e.target.checked,
                                },
                              },
                            })
                          }
                        />
                        <span className="capitalize">{k}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/staff/roles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRole) })
                  if (res.ok) {
                    showToast('success', 'Role created')
                    setShowCreateRoleModal(false)
                    setNewRole({ name: '', description: '', color: '', icon: '', baseRole: 'MANAGER', permissions: defaultPermissions() as any })
                    fetchFilters()
                  } else {
                    const err = await res.json()
                    showToast('error', err.error || 'Failed to create role')
                  }
                } catch (e) {
                  showToast('error', 'Failed to create role')
                }
              }}
              className="flex-1 bg-gradient-to-r from-imboni-blue to-blue-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 flex items-center justify-center transition-all"
            >
              <Save className="w-4 h-4 mr-2" /> Save Role
            </button>
            <button onClick={() => setShowCreateRoleModal(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
          </div>
        </div>
      </FormModal>
    </DashboardLayout>
  )
}

function permissionSummaryForRole(role: string) {
  const summaries: Record<string, Array<{ label: string; allowed: boolean }>> = {
    OWNER: [
      { label: 'Dashboard', allowed: true },
      { label: 'Orders: Manage', allowed: true },
      { label: 'Tables/Reservations', allowed: true },
      { label: 'Rooms', allowed: true },
      { label: 'Payments', allowed: true },
      { label: 'Reports', allowed: true },
      { label: 'Staff: Manage', allowed: true },
      { label: 'Inventory', allowed: true },
      { label: 'Settings', allowed: true },
    ],
    MANAGER: [
      { label: 'Dashboard', allowed: true },
      { label: 'Orders: Manage', allowed: true },
      { label: 'Tables/Reservations', allowed: true },
      { label: 'Rooms', allowed: true },
      { label: 'Payments', allowed: true },
      { label: 'Reports', allowed: true },
      { label: 'Staff: Manage', allowed: true },
      { label: 'Inventory', allowed: true },
      { label: 'Settings', allowed: false },
    ],
    CASHIER: [
      { label: 'Dashboard', allowed: true },
      { label: 'Orders: View', allowed: true },
      { label: 'Tables/Reservations', allowed: true },
      { label: 'Rooms: Check-in/out', allowed: true },
      { label: 'Payments', allowed: true },
      { label: 'Reports', allowed: false },
      { label: 'Staff', allowed: false },
      { label: 'Inventory', allowed: false },
      { label: 'Settings', allowed: false },
    ],
    FRONT_DESK: [
      { label: 'Dashboard', allowed: true },
      { label: 'Orders: View', allowed: true },
      { label: 'Tables/Reservations', allowed: true },
      { label: 'Rooms: Check-in/out', allowed: true },
      { label: 'Payments', allowed: true },
      { label: 'Reports', allowed: false },
      { label: 'Staff', allowed: false },
      { label: 'Inventory', allowed: false },
      { label: 'Settings', allowed: false },
    ],
    WAITER: [
      { label: 'Dashboard', allowed: true },
      { label: 'Orders: Create/Update', allowed: true },
      { label: 'Tables', allowed: true },
      { label: 'Rooms', allowed: false },
      { label: 'Payments', allowed: false },
      { label: 'Reports', allowed: false },
      { label: 'Staff', allowed: false },
      { label: 'Inventory', allowed: false },
      { label: 'Settings', allowed: false },
    ],
    KITCHEN_MANAGER: [
      { label: 'Dashboard', allowed: true },
      { label: 'Orders: Update Status', allowed: true },
      { label: 'Tables', allowed: true },
      { label: 'Rooms', allowed: false },
      { label: 'Payments', allowed: false },
      { label: 'Reports', allowed: false },
      { label: 'Staff', allowed: false },
      { label: 'Inventory', allowed: true },
      { label: 'Settings', allowed: false },
    ],
  }
  return summaries[role] || []
}
