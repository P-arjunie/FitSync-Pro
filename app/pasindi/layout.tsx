import React from 'react';
import Navbar from '../Components/navbar';
import Footer1 from '../Components/footer_01';

export default function PasindiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer1 />
    </div>
  );
}
