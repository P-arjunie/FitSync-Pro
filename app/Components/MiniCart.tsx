// Components/MiniCart.tsx
"use client";

import { useShoppingCartStore } from '../user-order-management/ShoppingCart/page';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function MiniCart() {
  const { getItemCount, getCartTotal } = useShoppingCartStore();
  const itemCount = getItemCount();
  const cartTotal = getCartTotal();

  return (
    <Link href="/user-order-management/cart">
      <button className="relative group flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
        <ShoppingCart className="w-5 h-5 text-gray-700 group-hover:text-red-600 transition-colors" />
        
        {itemCount > 0 && (
          <>
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
            <span className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition-colors">
              ${cartTotal.toFixed(2)}
            </span>
          </>
        )}
        
        {itemCount === 0 && (
          <span className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition-colors">
            Cart
          </span>
        )}
      </button>
    </Link>
  );
}