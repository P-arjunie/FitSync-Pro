"use client"

import type React from "react"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Upload, Package, ImageIcon, DollarSign, Hash, Tag, FileText, ArrowLeft, CheckCircle } from "lucide-react"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const AddProductForm: React.FC = () => {
  const router = useRouter()
  const [title, setTitle] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  const [price, setPrice] = useState<number | "">("")
  const [countInStock, setCountInStock] = useState<number | "">("")
  const [error, setError] = useState<string | null>(null)
  const [image, setImage] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [uploading, setUploading] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImage(e.dataTransfer.files[0])
    }
  }

  const handleAreaClick = () => {
    const fileInput = document.getElementById('image-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.click()
    }
  }

  const handleImageUpload = async () => {
    if (!image) {
      toast.error("Please select an image!")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", image)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      setUploading(false)

      if (!res.ok) {
        console.error("Upload failed:", data.error)
        toast.error("Upload failed: " + data.error)
        return
      }

      setImageUrl(data.url)
      console.log("Uploaded URL:", data.url)
      toast.success("Upload successful!")
    } catch (err) {
      setUploading(false)
      console.error("Fetch error:", err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      toast.error("Upload failed: " + errorMessage)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!imageUrl) {
      setError("Please upload an image")
      return
    }

    setSubmitting(true)
    setError(null)

    const product = {
      image: imageUrl,
      title,
      description,
      category,
      price: Number(price),
      countInStock: Number(countInStock),
    }

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        body: JSON.stringify(product),
        headers: { "Content-Type": "application/json" },
      })

      const json = await response.json()

      if (!response.ok) {
        setError(json.error || "Failed to add product")
        setSubmitting(false)
        return
      }

      // Reset form
      setImage(null)
      setImageUrl("")
      setTitle("")
      setDescription("")
      setCategory("")
      setPrice("")
      setCountInStock("")
      setError(null)

      console.log("New product added", json)
      router.push("/pasindi/admin-products-dashboard")
    } catch (err) {
      console.error("Submit error:", err)
      setError("Failed to add product")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/pasindi/admin-products-dashboard")}
              className="flex items-center justify-center w-12 h-12 bg-black hover:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-800"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-black">Add New Product</h1>
              <p className="text-gray-800 mt-2 text-lg">Add premium fitness equipments & suppliments to your gym inventory</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 rounded-full shadow-lg border border-red-800">
            <Package className="w-5 h-5 text-white" />
            <span className="text-sm font-semibold text-white">Product Form</span>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl border-2 border-black overflow-hidden max-w-5xl mx-auto">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-black via-gray-900 to-black px-8 py-6 border-b-2 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Equipment & Suppliment Information</h2>
                <p className="text-gray-300 mt-1">Add professional fitness products to your inventory</p>
              </div>
              <div className="bg-red-600 border-2 border-red-500 p-3 rounded-full shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {/* Image Upload Section */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-2 rounded-lg mr-3 border border-red-500 shadow-lg">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Product Image</h3>
                  <p className="text-gray-300 text-sm">Upload a high-quality image of your fitness equipment or suppliment</p>
                </div>
              </div>

              <div 
                className="bg-gray-900 rounded-xl p-6 border-2 border-dashed border-gray-600 hover:border-red-500 transition-colors duration-200 cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleAreaClick}
              >
                {imageUrl ? (
                  <div className="space-y-4">
                    <div className="relative group">
                      <Image
                        src={imageUrl || "/placeholder.svg"}
                        alt="Uploaded equipment"
                        width={800}
                        height={400}
                        className="w-full product-image-upload object-cover rounded-xl shadow-lg border border-gray-700"
                        style={{ objectFit: "cover" }}
                        priority
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-xl transition-all duration-200"></div>
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg flex items-center space-x-1 border border-red-500">
                        <CheckCircle className="w-4 h-4" />
                        <span>Uploaded</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-black rounded-lg p-4 shadow-sm border border-red-600">
                      <div className="flex items-center space-x-3">
                        <div className="bg-red-600 p-2 rounded-full border border-red-500">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Equipment image uploaded successfully</p>
                          <p className="text-gray-300 text-sm">Ready to use in your equipment listing</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl("")
                          setImage(null)
                        }}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 border border-gray-600"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mx-auto w-20 h-20 bg-black rounded-full flex items-center justify-center mb-4 border-2 border-red-600 shadow-lg">
                      <Upload className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="image-upload" className="cursor-pointer block w-full">
                        <div className="w-full">
                          <span className="text-lg font-semibold text-white hover:text-gray-300 transition-colors duration-200">
                            Click to upload an image
                          </span>
                          <input 
                            id="image-upload"
                            type="file" 
                            className="hidden" 
                            onChange={handleImageChange} 
                            accept="image/*" 
                          />
                        </div>
                      </label>
                      <p className="text-gray-400 mt-1">or drag and drop your file here</p>
                    </div>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                      <span>PNG, JPG, GIF</span>
                      <span>•</span>
                      <span>Max 10MB</span>
                    </div>
                  </div>
                )}

                {/* Upload button - shown when file is selected but not uploaded */}
                {image && !imageUrl && (
                  <div className="flex items-center justify-between bg-black rounded-lg p-4 shadow-sm border border-gray-600 mt-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-800 p-2 rounded-full border border-gray-600">
                        <ImageIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{image.name}</p>
                        <p className="text-gray-300 text-sm">Ready to upload</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents triggering the parent div's onClick
                        handleImageUpload();
                      }}
                      disabled={uploading}
                      className="inline-flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg border border-gray-600"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Product Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="flex items-center text-sm font-semibold text-white mb-2">
                    <div className="bg-gradient-to-r from-red-600 to-red-700 p-1 rounded mr-2 border border-red-500">
                      <Tag className="w-3 h-3 text-white" />
                    </div>
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-4 bg-white border-2 border-gray-600 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-500"
                    placeholder="Enter equipment or suppliment name (e.g., Treadmill, Dumbbells)"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="flex items-center text-sm font-semibold text-white mb-2">
                    <div className="bg-gradient-to-r from-red-600 to-red-700 p-1 rounded mr-2 border border-red-500">
                      <Package className="w-3 h-3 text-white" />
                    </div>
                    Product Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-4 bg-white border-2 border-gray-600 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-500"
                    required
                  >
                    <option value="">Select equipment category</option>
                    <option value="equipment">Fitness Equipment</option>
                    <option value="accessories">Training Accessories</option>
                    <option value="gear">Apparel & Gear</option>
                    <option value="supplements">Supplements</option>
                    <option value="snacks & drinks">Snacks & Drinks</option>
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Price */}
                <div>
                  <label className="flex items-center text-sm font-semibold text-white mb-2">
                    <div className="bg-gradient-to-r from-red-600 to-red-700 p-1 rounded mr-2 border border-red-500">
                      <DollarSign className="w-3 h-3 text-white" />
                    </div>
                    Price (USD)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-lg">$</span>
                    </div>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-4 bg-white border-2 border-gray-600 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                {/* Stock Count */}
                <div>
                  <label className="flex items-center text-sm font-semibold text-white mb-2">
                    <div className="bg-gradient-to-r from-red-600 to-red-700 p-1 rounded mr-2 border border-red-500">
                      <Hash className="w-3 h-3 text-white" />
                    </div>
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={countInStock}
                    onChange={(e) => setCountInStock(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-4 bg-white border-2 border-gray-600 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-500"
                    placeholder="Enter available quantity"
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <label className="flex items-center text-sm font-semibold text-white mb-2">
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-1 rounded mr-2 border border-red-500">
                  <FileText className="w-3 h-3 text-white" />
                </div>
                Product Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full px-4 py-4 bg-white border-2 border-gray-600 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-500 resize-none"
                placeholder="Describe the equipment specifications, features, and benefits. Include details about dimensions, weight capacity, material, and any special features that make this equipment suitable for your gym..."
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900 border-2 border-red-700 text-red-200 px-6 py-4 rounded-xl mb-6">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4 pt-8 border-t border-gray-600">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors duration-200 shadow-md hover:shadow-lg border border-gray-600"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="px-12 py-4 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 disabled:bg-gray-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100 transition-all duration-200 border-2 border-red-500"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Adding Product...
                  </div>
                ) : (
                  "Add Product"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  )
}

export default AddProductForm