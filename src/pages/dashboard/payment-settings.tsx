import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Save, Info } from 'lucide-react';

interface BusinessSettings {
  id: string;
  taxMode: 'INCLUSIVE' | 'EXCLUSIVE';
  taxRate: number;
  currency: string;
  splitPaymentConvenienceFeeEnabled: boolean;
  splitPaymentConvenienceFeePercent: number;
}

export default function PaymentSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [session]);

  const fetchSettings = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      const user = session.user as any;
      const businessId = user.businessId;
      
      if (!businessId) {
        setError('No business associated with your account. Please contact support.');
        setSettings(null);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/business/${businessId}/settings`);
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      alert('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings || !session?.user) return;

    setSaving(true);
    try {
      const user = session.user as any;
      const businessId = user.businessId;
      
      if (!businessId) {
        alert('No business associated with your account');
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/business/${businessId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxMode: settings.taxMode,
          taxRate: settings.taxRate,
          currency: settings.currency,
          splitPaymentConvenienceFeeEnabled: settings.splitPaymentConvenienceFeeEnabled,
          splitPaymentConvenienceFeePercent: settings.splitPaymentConvenienceFeePercent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-red-600 font-semibold">{error}</p>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Return to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (loading || !settings) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Payment & Tax Settings</h1>
          <p className="text-muted-foreground">
            Configure how taxes and payments are displayed to your customers
          </p>
        </div>

        {/* Tax Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Tax (VAT) Configuration</CardTitle>
            <CardDescription>
              Choose how VAT is displayed on bills and receipts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tax Mode */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Tax Display Mode</Label>
              <RadioGroup
                value={settings.taxMode}
                onValueChange={(value: string) =>
                  setSettings({ ...settings, taxMode: value as 'INCLUSIVE' | 'EXCLUSIVE' })
                }
              >
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="EXCLUSIVE" id="exclusive" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="exclusive" className="font-medium cursor-pointer">
                      Exclusive (Add VAT at checkout)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Menu prices shown without VAT. VAT is added as a separate line at checkout.
                      <br />
                      <span className="font-mono text-xs">Example: Subtotal RWF 10,000 + VAT RWF 1,800 = Total RWF 11,800</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="INCLUSIVE" id="inclusive" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="inclusive" className="font-medium cursor-pointer">
                      Inclusive (Prices include VAT)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Menu prices already include VAT. Customers see final price immediately.
                      <br />
                      <span className="font-mono text-xs">Example: Total RWF 11,800 (VAT included)</span>
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Tax Rate */}
            <div className="space-y-2">
              <Label htmlFor="taxRate" className="text-base font-semibold">
                Tax Rate (%)
              </Label>
              <div className="flex items-center gap-4">
                <input
                  id="taxRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.taxRate}
                  onChange={(e) =>
                    setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-32 px-3 py-2 border rounded-md"
                />
                <span className="text-sm text-muted-foreground">
                  Default rates: Rwanda 18%, Kenya 16%, Uganda 18%, Tanzania 18%
                </span>
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-base font-semibold">
                Currency
              </Label>
              <select
                id="currency"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-48 px-3 py-2 border rounded-md"
              >
                <option value="RWF">RWF (Rwandan Franc)</option>
                <option value="KES">KES (Kenyan Shilling)</option>
                <option value="UGX">UGX (Ugandan Shilling)</option>
                <option value="TZS">TZS (Tanzanian Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>

            {/* Info Box */}
            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Tax Mode Recommendation</p>
                <p>
                  <strong>Inclusive mode</strong> reduces customer friction by showing final prices upfront, 
                  leading to higher conversion rates. <strong>Exclusive mode</strong> provides transparency 
                  by showing VAT as a separate line item. Choose based on your local market expectations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Split Payment Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Split Payment Convenience Fee</CardTitle>
            <CardDescription>
              Optional fee for customers using split bill feature
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <Label htmlFor="convenienceFeeEnabled" className="font-medium cursor-pointer">
                  Enable Convenience Fee
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Charge a small fee (1-1.5%) when customers split their bill
                </p>
              </div>
              <Switch
                id="convenienceFeeEnabled"
                checked={settings.splitPaymentConvenienceFeeEnabled}
                onCheckedChange={(checked: boolean) =>
                  setSettings({ ...settings, splitPaymentConvenienceFeeEnabled: checked })
                }
              />
            </div>

            {/* Fee Percentage */}
            {settings.splitPaymentConvenienceFeeEnabled && (
              <div className="space-y-2">
                <Label htmlFor="convenienceFeePercent" className="text-base font-semibold">
                  Convenience Fee Percentage
                </Label>
                <div className="flex items-center gap-4">
                  <input
                    id="convenienceFeePercent"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={settings.splitPaymentConvenienceFeePercent}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        splitPaymentConvenienceFeePercent: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-32 px-3 py-2 border rounded-md"
                  />
                  <span className="text-sm text-muted-foreground">
                    Recommended: 1.0% - 1.5%
                  </span>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">About Convenience Fees</p>
                <p>
                  This fee is clearly labeled as "Convenience fee for instant split payment" to customers. 
                  It helps offset the additional processing overhead of split payments. The fee is optional 
                  and disabled by default.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={fetchSettings} disabled={saving}>
            Reset
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Impact Preview */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle>Preview: How Customers See Prices</CardTitle>
            <CardDescription>
              Example bill with current settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-6 rounded-lg border-2 border-dashed border-purple-300 font-mono text-sm">
              <div className="text-center mb-4 font-bold">SAMPLE BILL</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Beef Brochette x2</span>
                  <span>{settings.currency} 10,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Chips</span>
                  <span>{settings.currency} 5,000</span>
                </div>
                <div className="border-t border-dashed my-3"></div>
                
                {settings.taxMode === 'EXCLUSIVE' ? (
                  <>
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{settings.currency} 15,000</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>VAT ({settings.taxRate}%)</span>
                      <span>{settings.currency} {Math.round(15000 * (settings.taxRate / 100)).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-dashed my-3"></div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>TOTAL</span>
                      <span>{settings.currency} {(15000 + Math.round(15000 * (settings.taxRate / 100))).toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between font-bold text-lg">
                      <span>TOTAL</span>
                      <span>{settings.currency} 15,000</span>
                    </div>
                    <div className="text-center text-xs text-muted-foreground mt-2">
                      VAT included ({settings.taxRate}%)
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
