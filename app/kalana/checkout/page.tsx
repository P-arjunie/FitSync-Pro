'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import StripeProvider from "../../Components/stripeprovider";
import CheckoutForm from "../../Components/CheckoutForm";

const CheckoutPage: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
<<<<<<< Updated upstream
  const [enrollmentData, setEnrollmentData] = useState<{ className: string; totalAmount: number } | null>(null);
=======
  const [enrollmentData, setEnrollmentData] = useState<{ _id: string; className: string; totalAmount: number } | null>(null);
  const [orderIdState, setOrderIdState] = useState<string | null>(null);
>>>>>>> Stashed changes
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId");
  const enrollmentId = searchParams.get("enrollmentId");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    setUserId(id || "test_user_123");
  }, []);

  useEffect(() => {
    if (!orderId) return;

    setOrderIdState(orderId);
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();

        if (res.ok) {
          setOrderItems(data.orderItems);
          setTotalAmount(data.totalAmount);
<<<<<<< Updated upstream
          setEnrollmentData(null); // Clear enrollment if order loaded
=======
          setEnrollmentData(null);
>>>>>>> Stashed changes
        }
      } catch (err) {
        console.error("Error fetching order by ID:", err);
      }
    };
    fetchOrder();
  }, [orderId]);

<<<<<<< Updated upstream
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

=======
  useEffect(() => {
    if (!enrollmentId) return;

    const fetchEnrollment = async () => {
      try {
        const res = await fetch(`/api/enrollments?id=${enrollmentId}`);
        const data = await res.json();

        if (res.ok) {
          setEnrollmentData(data);
          setOrderItems([]);
          setTotalAmount(null);
        }
      } catch (err) {
        console.error("Error fetching enrollment:", err);
      }
    };
    fetchEnrollment();
  }, [enrollmentId]);
>>>>>>> Stashed changes

  if (!userId) return <p>Loading user...</p>;

  return (
    <StripeProvider>
      <CheckoutForm
        userId={userId}
        orderItems={orderItems}
        totalAmount={totalAmount === null ? undefined : totalAmount}
        enrollmentData={enrollmentData || undefined}
        orderId={orderIdState || undefined}
      />
    </StripeProvider>
  );
};

export default CheckoutPage;
