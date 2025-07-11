"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import React from "react";

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error("Stripe publishable key is not configured");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stripePromise = getStripe();
  
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
