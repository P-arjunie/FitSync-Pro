// app/kalana/checkout/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import StripeProvider from "../../Components/stripeprovider";
import CheckoutForm from "../../Components/CheckoutForm";

const CheckoutPage: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<{ className: string; totalAmount: number } | null>(null);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const enrollmentId = searchParams.get("enrollmentId");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    setUserId(id || "test_user_123");
  }, []);

  // Fetch order by orderId if present
  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();

        if (res.ok) {
          setOrderItems(data.orderItems);
          setTotalAmount(data.totalAmount);
          setEnrollmentData(null); // Clear enrollment if order loaded
        }
      } catch (err) {
        console.error("Error fetching order by ID:", err);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Fetch enrollment by enrollmentId if present
// Fetch enrollment by enrollmentId if present
useEffect(() => {
  if (!enrollmentId) return;

  const fetchEnrollment = async () => {
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}`);
      if (!res.ok) throw new Error('Enrollment fetch failed');
      const data = await res.json();
      setEnrollmentData({ className: data.className, totalAmount: data.totalAmount });
      setOrderItems([]);            // clear any order data
      setTotalAmount(null);
    } catch (err) {
      console.error(err);
      alert('Could not load that enrollment - please retry.');
    }
  };

  fetchEnrollment();
}, [enrollmentId]);


  if (!userId) return <p>Loading user...</p>;

  return (
    <StripeProvider>
      <CheckoutForm
        userId={userId}
        orderItems={orderItems}
        totalAmount={totalAmount === null ? undefined : totalAmount}
        enrollmentData={enrollmentData || undefined}
      />
    </StripeProvider>
  );
};

export default CheckoutPage;
