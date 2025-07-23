"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface SiteSettings {
  logoUrl: string;
  footerText: string;
  classes: string[];
  workingHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  contact: {
    address: string;
    phone: string;
    email: string;
  };
  social: {
    whatsapp: string;
    instagram: string;
    facebook: string;
    linkedin: string;
  };
}

const Footer1: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        setSettings(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading || !settings) {
    return (
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.info}>Loading footer...</div>
        </div>
      </footer>
    );
  }

  return (
    <footer style={styles.footer}>
      <div style={styles.footerContent}>
        <div style={styles.info}>
          <h1>FITSYNC PRO</h1>
          <p>Ultimate Fitness Center</p>
          <p style={styles.legal}>Privacy Policy | {settings.footerText}</p>
          <br />
          <p>
            FitSync Pro is where smart training meets real results. We blend expert coaching, modern equipment, and
            a supportive community to help you reach your fitness goals, no matter your starting point.
          </p>
        </div>

        <div style={styles.classes}>
          <h3 style={styles.redBar}>Our Classes</h3>
          <ul>
            {settings.classes.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>

        <div style={styles.workingHours}>
          <h3 style={styles.redBar}>Working Hours</h3>
          <p>{settings.workingHours.weekdays}</p>
          <p>{settings.workingHours.saturday}</p>
          <p>{settings.workingHours.sunday}</p>
        </div>

        <div style={styles.contact}>
          <h3 style={styles.redBar}>Contact Us</h3>
          <p>{settings.contact.address}</p>
          <p>{settings.contact.phone}</p>
          <p>{settings.contact.email}</p>
        </div>

        <div style={styles.socialIcons}>
          <a href={settings.social.whatsapp} style={styles.iconLink} target="_blank" rel="noopener noreferrer">
            <Image src="/whatsapp.png" alt="Whatsapp" width={40} height={40} />
          </a>
          <a href={settings.social.instagram} style={styles.iconLink} target="_blank" rel="noopener noreferrer">
            <Image src="/insta.png" alt="Instagram" width={40} height={40} />
          </a>
          <a href={settings.social.facebook} style={styles.iconLink} target="_blank" rel="noopener noreferrer">
            <Image src="/facebook.png" alt="Facebook" width={40} height={40} />
          </a>
          <a href={settings.social.linkedin} style={styles.iconLink} target="_blank" rel="noopener noreferrer">
            <Image src="/linkedin.png" alt="LinkedIn" width={40} height={40} />
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
    flexWrap: 'wrap',
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

export default Footer1;