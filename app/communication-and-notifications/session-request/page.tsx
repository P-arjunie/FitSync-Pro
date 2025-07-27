'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../../Components/Navbar';
import Footer from '../../Components/Footer_01';

const SessionRequestPage = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserEmail(localStorage.getItem('userEmail'));
      setUserName(localStorage.getItem('userName'));
    }
  }, []);

  return (
    <>
      <Navbar />
      <div className="bg-black min-h-screen px-6 py-10 font-sans text-white">
        {userEmail && (
          <div className="max-w-4xl mx-auto mb-4 flex justify-end">
            <span className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow">
              Hi{userName ? `, ${userName}` : userEmail}!
            </span>
          </div>
        )}
        <h2 className="text-3xl font-bold text-center mb-8 tracking-wide">
          <span className="text-white">FitSyncPro</span>{' '}
          <span className="text-red-600">- Session Requests</span>
        </h2>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold text-white mb-4">
              Session Request Management
            </h3>
            <p className="text-gray-300 mb-6">
              This page will display session requests and allow you to manage them.
            </p>
            <div className="bg-gray-700 rounded-lg p-6">
              <p className="text-gray-400">
                Session request functionality is being developed. Please check back later.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SessionRequestPage;
