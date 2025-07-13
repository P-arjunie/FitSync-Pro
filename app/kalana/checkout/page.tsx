'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import StripeProvider from "../../Components/stripeprovider";
import CheckoutForm from "../../Components/CheckoutForm";

const CheckoutPage: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderIdState, setOrderIdState] = useState<string | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<{
    className: string;
    totalAmount: number;
    enrollmentId: string;
  } | null>(null);

  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const enrollmentId = searchParams.get("enrollmentId");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    setUserId(id || "test_user_123");
  }, []);

  useEffect(() => {
    // Clear previous state on param change
    setError(null);
    setLoading(true);
    setOrderItems([]);
    setTotalAmount(null);
    setOrderIdState(null);
    setEnrollmentData(null);

    if (!userId) return;

    if (enrollmentId) {
      // Fetch enrollment ONLY if enrollmentId is present
      const fetchEnrollment = async () => {
        try {
          const res = await fetch(`/api/enrollments/${enrollmentId}`);
          if (!res.ok) throw new Error("Enrollment fetch failed");
          const data = await res.json();

          setEnrollmentData({
            className: data.className,
            totalAmount: data.totalAmount,
            enrollmentId: data._id,
          });

          setLoading(false);
        } catch (err) {
          console.error(err);
          setError("Could not load that enrollment - please retry.");
          setLoading(false);
        }
      };

      fetchEnrollment();
    } else if (orderId) {
      // Fetch order ONLY if orderId is present and no enrollmentId
      setOrderIdState(orderId);

      const fetchOrder = async () => {
        try {
          const res = await fetch(`/api/orders/${orderId}`, {
            headers: {
              userId,
              "Content-Type": "application/json",
            },
          });

          const data = await res.json();

          if (res.ok) {
            setOrderItems(data.orderItems);
            setTotalAmount(data.totalAmount);
            setLoading(false);
          } else {
            setError(data.error || "Failed to fetch order details");
            setLoading(false);
          }
        } catch (err) {
          setError("Network error while fetching order");
          setLoading(false);
        }
      };

      fetchOrder();
    } else {
      // No orderId or enrollmentId, show error or redirect
      setError("No order or enrollment ID provided");
      setLoading(false);
    }
  }, [userId, orderId, enrollmentId]);

  if (!userId) return <p>Loading user...</p>;
  if (loading) return <p>Loading details...</p>;

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );

  return (
    <StripeProvider>
      <CheckoutForm
        userId={userId}
        orderItems={orderItems}
        totalAmount={totalAmount === null ? undefined : totalAmount}
        orderId={orderIdState || undefined}
        enrollmentData={enrollmentData || undefined}
      />
    </StripeProvider>
  );
};

export default CheckoutPage;
