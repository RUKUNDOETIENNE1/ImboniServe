import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import AdminLayout from '@/components/AdminLayout'
import { ArrowLeft, FileText, Send } from 'lucide-react'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  const roles = (session?.user as any)?.roles || []
  if (!session?.user || !roles.some((r: string) => ['ADMIN', 'PARTNERSHIP_MANAGER', 'SALES'].includes(r))) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }
  return { props: {} }
}

export default function NewApplicationPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    region: '',
    motivation: '',
    experience: '',
    networkSize: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.name.trim() || form.name.trim().length < 2) {
      errs.name = 'Name is required (min 2 characters)'
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Valid email is required'
    }
    if (!form.phone.trim() || form.phone.trim().length < 8) {
      errs.phone = 'Valid phone number is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/partnership-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/admin/partnership-applications/${data.application.id}`)
      } else {
        const err = await res.json()
        setErrors({ submit: err.error || 'Failed to submit application' })
      }
    } catch {
      setErrors({ submit: 'Failed to submit application' })
    } finally {
      setSubmitting(false)
    }
  }

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  return (
    <AdminLayout title="New Partnership Application">
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => router.push('/admin/partnership-applications')}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </button>

        <div className="bg-white rounded-xl border border-slate-200/60 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">New Partnership Application</h1>
              <p className="text-sm text-slate-500">Submit a new Founder Partner application for review</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Full Name"
                required
                error={errors.name}
                value={form.name}
                onChange={(v) => update('name', v)}
                placeholder="e.g., Isimbi TV"
              />
              <FormField
                label="Email"
                required
                type="email"
                error={errors.email}
                value={form.email}
                onChange={(v) => update('email', v)}
                placeholder="e.g., info@isimbi.tv"
              />
              <FormField
                label="Phone"
                required
                error={errors.phone}
                value={form.phone}
                onChange={(v) => update('phone', v)}
                placeholder="e.g., +250788123456"
              />
              <FormField
                label="Organization"
                value={form.organization}
                onChange={(v) => update('organization', v)}
                placeholder="e.g., Isimbi Media Ltd"
              />
              <FormField
                label="Region"
                value={form.region}
                onChange={(v) => update('region', v)}
                placeholder="e.g., Kigali"
              />
              <FormField
                label="Network Size"
                value={form.networkSize}
                onChange={(v) => update('networkSize', v)}
                placeholder="e.g., 500K subscribers"
              />
            </div>

            <FormField
              label="Motivation"
              textarea
              value={form.motivation}
              onChange={(v) => update('motivation', v)}
              placeholder="Why does this partner want to join the Founder Partner Program?"
            />
            <FormField
              label="Experience"
              textarea
              value={form.experience}
              onChange={(v) => update('experience', v)}
              placeholder="Relevant experience in media, hospitality, or partnerships..."
            />

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/admin/partnership-applications')}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  type = 'text',
  textarea,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  error?: string
  type?: string
  textarea?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
            error ? 'border-red-300' : 'border-slate-200'
          }`}
          aria-label={label}
          aria-invalid={!!error}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            error ? 'border-red-300' : 'border-slate-200'
          }`}
          aria-label={label}
          aria-invalid={!!error}
        />
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
