/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb"
import Product from "../../../models/product"

// GET - Fetch a single product by ID
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params  // ✅ Good

  await connectToDatabase()

  try {

    const product = await Product.findById(id)

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product, { status: 200 })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

// PUT - Update a product by ID
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  await connectToDatabase()

  try {
    const { id } = context.params
    const updates = await request.json()

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })

    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(updatedProduct, { status: 200 })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

// DELETE - Delete a product by ID
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  await connectToDatabase()

  try {
    const { id } = context.params

    const deletedProduct = await Product.findByIdAndDelete(id)

    if (!deletedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
