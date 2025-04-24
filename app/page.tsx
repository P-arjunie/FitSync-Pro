import React from 'react';
import './Components/HomePage.css';
import Navbar from './Components/Navbar';
import Footer1 from './Components/Footer_01';
import StripeProvider from "./Components/StripeProvider";
import CheckoutForm from "./Components/CheckoutForm";

const HomePage: React.FC = () => {
  return (

    
    <div className = "pagecontainer">
      <Navbar />
      
      {/* Main Content Section */}
      <main className="main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-text">
            <h2 className="hero-title2">MAKE YOUR BODY</h2>
            <h2 className="hero-title2">STRONG WITH </h2>
            <h1 className="hero-title">FITSYNC PRO</h1>
            <p className="hero-description">
            "At FitSync Pro, we provide personalized fitness programs to help you build strength, improve endurance, and reach your goals faster. Join us today and take your workout to the next level!"
            </p>
            <div className="hero-button-container">
              <button className="button">Log In</button>
              <button className="button">Sign Up</button>
            </div>
          </div>
          <div className="hero-image">
            <img src="/bodybuilder.jpg" alt="Fitness" className="hero-image-style" />
          </div>
        </section>

        {/* Progression, Workout, Nutrition Section */}
        <section className="three-card-section">
          <div className="card-item">
            <img src="/progressionicon.png" alt="Progression" />
            <h3 className="card-title">Progression</h3>
            <p className="card-text">Track your progress and stay motivated to reach your fitness goals faster.</p>
            <button className="card-button">Learn More</button>
          </div>

          <div className="card-item">
            <img src="/workouticon.png" alt="Workout" />
            <h3 className="card-title">Workout</h3>
            <p className="card-text">Custom workouts designed to help you improve strength, endurance, and more.</p>
            <button className="card-button">Get Started</button>
          </div>

          <div className="card-item">
            <img src="/nutritionicon.png" alt="Nutrition" />
            <h3 className="card-title">Nutrition</h3>
            <p className="card-text">Personalized meal plans to fuel your body and maximize your performance.</p>
            <button className="card-button">Explore Plans</button>
          </div>
      </section>

        {/* Who We Are Section */}
        <section className="who-we-are">
          <div className="who-we-are-container">
          <div className="who-we-are-text">
            <h1 className="red-titles">WHO WE ARE</h1>
            <h2 className="section-title">Take Your Health And Body To Next Level</h2>
            <p className="description-text">
        FitSyncPro, an unknown printer, took a galley of type and scrambled it to make a type specimen book.
        It has survived not only five centuries but also the leap into electronic typesetting.
            </p>
          <div className="icon-section">
          <div className="icon-item">
            <img src="/trainericon.png" alt="Professional Trainers" className="icon-image2" />
          <p className="icon-item">Professional Trainers</p>
        </div>
        <div className="icon-item">
          <img src="/equipmenticon.png" alt="Modern Equipment" className="icon-image2" />
          <p className="icon-text">Modern Equipment</p>
        </div>
        <div className="icon-item">
          <img src="/machineicon.png" alt="Body Building Machine" className="icon-image2" />
          <p className="icon-text">Body Building Machine</p>
        </div>
        </div>
        </div>
        <div className="who-we-are-image">
        <img src="/whowearecoach.jpg" alt="Coach" className="bodybuilder-image" />
        </div>
        </div>
        </section>

        {/* Featured Classes Section */}
        <section className="featured-classes">
          <h2 className="section-title">We Are Offering Best Flexible Classes</h2>

          <div className="class-items">

            <div>
            <div className="class-item">
              <img src="/cycling.png" alt="Cycling" className="class-image" />
              <p className="class-text">Cycling</p>
              <button className="date-button">Date & Time</button>
            </div>
            <div className="class-item">
              <img src="/workout2.jpg" alt="Workout" className="class-image" />
              <p className="class-text">Workout</p>
              <button className="date-button">Date & Time</button>
            </div>
            </div>

            <div>
            <div className="class-item">
              <img src="/powerlifting.jpg" alt="Power Lifting" className="class-image" />
              <p className="class-text">Power Lifting</p>
              <button className="date-button">Date & Time</button>
            </div>
            <div className="class-item">
              <img src="/meditation.jpg" alt="meditation" className="class-image" />
              <p className="class-text">Meditation</p>
              <button className="date-button">Date & Time</button>
            </div>
            </div>

            <div>
            <div className="class-item">
              <img src="/yoga.jpg" alt="Yoga" className="class-image" />
              <p className="class-text">Yoga</p>
              <button className="date-button">Date & Time</button>
            </div>
            <div className="class-item">
              <img src="/mma.jpg" alt="MMA" className="class-image" />
              <p className="class-text">MMA</p>
              <button className="date-button">Date & Time</button>
            </div>
            </div>
            
          </div>
        </section>

        {/* Fitness Service Section */}
        <section className="fitness-service">
          <h2 className="section-title">We Are Always Provide Best Fitness Service For You</h2>
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

        {/* BMI Calculator Section */}
        <section className="bmi-calculator">
          <h2 className="section-title">Let's Calculate Your BMI</h2>
          <div className="bmi-form">
            <input type="number" placeholder="Weight (kg)" className="input" />
            <input type="number" placeholder="Height (cm)" className="input" />
            <button className="calculate-button">Calculate</button>
          </div>
        </section>

        {/* Stripe Checkout Section */}
        <section className="checkout-section">
          <StripeProvider>
            <h1>Checkout</h1>
            <CheckoutForm userId={''}/>
          </StripeProvider>
        </section>
      </main>

      <Footer1 />
    </div>
  );
};

export default HomePage;
