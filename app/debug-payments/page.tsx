'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function DebugPaymentsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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

  const handleDebug = async () => {
    if (!userId) return;

    setLoading(true);
    setError('');
    setDebugData(null);

    try {
      const response = await fetch(`/api/debug-payments?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setDebugData(data.debug);
      } else {
        setError(data.error || 'Failed to fetch debug data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch debug data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Search className="text-blue-500" size={40} />
              <h1 className="text-3xl font-bold text-gray-900">
                Payment Debug Tool
              </h1>
            </div>
            <p className="text-gray-600">
              Debug payment data to understand why pricing plans aren't showing
            </p>
          </div>

          <div className="space-y-6">
            {/* Debug Button */}
            <div className="text-center">
              <button
                onClick={handleDebug}
                disabled={loading || !userId}
                className="bg-blue-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading Debug Data...' : 'Debug Payments'}
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

            {/* Debug Results */}
            {debugData && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-green-600" size={20} />
                    <h3 className="font-semibold text-green-800">Summary</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Payments:</span>
                      <span className="ml-2 text-green-700">{debugData.totalPayments}</span>
                    </div>
                    <div>
                      <span className="font-medium">Total Pricing Plans:</span>
                      <span className="ml-2 text-green-700">{debugData.totalPricingPlans}</span>
                    </div>
                    <div>
                      <span className="font-medium">Payment Types:</span>
                      <span className="ml-2 text-green-700">{Object.keys(debugData.paymentTypes).join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Types Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">Payment Types Breakdown</h3>
                  {Object.entries(debugData.paymentTypes).map(([type, payments]: [string, any]) => (
                    <div key={type} className="mb-4 p-3 bg-white rounded border">
                      <h4 className="font-medium text-gray-800 mb-2">
                        {type} ({payments.length} payments)
                      </h4>
                      <div className="space-y-2">
                        {payments.map((payment: any, index: number) => (
                          <div key={index} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                            <div>ID: {payment.id}</div>
                            <div>Amount: ${payment.amount}</div>
                            <div>Status: {payment.status}</div>
                            <div>Date: {new Date(payment.createdAt).toLocaleDateString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing Plans */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-4">Pricing Plans in Database</h3>
                  {debugData.pricingPlans.length > 0 ? (
                    <div className="space-y-2">
                      {debugData.pricingPlans.map((plan: any, index: number) => (
                        <div key={index} className="p-3 bg-white rounded border">
                          <div className="text-sm">
                            <div><strong>Plan Name:</strong> {plan.planName}</div>
                            <div><strong>Amount:</strong> ${plan.amount}</div>
                            <div><strong>Status:</strong> {plan.status}</div>
                            <div><strong>Stripe Customer ID:</strong> {plan.stripeCustomerId || 'None'}</div>
                            <div><strong>Created:</strong> {new Date(plan.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-700">No pricing plans found in database</p>
                  )}
                </div>

                {/* All Payments */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-4">All Payments (Raw Data)</h3>
                  <div className="max-h-96 overflow-y-auto">
                    <pre className="text-xs text-yellow-700 bg-white p-3 rounded border">
                      {JSON.stringify(debugData.allPayments, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-gray-600" size={20} />
                <h3 className="font-semibold text-gray-800">What to Look For</h3>
              </div>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>1. Payment Types:</strong> Check if "pricing-plan" appears in the payment types</p>
                <p><strong>2. Pricing Plans:</strong> Verify that pricing plans exist in the database</p>
                <p><strong>3. Matching:</strong> Look for payments that should match pricing plans</p>
                <p><strong>4. Status:</strong> Check if payment statuses are correct</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 