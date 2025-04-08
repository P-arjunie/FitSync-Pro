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
            <h1 className="hero-title">MAKE YOUR BODY STRONG WITH FITSYNC PRO</h1>
            <p className="hero-description">
              Gymmen an unknown printer took a galley of type and scrambled. It has survived unknown printcenturies.
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
          <div className="progression-card">
            <img src="/progressionicon.png" alt="Progression" className="icon-image" />
            <p className="card-title">Progression</p>
            <p className="card-text">Tracking your progress is key to reaching your fitness goals. Whether you're building strength, losing weight, or improving endurance, seeing measurable progress keeps you motivated and focused on your journey. Celebrate each milestone along the way!</p>
          </div>
          <div className="workout-card">
            <img src="/workouticon.png" alt="Workout" className="icon-image" />
            <p className="card-title">Workout</p>
            <p className="card-text">Our expertly designed workouts are tailored to meet your specific fitness level and goals. Whether you're a beginner or an advanced athlete, we provide diverse routines that target all aspects of fitness, from strength training to cardiovascular endurance.</p>
          </div>
          <div className="nutrition-card">
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
            <CheckoutForm/>
          </StripeProvider>
        </section>
      </main>

      <Footer1 />
    </div>
  );
};

export default HomePage;
/*
const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    margin: 0,
    padding: 0,
    height: '100%',
    width: '100%'
  },
  main: {
    fontFamily: 'Arial, sans-serif',
    margin: 0,
    padding: 0,
    overflowX: 'hidden', // Prevent horizontal overflow
  },
  heroSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0',
    padding: '100px',
    backgroundImage: 'url(/herobackground.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    width: '100%', // Ensure full width
    height: '800px',
  },
  heroText: {
    maxWidth: '50%',
    color: '#fff',
    margin: 0, // Prevent extra margin
  },
  heroTitle: {
    fontSize: '3rem',
    marginBottom: '20px',
    fontWeight: 'bold',
  },
  heroDescription: {
    fontSize: '1.2rem',
    marginBottom: '20px',
  },
  heroButtonContainer: {
    display: 'flex',
    gap: '20px',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#e60000',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    borderRadius: '5px',
  },
  heroImage: {
    maxWidth: '40%',
  },
  heroImageStyle: {
    width: '100%',
    height: 'auto',
  },
  // Progression, Workout, Nutrition Section with Backgrounds
  threeCardSection: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0',
    marginTop: '0',
    padding: '100px',
    height: '800px',
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(/cardbackground.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  CardTitle: {
    fontSize: '2.5rem', // Increase this for a larger title
    fontWeight: 'bold', // Optional: Makes the title bold
    marginBottom: '15px', // Space between title and the following text
  },
  progressionCard: {
    position: 'relative',
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), url(/gymprogress.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '20px',
    borderRadius: '5px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    width: '30%',
    textAlign: 'center',
    color: 'white',
  },
  workoutCard: {
    position: 'relative',
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), url(/workoutcard.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '20px',
    borderRadius: '5px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    width: '30%',
    textAlign: 'center',
    color: 'white',
  },
  nutritionCard: {
    position: 'relative',
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), url(/gymnutrition.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '20px',
    borderRadius: '5px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    width: '30%',
    textAlign: 'center',
    color: 'white',
  },
  iconImage: {
    width: '80px',
    height: '80px',
    marginBottom: '10px',
    display: 'block',  // Makes the image behave like a block element
    marginLeft: 'auto', // Automatically adjust left margin to center
    marginRight: 'auto', // Automatically adjust right margin to center
  },
  cardText: {
    fontSize: '1rem',
  },
  readMoreButton: {
    padding: '8px 16px',
    backgroundColor: '#e60000',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '10px',
    borderRadius: '5px',
  },
  whoWeAre: {
    background: '#f8f8f8',
    padding: '50px 20px',
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), url(/whoweare2.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    height: '800px',
    color: 'white',
  },
  
  whoWeAreContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  
  whoWeAreText: {
    flex: 1,
  },
  
  whoWeAreImage: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  
  bodybuilderImage: {
    width: '80%',
    height: '730px',
    borderRadius: '10px',
    marginTop: '20px',
    marginBottom: '20px',
    marginLeft: '50px',
  },
  
  redTitles: {
    backgroundColor: "#FF0000",
    color: "#FFFFFF",
    padding: "10px",
    display: "inline-block",
  },
  
  sectionTitle: {
    padding: '50px',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    margin: '20px 0',
  },
  
  descriptionText: {
    fontSize: '1.2rem',
    marginBottom: '20px',
  },
  
  iconSection: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '30px',
  },
  
  iconItem: {
    textAlign: 'center',
    flex: '1',
  },
  
  iconImage2: {
    width: '60px',
    height: '60px',
    marginBottom: '10px',
  },

  iconText: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
  },
  featuredClasses: {
    padding: '50px 20px',
    marginBottom: '50px',
  },
  classItems: {
    padding : '50px',
    display: 'flex',
    justifyContent: 'space-around',
  },
  classItem: {
    width: '90%',
    textAlign: 'center',
  },
  classImage: {
    width: '100%',
    height: '250px',
    marginBottom: '10px',
  },
  classText: {
    fontSize: '1.5rem',
  },
  dateButton: {
    padding: '8px 16px',
    backgroundColor: '#e60000',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '10px',
    marginBottom: '20px',
    borderRadius: '5px',
  },
  fitnessService: {
    padding: '50px 20px',
    marginBottom: '50px',
  },
  serviceContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceItem: {
    width: '60%',
    textAlign: 'center',
  },
  serviceTitle: {
    fontSize: '2rem',
    marginBottom: '20px',
  },
  serviceDescription: {
    fontSize: '1.2rem',
    marginBottom: '30px',
  },
  serviceImage: {
    width: '35%',
  },
  serviceImageStyle: {
    width: '100%',
    height: 'auto',
  },
  bmiCalculator: {
    textAlign: 'center',
    marginBottom: '50px',
  },
  bmiForm: {
    display: 'inline-block',
  },
  input: {
    padding: '10px',
    fontSize: '1rem',
    margin: '10px',
    width: '200px',
    borderRadius: '5px',
  },
  calculateButton: {
    padding: '10px 20px',
    backgroundColor: '#e60000',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    borderRadius: '5px',
  },
};

export default HomePage;

*/