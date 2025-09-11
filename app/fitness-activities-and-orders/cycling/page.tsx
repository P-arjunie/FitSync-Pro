'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/Components/Navbar';
import Footer1 from '@/Components/Footer_01';
import { getAuthUser } from '@/lib/auth';
//import { createSubscription, redirectToSubscriptionCheckout } from '@/lib/subscription';

const CyclingClassPage = () => {
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

  const goBackToClasses = () => {
    router.push('/#featured-classes');
  };

  const enrollNow = async () => {
    if (!authUser) {
      router.push("/member-system-management/Authform");
      return;
    }

    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authUser.userId,
          className: "cycling", 
          totalAmount: 10, 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("🔴 Server responded with error:", data);
        if (data.error && data.error.includes('engaged in 2 classes')) {
          alert('You are already engaged in 2 classes. Please refund one to continue.');
          return;
        }
        if (data.error && data.error.includes('already enrolled in this class')) {
          alert('You are already enrolled in this class. Please refund to enroll again.');
          return;
        }
        throw new Error(data.error || "Failed to create enrollment");
      }

      router.push(`/fitness-activities-and-orders/checkout?enrollmentId=${data._id}`);
    } catch (error) {
      console.error("Enrollment creation failed", error);
      alert("Could not create enrollment, please try again.");
    }
  };


  return (
    <>
      <Navbar />

      <header className="header">
        <div className="container">
          <button onClick={goBackToClasses} className="back-btn" type="button">
            ← Back to Classes
          </button>
          <h1 className="class-title">CYCLING</h1>
          <p className="class-subtitle">High-Energy Indoor Cycling Experience</p>
        </div>
      </header>

      <main className="container">
        <div className="main-content">
          <div className="class-image-section">
            <Image
              src="/cycling.png"
              alt="Cycling Class"
              className="class-hero-image"
              width={1000}
              height={500}
            />
            <div className="image-overlay">
              <h3>Next Session</h3>
              <div className="schedule-badge">Monday | 7:00 AM</div>
            </div>
          </div>

          <div className="class-details">
            <div className="details-section">
              <h2 className="section-title">About This Class</h2>
              <p className="description">
                Experience the ultimate cardiovascular workout with our high-energy cycling
                classes. Led by certified instructors, these sessions combine motivating music,
                challenging intervals, and immersive lighting to create an unforgettable fitness
                experience.
              </p>
            </div>

            <div className="details-section">
              <h2 className="section-title">Class Benefits</h2>
              <ul className="benefits-list">
                <li>Burns 400-600 calories per session</li>
                <li>Improves cardiovascular endurance</li>
                <li>Low-impact, joint-friendly workout</li>
                <li>Builds leg strength and power</li>
                <li>Boosts mental health and mood</li>
                <li>Group motivation and energy</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="class-info">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Duration</div>
              <div className="info-value">45 Minutes</div>
            </div>
            <div className="info-item">
              <div className="info-label">Intensity</div>
              <div className="info-value">High</div>
            </div>
            <div className="info-item">
              <div className="info-label">Equipment</div>
              <div className="info-value">Provided</div>
            </div>
            <div className="info-item">
              <div className="info-label">Max Capacity</div>
              <div className="info-value">20 People</div>
            </div>
          </div>
        </div>

        <div className="enrollment-section">
          <div className="price-tag">$10</div>
          <div className="price-period">per month</div>
          <button 
            className="enroll-btn" 
            onClick={enrollNow}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : authUser ? "Enroll Now" : "Login to Enroll"}
          </button>
                      <div className="enrollment-benefits">
              <h4>What&apos;s Included:</h4>
              <ul>
                <li>Unlimited monthly cycling classes</li>
                <li>Professional instruction</li>
                <li>All equipment provided</li>
                <li>Locker room access</li>
                <li>Progress tracking</li>

              </ul>
            </div>
        </div>
      </main>

      <Footer1 />

      {/* Global Styles */}
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

      {/* Component Styles */}
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
          top: 0; left: 0; right: 0; bottom: 0;
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
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
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
          background: linear-gradient(transparent, rgba(0,0,0,0.8));
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
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .enroll-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
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

export default CyclingClassPage;
