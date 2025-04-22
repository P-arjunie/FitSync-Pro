"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import React from "react";

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Elements stripe={getStripe()} options={{ locale: "en" }}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
