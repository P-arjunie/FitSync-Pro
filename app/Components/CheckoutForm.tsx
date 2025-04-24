"use client";

import { useEffect, useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import styles from "./CheckoutForm.module.css";

interface CheckoutFormProps {
  userId: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ userId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/user-data?userId=${userId}`);
        const data = await res.json();
        setUserData(data);
      } catch {
        setUserData(null); // fallback to dummy if fetch fails
      }
    };
    fetchUserData();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const { paymentMethod, error: methodError } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (methodError) throw new Error(methodError.message || "Payment failed");

      const res = await fetch("/api/payment_intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId: paymentMethod.id }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.requiresAction && data.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret);
        if (confirmError) throw new Error(confirmError.message || "Payment failed");
        alert("Payment successful!");
      } else if (data.success) {
        alert("Payment successful!");
      } else {
        throw new Error("Payment failed");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const dummy = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    company: "FitSyncPro",
    billingAddress: {
      street: "123 Main St",
      city: "Colombo",
      country: "Sri Lanka",
      zip: "10100",
    },
  };

  const info = {
    ...dummy,
    ...userData,
    billingAddress: {
      ...dummy.billingAddress,
      ...(userData?.billingAddress || {})
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <form onSubmit={handleSubmit} className={styles.container}>
        <h2 className={styles.title}>Your basic information</h2>
        <div className={styles.grid}>
          <input className={styles.input} type="text" value={info.firstName} readOnly />
          <input className={styles.input} type="text" value={info.lastName} readOnly />
          <input className={styles.input} type="text" value={info.email} readOnly />
          <input className={styles.input} type="text" value={info.company} readOnly />
        </div>

        <h2 className={styles.title}>Billing address</h2>
        <div className={styles.grid}>
          <input className={styles.input} type="text" value={info.billingAddress.street} readOnly />
          <input className={styles.input} type="text" value={info.billingAddress.city} readOnly />
          <input className={styles.input} type="text" value={info.billingAddress.country} readOnly />
          <input className={styles.input} type="text" value={info.billingAddress.zip} readOnly />
        </div>

        <h2 className={styles.title}>Your payment information</h2>
        <div className={styles.card}>
          <CardElement />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.button} type="submit" disabled={isProcessing || !stripe}>
          {isProcessing ? "Processing..." : "Pay $10.00"}
        </button>
      </form>
    </div>
  );
};

export default CheckoutForm;
