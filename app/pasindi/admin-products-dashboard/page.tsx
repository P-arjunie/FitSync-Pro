"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Edit, Trash2, Plus, Search, RotateCcw } from "lucide-react"

// Define TypeScript interfaces
interface Product {
  _id: string
  title: string
  category: string
  imageUrl: string
  image: string
  price: number
  description: string
  countInStock: number
  isDeleted?: boolean
  deletedAt?: string
}

const AdminProductsDashboard = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteProductName, setDeleteProductName] = useState<string>("")
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [showDeleted, setShowDeleted] = useState<boolean>(false)
  const router = useRouter()

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        // Fetch all products including deleted ones for admin dashboard
        const response = await fetch("/api/products?includeDeleted=true")
        if (!response.ok) throw new Error("Failed to fetch products")
        const data = await response.json()
        setProducts(data)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Filter products based on search term and deleted status
  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDeletedFilter = showDeleted 
      ? product.isDeleted === true 
      : !product.isDeleted
    
    return matchesSearch && matchesDeletedFilter
  })

  // Handle delete product (soft delete)
  const handleDeleteClick = (id: string, productName: string) => {
    setDeleteId(id)
    setDeleteProductName(productName)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    try {
      console.log('Attempting to delete product with ID:', deleteId)
      
      const response = await fetch(`/api/products/${deleteId}`, {
        method: "DELETE",
      })

      console.log('Delete response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('Delete response:', result)
        
        // Update product in state to show as deleted
        setProducts(products.map(product => 
          product._id === deleteId 
            ? { ...product, isDeleted: true, deletedAt: new Date().toISOString() }
            : product
        ))
        setShowDeleteModal(false)
        setDeleteId(null)
        setDeleteProductName("")
      } else {
        const errorData = await response.json()
        console.error("Failed to delete product:", errorData)
      }
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  // Handle restore product
  const handleRestoreProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "restore" }),
      })

      if (response.ok) {
        // Update product in state to show as restored
        setProducts(products.map(product => 
          product._id === id 
            ? { ...product, isDeleted: false, deletedAt: undefined }
            : product
        ))
      } else {
        console.error("Failed to restore product")
      }
    } catch (error) {
      console.error("Error restoring product:", error)
    }
  }

  // Handle edit product
  const handleEditClick = (id: string) => {
    router.push(`/pasindi/admin/products/edit/${id}`) // Fixed path
  }

  // Handle add new product
  const handleAddProduct = () => {
    router.push("/pasindi/addProduct") // Fixed path
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
              Product Management
            </h1>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              {/* Toggle Deleted Products */}
              <button
                onClick={() => setShowDeleted(!showDeleted)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showDeleted
                    ? "bg-red-100 text-red-700 border border-red-300"
                    : "bg-gray-100 text-gray-700 border border-gray-300"
                }`}
              >
                {showDeleted ? "Show Active" : "Show Deleted"}
              </button>

              {/* Search */}
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>

              {/* Add Product Button */}
              <button
                onClick={handleAddProduct}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus size={18} />
                Add Product
              </button>
            </div>
          </div>

          {/* Products Table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr 
                        key={product._id} 
                        className={`hover:bg-gray-50 ${
                          product.isDeleted ? 'opacity-60 bg-red-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-16 w-16 relative">
                            <Image
                              src={product.image || product.imageUrl || "/placeholder.svg"}
                              alt={product.title}
                              fill
                              className="object-cover rounded-md"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-800">
                            {product.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-800 text-white">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.countInStock > 10
                                ? "bg-gray-800 text-white"
                                : product.countInStock > 0
                                  ? "bg-red-600 text-white"
                                  : "bg-red-600 text-white"
                            }`}
                          >
                            {product.countInStock} in stock
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.isDeleted
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {product.isDeleted ? "Deleted" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {!product.isDeleted ? (
                              <>
                                <button
                                  onClick={() => handleEditClick(product._id)}
                                  className="text-gray-800 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                                >
                                  <Edit size={18} />
                                  <span className="sr-only">Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(product._id, product.title)}
                                  className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                                >
                                  <Trash2 size={18} />
                                  <span className="sr-only">Delete</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleRestoreProduct(product._id)}
                                className="text-green-600 hover:text-green-700 p-1 rounded-full hover:bg-green-100"
                              >
                                <RotateCcw size={18} />
                                <span className="sr-only">Restore</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        {showDeleted ? "No deleted products found" : "No products found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Confirm Delete</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete <strong>&quot;{deleteProductName}&quot;</strong>? 
              This will move it to deleted items but preserve order history. 
              You can restore it later if needed.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteId(null)
                  setDeleteProductName("")
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProductsDashboard