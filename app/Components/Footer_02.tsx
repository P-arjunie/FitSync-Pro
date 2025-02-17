// components/Footer2.js
import React from 'react';
import Image from 'next/image';

const Footer2 = () => {
  return (
    <footer style={footerStyle}>
      <div style={footerContentStyle}>
        <div style={imageSliderStyle}>
          <div style={imageContainerStyle}>
            <Image src="/image1.jpg" alt="Image 1" width={300} height={200} />
            <Image src="/image2.jpg" alt="Image 2" width={300} height={200} />
            <Image src="/image3.jpg" alt="Image 3" width={300} height={200} />
          </div>
        </div>
        <div style={infoStyle}>
          <h2>FITSYNC PRO</h2>
          <p>ULTIMATE GYM CENTER</p>
          <p>When an unknown printer took a galley of type...</p>
        </div>
        <div style={iconsStyle}>
          <a href="#" style={iconLinkStyle}>Whatsapp</a>
          <a href="#" style={iconLinkStyle}>Instagram</a>
          <a href="#" style={iconLinkStyle}>Facebook</a>
        </div>
      </div>
    </footer>
  );
};

const footerStyle = {
  backgroundColor: '#333',
  color: '#fff',
  padding: '20px 0',
  fontFamily: 'Arial, sans-serif',
};

const footerContentStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0 20px',
};

const imageSliderStyle = {
  width: '30%',
};

const imageContainerStyle = {
  display: 'flex',
  gap: '10px',
};

const infoStyle = {
  width: '30%',
};

const iconsStyle = {
  width: '30%',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
};

const iconLinkStyle = {
  textDecoration: 'none',
  color: '#fff',
  fontSize: '20px',
};

export default Footer2;