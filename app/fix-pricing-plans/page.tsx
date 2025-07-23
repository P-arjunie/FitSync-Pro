'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Wrench } from 'lucide-react';

export default function FixPricingPlansPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [planStatus, setPlanStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) {
      router.push('/user-system-management/Authform');
      return;
    }
    setUserId(id);
  }, [router]);

  const checkPlanStatus = async () => {
    if (!userId) return;

    setLoading(true);
    setError('');
    setPlanStatus(null);

    try {
      const response = await fetch(`/api/fix-pending-pricing-plans?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setPlanStatus(data);
      } else {
        setError(data.error || 'Failed to check plan status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check plan status');
    } finally {
      setLoading(false);
    }
  };

  const fixPendingPlans = async () => {
    if (!userId) return;

    setFixing(true);
    setError('');

    try {
      const response = await fetch('/api/fix-pending-pricing-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Fixed ${data.results.length} pending plans!`);
        // Refresh the status
        await checkPlanStatus();
      } else {
        setError(data.error || 'Failed to fix pending plans');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fix pending plans');
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Wrench className="text-orange-500" size={40} />
              <h1 className="text-3xl font-bold text-gray-900">
                Fix Pricing Plans
              </h1>
            </div>
            <p className="text-gray-600">
              Fix pending pricing plans and create missing payment records
            </p>
          </div>

          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={checkPlanStatus}
                disabled={loading || !userId}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Checking Status...' : 'Check Plan Status'}
              </button>

              <button
                onClick={fixPendingPlans}
                disabled={fixing || !userId || !planStatus?.summary?.pendingPlans}
                className="bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {fixing ? 'Fixing Plans...' : `Fix ${planStatus?.summary?.pendingPlans || 0} Pending Plans`}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="text-red-600" size={20} />
                  <h3 className="font-semibold text-red-800">Error</h3>
                </div>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Plan Status */}
            {planStatus && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="text-green-600" size={20} />
                    <h3 className="font-semibold text-green-800">Summary</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Plans:</span>
                      <span className="ml-2 text-green-700">{planStatus.summary.totalPlans}</span>
                    </div>
                    <div>
                      <span className="font-medium">Pending Plans:</span>
                      <span className="ml-2 text-orange-600">{planStatus.summary.pendingPlans}</span>
                    </div>
                    <div>
                      <span className="font-medium">Paid Plans:</span>
                      <span className="ml-2 text-green-700">{planStatus.summary.paidPlans}</span>
                    </div>
                    <div>
                      <span className="font-medium">Total Payments:</span>
                      <span className="ml-2 text-green-700">{planStatus.summary.totalPayments}</span>
                    </div>
                    <div>
                      <span className="font-medium">Pricing Plan Payments:</span>
                      <span className="ml-2 text-green-700">{planStatus.summary.pricingPlanPayments}</span>
                    </div>
                  </div>
                </div>

                {/* Pending Plans */}
                {planStatus.pendingPlans.length > 0 && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-800 mb-4">Pending Plans (Need Fix)</h3>
                    <div className="space-y-2">
                      {planStatus.pendingPlans.map((plan: any, index: number) => (
                        <div key={index} className="p-3 bg-white rounded border">
                          <div className="text-sm">
                            <div><strong>Plan Name:</strong> {plan.planName}</div>
                            <div><strong>Amount:</strong> ${plan.amount}</div>
                            <div><strong>Status:</strong> {plan.status}</div>
                            <div><strong>Created:</strong> {new Date(plan.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paid Plans */}
                {planStatus.paidPlans.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-4">Paid Plans</h3>
                    <div className="space-y-2">
                      {planStatus.paidPlans.map((plan: any, index: number) => (
                        <div key={index} className="p-3 bg-white rounded border">
                          <div className="text-sm">
                            <div><strong>Plan Name:</strong> {plan.planName}</div>
                            <div><strong>Amount:</strong> ${plan.amount}</div>
                            <div><strong>Status:</strong> {plan.status}</div>
                            <div><strong>Created:</strong> {new Date(plan.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing Plan Payments */}
                {planStatus.pricingPlanPayments.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-4">Pricing Plan Payments</h3>
                    <div className="space-y-2">
                      {planStatus.pricingPlanPayments.map((payment: any, index: number) => (
                        <div key={index} className="p-3 bg-white rounded border">
                          <div className="text-sm">
                            <div><strong>Amount:</strong> ${payment.amount}</div>
                            <div><strong>Status:</strong> {payment.status}</div>
                            <div><strong>Payment ID:</strong> {payment.stripePaymentIntentId}</div>
                            <div><strong>Created:</strong> {new Date(payment.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-gray-600" size={20} />
                <h3 className="font-semibold text-gray-800">How This Works</h3>
              </div>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>1. Check Status:</strong> See how many pricing plans are pending vs paid</p>
                <p><strong>2. Fix Plans:</strong> Updates pending plans to "paid" and creates missing payment records</p>
                <p><strong>3. Result:</strong> Pricing plans will appear in purchase history after fixing</p>
                <p><strong>Note:</strong> This only fixes plans that are already paid in Stripe but stuck in "pending" status</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 