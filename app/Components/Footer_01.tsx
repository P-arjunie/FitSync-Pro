import React from 'react';
import Image from 'next/image';

const Footer1: React.FC = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerContent}>
        <div style={styles.info}>
          <h2>FITSYNC PRO</h2>
          <p>ULTIMATE GYM CENTER</p>
          <p>Privacy Policy | @ 2025 FitSyncPro</p>
          <br/>
          <p>When an unknown printer took a galley of type and scrambled it to create a unique specimen book, it marked the beginning of a new era in printing, surviving centuries of evolution and adapting to modern advancements.</p>
        </div>

        <div style={styles.classes}>
          <h3 style={styles.redBar}>Our Classes</h3>
          <ul>
            <li>Fitness Classes</li>
            <li>Power Yoga</li>
            <li>Full-Body Strength</li>
            <li>Yoga</li>
            <li>Aerobic & Zumba Classes</li>
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
          <p>email@email.com</p>
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
};

export default Footer1;