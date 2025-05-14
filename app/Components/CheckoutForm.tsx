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

  // Fetch user data when the component loads
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/user-data?userId=${userId}`);
        const data = await res.json();
        setUserData(data);
      } catch {
        setUserData(null); // Fallback to dummy data if fetching user data fails
      }
    };
    fetchUserData();
  }, [userId]);

  // Handle form submission
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
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          userId,
          firstName: userData?.firstName || "", // Use fetched data or fallback to dummy
          lastName: userData?.lastName || "", // Use fetched data or fallback to dummy
          email: userData?.email || "", // Use fetched data or fallback to dummy
          billingAddress: {
            street: userData?.billingAddress?.street || "", // Ensure these values are provided
            city: userData?.billingAddress?.city || "",
            country: userData?.billingAddress?.country || "",
            zip: userData?.billingAddress?.zip || "",
          },
        }),
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

  // Dummy data fallback
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

  // Combine dummy data and fetched data
  const info = {
    firstName: userData?.firstName || dummy.firstName,
    lastName: userData?.lastName || dummy.lastName,
    email: userData?.email || dummy.email,
    company: userData?.company || dummy.company,
    billingAddress: {
      street: userData?.billingAddress?.street || dummy.billingAddress.street,
      city: userData?.billingAddress?.city || dummy.billingAddress.city,
      country: userData?.billingAddress?.country || dummy.billingAddress.country,
      zip: userData?.billingAddress?.zip || dummy.billingAddress.zip,
    },
  };

  return (
    <div className={styles.pageWrapper}>
      <form onSubmit={handleSubmit} className={styles.container}>
        <h2 className={styles.title}>Your basic information</h2>
        <div className={styles.grid}>
          <input
            className={styles.input}
            type="text"
            value={info.firstName}
            onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
            placeholder="First Name"
          />
          <input
            className={styles.input}
            type="text"
            value={info.lastName}
            onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
            placeholder="Last Name"
          />
          <input
            className={styles.input}
            type="email"
            value={info.email}
            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
            placeholder="Email Address"
          />
          <input
            className={styles.input}
            type="text"
            value={info.company}
            onChange={(e) => setUserData({ ...userData, company: e.target.value })}
            placeholder="Company"
          />
        </div>

        <h2 className={styles.title}>Billing address</h2>
        <div className={styles.grid}>
          <input
            className={styles.input}
            type="text"
            value={info.billingAddress.street}
            onChange={(e) =>
              setUserData({
                ...userData,
                billingAddress: { ...userData.billingAddress, street: e.target.value },
              })
            }
            placeholder="Street Address"
          />
          <input
            className={styles.input}
            type="text"
            value={info.billingAddress.city}
            onChange={(e) =>
              setUserData({
                ...userData,
                billingAddress: { ...userData.billingAddress, city: e.target.value },
              })
            }
            placeholder="City"
          />
          <input
            className={styles.input}
            type="text"
            value={info.billingAddress.country}
            onChange={(e) =>
              setUserData({
                ...userData,
                billingAddress: { ...userData.billingAddress, country: e.target.value },
              })
            }
            placeholder="Country"
          />
          <input
            className={styles.input}
            type="text"
            value={info.billingAddress.zip}
            onChange={(e) =>
              setUserData({
                ...userData,
                billingAddress: { ...userData.billingAddress, zip: e.target.value },
              })
            }
            placeholder="Zip Code"
          />
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
