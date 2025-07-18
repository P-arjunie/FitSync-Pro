/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Product, { type IProduct } from "@/models/product"

// GET - Fetch all products
export async function GET(request: NextRequest) {
  await connectToDatabase()

  try {
    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get("includeDeleted") === "true"

    let query = {}

    if (!includeDeleted) {
      // Only get active products (not deleted)
      query = { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] }
    }

    const products = (await Product.find(query).sort({ createdAt: -1 })) as IProduct[]

    console.log("Products found:", products.length)

    return NextResponse.json(products, { status: 200 })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  await connectToDatabase()

  try {
    const productData = await request.json()

    console.log("Received product data:", productData)

    // Validate required fields
    if (
      !productData.image ||
      !productData.title ||
      !productData.description ||
      !productData.category ||
      productData.price === undefined ||
      productData.countInStock === undefined
    ) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Create clean product data - let schema defaults handle soft delete fields
    const cleanProductData = {
      image: productData.image,
      title: productData.title,
      description: productData.description,
      category: productData.category,
      price: Number(productData.price),
      countInStock: Number(productData.countInStock),
      // Don't explicitly set isDeleted or deletedAt - let schema defaults handle it
    }

    console.log("Clean product data:", cleanProductData)

    const newProduct = new Product(cleanProductData)
    const savedProduct = await newProduct.save()

    console.log("Saved product:", savedProduct)

    return NextResponse.json(savedProduct, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)

    // Handle validation errors with more detailed information
    if (error instanceof Error && error.name === "ValidationError") {
      const validationError = error as any
      const errorMessages = Object.values(validationError.errors).map((err: any) => err.message)
      return NextResponse.json(
        {
          error: "Validation failed",
          details: errorMessages,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
