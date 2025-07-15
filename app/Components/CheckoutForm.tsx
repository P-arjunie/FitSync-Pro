import { useEffect, useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { StripeCardElement } from "@stripe/stripe-js";
import styles from "./checkoutform.module.css";
import Navbar from "./Navbar";
import Footer_02 from "./Footer_02";

interface OrderItem {
  title: string;
  price: number;
  quantity: number;
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

    const res = await fetch("/api/payment_intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethodId: paymentMethod.id,
        userId,
        
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
    } else {
      setMessage(`❌ Payment failed: ${data.error || "Unknown error"}`);
    }

    setLoading(false);
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
        <p>
          <strong>{item.title}</strong>
        </p>
        <p>Qty: {item.quantity}</p>
        <p>Price: ${item.price}</p>
      </div>
    ))}

  {/* Enrollment Summary */}
  {enrollmentData && (
    <div className={styles.card}>
      <p>
        <strong>{enrollmentData.className}</strong>
      </p>
      <p>Qty: 1</p>
      <p>Price: ${enrollmentData.totalAmount}</p>
    </div>
  )}

  {/* Pricing Plan Summary */}
  {pricingPlanData && (
    <div className={styles.card}>
      <p>
        <strong>{pricingPlanData.planName}</strong>
      </p>
      <p>Qty: 1</p>
      <p>Price: ${pricingPlanData.amount}</p>
    </div>
  )}

  {/* Total Summary */}
  <div className={styles.card}>
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


        <CardElement
          className={styles.card}
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": { color: "#aab7c4" },
              },
              invalid: { color: "#9e2146" },
            },
          }}
        />

        <button
          type="submit"
          disabled={!stripe || loading}
          className={styles.button}
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>

        {message && <p className={styles.error}>{message}</p>}
      </form>
      <Footer_02 />
    </div>
  );
};

export default CheckoutForm;
