/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react"
import { useRouter, useParams } from "next/navigation"
import { Upload, ArrowLeft } from "lucide-react"
import Image from "next/image"

interface ProductData { //product obj
  _id: string
  title: string
  description: string
  category: string
  price: number
  countInStock: number
  image: string
  imageUrl: string
}

const EditProduct = () => {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string // Extracting id from params

  const [title, setTitle] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  const [price, setPrice] = useState<number | "">("")
  const [countInStock, setCountInStock] = useState<number | "">("")
  const [error, setError] = useState<string | null>(null)
  const [image, setImage] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("")
  const [uploading, setUploading] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Fetch product data when component loads/ id change
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/products/${id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch product")
        }

        const product: ProductData = await response.json()
        //update the states with fetched data 
        setTitle(product.title)
        setDescription(product.description)
        setCategory(product.category)
        setPrice(product.price)
        setCountInStock(product.countInStock)
        setCurrentImageUrl(product.image || product.imageUrl)
        setImageUrl(product.image || product.imageUrl)
      } catch (error) {
        console.error("Error fetching product:", error)
        setError("Failed to load product data")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchProduct()
    }
  }, [id])
  //image upload 
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0])
    }
  }

  const handleImageUpload = async () => {
    if (!image) return alert("Please select an image!")

    setUploading(true)
    const formData = new FormData()
    formData.append("image", image)

    try {
      const res = await fetch("/api/upload", {//cloudinary 
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      setUploading(false)

      if (data.success) {
        setImageUrl(data.url)
        alert("Image uploaded successfully!")
      } else {
        alert("Upload failed")
      }
    } catch (error) {
      setUploading(false)
      alert("Upload error")
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const productData = {
      title,
      description,
      category,
      price,
      countInStock,
      image: imageUrl || currentImageUrl,
    }

    try {
      const response = await fetch(`/api/products/${id}`, { //update dta 
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update product")
      }

      // navigate back to admin dashboard
      router.push("/admin-order-management/admin-products-dashboard")
    } catch (error) {
      console.error("Error updating product:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    }
  }

  if (isLoading) { //spinner loading
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.push("/admin/products")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Product</h1>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Image Preview */}
            {currentImageUrl && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Image</label>
                <div className="relative h-48 w-48 mb-2">
                  <Image
                    src={currentImageUrl || "/placeholder.svg"}
                    alt="Current product image"
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              </div>
            )}

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Product Image</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-gray-200 text-gray-800 rounded-md px-4 py-2 hover:bg-gray-300">
                  Choose File
                  <input type="file" className="sr-only" onChange={handleImageChange} />
                </label>
                <span className="text-sm text-gray-500">{image ? image.name : "No file chosen"}</span>
                <button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={!image || uploading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Count in Stock</label>
                <input
                  type="number"
                  value={countInStock}
                  onChange={(e) => setCountInStock(e.target.value === "" ? "" : Number(e.target.value))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
                  min="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
                required
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push("/admin-order-management/admin-products-dashboard")}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                Update Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditProduct
