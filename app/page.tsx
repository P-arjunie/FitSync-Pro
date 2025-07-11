"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './Components/HomePage.css';
import Navbar from './Components/Navbar';
import Footer1 from './Components/Footer_01';
import GaugeChart from 'react-gauge-chart';
import StripeProvider from "./Components/StripeProvider";
{/*import CheckoutForm from "./Components/CheckoutForm"; */}

interface UserInfo {
  role: string;
  email: string;
  name: string;
  userId: string;
}

const HomePage: React.FC = () => {
  const router = useRouter();
  
  // Authentication state
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // BMI State hooks
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const userRole = localStorage.getItem("userRole");
        const userEmail = localStorage.getItem("userEmail");
        const userName = localStorage.getItem("userName");
        const userId = localStorage.getItem("userId");

        if (userRole && userEmail && userName && userId) {
          setUser({
            role: userRole,
            email: userEmail,
            name: userName,
            userId: userId
          });
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Navigation handlers
  const handleAuthNavigation = () => {
    router.push('/lithira/Authform');
  };

  const handleAdminUserManagement = () => {
    router.push('/lithira/adminUserManagement');
  };

  const handleUserInfo = () => {
    router.push('/lithira/userinfo');
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    setUser(null);
    router.push('/');
  };

  // BMI Calculation function
  const calculateBMI = () => {
    if (!weight || !height) {
      setMessage("Please enter both weight and height");
      setBmi(null);
      return;
    }

    const weightNum = parseFloat(weight);
    const heightMeters = parseFloat(height) / 100; // convert cm to meters

    if (isNaN(weightNum) || isNaN(heightMeters) || heightMeters === 0) {
      setMessage("Invalid input");
      setBmi(null);
      return;
    }

    const bmiValue = weightNum / (heightMeters * heightMeters);
    const roundedBMI = parseFloat(bmiValue.toFixed(2));
    setBmi(roundedBMI);

    if (bmiValue < 18.5) {
      setMessage("Underweight");
    } else if (bmiValue < 25) {
      setMessage("Normal weight");
    } else if (bmiValue < 30) {
      setMessage("Overweight");
    } else if (bmiValue < 35) {
      setMessage("Obese");
    } else {
      setMessage("Severely Obese");
    }
  };

  // Define gauge arcs
  const range = 40 - 15; // 25
  const arcsLength = [
    (18.5 - 15) / range,   // Underweight
    (25 - 18.5) / range,   // Normal
    (30 - 25) / range,     // Overweight
    (35 - 30) / range,     // Obese
    (40 - 35) / range      // Severely Obese
  ];

  //Animations and transitions for cards 
  useEffect(() => {
    const cards = document.querySelectorAll(".progression-card, .workout-card, .nutrition-card");

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const card = entry.target as HTMLElement;
            card.classList.add("animate-in");

            // Add animate-in to children inside the card
            const icon = card.querySelector(".icon-image");
            const title = card.querySelector(".card-title");
            const text = card.querySelector(".card-text");
            const btn = card.querySelector(".read-more-button");

            if (icon) icon.classList.add("animate-in");
            if (title) title.classList.add("animate-in");
            if (text) text.classList.add("animate-in");
            if (btn) btn.classList.add("animate-in");

            obs.unobserve(card);
          }
        });
      },
      { threshold: 0.1 }
    );

    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  // In the HomePage component, update the renderHeroButtons function:
