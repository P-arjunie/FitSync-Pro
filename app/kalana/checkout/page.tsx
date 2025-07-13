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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const enrollmentId = searchParams.get("enrollmentId");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    console.log("Setting userId:", id);
    setUserId(id || "test_user_123");
  }, []);

  // Fetch order by orderId if present
  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      if (!orderId || !userId) return;

      console.log("Fetching order with orderId:", orderId, "userId:", userId);
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'userId': userId,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();

        if (res.ok) {
          setOrderItems(data.orderItems);
          setTotalAmount(data.totalAmount);
        } else {
          console.error("Failed to fetch order:", data.error);
          setError(data.error || "Failed to fetch order details");
        }
      } catch (err) {
        console.error("Error fetching order by ID:", err);
        setError("Network error while fetching order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, userId]);

  if (!userId) return <p>Loading user...</p>;
  
  if (loading) return <p>Loading order details...</p>;
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Order</h2>
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

  if (!orderId) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">No Order ID</h2>
        <p className="text-gray-600 mb-4">No order ID provided in the URL</p>
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
        enrollmentData={enrollmentData || undefined}
      />
    </StripeProvider>
  );
};

export default CheckoutPage;
