"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ItemDetails from "../components/ProductDetails";

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

const Medicine = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 40;
  const router = useRouter();

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
  }, [selectedCategory]);

  // Filter items
  const filteredItems = items.filter(
    (item) =>
      (item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedCategory === "" || item.category === selectedCategory)
  );

  // Unique categories
  const categories = [...new Set(items.map((item) => item.category))];

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Handlers
  const handleCategoryClick = (category: string) => setSelectedCategory(category);
  const handleMCategoryClick = (route: string) => router.push(route);
  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handlePreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  return (
    <div className="px-6 py-4">
      {/* 🔍 Search Bar */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <input
          type="search"
          placeholder="Search for a product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-black rounded-lg focus:outline-none w-[250px]"
        />
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Search
        </button>
      </div>

      {/* 🛍️ Product List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.map((item) => (
          <div key={item._id} className="w-full">
            <ItemDetails item={item} />
          </div>
        ))}
      </div>

      {/* 🔄 Pagination */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-lg text-white ${
            currentPage === 1 ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          Previous
        </button>
        <span className="text-black font-semibold">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-lg text-white ${
            currentPage === totalPages ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Medicine;
