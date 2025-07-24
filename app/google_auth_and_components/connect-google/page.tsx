'use client';

import { signIn } from 'next-auth/react';

export default function ConnectGooglePage() {
  return (
    <div>
      <h2>Connect to Google</h2>
      <button
        onClick={() =>
          signIn('google', { callbackUrl: '/pasindi/calendar' }) // Redirect after login
        }
        className="bg-blue-600 text-white p-2 rounded"
      >
        Sign in with Google
      </button>
    </div>
  );
}
