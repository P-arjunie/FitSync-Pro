
"use client";

import { useState } from "react";
import { useShoppingCartStore } from "../ShoppingCart/page";
import Toast from "../../utils/Toast";
import Image from "next/image";
import { ShoppingCart } from 'lucide-react';

// Define TypeScript interfaces
interface Product {
  _id: string;
  title: string;
  image: string;
  price: number;
  category: string;
  description: string;
  countInStock: number;
}

interface ItemDetailsProps {
  item: Product;
}

const ItemDetails: React.FC<ItemDetailsProps> = ({ item }) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const { addToCart } = useShoppingCartStore();

  const handleMouseOver = () => setIsHovering(true);
  const handleMouseOut = () => setIsHovering(false);

  const handleAddToCart = () => {
    const itemToAdd = {
      ...item,
      quantity: Math.min(quantity, item?.countInStock),
    };
    addToCart(itemToAdd);
    Toast({ type: "success", message: "Added to cart" });
    setQuantity(1); // Reset quantity after adding to cart
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col hover:scale-105 hover:z-10 relative">
        <div
          className="relative group flex-1 flex flex-col"
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        >
          <div className="product-card-image relative overflow-hidden flex-shrink-0">
            <Image
              src={item.image}
              alt={item.title}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              layout="fill"
            />
            {item.countInStock === 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white text-lg font-semibold">Out of Stock</span>
              </div>
            )}
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                {item.title}
              </h4>
              <p className="text-xl font-bold text-red-600 mb-4">
                ${item.price.toFixed(2)}
              </p>

              {isHovering && (
                <div className="mt-2 space-y-2 animate-fadeIn">
                  <p className="text-sm text-gray-600 font-medium">{item.category}</p>
                  <p className="text-sm text-gray-600 line-clamp-3">{item.description}</p>
                  <p className="text-sm text-gray-600">
                    <strong>In Stock: </strong>
                    <span className={item.countInStock > 0 ? "text-green-600" : "text-red-600"}>
                      {item.countInStock}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-auto pt-4 flex items-center gap-2">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                max={item?.countInStock}
                className="w-20 px-2 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-red-500"
              />

              <button
                onClick={handleAddToCart}
                disabled={item?.countInStock === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={20} />
                <span className="font-semibold">ADD TO CART</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;