"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import React, { useMemo } from "react";

const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stripePromise = useMemo(() => {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error("Stripe publishable key is not configured");
      return null;
    }
    return loadStripe(publishableKey);
  }, []);

  if (!stripePromise) {
    return <div>Stripe is not configured. Please check your environment variables.</div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ locale: "en" }}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
