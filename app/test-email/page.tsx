'use client';

import { useState } from 'react';
import { Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TestEmailPage() {
  const [testEmail, setTestEmail] = useState('kalanam890@gmail.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTestEmail = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testEmail }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to test email configuration' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Mail className="text-blue-500" size={40} />
              <h1 className="text-3xl font-bold text-gray-900">
                Email Configuration Test
              </h1>
            </div>
            <p className="text-gray-600">
              Test your email configuration to ensure refund notifications are working
            </p>
          </div>

          <div className="space-y-6">
            {/* Configuration Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Configuration Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">EMAIL_USER:</span>
                  <span className="text-gray-600">
                    {process.env.NEXT_PUBLIC_EMAIL_USER || 'Not set in frontend'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">EMAIL_PASS:</span>
                  <span className="text-gray-600">
                    {process.env.NEXT_PUBLIC_EMAIL_PASS ? 'Set' : 'Not set in frontend'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Note: Environment variables are only available on the server side for security
              </p>
            </div>

            {/* Test Email Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Email Address
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address to test"
                />
              </div>

              <button
                onClick={handleTestEmail}
                disabled={loading || !testEmail}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending Test Email...' : 'Send Test Email'}
              </button>
            </div>

            {/* Results */}
            {result && (
              <div className={`rounded-lg p-4 ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <XCircle className="text-red-600" size={20} />
                  )}
                  <h3 className="font-semibold text-gray-800">
                    {result.success ? 'Success!' : 'Error'}
                  </h3>
                </div>
                
                <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.message || result.error}
                </p>

                {result.details && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <h4 className="font-medium text-gray-800 mb-2">Details:</h4>
                    <pre className="text-xs text-gray-600 overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-yellow-600" size={20} />
                <h3 className="font-semibold text-yellow-800">Setup Instructions</h3>
              </div>
              <div className="text-sm text-yellow-700 space-y-2">
                <p><strong>1. Enable 2-Factor Authentication:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Go to <a href="https://myaccount.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Account Settings</a></li>
                  <li>Click on "Security"</li>
                  <li>Enable "2-Step Verification"</li>
                </ul>
                
                <p><strong>2. Generate App Password:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline">App Passwords</a></li>
                  <li>Select "Mail" and "Other (Custom name)"</li>
                  <li>Name it "FitSync Pro"</li>
                  <li>Copy the 16-character password</li>
                </ul>
                
                <p><strong>3. Update .env file:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Replace "your_app_password_here" with the generated app password</li>
                  <li>Restart your development server</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 