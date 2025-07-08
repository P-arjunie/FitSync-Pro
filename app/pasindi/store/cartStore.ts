// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { create } from "zustand"
// import { devtools, persist } from "zustand/middleware"

// interface CartItem {
//   _id: string
//   title: string
//   price: number
//   quantity: number
//   countInStock: number
//   image?: string
//   category?: string
//   description?: string
// }

// interface ShoppingCartState {
//   cartItems: CartItem[]
//   addToCart: (newItem: CartItem) => void
//   removeFromCart: (itemId: string) => void
//   updateItemQuantity: (itemId: string, quantity: number) => void
//   resetCart: () => void
// }

// const initialState: ShoppingCartState = {
//   cartItems: [],
//   addToCart: () => {},
//   removeFromCart: () => {},
//   updateItemQuantity: () => {},
//   resetCart: () => {},
// }

// const shoppingCartStore = (set: any) => ({
//   ...initialState,
//   addToCart: (newItem: CartItem) =>
//     set((state: ShoppingCartState) => {
//       const itemIndex = state.cartItems.findIndex((item) => item._id === newItem._id)
//       if (itemIndex > -1) {
//         const newQuantity = state.cartItems[itemIndex].quantity + newItem.quantity
//         const updatedItem = {
//           ...state.cartItems[itemIndex],
//           quantity: Math.min(newQuantity, newItem.countInStock),
//         }
//         return {
//           cartItems: state.cartItems.map((item) => (item._id === newItem._id ? updatedItem : item)),
//         }
//       } else {
//         return { cartItems: [...state.cartItems, newItem] }
//       }
//     }),
//   removeFromCart: (itemId: string) =>
//     set((state: ShoppingCartState) => ({
//       cartItems: state.cartItems.filter((item) => item._id !== itemId),
//     })),
//   updateItemQuantity: (itemId: string, quantity: number) =>
//     set((state: ShoppingCartState) => ({
//       cartItems: state.cartItems.map((item) => (item._id === itemId ? { ...item, quantity } : item)),
//     })),
//   resetCart: () => set({ cartItems: [] }),
// })

// export const useShoppingCartStore = create<ShoppingCartState>()(
//   devtools(persist(shoppingCartStore, { name: "shoppingCartStore" }), { name: "shoppingCartStore" }),
// )
