import { useState } from "react";
import { useShoppingCartStore } from "../ShoppingCart/page";
import Toast from "../utils/Toast";
import Image from "next/image";
import { ShoppingCart } from 'lucide-react';
// import styles from "./ProductDetails.module.css"; // Use CSS modules

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
  };

  return (
<div className="w-full max-w-[300px] mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
        <div
          className="relative group"
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        >
          <div className="aspect-square relative overflow-hidden">
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
          
          <div className="p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h4>
            <p className="text-xl font-bold text-gray-900 mb-4">${item.price.toFixed(2)}</p>
            
            {isHovering && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-600">{item.category}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
                <p className="text-sm text-gray-600">
                  <strong>Items Available: </strong>{item.countInStock}
                </p>
              </div>
            )}
            
            <div className="mt-4 flex items-center gap-2">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                max={item?.countInStock}
                className="w-20 px-2 py-1 border border-gray-300 rounded-md text-center"
              />
              
              <button
                onClick={handleAddToCart}
                disabled={item?.countInStock === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={20} />
                <span>ADD TO CART</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
