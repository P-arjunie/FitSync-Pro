'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import StripeProvider from "../../Components/StripeProvider";
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
  const [pricingPlanData, setPricingPlanData] = useState<{
    planName: string;
    amount: number;
    pricingPlanId: string;
  } | null>(null);

  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const enrollmentId = searchParams.get("enrollmentId");
  const paymentFor = searchParams.get("paymentFor");
  const pricingPlanId = searchParams.get("pricingPlanId");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    setUserId(id || "test_user_123");
  }, []);

  useEffect(() => {
    // Reset all states on param change
    setError(null);
    setLoading(true);
    setOrderItems([]);
    setTotalAmount(null);
    setOrderIdState(null);
    setEnrollmentData(null);
    setPricingPlanData(null);

    if (!userId) return;

    const fetchData = async () => {
      try {
        if (enrollmentId) {
          const res = await fetch(`/api/enrollments/${enrollmentId}`);
          if (!res.ok) throw new Error("Enrollment fetch failed");
          const data = await res.json();
          setEnrollmentData({
            className: data.className,
            totalAmount: data.totalAmount,
            enrollmentId: data._id,
          });
        } else if (orderId) {
          setOrderIdState(orderId);
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
          } else {
            throw new Error(data.error || "Order fetch failed");
          }
        } else if (paymentFor === "pricing-plan" && pricingPlanId) {
          const res = await fetch(`/api/pricing-plan-purchase/${pricingPlanId}`);
          if (!res.ok) throw new Error("Pricing plan fetch failed");
          const data = await res.json();
          setPricingPlanData({
            planName: data.planName,
            amount: data.amount,
            pricingPlanId: data._id,
          });
        } else {
          throw new Error("No valid parameters provided");
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, orderId, enrollmentId, paymentFor, pricingPlanId]);

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
        pricingPlanData={pricingPlanData || undefined}
      />
    </StripeProvider>
  );
};

export default CheckoutPage;
