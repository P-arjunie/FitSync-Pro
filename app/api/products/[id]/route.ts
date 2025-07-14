/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb"
import Product from "../../../models/product"


// GET - Fetch a single product by ID
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  
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
  context: { params: Promise<{ id: string }> }
) {
  await connectToDatabase()
  
  try {
    const { id } = await context.params // ✅ Fixed: Added await
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

// DELETE - Soft delete a product by ID
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectToDatabase()
  
  try {
    const { id } = await context.params // ✅ Fixed: Added await
    
    console.log(`Attempting to soft delete product with ID: ${id}`)
    
    // First, find the product to see its current state
    const existingProduct = await Product.findById(id)
    console.log('Existing product:', existingProduct)
    
    if (!existingProduct) {
      console.log('Product not found in database')
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    
    // Update the product to mark as deleted - using a simpler approach
    console.log('Attempting to update product with query:', { id, isDeleted: true, deletedAt: new Date() })
    
    // Try direct update first
    const updateResult = await Product.updateOne(
      { _id: id },
      { 
        isDeleted: true, 
        deletedAt: new Date() 
      }
    )
    
    console.log('Update result:', updateResult)
    
    // Fetch the updated product
    const updatedProduct = await Product.findById(id)
    console.log('Updated product:', updatedProduct)
    
    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    
    return NextResponse.json({ 
      message: "Product deleted successfully",
      deletedProduct: updatedProduct 
    }, { status: 200 })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}

// Optional: Add PATCH method for restore functionality
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectToDatabase()
  
  try {
    const { id } = await context.params
    const { action } = await request.json()
    
    if (action === 'restore') {
      // Find and restore the product
      const restoredProduct = await Product.findByIdAndUpdate(
        id,
        { 
          isDeleted: false, 
          deletedAt: null 
        },
        { new: true }
      )
      
      if (!restoredProduct) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
      
      return NextResponse.json({ 
        message: "Product restored successfully",
        restoredProduct: restoredProduct 
      }, { status: 200 })
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in PATCH operation:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}