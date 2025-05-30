
import mongoose from 'mongoose';

const CheckoutSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  billingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    zip: { type: String, required: true },
  },
  paymentStatus: { type: String, required: true },
  paymentMethodId: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const Checkout = mongoose.models.Checkout || mongoose.model('Checkout', CheckoutSchema);
export default Checkout;
