// app/pasindi/checkout/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useShoppingCartStore } from '../ShoppingCart/page';

import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/Components/ui/button';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useShoppingCartStore();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  type OrderDetails = {
    orderNumber: string;
    totalAmount: number;
    status: string;
  };
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [userId, setUserId] = useState("");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    // Get userId from localStorage when component mounts
    const id = localStorage.getItem("userId");
    if (id) setUserId(id);
    
    // Redirect if cart is empty
    if (items.length === 0 && !success) {
      router.push('/pasindi/cart');
    }
  }, [items.length, router, success]);

  const handleCheckout = async () => {
    if (!userId) {
      setError("Please log in to complete your purchase");
      return;
    }
    
    setProcessing(true);
    setError("");
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          items,
          totalAmount: getCartTotal()
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setOrderDetails(data.order);
        setOrderId(data.order._id);
        clearCart(); // Clear cart after successful order
      } else {
        setError(data.error || 'Something went wrong processing your order');
      }
    } catch (err) {
      setError('Network error, please try again');
      console.error('Checkout error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleProceedToPayment = () => {
    if (orderId) {
      window.location.href = `/kalana/checkout?orderId=${orderId}`;
    }
  };

  // Only render after client-side hydration
  if (typeof window === "undefined" || !userId) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {success ? (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <CheckCircle2 size={80} className="mx-auto mb-6 text-green-500" />
            <h1 className="text-3xl font-semibold text-gray-800 mb-6">Order Confirmed!</h1>
            <p className="text-gray-600 mb-2">Your order #{orderDetails?.orderNumber} has been placed successfully.</p>
            <p className="text-gray-600 mb-6">We&#39;ve sent the confirmation to your email.</p>
            
            <div className="bg-gray-50 p-6 rounded-md mb-8">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-semibold">{orderDetails?.orderNumber}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold">${orderDetails?.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold capitalize">{orderDetails?.status}</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleProceedToPayment}
                className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Proceed to Payment
              </button>
              <Link href="/pasindi/my-orders">
                <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  View All Orders
                </button>
              </Link>
              <Link href="/products">
                <button className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Continue Shopping
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-800">Checkout</h1>
                <Link href="/cart">
                  <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
                    <ArrowLeft size={20} />
                    Back to Cart
                  </button>
                </Link>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item._id} className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="bg-gray-100 text-gray-800 font-semibold w-8 h-8 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                      <span className="text-gray-800">{item.title}</span>
                    </div>
                    <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between text-xl font-semibold">
                  <span>Total</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="p-4 bg-red-50 flex items-center gap-2 text-red-700">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}
            
            {/* Payment section - Simplified for this example */}
            <div className="p-6">
              {/* <h2 className="text-xl font-semibold mb-4">Payment</h2> */}
              {/* <p className="text-gray-600 mb-6">
                For this demo, we&#39;ll simulate the payment process. Click the button below to place your order.
              </p> */}
              <Button
                onClick={handleCheckout}
                disabled={processing || items.length === 0}
                className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Place Order'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}