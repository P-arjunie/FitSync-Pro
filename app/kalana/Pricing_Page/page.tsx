/* Pricing page */
// app/kalana/Pricing_Page/page.tsx

import Navbar from "../../Components/navbar"; // Adjust if Navbar is in a different folder
import Footer from "@/Components/Footer_02";  
import styles from "@/Components/pricingpage.module.css";

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <div className={styles.pageWrapper}>
        <h1 className={styles.pageTitle}>FitSyncPro - Pricing Page</h1>
        <section className={styles.pricingSection}>
          <h2 className={styles.pricingTitle}>Exclusive Pricing Plan</h2>
          <p className={styles.pricingDescription}>
            FitSyncPro - Where Strength Meets Innovation <br />
            Forging a path in fitness, FitSyncPro is dedicated to transforming lives through strength, endurance, and cutting-edge training.
          </p>

          <div className={styles.pricingChart}>
            <div className={styles.pricingCard}>
              <h3 className={styles.cardTitle}>Beginners</h3>
              <p className={styles.cardPrice}>$10 per month</p>
              <ul className={styles.cardFeatures}>
                <li>Free Hand</li>
                <li>Gym Fitness</li>
                <li>Weight Loss</li>
                <li>Cycling</li>
              </ul>
              <button className={styles.purchaseButton}>Purchase Now</button>
            </div>

            <div className={styles.pricingCard}>
              <h3 className={styles.cardTitle}>Basic</h3>
              <p className={styles.cardPrice}>$15 per month</p>
              <ul className={styles.cardFeatures}>
                <li>Free Hand</li>
                <li>Gym Fitness</li>
                <li>Weight Loss</li>
                <li>Personal Trainer</li>
                <li>Cycling</li>
                <li>Diet Plan</li>
              </ul>
              <button className={styles.purchaseButton}>Purchase Now</button>
            </div>

            <div className={styles.pricingCard}>
              <h3 className={styles.cardTitle}>Advanced</h3>
              <p className={styles.cardPrice}>$25 per month</p>
              <ul className={styles.cardFeatures}>
                <li>Free Hand</li>
                <li>Gym Fitness</li>
                <li>Weight Loss</li>
                <li>Personal Trainer</li>
                <li>Cycling</li>
                <li>Diet Plan</li>
                <li>Sport Measure</li>
              </ul>
              <button className={styles.purchaseButton}>Purchase Now</button>
            </div>
          </div>
        </section>

        <section className={styles.discountSection}>
          <h2 className={styles.discountTitle}>FITNESS CLASSES THIS SUMMER</h2>
          <p className={styles.discountText}>Get <strong>45% Discount</strong></p>
          <button className={styles.contactButton}>Contact Us</button>
        </section>
      </div>

      <Footer />
    </>
  );
}
