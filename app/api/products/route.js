import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import Product from "../../models/product";

// Handle GET requests to fetch products
export async function GET(request) {
  await connectDB();
  try {
    // Fetch all products from the database
    const products = await Product.find({});
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// Handle POST requests to add a new product
export async function POST(req) {
  await connectDB();

  try {
    const product = await req.json();
    
    // Validate that all required fields are provided
    if (
      !product.image ||
      !product.title ||
      !product.description ||
      !product.category ||
      !product.price ||
      !product.countInStock
    ) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Create a new product in the database
    const newProduct = await Product.create(product);
    return NextResponse.json(newProduct, { status: 201 });

  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 });
  }
}

