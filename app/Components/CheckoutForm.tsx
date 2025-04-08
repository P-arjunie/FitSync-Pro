"use client";

import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const CheckoutForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Step 1: Create Payment Method
      const { paymentMethod, error: paymentMethodError } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message || "Payment failed");
      }

      // Step 2: Call Backend to Create PaymentIntent
      const response = await fetch("/api/payment_intents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod?.id,
        }),
      });

      // Check if the response is valid JSON
      if (!response.ok) {
        const text = await response.text();
        console.error("Server response error:", text);
        throw new Error("Server returned an error (not JSON or invalid response)");
      }

      const data = await response.json();  // Only parse JSON after checking the status

      if (data.error) {
        throw new Error(data.error || "Payment failed");
      }

      // Step 3: Handle 3D Secure authentication
      if (data.requiresAction && data.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret);

        if (confirmError) {
          throw new Error(confirmError.message || "Payment failed");
        }

        alert("Payment successful!");
      } else if (data.success) {
        alert("Payment successful!");
      } else {
        throw new Error("Payment failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4">
      <div className="mb-4 p-2 border rounded">
        <CardElement options={{ style: { base: { fontSize: "16px" } } }} />
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <button
        type="submit"
        disabled={isProcessing || !stripe}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isProcessing ? "Processing..." : "Pay $10.00"}
      </button>
    </form>
  );
};

export default CheckoutForm;
