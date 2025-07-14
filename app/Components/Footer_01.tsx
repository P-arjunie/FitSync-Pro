import React from 'react';
import Image from 'next/image';

const footer1: React.FC = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerContent}>
        <div style={styles.info}>
          <h1>FITSYNC PRO</h1>
          <p>Ultimate Fitness Center</p>
          <p style={styles.legal}>Privacy Policy | @ 2025 FitSyncPro</p>
          <br/>
          <p>
            FitSync Pro is where smart training meets real results. We blend expert coaching, modern equipment, and
            a supportive community to help you reach your fitness goals, no matter your starting point.
          </p>
        </div>

        <div style={styles.classes}>
          <h3 style={styles.redBar}>Our Classes</h3>
          <ul>
            <li>Cycling</li>
            <li>Yoga</li>
            <li>Power Lifting</li>
            <li>Yoga</li>
            <li>Meditation</li>
            <li>Mixed Martial Arts</li>
          </ul>
        </div>

        <div style={styles.workingHours}>
          <h3 style={styles.redBar}>Working Hours</h3>
          <p>Monday - Friday: 7:00 a.m. - 9:00 p.m.</p>
          <p>Saturday: 7:00 a.m. - 4:00 p.m.</p>
          <p>Sunday Close</p>
        </div>

        <div style={styles.contact}>
          <h3 style={styles.redBar}>Contact Us</h3>
          <p>No 4/1, Sapumal Palace Colombo</p>
          <p>+94 71 278 1444</p>
          <p>fitsyncpro.gym@gmail.com</p>
        </div>

        <div style={styles.socialIcons}>
          <a href="https://wa.me/+94712781444" style={styles.iconLink}>
            <Image src="/whatsapp.png" alt="Whatsapp" width={40} height={40} />
          </a>
          <a href="https://www.instagram.com" style={styles.iconLink}>
            <Image src="/insta.png" alt="Instagram" width={40} height={40} />
          </a>
          <a href="https://www.facebook.com" style={styles.iconLink}>
            <Image src="/facebook.png" alt="Facebook" width={40} height={40} />
          </a>
          <a href="mailto:email@email.com" style={styles.iconLink}>
            <Image src="/linkedin.png" alt="Email" width={40} height={40} />
          </a>
        </div>
      </div>
    </footer>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  footer: {
    backgroundColor: '#000000',
    color: 'white',
    padding: '40px 20px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '0.875rem',
    
  },
  footerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap', // Ensure 'flexWrap' is typed correctly
    gap: '20px',
  },
  info: {
    flex: 1,
    minWidth: '250px',
    textAlign: 'left',
    fontSize: '1rem',
  },
  classes: {
    flex: 1,
    minWidth: '250px',
  },
  workingHours: {
    flex: 1,
    minWidth: '250px',
  },
  contact: {
    flex: 1,
    minWidth: '250px',
  },
  redBar: {
    backgroundColor: '#e60000',
    color: 'white',
    padding: '5px 10px',
    fontWeight: 'bold',
    marginBottom: '10px',
    display: 'inline-block',
  },
  socialIcons: {
    display: 'flex',
    gap: '15px',
  },
  iconLink: {
    display: 'inline-block',
  },
  legal: {
  fontSize: '0.675rem',
  fontWeight: 600,
  marginTop: '0.5rem',
},
};

export default footer1;