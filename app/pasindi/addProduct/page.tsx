/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, Package, Image as ImageIcon, DollarSign, Hash, Tag, FileText } from "lucide-react";

const AddProductForm: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [price, setPrice] = useState<number | "">("");
  const [countInStock, setCountInStock] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleImageUpload = async () => {
    if (!image) {
      alert("Please select an image!");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", image);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploading(false);

      if (!res.ok) {
        console.error("Upload failed:", data.error);
        alert("Upload failed: " + data.error);
        return;
      }

      setImageUrl(data.url);
      console.log("Uploaded URL:", data.url);
      alert("Upload successful!");
    } catch (err) {
      setUploading(false);
      console.error("Fetch error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert("Upload failed: " + errorMessage);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setError("Please upload an image");
      return;
    }
    
    const product = { image: imageUrl, title, description, category, price, countInStock };

    const response = await fetch("/api/products", {
      method: "POST",
      body: JSON.stringify(product),
      headers: { "Content-Type": "application/json" },
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error);
      return;
    }
    
    setImage(null);
    setImageUrl("");
    setTitle("");
    setDescription("");
    setCategory("");
    setPrice("");
    setCountInStock("");
    setError(null);
    console.log("New product added", json);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Add New Product</h1>
          <p className="text-gray-300 text-lg">Create a stunning product listing</p>
        </div>

        {/* Main Form Container */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6">
            <h2 className="text-2xl font-semibold text-white">Product Details</h2>
            <p className="text-red-100 mt-1">Fill in the information below to add your product</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Image Upload Section */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-600">
              <div className="flex items-center mb-4">
                <ImageIcon className="w-5 h-5 text-red-600 mr-2" />
                <label className="text-lg font-medium text-white">Product Image</label>
              </div>
              
              <div className="space-y-4">
                {/* Show uploaded image if available */}
                {imageUrl ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img 
                        src={imageUrl} 
                        alt="Uploaded product" 
                        className="w-full h-48 object-cover rounded-lg border border-gray-600"
                      />
                      <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        ✓ Uploaded
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center">
                        <ImageIcon className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-white text-sm">Image uploaded successfully</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl("");
                          setImage(null);
                        }}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm transition-colors duration-200"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-all duration-300">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-300">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                        </div>
                        <input type="file" className="hidden" onChange={handleImageChange} required />
                      </label>
                    </div>
                  </>
                )}
                
                {/* Upload button - shown when file is selected but not uploaded */}
                {image && !imageUrl && (
                  <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center">
                      <ImageIcon className="w-5 h-5 text-red-600 mr-2" />
                      <span className="text-white text-sm">{image.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={uploading}
                      className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 rounded-lg text-white text-sm font-medium transition-colors duration-200"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Product Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-white">
                  <Tag className="w-4 h-4 mr-2 text-red-600" />
                  Product Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200"
                  placeholder="Enter product title"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-white">
                  <Package className="w-4 h-4 mr-2 text-red-600" />
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="">Select category</option>
                  <option value="sports">Sports</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-white">
                  <DollarSign className="w-4 h-4 mr-2 text-red-600" />
                  Price
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* Stock Count */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-white">
                  <Hash className="w-4 h-4 mr-2 text-red-600" />
                  Stock Count
                </label>
                <input
                  type="number"
                  value={countInStock}
                  onChange={(e) => setCountInStock(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-white">
                <FileText className="w-4 h-4 mr-2 text-red-600" />
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Describe your product in detail..."
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900 border border-red-600 text-red-100 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
                  {error}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Add Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProductForm;