import { useEffect, useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { StripeCardElement } from "@stripe/stripe-js";
import styles from "./checkoutform.module.css";
import Navbar from "./Navbar";
import Footer_02 from "./Footer_02";
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface OrderItem {
  title: string;
  price: number;
  quantity: number;
  image?: string; // Added image property
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

  // Static image map for classes
  const classImageMap: Record<string, string> = {
    meditation: "/meditation.jpg",
    workout: "/workout.jpg",
    mma: "/mma.jpg",
    yoga: "/yoga.jpg",
    cycling: "/cycling.jpg",
    power_lifting: "/powerlifting.jpg",
  };

  // Themed icon for pricing plans
  const pricingPlanImage = "/cards.png";

  return (
    <div className={styles.pageWrapper}>
      <Navbar />
      <form onSubmit={handleSubmit} className={styles.container}>
        {/* Summary Card */}
        <div className={styles.summaryCard}>
          <div className={styles.accentBar}></div>
          {/* Show image and details for the first item/enrollment/plan */}
          {orderItems.length > 0 && (
            <>
              <img
                src={orderItems[0].image || "/file.svg"}
                alt={orderItems[0].title}
                className={styles.summaryImage}
              />
              <div className={styles.summaryHeader}>{orderItems[0].title}</div>
              <div className={styles.summaryPrice}>${orderItems[0].price}</div>
              <ul className={styles.summaryFeatures}>
                <li className={styles.featureItem}><FaCheckCircle className={styles.featureIcon}/>Qty: {orderItems[0].quantity}</li>
              </ul>
            </>
          )}
          {enrollmentData && (
            <>
              <img
                src={classImageMap[enrollmentData.className.toLowerCase()] || "/file.svg"}
                alt={enrollmentData.className}
                className={styles.summaryImage}
              />
              <div className={styles.summaryHeader}>{enrollmentData.className}</div>
              <div className={styles.summaryPrice}>${enrollmentData.totalAmount}</div>
              <ul className={styles.summaryFeatures}>
                <li className={styles.featureItem}><FaCheckCircle className={styles.featureIcon}/>Unlimited monthly classes</li>
                <li className={styles.featureItem}><FaCheckCircle className={styles.featureIcon}/>Expert guidance</li>
                <li className={styles.featureItem}><FaCheckCircle className={styles.featureIcon}/>Peaceful environment</li>
              </ul>
            </>
          )}
          {pricingPlanData && (
            <>
              <img
                src={pricingPlanImage}
                alt={pricingPlanData.planName}
                className={styles.summaryImage}
              />
              <div className={styles.summaryHeader}>{pricingPlanData.planName}</div>
              <div className={styles.summaryPrice}>${pricingPlanData.amount} <span style={{fontSize:'1rem',fontWeight:400}}>/month</span></div>
              <ul className={styles.summaryFeatures}>
                <li className={styles.featureItem}><FaCheckCircle className={styles.featureIcon}/>Training Overview</li>
                <li className={styles.featureItem}><FaCheckCircle className={styles.featureIcon}/>Beginner Classes</li>
                <li className={`${styles.featureItem} ${styles.inactive}`}><FaTimesCircle className={styles.featureIcon}/>Personal Training</li>
                <li className={`${styles.featureItem} ${styles.inactive}`}><FaTimesCircle className={styles.featureIcon}/>Olympic Weightlifting</li>
                <li className={`${styles.featureItem} ${styles.inactive}`}><FaTimesCircle className={styles.featureIcon}/>Foundation Training</li>
              </ul>
            </>
          )}
          <div className={styles.summaryTotal}>
            Total: $
            {pricingPlanData
              ? pricingPlanData.amount
              : enrollmentData
              ? enrollmentData.totalAmount
              : totalAmount}
          </div>
        </div>
        {/* Payment Form */}
        <div className={styles.paymentSection}>
          <h2 className={styles.title}>Payment</h2>
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
        </div>
      </form>
      <Footer_02 />
    </div>
  );
};

export default CheckoutForm;
