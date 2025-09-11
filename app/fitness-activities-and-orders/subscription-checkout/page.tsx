'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import Navbar from '@/Components/Navbar';
import Footer from '@/Components/Footer_02';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function SubscriptionCheckoutPage() {
  const searchParams = useSearchParams();

  const email = searchParams.get('email');
  const priceId = searchParams.get('priceId');
  const planName = searchParams.get('planName');
  const userId = searchParams.get('userId');
  const planId = searchParams.get('planId');

  useEffect(() => {
    if (!priceId || !userId || !planName || !planId || !email) return;

    const createCheckoutSession = async () => {
      try {
        const res = await fetch('/api/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId, userId, planName, planId, email }),
        });

        const data = await res.json();
        const stripe = await stripePromise;

        if (data.sessionId) {
          await stripe?.redirectToCheckout({ sessionId: data.sessionId });
        } else {
          console.error('Stripe session failed:', data);
          alert('Failed to start Stripe checkout.');
        }
      } catch (error) {
        console.error('Checkout error:', error);
        alert('Something went wrong starting payment.');
      }
    };

    createCheckoutSession();
  }, [priceId, userId, planName, planId, email]);

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#d7263d', fontWeight: 600 }}>
        Redirecting to Stripe...
      </div>
      <Footer />
    </>
  );
}
