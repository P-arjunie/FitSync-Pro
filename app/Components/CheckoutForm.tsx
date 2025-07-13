import { useEffect, useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { StripeCardElement } from "@stripe/stripe-js";
import styles from "./checkoutform.module.css";

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
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  userId,
  orderItems: orderItemsProp,
  totalAmount: totalAmountProp,
  orderId,
  enrollmentData,
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
        const res = await fetch("/api/orders", {
          headers: {
            userId,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          setOrderItems([{ title: "Dummy Plan", price: 10, quantity: 1 }]);
          setTotalAmount(10);
          return;
        }

        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const latest = data[data.length - 1];
          setOrderItems(latest.orderItems);
          setTotalAmount(latest.totalAmount);
        } else {
          throw new Error("No orders found");
        }
      } catch (err) {
        setOrderItems([{ title: "Dummy Plan", price: 100, quantity: 20 }]);
        setTotalAmount(2000);
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
        paymentFor: enrollmentData ? "enrollment" : "order",
        enrollmentId: enrollmentData?.enrollmentId || null,
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
      <form onSubmit={handleSubmit} className={styles.container}>
        <h2 className={styles.title}>Checkout Summary</h2>

        {orderItems.length > 0 && (
          <div className={styles.grid}>
            {orderItems.map((item, idx) => (
              <div key={idx} className={styles.card}>
                <p>
                  <strong>{item.title}</strong>
                </p>
                <p>Qty: {item.quantity}</p>
                <p>Price: ${item.price}</p>
              </div>
            ))}
            <div className={styles.card}>
              <p>
                <strong>Total: ${totalAmount}</strong>
              </p>
            </div>
          </div>
        )}

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
    </div>
  );
};

export default CheckoutForm;
