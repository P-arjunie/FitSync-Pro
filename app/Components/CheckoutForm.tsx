import { useEffect, useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { StripeCardElement } from "@stripe/stripe-js";
import styles from "./CheckoutForm.module.css";
import Navbar from "./Navbar";
import Footer_02 from "./Footer_02";
import cartImg from "../../public/cart.png";
import classImg from "../../public/classesb.png";
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  // Add a state for store purchase warning
  const [showStoreWarning, setShowStoreWarning] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState("");
  const [useWallet, setUseWallet] = useState(false);

  // Fetch wallet balance (same as purchase history)
  const fetchWallet = async () => {
    try {
      setWalletLoading(true);
      setWalletError("");
      const res = await fetch(`/api/wallet?userId=${userId}&_=${Date.now()}`); // Add cache buster
      if (!res.ok) throw new Error("Failed to fetch wallet");
      const data = await res.json();
      setWalletBalance(data.wallet?.balance || 0);
      console.log('[CHECKOUT] Wallet fetched:', data.wallet?.balance, 'Order total:', totalAmount);
    } catch (err) {
      setWalletError("Could not load wallet");
    } finally {
      setWalletLoading(false);
    }
  };

  // Always fetch wallet balance right before showing wallet button
  useEffect(() => {
    if (!userId) return;
    fetchWallet();
  }, [userId, orderItems, totalAmount]);

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
      router.push('/fitness-activities-and-orders/success');
      if (!enrollmentData && !pricingPlanData) {
        setShowStoreWarning(true);
      }
    } else {
      setMessage(`❌ Payment failed: ${data.error || "Unknown error"}`);
    }

    setLoading(false);
  };

  const handleWalletPay = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          items: orderItems,
          totalAmount,
          payWithWallet: true,
          userEmail: localStorage.getItem("userEmail")
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage("✅ Payment succeeded using wallet!");
        setPaymentSuccess(true);
        router.push('/fitness-activities-and-orders/success');
        await fetchWallet(); // Refresh wallet balance after payment
      } else {
        setMessage(`❌ Wallet payment failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setMessage("❌ Wallet payment failed");
    } finally {
      setLoading(false);
    }
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

  // Only allow wallet for shop purchases (not enrollments or pricing plans)
  const isShopPurchase = !enrollmentData && !pricingPlanData;
  const hasOrder = isShopPurchase && orderItems.length > 0 && totalAmount > 0;
  const isEnrollmentOrPlan = !!enrollmentData || !!pricingPlanData;

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

        {/* Show store purchase warning before payment for shop purchases */}
        {isShopPurchase && (
          <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1 text-yellow-700 mt-4 mb-4 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Note: Store purchases are non-refundable.</span>
          </div>
        )}

        {/* Wallet payment button for shop purchases only, if order context is present */}
        {isShopPurchase && hasOrder && !paymentSuccess && (
          <>
            {console.log('[CHECKOUT] Rendering wallet button. Wallet balance:', walletBalance, 'Order total:', totalAmount)}
            <button
              type="button"
              disabled={loading || walletBalance < totalAmount}
              className={styles.button + (walletBalance < totalAmount ? " bg-gray-400 cursor-not-allowed" : " bg-green-600 hover:bg-green-700") + " mt-4 mb-4"} // Added mb-4 for spacing
              onClick={handleWalletPay}
            >
              {walletBalance < totalAmount ? "Insufficient Wallet Balance" : loading ? "Processing..." : "Pay with Wallet"}
            </button>
            {walletBalance < totalAmount && (
              <div className="text-red-600 font-semibold my-2 text-center">
                Your wallet balance is not enough to complete this purchase.
              </div>
            )}
          </>
        )}

        {/* Show a message if shop purchase but no order context */}
        {isShopPurchase && (!hasOrder) && (
          <div className="text-red-600 font-semibold my-4 text-center">
            Please add items to your cart and proceed through the shop checkout to use wallet payment.
          </div>
        )}

        {/* Card payment section: always show for enrollments/pricing plans, or for shop if order is present */}
        {(isEnrollmentOrPlan || (isShopPurchase && hasOrder)) && (
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
        )}

        {/* Card payment submit (for all except wallet shop) */}
        {((isEnrollmentOrPlan || (isShopPurchase && hasOrder)) && !paymentSuccess) && (
          <button
            type="submit"
            disabled={!stripe || loading}
            className={styles.button}
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        )}

        {message && <p className={styles.error}>{message}</p>}
      </form>
      <Footer_02 />
    </div>
  );
};

export default CheckoutForm;
