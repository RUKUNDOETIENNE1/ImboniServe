/**
 * Usage Dashboard Component
 * Shows AI credits, storage, QR codes, and other feature usage
 */

import { useState, useEffect } from 'react';
import { Sparkles, HardDrive, QrCode, FileText, TrendingUp, Crown } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useTranslation } from '@/lib/i18n';

interface UsageStats {
  aiCredits: {
    used: number;
    limit: number;
    remaining: number;
    resetDate: string | null;
  };
  storage: {
    usedBytes: number;
    limitGB: number;
    usedPercent: number;
  };
  qrCodes: {
    count: number;
    limit: number | null;
  };
  cmsPosts: {
    thisMonth: number;
    limit: number | null;
  };
  plan: {
    name: string;
    tier: string;
  };
  siteBuilder?: {
    tier: string;
    isPublished: boolean;
  };
  discovery?: {
    tier: string;
    commission: number;
  };
}

export default function UsageDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  async function fetchUsageStats() {
    try {
      const res = await fetch('/api/usage/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600 bg-red-50';
    if (percent >= 75) return 'text-orange-600 bg-orange-50';
    if (percent >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const aiUsagePercent = (stats.aiCredits.used / stats.aiCredits.limit) * 100;
  const storagePercent = stats.storage.usedPercent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Feature Usage</h2>
          <p className="text-sm text-slate-600 mt-1">
            Monitor your plan limits and usage
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <Crown className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-900">{stats.plan.name} Plan</span>
        </div>
      </div>

      {/* AI Credits */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>AI Credits</CardTitle>
                <CardDescription>
                  {stats.aiCredits.remaining} of {stats.aiCredits.limit} remaining
                </CardDescription>
              </div>
            </div>
            {aiUsagePercent >= 80 && (
              <button 
                onClick={() => window.location.href = '/pricing'}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
              >
                Get More Credits
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Progress Bar */}
            <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                  aiUsagePercent >= 90 ? 'bg-red-500' :
                  aiUsagePercent >= 75 ? 'bg-orange-500' :
                  aiUsagePercent >= 50 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(aiUsagePercent, 100)}%` }}
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{stats.aiCredits.used}</div>
                <div className="text-xs text-slate-500 mt-1">Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{stats.aiCredits.remaining}</div>
                <div className="text-xs text-slate-500 mt-1">Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{stats.aiCredits.limit}</div>
                <div className="text-xs text-slate-500 mt-1">Monthly Limit</div>
              </div>
            </div>

            {/* Reset Date */}
            {stats.aiCredits.resetDate && (
              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  Credits reset on {new Date(stats.aiCredits.resetDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Storage, QR Codes, CMS Posts Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Storage */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HardDrive className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Storage</CardTitle>
                <CardDescription className="text-xs">
                  {formatBytes(stats.storage.usedBytes)} / {stats.storage.limitGB} GB
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                  storagePercent >= 90 ? 'bg-red-500' :
                  storagePercent >= 75 ? 'bg-orange-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
            <div className="text-center mt-2">
              <span className={`text-sm font-semibold ${getUsageColor(storagePercent)}`}>
                {storagePercent.toFixed(1)}% Used
              </span>
            </div>
          </CardContent>
        </Card>

        {/* QR Codes */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <QrCode className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">QR Codes</CardTitle>
                <CardDescription className="text-xs">
                  {stats.qrCodes.count} {stats.qrCodes.limit ? `/ ${stats.qrCodes.limit}` : '(Unlimited)'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stats.qrCodes.limit ? (
              <>
                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-green-500 rounded-full transition-all"
                    style={{ width: `${Math.min((stats.qrCodes.count / stats.qrCodes.limit) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-center mt-2">
                  <span className="text-sm font-semibold text-green-600">
                    {stats.qrCodes.limit - stats.qrCodes.count} Remaining
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center">
                <span className="text-sm font-semibold text-green-600">✓ Unlimited</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CMS Posts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-base">CMS Posts</CardTitle>
                <CardDescription className="text-xs">
                  {stats.cmsPosts.thisMonth} {stats.cmsPosts.limit ? `/ ${stats.cmsPosts.limit}` : '(Unlimited)'} this month
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stats.cmsPosts.limit ? (
              <>
                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-orange-500 rounded-full transition-all"
                    style={{ width: `${Math.min((stats.cmsPosts.thisMonth / stats.cmsPosts.limit) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-center mt-2">
                  <span className="text-sm font-semibold text-orange-600">
                    {stats.cmsPosts.limit - stats.cmsPosts.thisMonth} Remaining
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center">
                <span className="text-sm font-semibold text-orange-600">✓ Unlimited</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Subscriptions */}
      {(stats.siteBuilder || stats.discovery) && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Site Builder Status */}
          {stats.siteBuilder && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Site Builder</CardTitle>
                <CardDescription>
                  Current tier: <span className="font-semibold text-slate-900">{stats.siteBuilder.tier}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    <span className={`text-sm font-semibold ${
                      stats.siteBuilder.isPublished ? 'text-green-600' : 'text-slate-400'
                    }`}>
                      {stats.siteBuilder.isPublished ? '✓ Published' : 'Preview Only'}
                    </span>
                  </div>
                  {stats.siteBuilder.tier === 'FREE' && (
                    <button
                      onClick={() => window.location.href = '/pricing'}
                      className="w-full mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                    >
                      Upgrade to Publish
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Discovery Status */}
          {stats.discovery && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Discovery Marketplace</CardTitle>
                <CardDescription>
                  Current tier: <span className="font-semibold text-slate-900">{stats.discovery.tier}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Commission Rate</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {stats.discovery.commission}% + VAT
                    </span>
                  </div>
                  {stats.discovery.tier === 'FREE' && (
                    <button
                      onClick={() => window.location.href = '/pricing'}
                      className="w-full mt-3 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                    >
                      Get Featured Placement
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Upgrade CTA */}
      {stats.plan.tier !== 'BUSINESS' && stats.plan.tier !== 'ENTERPRISE' && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-full">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Need More Resources?</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Upgrade your plan for higher limits and premium features
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/pricing'}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200"
              >
                View Plans
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
