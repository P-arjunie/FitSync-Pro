"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import StripeProvider from "../../Components/StripeProvider";
import CheckoutForm from "../../Components/CheckoutForm";

const CheckoutPage: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    setUserId(id || "test_user_123");
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      console.log("Fetching order with orderId:", orderId);
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();

        console.log("Fetched order details:", data);
        if (res.ok) {
          setOrderItems(data.orderItems);
          setTotalAmount(data.totalAmount);
        }
      } catch (err) {
        console.error("Error fetching order by ID:", err);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (!userId) return <p>Loading user...</p>;

  return (
    <StripeProvider>
      <CheckoutForm
        userId={userId}
        orderItems={orderItems}
        totalAmount={totalAmount === null ? undefined : totalAmount}
      />
    </StripeProvider>
  );
};

export default CheckoutPage;


{/* Scenario	Result	Displayed Details
Valid userId & has an order	Real Instance	Real order items & total
Valid userId but no orders	Dummy Instance	Dummy item & $10 total
Invalid or missing userId	Dummy Instance	Dummy item & $10 total
DB error fetching orders	Dummy Instance	Dummy item & $10 total*/}