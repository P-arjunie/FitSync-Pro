import React from 'react';
import Image from 'next/image';
import styles from './Footer2.module.css';

const Footer_02: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        
        {/* Left: Text */}
        <div className={styles.footerText}>
          <h2 className={styles.brandTitle}>
            <span className={styles.brandHighlight}>F</span>ITSYNC PRO
          </h2>
          <p className={styles.subTitle}>ULTIMATE GYM CENTER</p>
          <p className={styles.legal}>Privacy Policy | © 2025 FitSyncPro</p>
          <p className={styles.description}>
            When an unknown printer took a galley of type and scrambled it to create a unique specimen book,
            it marked the beginning of a new era in printing, surviving centuries of evolution and adapting
            to modern advancements.
          </p>
        </div>

        {/* Center: Social Icons */}
        <div className={styles.socialIconsWrapper}>
          <div className={styles.socialIcons}>
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
              <Image src="/facebook.png" alt="Facebook" width={35} height={35} />
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
              <Image src="/linkedin.png" alt="LinkedIn" width={35} height={35} />
            </a>
            <a href="https://wa.me/+94712781444" target="_blank" rel="noopener noreferrer">
              <Image src="/whatsapp.png" alt="WhatsApp" width={35} height={35} />
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
              <Image src="/insta.png" alt="Instagram" width={35} height={35} />
            </a>
          </div>
        </div>

        {/* Right: Image */}
        <div className={styles.imageWrapper}>
          <Image
            src="/Footer2.png"
            alt="Muscle Icon"
            fill
            className={styles.footerImage}
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer_02;
