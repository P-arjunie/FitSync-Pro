/* eslint-disable @typescript-eslint/no-unused-vars */
// // import { NextResponse } from "next/server";
// // import connectMongoDB from "@/app/lib/mongodb";
// // import Quiz from "../../models/product";

// // const createProduct = async (req, res) => {
// //     try {
// //       const newProduct = await Product.create(req.body);
// //       res.json(newProduct);
// //     } catch (error) {
// //       throw new Error(error);
// //     }
// // };
// // const updateProduct = async (req, res) => {
// //     const {id} = req.params //get the id
// //     //check whether the id is valid
// //     if(!mongoose.Types.ObjectId.isValid(id)){
// //         return res.status(404).json({error: 'No such item'})
// //     }
// //   try {
// //     const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
// //       new: true,
// //     });
// //     res.json(updatedProduct);
// //   } catch (error) {
// //     throw new Error(error);
// //   }
// // };
// // const deleteProduct = async (req, res) => {
// //     const {id} = req.params //get the id
// //     //check whether the id is valid
// //     if(!mongoose.Types.ObjectId.isValid(id)){
// //         return res.status(404).json({error: 'No such item'})
// //     }
// //   try {
// //     const deletedProduct = await Product.findByIdAndDelete(id);
// //     res.json(deletedProduct);
// //   } catch (error) {
// //     throw new Error(error);
// //   }
// // };
// // const getProduct = async (req, res) => {
// //     const {id} = req.params //get the id
// //     //check whether the id is valid
// //     if(!mongoose.Types.ObjectId.isValid(id)){
// //         return res.status(404).json({error: 'No such item'})
// //     }
// //   try {
// //     const getaProduct = await Product.findById(id);
// //     res.json(getaProduct);
// //   } catch (error) {
// //     throw new Error(error);
// //   }
// // };
// // const getallProduct = async (req, res) => {
// //     try {
// //       const getallProduct = await Product.find();
// //       res.json(getallProduct);
// //     } catch (error) {
// //       throw new Error(error);
// //     }
// // };


// import { NextResponse } from "next/server";
// import connectDB from "../../lib/mongodb";
// import Product from "../../models/product";

// export async function POST(req) {
//   await connectDB();

//   try {
//     const product = await req.json();
//     const newProduct = await Product.create(product);
//     return NextResponse.json(newProduct, { status: 201 });
//   } catch (error) {
//     console.error("Product creation error:", error);
//     return NextResponse.json({ error: "Failed to add product" }, { status: 500 });
//   }
// }

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

