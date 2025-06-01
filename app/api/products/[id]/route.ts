/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb"
import Product from "../../../models/product"

// GET - Fetch a single product by ID
export async function GET(request: any, { params }: any) {
  await connectToDatabase()

  try {
    const { id } = params

    // Find the product by ID
    const product = await Product.findById(id)

    // If product not found
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Return the product
    return NextResponse.json(product, { status: 200 })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

// PUT - Update a product by ID
export async function PUT(request: { json: () => any }, { params }: any) {
  await connectToDatabase()

  try {
    const { id } = params
    const updates = await request.json()

    // Find and update the product
    const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true })

    // If product not found
    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Return the updated product
    return NextResponse.json(updatedProduct, { status: 200 })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

// DELETE - Delete a product by ID
export async function DELETE(request: any, { params }: any) {
  await connectToDatabase()

  try {
    const { id } = params

    // Find and delete the product
    const deletedProduct = await Product.findByIdAndDelete(id)

    // If product not found
    if (!deletedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Return success message
    return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
