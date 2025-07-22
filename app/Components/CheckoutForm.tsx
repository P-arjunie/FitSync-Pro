import { useEffect, useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { StripeCardElement } from "@stripe/stripe-js";
import styles from "./checkoutform.module.css";
import Navbar from "./Navbar";
import Footer_02 from "./Footer_02";
import cartImg from "../../public/cart.png";
import classImg from "../../public/classesb.png";

interface OrderItem {
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CheckoutFormProps {
  userId: string;
  orderItems?: OrderItem[];
  totalAmount?: number;
  orderId?: string;
  enrollmentData?: {
    className: string;
    totalAmount: number;
    enrollmentId: string;
  };
   pricingPlanData?: {
    planName: string;
    amount: number;
    pricingPlanId: string;
  };
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  userId,
  orderItems: orderItemsProp,
  totalAmount: totalAmountProp,
  orderId,
  enrollmentData,
  pricingPlanData,
}) => {
  
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  // Add a state for store purchase warning
  const [showStoreWarning, setShowStoreWarning] = useState(false);

  useEffect(() => {
    if (!userId) return;

    if (orderItemsProp && totalAmountProp !== undefined) {
      setOrderItems(orderItemsProp);
      setTotalAmount(totalAmountProp);
      return;
    }

    const fetchOrders = async () => {
  try {
    if (!orderId) return; // Don't fetch unless it's an actual order

    const res = await fetch("/api/orders", {
      headers: {
        userId,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return;

    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      const latest = data[data.length - 1];
      setOrderItems(latest.orderItems);
      setTotalAmount(latest.totalAmount);
    }
  } catch (err) {
    console.error("Order fetch error:", err);
  }
};


    fetchOrders();
  }, [userId, orderItemsProp, totalAmountProp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;
    setLoading(true);
    setMessage("");

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setMessage("Card element not found.");
      setLoading(false);
      return;
    }

    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement as StripeCardElement,
    });

    if (error || !paymentMethod) {
      setMessage(error?.message || "Payment method creation failed.");
      setLoading(false);
      return;
    }

    // Get user email from localStorage
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      setMessage("User email not found in localStorage.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/payment-intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethodId: paymentMethod.id,
        userId,
        email: userEmail,
        paymentFor: pricingPlanData
          ? "pricing-plan"
          : enrollmentData
          ? "enrollment"
          : "order",
        enrollmentId: enrollmentData?.enrollmentId || null,
        pricingPlanId: pricingPlanData?.pricingPlanId || null,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setMessage("✅ Payment succeeded!");
      setPaymentSuccess(true);
      if (!enrollmentData && !pricingPlanData) {
        setShowStoreWarning(true);
      }
    } else {
      setMessage(`❌ Payment failed: ${data.error || "Unknown error"}`);
    }

    setLoading(false);
  };

  // Map class names to their respective images
  const classImageMap: Record<string, string> = {
    meditation: "/meditation.jpg",
    workout: "/workout.jpg",
    mma: "/mma.jpg",
    yoga: "/yoga.jpg",
    cycling: "/cycling.jpg",
    power_lifting: "/powerlifting.jpg",
  };

  return (
    <div className={styles.pageWrapper}>
      <Navbar />
      <form onSubmit={handleSubmit} className={styles.container}>
        <h2 className={styles.title}>Checkout Summary</h2>
        <div className={styles.grid}>
          {/* Order Items */}
          {orderItems.length > 0 &&
            orderItems.map((item, idx) => (
              <div key={idx} className={styles.card}>
                <img
                  src={item.image || cartImg.src}
                  alt={item.title}
                  className={styles.itemImage}
                />
                <div className={styles.cardContent}>
                  <p><strong>{item.title}</strong></p>
                  <p>Qty: {item.quantity}</p>
                  <p>Price: ${item.price}</p>
                </div>
              </div>
            ))}

          {/* Enrollment Summary */}
          {enrollmentData && (
            <div className={styles.card}>
              <img
                src={classImageMap[enrollmentData.className.toLowerCase().replace(/ /g, "_")] || classImg.src}
                alt={enrollmentData.className}
                className={styles.itemImage}
              />
              <div className={styles.cardContent}>
                <p><strong>{enrollmentData.className}</strong></p>
                <p>Qty: 1</p>
                <p>Price: ${enrollmentData.totalAmount}</p>
              </div>
            </div>
          )}

          {/* Pricing Plan Summary */}
          {pricingPlanData && (
            <div className={styles.card}>
              <img
                src={cartImg.src}
                alt="Plan"
                className={styles.itemImage}
              />
              <div className={styles.cardContent}>
                <p><strong>{pricingPlanData.planName}</strong></p>
                <p>Qty: 1</p>
                <p>Price: ${pricingPlanData.amount}</p>
              </div>
            </div>
          )}

          {/* Total Summary */}
          <div className={styles.card}>
            <div className={styles.cardContent}>
              <p>
                <strong>
                  Total: $
                  {pricingPlanData
                    ? pricingPlanData.amount
                    : enrollmentData
                    ? enrollmentData.totalAmount
                    : totalAmount}
                </strong>
              </p>
            </div>
          </div>
        </div>

        <div className={styles.paymentCard}>
          <h3 className={styles.paymentTitle}>Enter Card Details</h3>
          <CardElement
            className={styles.cardElement}
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#222",
                  '::placeholder': { color: "#bbb" },
                  fontFamily: "inherit",
                  backgroundColor: "#fff",
                },
                invalid: { color: "#e3342f" },
              },
            }}
          />
        </div>

        {/* Show store purchase warning before payment for shop purchases */}
        {(!enrollmentData && !pricingPlanData) && (
          <div style={{ background: '#FEF3C7', color: '#92400e', border: '1px solid #F59E0B', borderRadius: 8, padding: 16, marginTop: 16, textAlign: 'center' }}>
            <strong>Note:</strong> Store purchases are non-refundable.
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || loading || paymentSuccess}
          className={styles.button}
        >
          {loading ? "Processing..." : paymentSuccess ? "Payment Successful" : "Pay Now"}
        </button>

        {message && <p className={styles.error}>{message}</p>}
        {/* Remove post-payment warning, now always shown above */}
      </form>
      <Footer_02 />
    </div>
  );
};

export default CheckoutForm;
