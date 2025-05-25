"use client";

import { useEffect, useState } from "react";
import { CardElement, useStripe, useElements, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import styles from "../../Components/CheckoutForm.module.css"; // Make sure to import the CSS from its location
import Navbar from "../../Components/Navbar";

// Initialize Stripe - you'll need to replace this with your actual publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

// Dummy data for form fields
const DUMMY_DATA = {
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

// Default user ID - replace with your authentication logic
const DEFAULT_USER_ID = "user_123";

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <div className={styles.pageWrapper}>
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      </div>
    </>
  );
}

// CheckoutForm component moved from Components/CheckoutForm.tsx
const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize form data with dummy values to ensure fields are never empty
  const [formData, setFormData] = useState({
    userId: DEFAULT_USER_ID,
    firstName: DUMMY_DATA.firstName,
    lastName: DUMMY_DATA.lastName,
    email: DUMMY_DATA.email,
    company: DUMMY_DATA.company,
    billingAddress: {
      street: DUMMY_DATA.billingAddress.street,
      city: DUMMY_DATA.billingAddress.city,
      country: DUMMY_DATA.billingAddress.country,
      zip: DUMMY_DATA.billingAddress.zip,
    }
  });

  // Fetch user data when the component loads
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/user-data?userId=${formData.userId}`);
        if (!res.ok) {
          console.error(`Failed to fetch user data: ${res.status}`);
          return; // Keep using dummy data
        }
        
        const data = await res.json();
        
        // Update form data with fetched user data, keeping dummy values as fallbacks
        setFormData(prevData => ({
          ...prevData,
          firstName: data.firstName || prevData.firstName,
          lastName: data.lastName || prevData.lastName,
          email: data.email || prevData.email,
          company: data.company || prevData.company,
          billingAddress: {
            street: data.billingAddress?.street || prevData.billingAddress.street,
            city: data.billingAddress?.city || prevData.billingAddress.city,
            country: data.billingAddress?.country || prevData.billingAddress.country,
            zip: data.billingAddress?.zip || prevData.billingAddress.zip,
          }
        }));
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Continue using the dummy data already in state
      }
    };
    
    fetchUserData();
  }, []);

  // Update form field handler
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update billing address field handler
  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      billingAddress: {
        ...prev.billingAddress,
        [field]: value
      }
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setError("Stripe has not been initialized");
      return;
    }
    
    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      // Log the form data being submitted (for debugging)
      console.log("Submitting form data:", formData);

      const { paymentMethod, error: methodError } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (methodError) throw new Error(methodError.message || "Payment method creation failed");

      // Send the full formData to the API endpoint
      const res = await fetch("/api/payment_intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          ...formData // Include all form data - userId and billing info
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Payment request failed with status: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.requiresAction && data.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret);
        if (confirmError) throw new Error(confirmError.message || "Payment confirmation failed");
        alert("Payment successful!");
      } else if (data.success) {
        alert("Payment successful!");
      } else {
        throw new Error("Payment failed");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <form onSubmit={handleSubmit} className={styles.container}>
        <h2 className={styles.title}>Your basic information</h2>
        <div className={styles.grid}>
          <input
            className={styles.input}
            type="text"
            value={formData.firstName}
            onChange={(e) => handleFieldChange("firstName", e.target.value)}
            placeholder="First Name"
            required
          />
          <input
            className={styles.input}
            type="text"
            value={formData.lastName}
            onChange={(e) => handleFieldChange("lastName", e.target.value)}
            placeholder="Last Name"
            required
          />
          <input
            className={styles.input}
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            placeholder="Email Address"
            required
          />
          <input
            className={styles.input}
            type="text"
            value={formData.company}
            onChange={(e) => handleFieldChange("company", e.target.value)}
            placeholder="Company"
          />
        </div>

        <h2 className={styles.title}>Billing address</h2>
        <div className={styles.grid}>
          <input
            className={styles.input}
            type="text"
            value={formData.billingAddress.street}
            onChange={(e) => handleAddressChange("street", e.target.value)}
            placeholder="Street Address"
            required
          />
          <input
            className={styles.input}
            type="text"
            value={formData.billingAddress.city}
            onChange={(e) => handleAddressChange("city", e.target.value)}
            placeholder="City"
            required
          />
          <input
            className={styles.input}
            type="text"
            value={formData.billingAddress.country}
            onChange={(e) => handleAddressChange("country", e.target.value)}
            placeholder="Country"
            required
          />
          <input
            className={styles.input}
            type="text"
            value={formData.billingAddress.zip}
            onChange={(e) => handleAddressChange("zip", e.target.value)}
            placeholder="Zip Code"
            required
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