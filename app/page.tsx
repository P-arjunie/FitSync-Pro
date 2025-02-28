import React from 'react';
import Navbar from './Components/Navbar';
import Footer1 from './Components/Footer_01';

const HomePage: React.FC = () => {
  return (
    <div style={styles.pageContainer}>
      <Navbar />
      
      {/* Main Content Section */}
      <main style={styles.main}>
        {/* Hero Section */}
        <section style={styles.heroSection}>
          <div style={styles.heroText}>
            <h1 style={styles.heroTitle}>MAKE YOUR BODY STRONG WITH FITSYNC PRO</h1>
            <p style={styles.heroDescription}>
              Gymmen an unknown printer took a galley of type and scrambled. It has survived unknown printcenturies.
            </p>
            <div style={styles.heroButtonContainer}>
              <button style={styles.button}>Log In</button>
              <button style={styles.button}>Sign Up</button>
            </div>
          </div>
          <div style={styles.heroImage}>
            <img src="/bodybuilder.jpg" alt="Fitness" style={styles.heroImageStyle} />
          </div>
        </section>

        {/* Progression, Workout, Nutrition Section */}
        <section style={styles.threeCardSection}>
          <div style={styles.progressionCard}>
            <img src="/progressionicon.png" alt="Progression" style={styles.iconImage} />
            <p style={styles.CardTitle}>Progression</p>
            <p style={styles.cardText}>Tracking your progress is key to reaching your fitness goals. Whether you're building strength, losing weight, or improving endurance, seeing measurable progress keeps you motivated and focused on your journey. Celebrate each milestone along the way!</p>
          </div>
          <div style={styles.workoutCard}>
            <img src="/workouticon.png" alt="Workout" style={styles.iconImage} />
            <p style={styles.CardTitle}>Workout</p>
            <p style={styles.cardText}>Our expertly designed workouts are tailored to meet your specific fitness level and goals. Whether you're a beginner or an advanced athlete, we provide diverse routines that target all aspects of fitness, from strength training to cardiovascular endurance.</p>
          </div>
          <div style={styles.nutritionCard}>
            <img src="/nutritionicon.png" alt="Nutrition" style={styles.iconImage} />
            <p style={styles.CardTitle}>Nutrition</p>
            <p style={styles.cardText}>Nutrition plays a crucial role in your fitness success. We offer personalized meal plans that help you fuel your body for maximum performance. Learn how to nourish your body with the right balance of protein, carbohydrates, and healthy fats to support muscle growth and recovery.</p>
            <button style={styles.readMoreButton}>Read More</button>
          </div>
        </section>

        {/* Who We Are Section */}
        <section style={styles.whoWeAre}>
          <div style={styles.whoWeAreContainer}>
          <div style={styles.whoWeAreText}>
            <h1 style={styles.redTitles}>WHO WE ARE</h1>
            <h2 style={styles.sectionTitle}>Take Your Health And Body To Next Level</h2>
            <p style={styles.descriptionText}>
        FitSyncPro, an unknown printer, took a galley of type and scrambled it to make a type specimen book.
        It has survived not only five centuries but also the leap into electronic typesetting.
            </p>
          <div style={styles.iconSection}>
          <div style={styles.iconItem}>
            <img src="/trainericon.png" alt="Professional Trainers" style={styles.iconImage2} />
          <p style={styles.iconText}>Professional Trainers</p>
        </div>
        <div style={styles.iconItem}>
          <img src="/equipmenticon.png" alt="Modern Equipment" style={styles.iconImage2} />
          <p style={styles.iconText}>Modern Equipment</p>
        </div>
        <div style={styles.iconItem}>
          <img src="/machineicon.png" alt="Body Building Machine" style={styles.iconImage2} />
          <p style={styles.iconText}>Body Building Machine</p>
        </div>
        </div>
        </div>
        <div style={styles.whoWeAreImage}>
        <img src="/whowearecoach.jpg" alt="Coach" style={styles.bodybuilderImage} />
        </div>
        </div>
        </section>

        {/* Featured Classes Section */}
        <section style={styles.featuredClasses}>
          <h2 style={styles.sectionTitle}>We Are Offering Best Flexible Classes</h2>
          <div style={styles.classItems}>
            <div style={styles.classItem}>
              <img src="/cycling.jpg" alt="Cycling" style={styles.classImage} />
              <p style={styles.classText}>Cycling</p>
              <button style={styles.dateButton}>Date & Time</button>
            </div>
            <div style={styles.classItem}>
              <img src="/workout.jpg" alt="Workout" style={styles.classImage} />
              <p style={styles.classText}>Workout</p>
              <button style={styles.dateButton}>Date & Time</button>
            </div>
            <div style={styles.classItem}>
              <img src="/power.jpg" alt="Power" style={styles.classImage} />
              <p style={styles.classText}>Power</p>
              <button style={styles.dateButton}>Date & Time</button>
            </div>
            <div style={styles.classItem}>
              <img src="/meditation.jpg" alt="Meditation" style={styles.classImage} />
              <p style={styles.classText}>Meditation</p>
              <button style={styles.dateButton}>Date & Time</button>
            </div>
          </div>
        </section>

        {/* Fitness Service Section */}
        <section style={styles.fitnessService}>
          <h2 style={styles.sectionTitle}>We Are Always Provide Best Fitness Service For You</h2>
          <div style={styles.serviceContent}>
            <div style={styles.serviceItem}>
              <h3 style={styles.serviceTitle}>Sculpt Your Perfect Body With Us!</h3>
              <p style={styles.serviceDescription}>
                A fitness legacy evolving with time, blending strength and innovation for modern excellence. It continues to inspire and transform, adapting seamlessly to modern needs while maintaining its core essence of strength and endurance.
              </p>
              <button style={styles.button}>Our Classes</button>
            </div>
            <div style={styles.serviceImage}>
              <img src="/fitnessservice.jpg" alt="Fitness Service" style={styles.serviceImageStyle} />
            </div>
          </div>
        </section>

        {/* BMI Calculator Section */}
        <section style={styles.bmiCalculator}>
          <h2 style={styles.sectionTitle}>Let's Calculate Your BMI</h2>
          <div style={styles.bmiForm}>
            <input type="number" placeholder="Weight (kg)" style={styles.input} />
            <input type="number" placeholder="Height (cm)" style={styles.input} />
            <button style={styles.calculateButton}>Calculate</button>
          </div>
        </section>
      </main>

      <Footer1 />
    </div>
  );
};

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
    fontWeight: 'bold',
  },
  featuredClasses: {
    marginBottom: '50px',
  },
  classItems: {
    display: 'flex',
    justifyContent: 'space-around',
  },
  classItem: {
    width: '20%',
    textAlign: 'center',
  },
  classImage: {
    width: '100%',
    height: 'auto',
    marginBottom: '10px',
  },
  classText: {
    fontSize: '1.1rem',
  },
  dateButton: {
    padding: '8px 16px',
    backgroundColor: '#e60000',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '10px',
    borderRadius: '5px',
  },
  fitnessService: {
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