const renderHeroButtons = () => {
  if (isLoading) {
    return (
      <div className="hero-button-container">
        <button className="button" disabled>Loading...</button>
      </div>
    );
  }

  if (user) {
    // User is authenticated
    if (user.role === 'admin') {
      // Admin user - show admin management buttons
      return (
        <div className="hero-button-container">
          <button className="button" onClick={handleAdminUserManagement}>
            Manage Members
          </button>
          <button className="button" onClick={handleUserInfo}>
            Manage New Users
          </button>
          <button className="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      );
    } else {
      // Regular user (member/trainer) - show user-specific options
      return (
        <div className="hero-button-container">
          <button 
            className="button" 
            onClick={() => {
              if (user.role === 'member') {
                router.push('/lithira/MemberProfilePage');
              } else if (user.role === 'trainer') {
                router.push('/lithira/TrainerProfilePage');
              }
            }}
          >
            Profile
          </button>
          <button className="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      );
    }
  } else {
    // Not authenticated - show original buttons
    return (
      <div className="hero-button-container">
        <button className="button" onClick={handleAuthNavigation}>
          Log In
        </button>
        <button className="button" onClick={handleAuthNavigation}>
          Sign Up
        </button>
      </div>
    );
  }
};
  return (
    <div className="pagecontainer">
      <Navbar />
      
      {/* Main Content Section */}
      <main className="main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-text">
            <h1 className="hero-title">MAKE YOUR BODY STRONG WITH FITSYNC PRO</h1>
            <p className="hero-description">
              Your all-in-one fitness platform. Book trainers, track workouts, and stay on top of your fitness goals all in one place. Start your journey to a healthier you with FitSync Pro today!
            </p>
            {renderHeroButtons()}
            {/* Show welcome message for authenticated users */}
            {user && (
              <div className="welcome-message" style={{ marginTop: '20px', color: '#ff4444' }}>
                <p>Welcome back, {user.name}! </p>
              </div>
            )}
          </div>
          <div className="hero-image">
            <img src="/bodybuilder.jpg" alt="Fitness" className="hero-image-style" />
          </div>
        </section>

        {/* Progression, Workout, Nutrition Section */}
        <section className="three-card-section">
          <div className="progression-card hidden-left" style={{ transitionDelay: "0s" }}>
            <img src="/progressionicon.png" alt="Progression" className="icon-image" />
            <p className="card-title">Progression</p>
            <p className="card-text">Tracking your progress is key to reaching your fitness goals. Whether you're building strength, losing weight, or improving endurance, seeing measurable progress keeps you motivated and focused on your journey. Celebrate each milestone along the way!</p>
          </div>
          <div className="workout-card hidden-left" style={{ transitionDelay: "0.2s" }}>
            <img src="/workouticon.png" alt="Workout" className="icon-image" />
            <p className="card-title">Workout</p>
            <p className="card-text">Our expertly designed workouts are tailored to meet your specific fitness level and goals. Whether you're a beginner or an advanced athlete, we provide diverse routines that target all aspects of fitness, from strength training to cardiovascular endurance.</p>
          </div>
          <div className="nutrition-card hidden-left" style={{ transitionDelay: "0.4s" }}>
            <img src="/nutritionicon.png" alt="Nutrition" className="icon-image" />
            <p className="card-title">Nutrition</p>
            <p className="card-text">Nutrition plays a crucial role in your fitness success. We offer personalized meal plans that help you fuel your body for maximum performance. Learn how to nourish your body with the right balance of protein, carbohydrates, and healthy fats to support muscle growth and recovery.</p>
            <button className="read-more-button">Read More</button>
          </div>
        </section>

        {/* Who We Are Section */}
        <section className="who-we-are">
          <div className="who-we-are-container">
            <div className="who-we-are-text">
              <h1 className="red-titles">WHO WE ARE</h1>
              <h2 className="section-title">Take Your Health And Body To Next Level</h2>
              <p className="description-text">
                At FitSync Pro, we combine modern technology with expert training to help you achieve your fitness goals faster.
                With access to professional trainers, state-of-the-art equipment, and dedicated bodybuilding machines, you get
                everything you need for a powerful transformation.
              </p>

              {/* Icon Box Section */}
              <div className="icon-box">
                <div className="icon-item">
                  <img src="/trainericon.png" alt="Professional Trainers" className="icon-image2" />
                  <p className="icon-text">Professional Trainers</p>
                </div>
                <div className="icon-divider" />
                <div className="icon-item">
                  <img src="/equipmenticon.png" alt="Modern Equipment" className="icon-image2" />
                  <p className="icon-text">Modern Equipment</p>
                </div>
                <div className="icon-divider" />
                <div className="icon-item">
                  <img src="/machineicon.png" alt="Body Building Machine" className="icon-image2" />
                  <p className="icon-text">Body Building</p>
                </div>
              </div>
            </div>

            <div className="who-we-are-image">
              <img src="/whowearecoach.png" alt="Coach" className="bodybuilder-image" />
            </div>
          </div>
        </section>

        {/* Featured Classes Section */}
        <section id="featured-classes"className="featured-classes">
          <h1 className="red-titles2">OUR FEATURED CLASSES</h1>
          <h2 className="section-title2">We Are Offering Best Flexible Classes</h2>

          <div className="class-items">
            <div className="class-item">
              <div className="class-overlay">
                <img src="/cycling.png" alt="Cycling" className="class-image" />
                <div className="overlay-content">
                  <p className="class-text" >Cycling</p>
                  <button className="date-button" onClick={() => router.push('/kalana/Cycling')}>Monday | 7:00 AM</button>
                </div>
              </div>
              <p className="class-name">Cycling</p>
            </div>

            <div className="class-item">
              <div className="class-overlay">
                <img src="/workout2.jpg" alt="Workout" className="class-image" />
                <div className="overlay-content">
                  <p className="class-text">Workout</p>
                  <button className="date-button" onClick={() => router.push('/kalana/Workout')}>Tuesday | 6:00 PM</button>
                </div>
              </div>
              <p className="class-name">Workout</p>
            </div>

            <div className="class-item">
              <div className="class-overlay">
                <img src="/powerlifting.jpg" alt="Power Lifting" className="class-image" />
                <div className="overlay-content">
                  <p className="class-text">Power Lifting</p>
                  <button className="date-button" onClick={() => router.push('/kalana/Power_Lifting')}>Wednesday | 8:00 PM</button>
                </div>
              </div>
              <p className="class-name">Power Lifting</p>
            </div>

            <div className="class-item">
              <div className="class-overlay">
                <img src="/meditation.jpg" alt="Meditation" className="class-image" />
                <div className="overlay-content">
                  <p className="class-text">Meditation</p>
                  <button className="date-button" onClick={() => router.push('/kalana/Meditation')}>Thursday | 7:00 AM</button>
                </div>
              </div>
              <p className="class-name">Meditation</p>
            </div>

            <div className="class-item">
              <div className="class-overlay">
                <img src="/yoga.jpg" alt="Yoga" className="class-image" />
                <div className="overlay-content">
                  <p className="class-text">Yoga</p>
                  <button className="date-button" onClick={() => router.push('/kalana/Yoga')}>Friday | 7:30 AM</button>
                </div>
              </div>
              <p className="class-name">Yoga</p>
            </div>

            <div className="class-item">
              <div className="class-overlay">
                <img src="/mma.jpg" alt="MMA" className="class-image" />
                <div className="overlay-content">
                  <p className="class-text">MMA</p>
                  <button className="date-button" onClick={() => router.push('/kalana/MMA')}>Saturday | 5:00 PM</button>
                </div>
              </div>
              <p className="class-name">MMA</p>
            </div>
          </div>
        </section>

        {/* Fitness Service Section */}
        <section className="fitness-service">
          <h2 className="section-title3">We Are Always Provide Best Fitness Service For You</h2>
          <div className="service-content">
            <div className="service-item">
              <h3 className="service-title">Sculpt Your Perfect Body With Us!</h3>
              <p className="service-description">
                A fitness legacy evolving with time, blending strength and innovation for modern excellence. It continues to inspire and transform, adapting seamlessly to modern needs while maintaining its core essence of strength and endurance.
              </p>
              <button className="button">Our Classes</button>
            </div>
            <div className="service-image">
              <img src="/fitnessservice.jpg" alt="Fitness Service" className="service-image-style" />
            </div>
          </div>
        </section>

        {/* BMI Section */}
        <section className="bmi-wrapper">
          <div className="bmi-box">
            <div className="bmi-left">
              <h2 className="bmi-heading">Let's Calculate Your BMI</h2>
              <p className="bmi-description">
                FitSyncPro combines strength and innovation to shape the ultimate fitness experience.
              </p>

              <div className="unit-selector">
                <label className="unit-option">
                  <input type="radio" name="unit" value="metric" defaultChecked />
                  <span>Metric Units</span>
                </label>
                <label className="unit-option">
                  <input type="radio" name="unit" value="imperial" />
                  <span>Imperial Units</span>
                </label>
              </div>

              <div className="bmi-form">
                <input
                  type="number"
                  placeholder="Weight / kg"
                  className="input"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Height / cm"
                  className="input"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>

              <button className="calculate-button" onClick={calculateBMI}>
                Calculate
              </button>

              {bmi !== null && (
                <div className="bmi-result">
                  <p>Your BMI is: {bmi}</p>
                  <p>Status: {message}</p>
                </div>
              )}
            </div>

            <div className="bmi-right">
              <GaugeChart
                id="bmi-meter"
                nrOfLevels={5}
                arcsLength={arcsLength}
                colors={['#00BFFF', '#32CD32', '#FFD700', '#FF4500', '#FF0000']}
                arcPadding={0.02}
                percent={bmi !== null ? Math.min((bmi - 15) / 25, 1) : 0}
                arcWidth={0.3}
                textColor="#000"
                formatTextValue={() => (bmi ? `${bmi} BMI` : '--')}
              />

              <div className="bmi-legend">
                <div className="bmi-legend-item">
                  <span className="bmi-legend-color" style={{ background: '#00BFFF' }}></span> Underweight
                </div>
                <div className="bmi-legend-item">
                  <span className="bmi-legend-color" style={{ background: '#32CD32' }}></span> Normal
                </div>
                <div className="bmi-legend-item">
                  <span className="bmi-legend-color" style={{ background: '#FFD700' }}></span> Overweight
                </div>
                <div className="bmi-legend-item">
                  <span className="bmi-legend-color" style={{ background: '#FF4500' }}></span> Obese
                </div>
                <div className="bmi-legend-item">
                  <span className="bmi-legend-color" style={{ background: '#FF0000' }}></span> Severely Obese
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*Stripe Checkout Section 
        <section className="checkout-section">
          <StripeProvider>
            <h1>Checkout</h1>
            <CheckoutForm/>
          </StripeProvider>
        </section>   */}

      </main>
      <Footer1 />
    </div>
  );
};

export default HomePage;
