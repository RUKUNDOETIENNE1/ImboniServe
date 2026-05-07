/**
 * Upgrade Prompt Component
 * Shown when users hit feature limits or try to access premium features
 */

import { Crown, Sparkles, X, ArrowRight } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

interface UpgradePromptProps {
  feature: 'ai_credits' | 'site_builder_publish' | 'discovery_featured' | 'qr_codes' | 'cms_posts' | 'storage';
  currentPlan?: string;
  onClose?: () => void;
  message?: string;
}

const FEATURE_CONFIG = {
  ai_credits: {
    icon: Sparkles,
    color: 'purple',
    title: 'AI Credits Exceeded',
    description: 'You\'ve used all your AI credits for this month',
    benefits: [
      'Get 50-200 AI credits per month',
      'Business Scanner unlimited access',
      'AI-powered menu descriptions',
      'Smart insights and recommendations'
    ],
    cta: 'Upgrade for More AI Power',
    plans: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE']
  },
  site_builder_publish: {
    icon: Crown,
    color: 'blue',
    title: 'Site Builder Pro Required',
    description: 'Publish your site and get it online',
    benefits: [
      'Publish your live website',
      'Remove "Powered by Imboni" watermark',
      '10+ premium templates',
      'Custom colors and fonts',
      '50 AI content generations/month',
      'SSL certificate included',
      'SEO optimization'
    ],
    cta: 'Upgrade to Site Builder Pro',
    price: '12,000 RWF/month',
    plans: ['SITE_BUILDER_PRO']
  },
  discovery_featured: {
    icon: Crown,
    color: 'green',
    title: 'Get Featured Placement',
    description: 'Appear in top 5 search results and save 3% on commissions',
    benefits: [
      '⭐ Featured badge on your listing',
      'Top 5 priority in search results',
      'Enhanced profile with photo gallery',
      'Commission reduced to 7% (save 3%)',
      'Priority customer support',
      'ROI: Self-funding at ~270K orders/month'
    ],
    cta: 'Get Featured Placement',
    price: '8,000 RWF/month',
    plans: ['DISCOVERY_FEATURED']
  },
  qr_codes: {
    icon: Crown,
    color: 'green',
    title: 'QR Code Limit Reached',
    description: 'You\'ve reached your QR code limit',
    benefits: [
      'Unlimited QR codes',
      'Detailed scan analytics',
      '20+ premium templates',
      'Dynamic QR codes',
      'Branded QR with logo'
    ],
    cta: 'Upgrade for Unlimited QR Codes',
    plans: ['BUSINESS', 'ENTERPRISE']
  },
  cms_posts: {
    icon: Crown,
    color: 'orange',
    title: 'CMS Post Limit Reached',
    description: 'You\'ve used all your monthly posts',
    benefits: [
      'Unlimited content posts',
      'Story templates',
      'Post scheduling',
      'Advanced analytics'
    ],
    cta: 'Upgrade for Unlimited Posts',
    plans: ['BUSINESS', 'ENTERPRISE']
  },
  storage: {
    icon: Crown,
    color: 'blue',
    title: 'Storage Limit Reached',
    description: 'You\'re running out of storage space',
    benefits: [
      'Up to 20-100 GB storage',
      'Unlimited media uploads',
      'Automatic backups',
      'CDN delivery'
    ],
    cta: 'Upgrade for More Storage',
    plans: ['BUSINESS', 'ENTERPRISE']
  }
};

export default function UpgradePrompt({ 
  feature, 
  currentPlan, 
  onClose,
  message 
}: UpgradePromptProps) {
  const config = FEATURE_CONFIG[feature];
  const Icon = config.icon;

  const colorClasses = {
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'bg-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'bg-green-600',
      button: 'bg-green-600 hover:bg-green-700'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'bg-orange-600',
      button: 'bg-orange-600 hover:bg-orange-700'
    }
  };

  const colors = colorClasses[config.color as keyof typeof colorClasses];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="max-w-lg w-full">
        <Card className={`${colors.bg} ${colors.border}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 ${colors.icon} rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">{config.title}</CardTitle>
                  <CardDescription className="text-slate-700 mt-1">
                    {message || config.description}
                  </CardDescription>
                </div>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* Price (if applicable) */}
              {config.price && (
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Upgrade Price</span>
                    <span className="text-2xl font-bold text-slate-900">
                      {config.price}
                    </span>
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-3">What You Get:</h4>
                <ul className="space-y-2">
                  {config.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="mt-0.5">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 text-xs">✓</span>
                        </div>
                      </div>
                      <span className="text-slate-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Current Plan Info */}
              {currentPlan && (
                <div className="text-center text-sm text-slate-600">
                  Current plan: <span className="font-semibold">{currentPlan}</span>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/pricing'}
                  className={`flex-1 px-6 py-3 ${colors.button} text-white font-semibold rounded-lg transition shadow-lg flex items-center justify-center gap-2`}
                >
                  {config.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-white text-slate-700 font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition"
                  >
                    Maybe Later
                  </button>
                )}
              </div>

              {/* Money-back guarantee */}
              <div className="text-center">
                <p className="text-xs text-slate-500">
                  ✓ 30-day money-back guarantee • Cancel anytime
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper component for inline upgrade prompts (smaller version)
export function InlineUpgradePrompt({ feature, compact = false }: { feature: string; compact?: boolean }) {
  const config = FEATURE_CONFIG[feature as keyof typeof FEATURE_CONFIG];
  if (!config) return null;

  const Icon = config.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <Icon className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900">{config.title}</p>
        </div>
        <button
          onClick={() => window.location.href = '/pricing'}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
        >
          Upgrade
        </button>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 rounded-full">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 text-lg">{config.title}</h3>
            <p className="text-slate-700 text-sm mt-1">{config.description}</p>
            <ul className="mt-3 space-y-1">
              {config.benefits.slice(0, 3).map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="text-green-600">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
            <button
              onClick={() => window.location.href = '/pricing'}
              className="mt-4 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              {config.cta}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
