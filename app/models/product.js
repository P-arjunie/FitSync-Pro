import mongoose from "mongoose";

// Custom validator function for price
const validatePrice = function (value) {
  return value > 0;
};

// Custom validator function for countInStock
const validateCountInStock = function (value) {
  return Number.isInteger(value) && value >= 0;
};

const productSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      validate: {
        validator: validatePrice,
        message: "Price must be a positive number",
      },
    },
    countInStock: {
      type: Number,
      required: true,
      validate: {
        validator: validateCountInStock,
        message: "Count in stock must be a non-negative integer",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Check if the model exists, otherwise create it
const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
