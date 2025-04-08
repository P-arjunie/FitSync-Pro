"use client";  // This marks the component as a client-side component

import StripeProvider from '../Components/StripeProvider';
import CheckoutForm from '../Components/CheckoutForm';

const CheckoutPage: React.FC = () => {
  return (
    <StripeProvider>
      <h1>Checkout</h1>
      <CheckoutForm />
    </StripeProvider>
  );
};

export default CheckoutPage;  // Ensure this is a default export
