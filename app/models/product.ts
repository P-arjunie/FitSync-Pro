/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { type Document, type Model, Schema } from "mongoose"

// Interface for the Product document
export interface IProduct extends Document {
  _id: string
  image: string
  title: string
  description: string
  category: string
  price: number
  countInStock: number
  isDeleted: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
  softDelete(): Promise<IProduct>
  restore(): Promise<IProduct>
}

// Interface for the Product model (static methods)
export interface IProductModel extends Model<IProduct> {
  findDeleted(filter?: any): Promise<IProduct[]>
  findWithDeleted(filter?: any): Promise<IProduct[]>
}

// Custom validator function for price
const validatePrice = (value: number): boolean => value > 0

// Custom validator function for countInStock
const validateCountInStock = (value: number): boolean => Number.isInteger(value) && value >= 0

const productSchema = new Schema<IProduct>(
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
    // Soft delete fields - simplified
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      // Remove all validation and required flags - let it be truly optional
    },
  },
  {
    timestamps: true,
  },
)

// Pre-save middleware to ensure soft delete fields are set
productSchema.pre("save", function (next) {
  // Set defaults for soft delete fields if they don't exist
  if (this.isDeleted === undefined) {
    this.isDeleted = false
  }

  if (this.deletedAt === undefined) {
    this.deletedAt = null
  }

  // If not deleted, ensure deletedAt is null
  if (!this.isDeleted) {
    this.deletedAt = null
  }

  console.log("Pre-save middleware - isDeleted:", this.isDeleted, "deletedAt:", this.deletedAt)
  next()
})

// Instance method for soft delete
productSchema.methods.softDelete = function (this: IProduct) {
  this.isDeleted = true
  this.deletedAt = new Date()
  return this.save()
}

// Instance method for restore
productSchema.methods.restore = function (this: IProduct) {
  this.isDeleted = false
  this.deletedAt = null
  return this.save()
}

// Static method to find deleted products
productSchema.statics.findDeleted = function (filter = {}) {
  return this.find({ ...filter, isDeleted: true })
}

// Static method to find all products (including deleted)
productSchema.statics.findWithDeleted = function (filter = {}) {
  return this.find(filter)
}

// Check if the model exists, otherwise create it
const Product: IProductModel =
  (mongoose.models.Product as unknown as IProductModel) || mongoose.model<IProduct, IProductModel>("Product", productSchema)

export default Product
