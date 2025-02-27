import React from 'react';
import Navbar from './Components/Navbar';
import Footer1 from './Components/Footer_01';

const HomePage: React.FC = () => {
  return (
    <div>
      <Navbar />

      {/* Main Content Section */}
      <main style={styles.main}>
        <section style={styles.heroSection}>
          <div style={styles.heroText}>
            <h1>MAKE YOUR BODY STRONG WITH FITSYNC PRO</h1>
            <p>Gymmen an unknown printer took a galley of type...</p>
            <button style={styles.button}>Join Now</button>
          </div>
          <div style={styles.heroImage}>
            <img src="/bodybuilder.jpg" alt="Fitness" style={styles.heroImageStyle} />
          </div>
        </section>

        {/* Who We Are Section */}
        <section style={styles.whoWeAre}>
          <h2>Take Your Health and Body to the Next Level</h2>
          <div style={styles.iconSection}>
            <div style={styles.iconItem}>
              <img src="/trainericon.png" alt="Professional Trainers" />
              <p>Professional Trainers</p>
            </div>
            <div style={styles.iconItem}>
              <img src="/equipmenticon.png" alt="Modern Equipment" />
              <p>Modern Equipment</p>
            </div>
            <div style={styles.iconItem}>
              <img src="/machineicon.png" alt="Body Building Machine" />
              <p>Body Building Machine</p>
            </div>
          </div>
        </section>

        {/* Featured Classes Section */}
        <section style={styles.featuredClasses}>
          <h2>We Are Offering Best Flexible Classes</h2>
          <div style={styles.classItems}>
            <div style={styles.classItem}>
              <img src="/cycling.jpg" alt="Cycling" />
              <p>Cycling</p>
            </div>
            <div style={styles.classItem}>
              <img src="/workout.jpg" alt="Workout" />
              <p>Workout</p>
            </div>
            <div style={styles.classItem}>
              <img src="/yoga.jpg" alt="Yoga" />
              <p>Yoga</p>
            </div>
            <div style={styles.classItem}>
              <img src="/meditation.jpg" alt="Meditation" />
              <p>Meditation</p>
            </div>
          </div>
        </section>

        {/* Fitness Service Section */}
        <section style={styles.fitnessService}>
          <h2>We Always Provide the Best Fitness Service For You</h2>
          <div style={styles.serviceContent}>
            <div style={styles.serviceItem}>
              <h3>Sculpt Your Perfect Body With Us!</h3>
              <p>A fitness legacy evolving with time...</p>
              <button style={styles.button}>Our Classes</button>
            </div>
            <div style={styles.serviceImage}>
              <img src="/fitnessservice.jpg" alt="Fitness Service" style={styles.serviceImageStyle} />
            </div>
          </div>
        </section>

        {/* BMI Calculator Section */}
        <section style={styles.bmiCalculator}>
          <h2>Let's Calculate Your BMI</h2>
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
  main: {
    fontFamily: 'Arial, sans-serif',
    marginTop: '20px',
  },
  heroSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '50px',
    padding: '20px',
  },
  heroText: {
    maxWidth: '50%',
  },
  heroImage: {
    maxWidth: '40%',
  },
  heroImageStyle: {
    width: '100%',
    height: 'auto',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#e60000',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  },
  whoWeAre: {
    textAlign: 'center',
    marginBottom: '50px',
  },
  iconSection: {
    display: 'flex',
    justifyContent: 'space-around',
  },
  iconItem: {
    width: '30%',
    textAlign: 'center',
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
  fitnessService: {
    backgroundColor: '#f1f1f1',
    padding: '50px 0',
    marginBottom: '50px',
  },
  serviceContent: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  serviceItem: {
    width: '50%',
  },
  serviceImage: {
    width: '300px',
    height: '700px',
  },
  serviceImageStyle: {
    width: '100%',
    height: 'auto',
  },
  bmiCalculator: {
    backgroundColor: '#e60000',
    color: 'white',
    padding: '40px 20px',
    textAlign: 'center',
  },
  bmiForm: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    border: 'none',
  },
  calculateButton: {
    padding: '10px 20px',
    backgroundColor: '#333',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  },
};

export default HomePage;
