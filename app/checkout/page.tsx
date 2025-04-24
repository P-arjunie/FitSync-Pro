"use client";

import { useEffect, useState } from "react";
import StripeProvider from "../Components/StripeProvider";
import CheckoutForm from "../Components/CheckoutForm";

const CheckoutPage: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/user-data");
        const data = await res.json();
        setUserId(data?.userId || null);
      } catch (err) {
        console.error("Error fetching user ID:", err);
      }
    };
    fetchUserData();
  }, []);

  if (!userId) return <p>Loading user data...</p>;

  return (
    <StripeProvider>
      <h1>Checkout</h1>
      <CheckoutForm userId={userId} />
    </StripeProvider>
  );
};

export default CheckoutPage;
