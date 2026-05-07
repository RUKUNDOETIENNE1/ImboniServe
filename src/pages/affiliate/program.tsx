import { useState } from 'react'
import PublicLayout from '@/components/PublicLayout'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Award, 
  Target,
  Clock,
  Shield,
  Briefcase,
  Mail
} from 'lucide-react'

export default function AffiliateProgramPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    // TODO: Implement application submission
    setSubmitted(true)
  }

  return (
    <PublicLayout title="B2B Affiliate Program — Imboni Serve">
      <div className="bg-imboni-light py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-imboni-blue to-blue-600 rounded-full mb-4">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-imboni-blue mb-4">
              B2B Affiliate Program
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Become a partner and earn <strong>15% recurring commissions for 12 months</strong> by bringing restaurants to Imboni Serve.
            </p>
          </div>

          {/* For Professional Marketers */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">For Professional Marketers Only</h3>
                <p className="text-amber-800 mb-3">
                  This program is designed for influencers, marketers, and business consultants who can bring qualified restaurant clients to our platform.
                </p>
                <p className="text-sm text-amber-700">
                  <strong>Looking for customer referrals?</strong> If you're a customer wanting to refer friends, check out our <a href="/refer" className="underline font-semibold">Customer Referral Program</a> (1,000 RWF per friend).
                </p>
              </div>
            </div>
          </div>

          {/* Earnings Potential */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 mb-8">
            <h2 className="text-2xl font-bold text-imboni-blue mb-6 text-center">
              Earnings Potential
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <DollarSign className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-green-700 mb-2">15%</div>
                <p className="text-sm text-slate-700">Commission Rate</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <Clock className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-blue-700 mb-2">12</div>
                <p className="text-sm text-slate-700">Months Duration</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
                <TrendingUp className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-purple-700 mb-2">∞</div>
                <p className="text-sm text-slate-700">Unlimited Referrals</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-800 mb-3">Example Earnings:</h3>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>1 restaurant on Growth plan (50,000 RWF/month):</span>
                  <span className="font-semibold text-green-600">7,500 RWF/month × 12 = 90,000 RWF</span>
                </div>
                <div className="flex justify-between">
                  <span>5 restaurants on Growth plan:</span>
                  <span className="font-semibold text-green-600">450,000 RWF total</span>
                </div>
                <div className="flex justify-between">
                  <span>10 restaurants on Growth plan:</span>
                  <span className="font-semibold text-green-700">900,000 RWF total</span>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 mb-8">
            <h2 className="text-2xl font-bold text-imboni-blue mb-6">How It Works</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-imboni-blue rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">1</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Apply to Join</h3>
                  <p className="text-sm text-slate-600">
                    Submit your application below. We review all applications within 48 hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-imboni-blue rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">2</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Get Your Affiliate Code</h3>
                  <p className="text-sm text-slate-600">
                    Once approved, you'll receive a unique affiliate code (e.g., IMB-ABC123) and marketing materials.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-imboni-blue rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">3</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Refer Restaurants</h3>
                  <p className="text-sm text-slate-600">
                    Share your affiliate link with restaurant owners. They sign up using your code.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">They Qualify</h3>
                  <p className="text-sm text-slate-600">
                    Restaurant must generate <strong>30 Smart Dining Slips within 14 days</strong> to prove active usage.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-imboni-gold rounded-full flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Earn Commissions</h3>
                  <p className="text-sm text-slate-600">
                    You earn 15% of every subscription payment they make for the next 12 months.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 mb-8">
            <h2 className="text-2xl font-bold text-imboni-blue mb-6">Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Professional Experience</h4>
                  <p className="text-sm text-slate-600">
                    Marketing, sales, or business consulting experience preferred
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Network Access</h4>
                  <p className="text-sm text-slate-600">
                    Ability to reach restaurant owners, managers, or hospitality businesses
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Active Promotion</h4>
                  <p className="text-sm text-slate-600">
                    Commitment to actively promote Imboni Serve to qualified leads
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Compliance</h4>
                  <p className="text-sm text-slate-600">
                    Follow our affiliate guidelines and ethical marketing practices
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 mb-8">
            <h2 className="text-2xl font-bold text-imboni-blue mb-6">Affiliate Benefits</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Dedicated Support</h4>
                  <p className="text-sm text-slate-600">
                    Priority support channel and dedicated account manager for top performers
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                <Target className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Marketing Materials</h4>
                  <p className="text-sm text-slate-600">
                    Professional brochures, demo videos, and presentation decks
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Real-Time Dashboard</h4>
                  <p className="text-sm text-slate-600">
                    Track clicks, signups, qualifications, and earnings in real-time
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
                <Award className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Monthly Payouts</h4>
                  <p className="text-sm text-slate-600">
                    Reliable monthly payments via bank transfer or Mobile Money
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Application Form */}
          {!submitted ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8">
              <h2 className="text-2xl font-bold text-imboni-blue mb-6">Apply Now</h2>
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                  <p className="mb-2">
                    <strong>Next steps:</strong> After submitting, our team will review your application and contact you within 48 hours with:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your unique affiliate code</li>
                    <li>Access to marketing materials</li>
                    <li>Affiliate dashboard access linked to your Imboni Serve account</li>
                    <li>Onboarding call scheduling</li>
                  </ul>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-imboni-blue to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all"
                >
                  Submit Application
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Application Submitted!</h2>
              <p className="text-slate-600 mb-6">
                Thank you for your interest in our affiliate program. We'll review your application and get back to you within 48 hours.
              </p>
              <a
                href="mailto:support@imboni.rw"
                className="inline-flex items-center gap-2 text-imboni-blue hover:underline"
              >
                <Mail className="w-4 h-4" />
                Contact us: support@imboni.rw
              </a>
            </div>
          )}

          {/* Terms Link */}
          <div className="text-center mt-8">
            <a
              href="/service-terms#referral"
              className="text-sm text-slate-600 hover:text-imboni-blue underline"
            >
              Read Full Affiliate Program Terms & Conditions
            </a>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
