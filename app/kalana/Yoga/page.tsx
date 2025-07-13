'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/Components/Navbar';
import Footer1 from '@/Components/Footer_01';

const YogaClassPage = () => {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem('userId'));
  }, []);

  const goBackToClasses = () => {
    router.push('/#featured-classes');
  };

  const enrollNow = async () => {
    if (!userId) {
      router.push('/lithira/Authform');
      return;
    }

    // No enrollment needed – just go to checkout
    router.push('/kalana/checkout');
  };

  return (
    <>
      <Navbar />

      <div className="header">
        <div className="container">
          <button className="back-btn" onClick={goBackToClasses}>← Back to Classes</button>
          <h1 className="class-title">Yoga Class</h1>
          <p className="class-subtitle">Find your balance, strength and inner peace</p>
        </div>
      </div>

      <div className="container main-content">
        <div className="class-image-section">
          <Image
            src="/images/yoga-banner.jpg"
            alt="Yoga Class"
            width={800}
            height={500}
            className="class-hero-image"
          />
          <div className="image-overlay">
            <span className="schedule-badge">Every Monday, 6 PM</span>
          </div>
        </div>

        <div className="class-details">
          <div className="details-section">
            <h2 className="section-title">What You'll Learn</h2>
            <p className="description">
              This yoga class focuses on improving flexibility, building strength, and achieving mindfulness.
              Whether you're a beginner or seasoned yogi, our instructor will guide you through postures that suit your level.
            </p>
            <ul className="benefits-list">
              <li>Stress relief</li>
              <li>Improved flexibility</li>
              <li>Core strength</li>
              <li>Mindful breathing</li>
            </ul>
          </div>

          <div className="class-info">
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Duration</div>
                <div className="info-value">1 Hour</div>
              </div>
              <div className="info-item">
                <div className="info-label">Instructor</div>
                <div className="info-value">Kalani Perera</div>
              </div>
              <div className="info-item">
                <div className="info-label">Level</div>
                <div className="info-value">All Levels</div>
              </div>
              <div className="info-item">
                <div className="info-label">Language</div>
                <div className="info-value">English</div>
              </div>
            </div>
          </div>

          <div className="enrollment-section">
            <div className="price-tag">LKR 2,000</div>
            <div className="price-period">One-time Payment</div>
            <button className="enroll-btn" onClick={enrollNow}>Enroll Now</button>
            <div className="enrollment-benefits">
              <ul>
                <li>Instant Access</li>
                <li>Certified Trainer</li>
                <li>7 Days Refund Policy</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer1 />

      {/* GLOBAL STYLES */}
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Arial', sans-serif;
          background-color: #000;
          color: #fff;
          line-height: 1.6;
        }
        button {
          font-family: inherit;
        }
      `}</style>

      {/* PAGE-SPECIFIC STYLES */}
      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .header {
          background: linear-gradient(135deg, #000 0%, #333 100%);
          padding: 20px 0;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(220, 20, 60, 0.1) 0%, transparent 50%);
        }
        .header > .container {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .back-btn {
          align-self: flex-start;
          padding: 10px 20px;
          background: #dc143c;
          color: #fff;
          border: 2px solid #dc143c;
          border-radius: 5px;
          cursor: pointer;
          margin-bottom: 20px;
          transition: all 0.3s ease;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .back-btn:hover {
          background: transparent;
          color: #dc143c;
          transform: translateY(-2px);
        }
        .class-title {
          font-size: 3.5rem;
          font-weight: bold;
          color: #dc143c;
          text-align: center;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
        .class-subtitle {
          font-size: 1.5rem;
          text-align: center;
          color: #ccc;
          margin-bottom: 30px;
        }
        .main-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          padding: 60px 0;
        }
        .class-image-section {
          position: relative;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(220, 20, 60, 0.3);
        }
        .class-hero-image {
          width: 100%;
          height: 500px;
          object-fit: cover;
          border-radius: 15px;
        }
        .image-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
          padding: 30px;
          color: #fff;
        }
        .schedule-badge {
          background: #dc143c;
          color: #fff;
          padding: 12px 24px;
          border-radius: 25px;
          font-weight: bold;
          font-size: 1.1rem;
          display: inline-block;
          margin-top: 15px;
        }
        .class-details {
          padding: 20px;
        }
        .details-section {
          margin-bottom: 40px;
        }
        .section-title {
          font-size: 2rem;
          color: #dc143c;
          margin-bottom: 20px;
          border-bottom: 2px solid #dc143c;
          padding-bottom: 10px;
        }
        .description {
          font-size: 1.1rem;
          line-height: 1.8;
          color: #ddd;
          margin-bottom: 25px;
        }
        .benefits-list {
          list-style: none;
          padding: 0;
        }
        .benefits-list li {
          padding: 10px 0;
          border-bottom: 1px solid #333;
          color: #ccc;
          position: relative;
          padding-left: 30px;
        }
        .benefits-list li::before {
          content: '✓';
          color: #dc143c;
          font-weight: bold;
          position: absolute;
          left: 0;
          font-size: 1.2rem;
        }
        .class-info {
          background: linear-gradient(135deg, #111 0%, #222 100%);
          padding: 30px;
          border-radius: 15px;
          margin: 30px 0;
          border: 2px solid #333;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .info-item {
          text-align: center;
          padding: 20px;
          background: #000;
          border-radius: 10px;
          border: 1px solid #dc143c;
        }
        .info-label {
          color: #dc143c;
          font-weight: bold;
          font-size: 0.9rem;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .info-value {
          font-size: 1.3rem;
          color: #fff;
          font-weight: bold;
        }
        .enrollment-section {
          background: linear-gradient(135deg, #dc143c 0%, #a0102a 100%);
          padding: 50px;
          border-radius: 20px;
          text-align: center;
          margin: 40px 0;
          box-shadow: 0 15px 40px rgba(220, 20, 60, 0.4);
        }
        .price-tag {
          font-size: 3rem;
          font-weight: bold;
          color: #fff;
          margin-bottom: 10px;
        }
        .price-period {
          font-size: 1.2rem;
          color: #ffcccb;
          margin-bottom: 30px;
        }
        .enroll-btn {
          background: #fff;
          color: #dc143c;
          border: none;
          padding: 20px 50px;
          font-size: 1.3rem;
          font-weight: bold;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        .enroll-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          background: #f0f0f0;
        }
        .enrollment-benefits {
          margin-top: 30px;
          color: #ffcccb;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        .enrollment-benefits ul {
          list-style: none;
          padding: 0;
        }
        .enrollment-benefits li {
          margin: 10px 0;
          font-size: 1.1rem;
        }
        .enrollment-benefits li::before {
          content: '★';
          color: #fff;
          margin-right: 10px;
        }
        @media (max-width: 768px) {
          .main-content {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          .class-title {
            font-size: 2.5rem;
          }
          .info-grid {
            grid-template-columns: 1fr;
          }
          .enrollment-section {
            padding: 30px 20px;
          }
          .price-tag {
            font-size: 2rem;
          }
        }
      `}</style>
    </>
  );
};

export default YogaClassPage;
