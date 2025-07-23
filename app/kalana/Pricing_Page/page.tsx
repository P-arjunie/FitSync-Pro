'use client';

import Link from "next/link";
import Navbar from "../../Components/Navbar";
import Footer from "@/Components/Footer_02";
import styles from "@/Components/pricingpage.module.css";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuthUser } from '@/lib/auth';

export default function PricingPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState(getAuthUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const user = getAuthUser();
      setAuthUser(user);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const priceMap: Record<string, string> = {
    Standard: "price_1Rl5CZ06dhrOhRKFNIRfbdY5",
    Popular: "price_1Rl5Er06dhrOhRKFnptOwuQR",
    Golden: "price_1Rl5GI06dhrOhRKFCjHsJuXQ",
    Professional: "price_1Rl40106dhrOhRKFEAb72IQ0",
  };

  const priceIdMap: Record<string, string> = {
    Standard: "price_1Rl5CZ06dhrOhRKFNIRfbdY5",
    Popular: "price_1Rl5Er06dhrOhRKFnptOwuQR",
    Golden: "price_1Rl5GI06dhrOhRKFCjHsJuXQ",
    Professional: "price_1Rl40106dhrOhRKFEAb72IQ0",
  };

  const handleSelectPlan = async (planName: string, amount: number) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.push("/user-system-management/Authform");
      return;
    }

    try {
      const priceId = priceIdMap[planName];
      const res = await fetch("/api/pricing-plan-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planName, amount, priceId }),
      });

      const data = await res.json();

      if (res.ok && data.planId) {
        router.push(`/kalana/checkout?paymentFor=pricing-plan&pricingPlanId=${data.planId}`);
      } else {
        if (data.error && data.error.includes('active subscription plan')) {
          alert(data.error);
        } else if (data.error) {
          alert(data.error);
        } else {
          alert("Failed to start payment. Try again.");
        }
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.pageWrapper}>
        <h1 className={styles.pageTitle}>Fitness Pricing Plans</h1>

        <section className={styles.pricingSection}>
          <div className={styles.pricingChart}>
            {/* Standard Plan */}
            <div className={styles.pricingCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Standard</h3>
                <div className={styles.cardPrice}>
                  <span className={styles.currency}>$</span>
                  <span className={styles.amount}>15</span>
                  <span className={styles.period}>/month</span>
                </div>
              </div>
              <div className={styles.cardBody}>
                <ul className={styles.cardFeatures}>
                  <li className={styles.featureItem}>✓ Training Overview</li>
                  <li className={styles.featureItem}>✗ Beginner Classes</li>
                  <li className={styles.featureItem}>✗ Personal Training</li>
                  <li className={styles.featureItem}>✗ Olympic Weightlifting</li>
                  <li className={styles.featureItem}>✗ Foundation Training</li>
                </ul>
                <button 
                  className={styles.purchaseButton} 
                  onClick={() => handleSelectPlan("Standard", 15)}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : authUser ? "Select Plan" : "Login to Subscribe"}
                </button>
              </div>
            </div>

            {/* Popular Plan */}
            <div className={styles.pricingCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Popular</h3>
                <div className={styles.cardPrice}>
                  <span className={styles.currency}>$</span>
                  <span className={styles.amount}>20</span>
                  <span className={styles.period}>/month</span>
                </div>
              </div>
              <div className={styles.cardBody}>
                <ul className={styles.cardFeatures}>
                  <li className={styles.featureItem}>✓ Training Overview</li>
                  <li className={styles.featureItem}>✓ Beginner Classes</li>
                  <li className={styles.featureItem}>✗ Personal Training</li>
                  <li className={styles.featureItem}>✗ Olympic Weightlifting</li>
                  <li className={styles.featureItem}>✗ Foundation Training</li>
                </ul>
                <button 
                  className={styles.purchaseButton} 
                  onClick={() => handleSelectPlan("Popular", 20)}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : authUser ? "Select Plan" : "Login to Subscribe"}
                </button>
              </div>
            </div>

            {/* Golden Plan */}
            <div className={styles.pricingCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Golden</h3>
                <div className={styles.cardPrice}>
                  <span className={styles.currency}>$</span>
                  <span className={styles.amount}>35</span>
                  <span className={styles.period}>/month</span>
                </div>
              </div>
              <div className={styles.cardBody}>
                <ul className={styles.cardFeatures}>
                  <li className={styles.featureItem}>✓ Training Overview</li>
                  <li className={styles.featureItem}>✓ Beginner Classes</li>
                  <li className={styles.featureItem}>✓ Personal Training</li>
                  <li className={styles.featureItem}>✓ Olympic Weightlifting</li>
                  <li className={styles.featureItem}>✗ Foundation Training</li>
                </ul>
                <button 
                  className={styles.purchaseButton} 
                  onClick={() => handleSelectPlan("Golden", 35)}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : authUser ? "Select Plan" : "Login to Subscribe"}
                </button>
              </div>
            </div>

            {/* Professional Plan */}
            <div className={styles.pricingCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Professional</h3>
                <div className={styles.cardPrice}>
                  <span className={styles.currency}>$</span>
                  <span className={styles.amount}>50</span>
                  <span className={styles.period}>/month</span>
                </div>
              </div>
              <div className={styles.cardBody}>
                <ul className={styles.cardFeatures}>
                  <li className={styles.featureItem}>✓ Training Overview</li>
                  <li className={styles.featureItem}>✓ Beginner Classes</li>
                  <li className={styles.featureItem}>✓ Personal Training</li>
                  <li className={styles.featureItem}>✓ Olympic Weightlifting</li>
                  <li className={styles.featureItem}>✓ Foundation Training</li>
                </ul>
                <button 
                  className={styles.purchaseButton} 
                  onClick={() => handleSelectPlan("Professional", 50)}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : authUser ? "Select Plan" : "Login to Subscribe"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.discountSection}>
          <h2 className={styles.discountTitle}>Summer Fitness Program</h2>
          <p className={styles.discountText}>
            Receive a <strong>45% Discount</strong> on all membership plans during our exclusive summer promotion.
          </p>
          <Link href="/hasini/Contact_Page" className={styles.contactButton}>
            Contact Us
          </Link>
        </section>
      </div>

      <Footer />
    </>
  );
}
