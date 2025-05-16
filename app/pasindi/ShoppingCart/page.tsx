/* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { create } from "zustand";
// import { devtools, persist } from "zustand/middleware";

// interface CartItem {
//   _id: string;
//   title: string;
//   price: number;
//   quantity: number;
//   countInStock: number;
//   image?: string;
//   category?: string;
//   description?: string;
// }

// interface ShoppingCartState {
//   cartItems: CartItem[];
//   addToCart: (newItem: CartItem) => void;
//   removeFromCart: (itemId: string) => void;
//   updateItemQuantity: (itemId: string, quantity: number) => void;
//   resetCart: () => void;
// }

// const initialState: ShoppingCartState = {
//   cartItems: [],
//   addToCart: () => {},
//   removeFromCart: () => {},
//   updateItemQuantity: () => {},
//   resetCart: () => {},
// };

// const shoppingCartStore = (set: any) => ({
//   ...initialState,
//   addToCart: (newItem: CartItem) =>
//     set((state: ShoppingCartState) => {
//       const itemIndex = state.cartItems.findIndex(
//         (item) => item._id === newItem._id
//       );
//       if (itemIndex > -1) {
//         const newQuantity = state.cartItems[itemIndex].quantity + newItem.quantity;
//         const updatedItem = {
//           ...state.cartItems[itemIndex],
//           quantity: Math.min(newQuantity, newItem.countInStock),
//         };
//         return {
//           cartItems: state.cartItems.map((item) =>
//             item._id === newItem._id ? updatedItem : item
//           ),
//         };
//       } else {
//         return { cartItems: [...state.cartItems, newItem] };
//       }
//     }),
//   removeFromCart: (itemId: string) =>
//     set((state: ShoppingCartState) => ({
//       cartItems: state.cartItems.filter((item) => item._id !== itemId),
//     })),
//   updateItemQuantity: (itemId: string, quantity: number) =>
//     set((state: ShoppingCartState) => ({
//       cartItems: state.cartItems.map((item) =>
//         item._id === itemId ? { ...item, quantity } : item
//       ),
//     })),
//   resetCart: () => set({ cartItems: [] }),
// });

// export const useShoppingCartStore = create<ShoppingCartState>()(
//   devtools(
//     persist(shoppingCartStore, { name: "shoppingCartStore" }),
//     { name: "shoppingCartStore" }
//   )
// );
// ShoppingCart/page.tsx


"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState } from 'react';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, X } from 'lucide-react';
import Link from 'next/link';

// Define interfaces
interface CartItem {
  _id: string;
  title: string;
  image: string;
  price: number;
  category: string;
  description: string;
  countInStock: number;
  quantity: number;
}

interface ShoppingCartState {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
}

// Create Zustand store with persistence
export const useShoppingCartStore = create<ShoppingCartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addToCart: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i._id === item._id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i._id === item._id
                  ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.countInStock) }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },
      
      removeFromCart: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item._id !== itemId),
        }));
      },
      
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item._id === itemId
              ? { ...item, quantity: Math.min(quantity, item.countInStock) }
              : item
          ),
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      getCartTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      
      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'shopping-cart',
    }
  )
);

// Shopping Cart Component
export default function ShoppingCart() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, removeFromCart, updateQuantity, clearCart, getCartTotal, getItemCount } = useShoppingCartStore();

  const cartTotal = getCartTotal();
  const itemCount = getItemCount();

  return (
    <>
      {/* Cart Button - can be placed in navbar */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
      >
        <ShoppingBag size={24} />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      {/* Cart Sidebar */}
      <div className={`fixed inset-0 z-50 ${isOpen ? 'visible' : 'invisible'}`}>
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 ${
            isOpen ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={() => setIsOpen(false)}
        />

        {/* Cart Panel */}
        <div
          className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-2xl font-semibold">Shopping Cart ({itemCount})</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag size={64} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg">Your cart is empty</p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item._id} className="flex gap-4 bg-white p-4 rounded-lg shadow-sm border">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.title}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-md"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{item.title}</h3>
                        <p className="text-gray-600 text-sm">{item.category}</p>
                        <p className="text-red-600 font-bold">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            disabled={item.quantity >= item.countInStock}
                            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t p-4 space-y-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  <Link href="/checkout">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                      Proceed to Checkout
                    </button>
                  </Link>
                  <button
                    onClick={clearCart}
                    className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}