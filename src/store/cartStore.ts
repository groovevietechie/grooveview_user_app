import { create } from 'zustand'
import { Cart, MenuItem } from '@/types/database'

interface CartStore extends Cart {
  addItem: (item: MenuItem, quantity?: number, note?: string) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  updateNote: (itemId: string, note: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  setBusinessId: (businessId: string) => void
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  businessId: '',

  addItem: (item: MenuItem, quantity = 1, note = '') => {
    set((state) => {
      const existingItem = state.items.find(cartItem => cartItem.menuItem.id === item.id)

      if (existingItem) {
        return {
          items: state.items.map(cartItem =>
            cartItem.menuItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + quantity, note: note || cartItem.note }
              : cartItem
          )
        }
      }

      return {
        items: [...state.items, { menuItem: item, quantity, note }]
      }
    })
  },

  removeItem: (itemId: string) => {
    set((state) => ({
      items: state.items.filter(cartItem => cartItem.menuItem.id !== itemId)
    }))
  },

  updateQuantity: (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(itemId)
      return
    }

    set((state) => ({
      items: state.items.map(cartItem =>
        cartItem.menuItem.id === itemId
          ? { ...cartItem, quantity }
          : cartItem
      )
    }))
  },

  updateNote: (itemId: string, note: string) => {
    set((state) => ({
      items: state.items.map(cartItem =>
        cartItem.menuItem.id === itemId
          ? { ...cartItem, note }
          : cartItem
      )
    }))
  },

  clearCart: () => {
    set({ items: [] })
  },

  getTotal: () => {
    return get().items.reduce((total, cartItem) => {
      return total + (cartItem.menuItem.price * cartItem.quantity)
    }, 0)
  },

  getItemCount: () => {
    return get().items.reduce((count, cartItem) => count + cartItem.quantity, 0)
  },

  setBusinessId: (businessId: string) => {
    set({ businessId })
  }
}))