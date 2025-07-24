'use client';

import Link from "next/link";
import Navbar from "../../Components/Navbar";
import Footer from "@/Components/Footer_02";
import styles from "@/Components/pricingpage.module.css";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuthUser } from '@/lib/auth';
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

// Add a type for plan features with an index signature
interface PlanFeatureMap {
  [key: string]: string;
}

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
      router.push("/member-system-management/Authform");
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
        router.push(`/fitness-activities-and-orders/checkout?paymentFor=pricing-plan&pricingPlanId=${data.planId}`);
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

  // Feature list and plan mapping
  const allFeatures = [
    { key: "fullDayAccess", label: "Full-day Gym Access" },
    { key: "allEquipment", label: "Use of All Equipment" },
    { key: "bodyAssessments", label: "Body Assessments" },
    { key: "lockerShower", label: "Locker & Shower Facility" },
    { key: "wifi", label: "Free Wi-Fi Access" },
    { key: "totalSessionCombo", label: "Total Session Combo" },
    { key: "groupVirtual", label: "Group Virtual Sessions" },
    { key: "groupPhysical", label: "Group Physical Sessions" },
    { key: "individualVirtual", label: "Individual Virtual Sessions" },
    { key: "personalTraining", label: "Personal Training Sessions" },
    { key: "nutrition", label: "Nutrition Consultation" },
    { key: "physio", label: "Physiotherapy & Recovery" },
    { key: "vipFacilities", label: "VIP Facilities" },
    { key: "merchandise", label: "Free Merchandise" },
    { key: "prioritySupport", label: "Priority Customer Support" },
  ];

  const planFeatures: Record<string, PlanFeatureMap> = {
    Standard: {
      fullDayAccess: "Yes",
      allEquipment: "Yes",
      bodyAssessments: "1/month",
      lockerShower: "Standard",
      wifi: "Yes",
      totalSessionCombo: "4 (2V + 2P)",
      groupVirtual: "2/month",
      groupPhysical: "2/month",
      individualVirtual: "-",
      personalTraining: "-",
      nutrition: "-",
      physio: "-",
      vipFacilities: "-",
      merchandise: "-",
      prioritySupport: "-",
    },
    Popular: {
      fullDayAccess: "Yes",
      allEquipment: "Yes",
      bodyAssessments: "2/month",
      lockerShower: "Priority",
      wifi: "Yes",
      totalSessionCombo: "6 (3V + 3P)",
      groupVirtual: "3/month",
      groupPhysical: "3/month",
      individualVirtual: "-",
      personalTraining: "1/month",
      nutrition: "Monthly",
      physio: "-",
      vipFacilities: "-",
      merchandise: "-",
      prioritySupport: "-",
    },
    Golden: {
      fullDayAccess: "Yes",
      allEquipment: "Yes",
      bodyAssessments: "3/month",
      lockerShower: "VIP",
      wifi: "Yes",
      totalSessionCombo: "8 (4V + 4P + 1IV)",
      groupVirtual: "4/month",
      groupPhysical: "4/month",
      individualVirtual: "1/month",
      personalTraining: "1/month",
      nutrition: "Monthly + Custom Plan",
      physio: "-",
      vipFacilities: "VIP Locker Access",
      merchandise: "-",
      prioritySupport: "-",
    },
    Professional: {
      fullDayAccess: "Yes",
      allEquipment: "Yes",
      bodyAssessments: "4/month",
      lockerShower: "Private",
      wifi: "Yes",
      totalSessionCombo: "12 (4V + 6P + 2IV)",
      groupVirtual: "4/month",
      groupPhysical: "6/month",
      individualVirtual: "2/month",
      personalTraining: "Unlimited",
      nutrition: "Personalized + Ongoing",
      physio: "Weekly",
      vipFacilities: "VIP Lounge, Private Room",
      merchandise: "T-shirt, shaker, towel, etc.",
      prioritySupport: "Yes",
    },
  };

  const isFeatureIncluded = (value: string) => value !== "-" && value !== "";

  // Helper to check if a value is numeric (e.g., '2/month')
  const isNumericFeature = (value: string) => /\d/.test(value);

  // Helper to extract the numeric part for comparison
  const extractNumber = (value: string) => {
    const match = value.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  };

  // Helper to get previous plan name
  const getPreviousPlan = (plan: string) => {
    if (plan === 'Popular') return 'Standard';
    if (plan === 'Golden') return 'Popular';
    if (plan === 'Professional') return 'Golden';
    return null;
  };

  // Helper to determine if a feature value is an increase from the previous plan
  const isIncreaseFromPrevious = (plan: string, featureKey: string) => {
    const prevPlan = getPreviousPlan(plan);
    if (!prevPlan) return false;
    const prevValue = planFeatures[prevPlan][featureKey];
    const currValue = planFeatures[plan][featureKey];
    if (isNumericFeature(prevValue) && isNumericFeature(currValue)) {
      const prevNum = extractNumber(prevValue);
      const currNum = extractNumber(currValue);
      return prevNum !== null && currNum !== null && currNum > prevNum;
    }
    return false;
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
                  {(() => {
                    const features = allFeatures.map((feature) => {
                      const value = planFeatures.Standard[feature.key];
                      const showParens = value !== 'Yes' && value !== 'No' && value !== '-';
                      return { feature, value, showParens };
                    });
                    const included = features.filter(f => isFeatureIncluded(f.value));
                    const excluded = features.filter(f => !isFeatureIncluded(f.value));
                    return [
                      ...included.map(({ feature, value, showParens }) => (
                        <li className={styles.featureItem} key={feature.key}>
                          <FaCheckCircle className={styles.checkmark} />
                          <span className={styles.featureLabel}>{feature.label}</span>
                          {isFeatureIncluded(value) && showParens && (
                            <span className={styles.featureValue}>{`(${value})`}</span>
                          )}
                        </li>
                      )),
                      ...excluded.map(({ feature, value }) => (
                        <li className={styles.featureItem} key={feature.key}>
                          <FaTimesCircle className={styles.cross} />
                          <span className={styles.featureLabel}>{feature.label}</span>
                        </li>
                      ))
                    ];
                  })()}
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
                  {(() => {
                    const features = allFeatures.map((feature) => {
                      const value = planFeatures.Popular[feature.key];
                      const showParens = value !== 'Yes' && value !== 'No' && value !== '-';
                      return { feature, value, showParens };
                    });
                    const included = features.filter(f => isFeatureIncluded(f.value));
                    const excluded = features.filter(f => !isFeatureIncluded(f.value));
                    return [
                      ...included.map(({ feature, value, showParens }) => (
                        <li className={styles.featureItem} key={feature.key}>
                          <FaCheckCircle className={styles.checkmark} />
                          <span className={styles.featureLabel}>{feature.label}</span>
                          {isFeatureIncluded(value) && showParens && (
                            <span className={styles.featureValue}>{`(${value})`}</span>
                          )}
                        </li>
                      )),
                      ...excluded.map(({ feature, value }) => (
                        <li className={styles.featureItem} key={feature.key}>
                          <FaTimesCircle className={styles.cross} />
                          <span className={styles.featureLabel}>{feature.label}</span>
                        </li>
                      ))
                    ];
                  })()}
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
                  {(() => {
                    const features = allFeatures.map((feature) => {
                      const value = planFeatures.Golden[feature.key];
                      const showParens = value !== 'Yes' && value !== 'No' && value !== '-';
                      return { feature, value, showParens };
                    });
                    const included = features.filter(f => isFeatureIncluded(f.value));
                    const excluded = features.filter(f => !isFeatureIncluded(f.value));
                    return [
                      ...included.map(({ feature, value, showParens }) => (
                        <li className={styles.featureItem} key={feature.key}>
                          <FaCheckCircle className={styles.checkmark} />
                          <span className={styles.featureLabel}>{feature.label}</span>
                          {isFeatureIncluded(value) && showParens && (
                            <span className={styles.featureValue}>{`(${value})`}</span>
                          )}
                        </li>
                      )),
                      ...excluded.map(({ feature, value }) => (
                        <li className={styles.featureItem} key={feature.key}>
                          <FaTimesCircle className={styles.cross} />
                          <span className={styles.featureLabel}>{feature.label}</span>
                        </li>
                      ))
                    ];
                  })()}
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
                  {(() => {
                    const features = allFeatures.map((feature) => {
                      const value = planFeatures.Professional[feature.key];
                      const showParens = value !== 'Yes' && value !== 'No' && value !== '-';
                      return { feature, value, showParens };
                    });
                    const included = features.filter(f => isFeatureIncluded(f.value));
                    const excluded = features.filter(f => !isFeatureIncluded(f.value));
                    return [
                      ...included.map(({ feature, value, showParens }) => (
                        <li className={styles.featureItem} key={feature.key}>
                          <FaCheckCircle className={styles.checkmark} />
                          <span className={styles.featureLabel}>{feature.label}</span>
                          {isFeatureIncluded(value) && showParens && (
                            <span className={styles.featureValue}>{`(${value})`}</span>
                          )}
                        </li>
                      )),
                      ...excluded.map(({ feature, value }) => (
                        <li className={styles.featureItem} key={feature.key}>
                          <FaTimesCircle className={styles.cross} />
                          <span className={styles.featureLabel}>{feature.label}</span>
                        </li>
                      ))
                    ];
                  })()}
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
          <Link href="/communication-and-notifications/Contact_Page" className={styles.contactButton}>
            Contact Us
          </Link>
        </section>
      </div>

      <Footer />
    </>
  );
}
