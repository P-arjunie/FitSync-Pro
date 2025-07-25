"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./Components/HomePage.css";
import Navbar from "./Components/Navbar";
import Footer1 from "./Components/Footer_01";
import GaugeChart from "react-gauge-chart";
import Link from "next/link";

{
  /*import CheckoutForm from "./Components/CheckoutForm"; */
}

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
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [bmi, setBmi] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // Hydration-safe: Only run browser code after mount
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  useEffect(() => {
    setCurrentTime(Date.now());
  }, []);

  useEffect(() => {
    if (currentTime === null) return;
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
            userId: userId,
          });

          // Only redirect admin users to admin dashboard if they just logged in
          // Check if this is a fresh login by looking for a login timestamp
          const adminLoginTimestamp = localStorage.getItem(
            "adminLoginTimestamp"
          );
          const memberLoginTimestamp = localStorage.getItem(
            "memberLoginTimestamp"
          );
          const adminTimeSinceLogin =
            currentTime - parseInt(adminLoginTimestamp || "0");
          const memberTimeSinceLogin =
            currentTime - parseInt(memberLoginTimestamp || "0");

          if (
            userRole === "admin" &&
            adminLoginTimestamp &&
            adminTimeSinceLogin < 5000
          ) {
            // Clear the timestamp and redirect only if it's a fresh login (within 5 seconds)
            localStorage.removeItem("adminLoginTimestamp");
            router.push("/member-system-management/admindashboard");
            return;
          }

          if (
            userRole === "member" &&
            memberLoginTimestamp &&
            memberTimeSinceLogin < 5000
          ) {
            // Clear the timestamp and redirect only if it's a fresh login (within 5 seconds)
            localStorage.removeItem("memberLoginTimestamp");
            router.push("/member-system-management/memberdashboard");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, [router, currentTime]);

  // Navigation handlers
  const handleAuthNavigation = () => {
    router.push("/member-system-management/Authform");
  };

  const handleAdminUserManagement = () => {
    router.push("/member-system-management/adminUserManagement");
  };

  const handleUserInfo = () => {
    router.push("/member-system-management/userinfo");
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("approvedTrainerId"); // <-- Add this line
    setUser(null);
    router.push("/");
  };

  // BMI Calculation
  const calculateBMI = () => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (!weight || !height) {
      setMessage("⚠️ Please enter both weight and height");
      setBmi(null);
      return;
    }

    if (isNaN(weightNum) || isNaN(heightNum)) {
      setMessage("⚠️ Please enter valid numbers");
      setBmi(null);
      return;
    }

    if (weightNum <= 0 || heightNum <= 0) {
      setMessage("⚠️ Please enter positive values only");
      setBmi(null);
      return;
    }

    let bmiValue = 0;

    if (unit === "metric") {
      const heightMeters = heightNum / 100;
      bmiValue = weightNum / (heightMeters * heightMeters);
    } else {
      // Imperial formula
      bmiValue = (weightNum / (heightNum * heightNum)) * 703;
    }

    const roundedBMI = parseFloat(bmiValue.toFixed(2));
    setBmi(roundedBMI);

    if (roundedBMI < 18.5) {
      setMessage("Underweight");
    } else if (roundedBMI < 25) {
      setMessage("Normal weight");
    } else if (roundedBMI < 30) {
      setMessage("Overweight");
    } else if (roundedBMI < 35) {
      setMessage("Obese");
    } else {
      setMessage("Severely Obese");
    }
  };

  // Define gauge arcs
  const range = 40 - 15; // 25
  const arcsLength = [
    (18.5 - 15) / range, // Underweight
    (25 - 18.5) / range, // Normal
    (30 - 25) / range, // Overweight
    (35 - 30) / range, // Obese
    (40 - 35) / range, // Severely Obese
  ];

  //Animations and transitions for cards
  useEffect(() => {
    const cards = document.querySelectorAll(
      ".progression-card, .workout-card, .nutrition-card"
    );

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
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

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  // In the HomePage component, update the renderHeroButtons function:
  const renderHeroButtons = () => {
    if (isLoading) {
      return (
        <div className="hero-button-container">
          <button className="button" disabled>
            Loading...
          </button>
        </div>
      );
    }

    if (user) {
      console.log("User role:", user.role); // Debug log

      // User is authenticated
      if (user.role === "admin") {
        // Admin user - show admin management buttons
        return (
          <div className="hero-button-container">
            <button
              className="button"
              onClick={() => router.push("/member-system-management/admindashboard")}
            >
              Admin Dashboard
            </button>
            <button className="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        );
      } else {
        // Regular user (member/trainer) - show user-specific options
        if (user.role === "member") {
          return (
            <div className="hero-button-container">
              <button
                className="button"
                onClick={() => router.push("/member-system-management/memberdashboard")}
              >
                Member Dashboard
              </button>
              <button className="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          );
        } else if (user.role === "trainer") {
          return (
            <div className="hero-button-container">
              <button
                className="button"
                onClick={() => router.push("/member-system-management/TrainerProfilePage")}
              >
                Profile
              </button>
              <button className="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          );
        } else {
          console.error("Unknown user role:", user.role);
          alert("Unknown user role. Please contact support.");
          return (
            <div className="hero-button-container">
              <button className="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          );
        }
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
            <h1 className="hero-title">
              MAKE YOUR BODY STRONG WITH FITSYNC PRO
            </h1>
            <p className="hero-description">
              Your all-in-one fitness platform. Book trainers, track workouts,
              and stay on top of your fitness goals all in one place. Start your
              journey to a healthier you with FitSync Pro today!
            </p>
            {renderHeroButtons()}
            {/* Show welcome message for authenticated users */}
            {user && (
              <div
                className="welcome-message"
                style={{ marginTop: "20px", color: "#ff4444" }}
              >
                <p>Welcome back, {user.name}! </p>
              </div>
            )}
          </div>
          <div className="hero-image">
            <img
              src="/bodybuilder.jpg"
              alt="Fitness"
              className="hero-image-style"
            />
          </div>
        </section>

        {/* Progression, Workout, Nutrition Section */}
        <section className="three-card-section">
          <div
            className="progression-card hidden-left"
            style={{ transitionDelay: "0s" }}
          >
            <img
              src="/progressionicon.png"
              alt="Progression"
              className="icon-image"
            />
            <p className="card-title">Progression</p>
            <p className="card-text">
              Tracking your progress is key to reaching your fitness goals.
              Whether you're building strength, losing weight, or improving
              endurance, seeing measurable progress keeps you motivated and
              focused on your journey. Celebrate each milestone along the way!
            </p>
            <Link href="/member-system-management/Authform">
              <button className="read-more-button">Sign Up</button>
            </Link>
          </div>

          <div
            className="workout-card hidden-left"
            style={{ transitionDelay: "0.2s" }}
          >
            <img src="/workouticon.png" alt="Workout" className="icon-image" />
            <p className="card-title">Workout</p>
            <p className="card-text">
              Our expertly designed workouts are tailored to meet your specific
              fitness level and goals. Whether you're a beginner or an advanced
              athlete, we provide diverse routines that target all aspects of
              fitness, from strength training to cardiovascular endurance.
            </p>
            <Link href="/fitness-activities-and-orders/pricing_page">
              <button className="read-more-button">Pricing Plans</button>
            </Link>
          </div>

          <div
            className="nutrition-card hidden-left"
            style={{ transitionDelay: "0.4s" }}
          >
            <img
              src="/nutritionicon.png"
              alt="Nutrition"
              className="icon-image"
            />
            <p className="card-title">Nutrition</p>
            <p className="card-text">
              Nutrition plays a crucial role in your fitness. We offer
              personalized meal plans that help you fuel your body for maximum
              performance. Learn how to nourish your body with the right balance
              of protein, carbohydrates, and healthy fats to support muscle
              growth and recovery.
            </p>
            <Link href="/user-order-management/products">
              <button className="read-more-button">Shop</button>
            </Link>
          </div>
        </section>

        {/* Who We Are Section */}
        <section className="who-we-are">
          <div className="who-we-are-container">
            <div className="who-we-are-text">
              <h1 className="red-titles">WHO WE ARE</h1>
              <h2 className="section-title">
                Take Your Health And Body To Next Level
              </h2>
              <p className="description-text">
                At FitSync Pro, we combine modern technology with expert
                training to help you achieve your fitness goals faster. With
                access to professional trainers, state-of-the-art equipment, and
                dedicated bodybuilding machines, you get everything you need for
                a powerful transformation.
              </p>

              {/* Icon Box Section */}
              <div className="icon-box">
                <div className="icon-item">
                  <img
                    src="/trainericon.png"
                    alt="Professional Trainers"
                    className="icon-image2"
                  />
                  <Link href="/sathya/trainerDetails">
                    <p className="icon-text cursor-pointer hover:underline">
                      Professional Trainers
                    </p>
                  </Link>
                </div>

                <div className="icon-divider" />

                <div className="icon-item">
                  <img
                    src="/equipmenticon.png"
                    alt="Modern Equipment"
                    className="icon-image2"
                  />
                  <Link href="/user-order-management/products">
                    <p className="icon-text cursor-pointer hover:underline">
                      Modern Equipment
                    </p>
                  </Link>
                </div>

                <div className="icon-divider" />

                <div className="icon-item">
                  <img
                    src="/machineicon.png"
                    alt="Body Building Machine"
                    className="icon-image2"
                  />
                  <Link href="/fitness-activities-and-orders/pricing_page">
                    <p className="icon-text cursor-pointer hover:underline">
                      Body Building
                    </p>
                  </Link>
                </div>
              </div>
            </div>

            <div className="who-we-are-image">
              <img
                src="/whowearecoach.png"
                alt="Coach"
                className="bodybuilder-image"
              />
            </div>
          </div>
        </section>

        {/* Featured Classes Section */}
        <section id="featured-classes" className="featured-classes">
          <h1 className="red-titles2">OUR FEATURED CLASSES</h1>
          <h2 className="section-title2">
            We Are Offering Best Flexible Classes
          </h2>

          <div className="class-items">
            <div className="class-item">
              <div className="class-overlay">
                <img src="/cycling.png" alt="Cycling" className="class-image" />
                <div className="overlay-content">
                  <p className="class-text">Cycling</p>
                  <button
                    className="date-button"
                    onClick={() => router.push("/fitness-activities-and-orders/cycling")}
                  >
                    Monday | 7:00 AM
                  </button>
                </div>
              </div>
              <p className="class-name">Cycling</p>
            </div>

            <div className="class-item">
              <div className="class-overlay">
                <img
                  src="/workout2.jpg"
                  alt="Workout"
                  className="class-image"
                />
                <div className="overlay-content">
                  <p className="class-text">Workout</p>
                  <button
                    className="date-button"
                    onClick={() => router.push("/fitness-activities-and-orders/workout")}
                  >
                    Tuesday | 6:00 PM
                  </button>
                </div>
              </div>
              <p className="class-name">Workout</p>
            </div>

            <div className="class-item">
              <div className="class-overlay">
                <img
                  src="/powerlifting.jpg"
                  alt="Power Lifting"
                  className="class-image"
                />
                <div className="overlay-content">
                  <p className="class-text">Power Lifting</p>
                  <button
                    className="date-button"
                    onClick={() => router.push("/fitness-activities-and-orders/power_lifting")}
                  >
                    Wednesday | 8:00 PM
                  </button>
                </div>
              </div>
              <p className="class-name">Power Lifting</p>
            </div>

            <div className="class-item">
              <div className="class-overlay">
                <img
                  src="/meditation.jpg"
                  alt="Meditation"
                  className="class-image"
                />
                <div className="overlay-content">
                  <p className="class-text">Meditation</p>
                  <button
                    className="date-button"
                    onClick={() => router.push("/fitness-activities-and-orders/meditation")}
                  >
                    Thursday | 7:00 AM
                  </button>
                </div>
              </div>
              <p className="class-name">Meditation</p>
            </div>

            <div className="class-item">
              <div className="class-overlay">
                <img src="/yoga.jpg" alt="Yoga" className="class-image" />
                <div className="overlay-content">
                  <p className="class-text">Yoga</p>
                  <button
                    className="date-button"
                    onClick={() => router.push("/fitness-activities-and-orders/yoga")}
                  >
                    Friday | 7:30 AM
                  </button>
                </div>
              </div>
              <p className="class-name">Yoga</p>
            </div>

            <div className="class-item">
              <div className="class-overlay">
                <img src="/mma.jpg" alt="MMA" className="class-image" />
                <div className="overlay-content">
                  <p className="class-text">MMA</p>
                  <button
                    className="date-button"
                    onClick={() => router.push("/fitness-activities-and-orders/mma")}
                  >
                    Saturday | 5:00 PM
                  </button>
                </div>
              </div>
              <p className="class-name">Mixed Martial Arts</p>
            </div>
          </div>
        </section>

        {/* Fitness Service Section */}
        <section id="fitness-service" className="fitness-service">
          <h2 className="section-title3">
            Choose the Right Fitness Plan to Match Your Goals
          </h2>
          <div className="service-content">
            <div className="service-item">
              <h3 className="service-title">
                Affordable Monthly Plans for Every Lifestyle !
              </h3>
              <p className="service-description">
                Whether you're just starting your fitness journey or you're a
                seasoned athlete, we offer flexible monthly pricing plans
                designed to suit your needs. From basic access to full-featured
                memberships, select the plan that empowers your transformation.
              </p>
              <a href="/fitness-activities-and-orders/pricing_page">
                <button className="button">VIEW PRICING PLANS</button>
              </a>
            </div>
            <div className="service-image">
              <img
                src="/fitnessservice.png"
                alt="Fitness Plans"
                className="service-image-style"
              />
            </div>
          </div>
        </section>

        {/* BMI Section */}
        <section className="bmi-wrapper">
          <div className="bmi-box">
            <div className="bmi-left">
              <h2 className="bmi-heading">Let's Calculate Your BMI</h2>
              <p className="bmi-description">
                FitSyncPro combines strength and innovation to shape the
                ultimate fitness experience.
              </p>

              <div className="unit-selector">
                <label className="unit-option">
                  <input
                    type="radio"
                    name="unit"
                    value="metric"
                    checked={unit === "metric"}
                    onChange={() => setUnit("metric")}
                  />
                  <span>Metric Units</span>
                </label>
                <label className="unit-option">
                  <input
                    type="radio"
                    name="unit"
                    value="imperial"
                    checked={unit === "imperial"}
                    onChange={() => setUnit("imperial")}
                  />
                  <span>Imperial Units</span>
                </label>
              </div>

              <div className="bmi-form">
                <input
                  type="number"
                  placeholder={
                    unit === "metric" ? "Weight (kg)" : "Weight (lbs)"
                  }
                  className="input"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <input
                  type="number"
                  placeholder={
                    unit === "metric" ? "Height (cm)" : "Height (inches)"
                  }
                  className="input"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>

              <button className="calculate-button" onClick={calculateBMI}>
                Calculate
              </button>

              <div className="bmi-result">
                {bmi !== null ? (
                  <>
                    <p>Your BMI is: {bmi}</p>
                    <p>Status: {message}</p>
                  </>
                ) : (
                  message && <p style={{ color: "red" }}>{message}</p>
                )}
              </div>
            </div>

            <div className="bmi-right">
              {currentTime !== null && (
                <GaugeChart
                  id="bmi-meter"
                  nrOfLevels={5}
                  arcsLength={arcsLength}
                  colors={["#00BFFF", "#32CD32", "#FFD700", "#FF4500", "#FF0000"]}
                  arcPadding={0.02}
                  percent={bmi !== null ? Math.min((bmi - 15) / 25, 1) : 0}
                  arcWidth={0.3}
                  textColor="#000"
                  formatTextValue={() => (bmi ? `${bmi} BMI` : "--")}
                />
              )}

              <div className="bmi-legend">
                <div className="bmi-legend-item">
                  <span
                    className="bmi-legend-color"
                    style={{ background: "#00BFFF" }}
                  ></span>{" "}
                  Underweight
                </div>
                <div className="bmi-legend-item">
                  <span
                    className="bmi-legend-color"
                    style={{ background: "#32CD32" }}
                  ></span>{" "}
                  Normal
                </div>
                <div className="bmi-legend-item">
                  <span
                    className="bmi-legend-color"
                    style={{ background: "#FFD700" }}
                  ></span>{" "}
                  Overweight
                </div>
                <div className="bmi-legend-item">
                  <span
                    className="bmi-legend-color"
                    style={{ background: "#FF4500" }}
                  ></span>{" "}
                  Obese
                </div>
                <div className="bmi-legend-item">
                  <span
                    className="bmi-legend-color"
                    style={{ background: "#FF0000" }}
                  ></span>{" "}
                  Severely Obese
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer1 />
    </div>
  );
};

export default HomePage;
