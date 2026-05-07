import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface PayoutSale {
  id: string;
  orderNumber: string;
  totalAmountCents: number;
  createdAt: string;
  paymentMethod: string;
  payout: {
    grossAmountCents: number;
    platformCommissionCents: number;
    netPayoutCents: number;
    commissionPercent: number;
  };
}

interface PayoutSummary {
  sales: PayoutSale[];
  summary: {
    totalGrossCents: number;
    totalCommissionCents: number;
    totalNetPayoutCents: number;
    commissionPercent: number;
    salesCount: number;
  };
}

export default function PayoutSummaryPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [payoutData, setPayoutData] = useState<PayoutSummary | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const fetchPayoutSummary = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      const selected = typeof window !== 'undefined' ? localStorage.getItem('selectedBusinessId') : null;
      const businessId = selected || ((session.user as any)?.businessId as string | undefined) || '';
      const qs = new URLSearchParams({ startDate, endDate });
      if (businessId) qs.set('businessId', businessId);

      const response = await fetch(`/api/business/payout-summary?${qs.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch payout summary');
      }

      const data = await response.json();
      setPayoutData(data);
    } catch (error) {
      console.error('Error fetching payout summary:', error);
      alert('Failed to load payout summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutSummary();
  }, [session]);

  const formatCurrency = (cents: number) => {
    return `RWF ${(cents / 100).toLocaleString('en-RW', { minimumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payout Summary</h1>
          <p className="text-muted-foreground">
            View your revenue breakdown and platform commission
          </p>
        </div>

        {/* Date Range Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date Range</CardTitle>
            <CardDescription>Choose the period for payout summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <Button onClick={fetchPayoutSummary} disabled={loading}>
                <Calendar className="mr-2 h-4 w-4" />
                {loading ? 'Loading...' : 'Update'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {payoutData && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Sales</CardDescription>
                  <CardTitle className="text-2xl">{payoutData.summary.salesCount}</CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Gross Revenue</CardDescription>
                  <CardTitle className="text-2xl">
                    {formatCurrency(payoutData.summary.totalGrossCents)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Platform Commission ({payoutData.summary.commissionPercent}%)</CardDescription>
                  <CardTitle className="text-2xl text-orange-600">
                    -{formatCurrency(payoutData.summary.totalCommissionCents)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Net Payout</CardDescription>
                  <CardTitle className="text-2xl text-green-600">
                    {formatCurrency(payoutData.summary.totalNetPayoutCents)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Sales Table */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Breakdown</CardTitle>
                <CardDescription>
                  Detailed view of all sales in the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Order #</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Payment</th>
                        <th className="text-right py-3 px-4">Gross</th>
                        <th className="text-right py-3 px-4">Commission</th>
                        <th className="text-right py-3 px-4">Net Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutData.sales.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-muted-foreground">
                            No sales found in this period
                          </td>
                        </tr>
                      ) : (
                        payoutData.sales.map((sale) => (
                          <tr key={sale.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-mono text-sm">{sale.orderNumber}</td>
                            <td className="py-3 px-4">{formatDate(sale.createdAt)}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {sale.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                              {formatCurrency(sale.payout.grossAmountCents)}
                            </td>
                            <td className="py-3 px-4 text-right text-orange-600">
                              -{formatCurrency(sale.payout.platformCommissionCents)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-green-600">
                              {formatCurrency(sale.payout.netPayoutCents)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="text-blue-600">ℹ️</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">About Platform Commission</h3>
                    <p className="text-sm text-blue-800">
                      The {payoutData.summary.commissionPercent}% platform commission is deducted from your gross revenue 
                      at payout time. This commission covers payment processing, platform maintenance, and support services. 
                      Your customers do not see this fee - it's deducted from your business revenue.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
