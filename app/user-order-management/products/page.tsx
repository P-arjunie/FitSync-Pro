/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ItemDetails from "../components/ProductDetails";

import { Search, Filter, Dumbbell, Zap, Heart } from 'lucide-react';
import Toast from "@/utils/Toast";
import { ToastContainer } from "@/utils/Toast";

// Define TypeScript interfaces
interface Product {
  _id: string;
  title: string;
  category: string;
  imageUrl: string;
  image: string;
  price: number;
  description: string;
  countInStock: number;
}

const Products = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>("name");
  const itemsPerPage = 20;
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Failed to fetch items");
        const json = await response.json();
        setItems(json);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };
    fetchItems();
  }, []); //stores in items state

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  useEffect(() => {
    if (userId) {
      console.log("User ID:", userId);
    }
  }, [userId]);

  // Filter items
  const filteredItems = items.filter(
    (item) =>
      (item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedCategory === "" || item.category === selectedCategory)
  );

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "name":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  // Unique categories
  const categories = [...new Set(items.map((item) => item.category))];

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

  // Handlers
  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handlePreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleAddToCart = (item: Product) => {
    if (!userId) {
      Toast({ type: "error", message: "Please log in to add items to cart." });
      return;
    }
    // In a real application, you would send an API request to add the item to the cart
    // For now, we'll just show a toast message
    Toast({ type: "success", message: "Item added to cart!" });
  };

  return (
    <div className="min-h-screen bg-white">
      <ToastContainer />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Header */}
        {/* Hero Header with Background Image */}
        <div className="relative mb-12 rounded-3xl overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
            }}
          ></div>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60"></div>
          
          {/* Content */}
          <div className="relative py-20 px-8 text-center text-white">
            <div className="flex justify-center items-center gap-3 mb-6">
              <Dumbbell className="text-red-500" size={50} />
              <h1 className="text-6xl font-bold">
                GYM <span className="text-red-500">STORE</span>
              </h1>
              {/* <Heart className="text-red-500" size={50} /> */}
            </div>
            <p className="text-2xl mb-4 font-semibold">Premium Equipment & Supplements</p>
            <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
              Transform your fitness journey with our professional-grade products
            </p>
            
            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Shop Now
              </button>
              
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="text-gray-800" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">Find Your Perfect Gear</h2>
          </div>
          
          <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="search"
                placeholder="Search equipment, supplements, accessories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 placeholder-gray-400 text-lg"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 font-medium text-lg min-w-[200px]"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 font-medium text-lg min-w-[200px]"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Zap className="inline mr-2" size={20} />
              Search
            </button>
          </form>
        </div>

        {/* Results count with stats */}
        <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-gray-800">
              <span className="text-lg font-semibold">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedItems.length)} of {sortedItems.length} products
              </span>
            </div>
            <div className="flex gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span>Premium Quality</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                <span>Fast Shipping</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {currentItems.map((item) => (
            <div key={item._id} className="w-full transform hover:scale-105 transition-transform duration-300">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-gray-100 overflow-hidden">
                <ItemDetails item={item} />
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ${
                currentPage === 1 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                  : "bg-gray-800 text-white hover:bg-black shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              }`}
            >
              Previous
            </button>
            
            <div className="flex gap-2">
              {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-12 h-12 rounded-xl font-bold text-lg transition-all duration-300 ${
                      currentPage === pageNumber
                        ? "bg-red-600 text-white shadow-lg transform scale-110"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="px-3 py-3 text-gray-500">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`w-12 h-12 rounded-xl font-bold text-lg transition-all duration-300 ${
                      currentPage === totalPages
                        ? "bg-red-600 text-white shadow-lg transform scale-110"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ${
                currentPage === totalPages 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                  : "bg-gray-800 text-white hover:bg-black shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-16 p-8 bg-gradient-to-r from-gray-800 to-black rounded-2xl text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-red-500 mb-2">{items.length}+</div>
              <div className="text-gray-300">Products Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500 mb-2">24/7</div>
              <div className="text-gray-300">Customer Support</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500 mb-2">100%</div>
              <div className="text-gray-300">Quality Guarantee</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;