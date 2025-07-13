import { useEffect, useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { StripeCardElement } from '@stripe/stripe-js';
import styles from './checkoutform.module.css';

interface OrderItem {
  title: string;
  price: number;
  quantity: number;
}

interface CheckoutFormProps {
  userId: string;
  orderItems?: OrderItem[];
  totalAmount?: number;
  enrollmentData?: { _id: string; className: string; totalAmount: number };
  orderId?: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  userId,
  orderItems: orderItemsProp,
  totalAmount: totalAmountProp,
  enrollmentData,
  orderId,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  /* ---------- Load summary ---------- */
  useEffect(() => {
    if (orderItemsProp && totalAmountProp !== undefined) {
      setOrderItems(orderItemsProp);
      setTotalAmount(totalAmountProp);
      return;
    }

    if (enrollmentData) {
      setOrderItems([
        { title: enrollmentData.className, price: enrollmentData.totalAmount, quantity: 1 }
      ]);
      setTotalAmount(enrollmentData.totalAmount);
      return;
    }

    // Fallback: dummy data if nothing else
    setOrderItems([{ title: 'Dummy Plan', price: 10, quantity: 1 }]);
    setTotalAmount(10);
  }, [orderItemsProp, totalAmountProp, enrollmentData]);

  /* ---------- Submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setMessage('');

    const card = elements.getElement(CardElement) as StripeCardElement | null;
    if (!card) {
      setMessage('Card element not found.');
      setLoading(false);
      return;
    }

    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card
    });
    if (error || !paymentMethod) {
      setMessage(error?.message || 'Payment method creation failed.');
      setLoading(false);
      return;
    }

    const paymentFor = enrollmentData ? 'enrollment' : 'order';

    const body: any = {
      paymentMethodId: paymentMethod.id,
      userId,
      paymentFor,
    };

    if (paymentFor === 'enrollment' && enrollmentData?._id) {
      body.enrollmentId = enrollmentData._id;
    } else if (paymentFor === 'order' && orderId) {
      body.orderId = orderId;
    }

    const res = await fetch('/api/payment_intents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    setMessage(data.success ? '✅ Payment succeeded!' : `❌ Payment failed: ${data.error}`);
    setLoading(false);
  };

  /* ---------- UI ---------- */
  return (
    <div className={styles.pageWrapper}>
      <form onSubmit={handleSubmit} className={styles.container}>
        <h2 className={styles.title}>Checkout Summary</h2>

        {orderItems.map((item, i) => (
          <div key={i} className={styles.card}>
            <p><strong>{item.title}</strong></p>
            <p>Qty: {item.quantity}</p>
            <p>Price: ${item.price}</p>
          </div>
        ))}
        <div className={styles.card}><strong>Total: ${totalAmount}</strong></div>

        <CardElement className={styles.card} />

        <button type="submit" disabled={!stripe || loading} className={styles.button}>
          {loading ? 'Processing…' : 'Pay Now'}
        </button>

        {message && <p className={styles.error}>{message}</p>}
      </form>
    </div>
  );
};

export default CheckoutForm;
