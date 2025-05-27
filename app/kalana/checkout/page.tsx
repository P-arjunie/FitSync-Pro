"use client";

import { useEffect, useState } from "react";
import StripeProvider from "../../Components/StripeProvider";
import CheckoutForm from "../../Components/CheckoutForm";

const CheckoutPage: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user-data");
        const data = await res.json();
        setUserId(data?.userId || "test_user_123");
      } catch (err) {
        setUserId("test_user_123"); // fallback dummy
      }
    };
    fetchUser();
  }, []);

  if (!userId) return <p>Loading user...</p>;

  return (
    <StripeProvider>
      <CheckoutForm userId={userId} />
    </StripeProvider>
  );
};

export default CheckoutPage;
