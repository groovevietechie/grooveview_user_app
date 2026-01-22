import { create } from 'zustand'
import { Cart, MenuItem, SelectedOption } from '@/types/database'

interface CartStore extends Cart {
  addItem: (item: MenuItem, quantity?: number, selectedOptions?: SelectedOption[], note?: string) => void
  removeItem: (itemId: string, optionsHash?: string) => void
  updateQuantity: (itemId: string, quantity: number, optionsHash?: string) => void
  updateNote: (itemId: string, note: string, optionsHash?: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  setBusinessId: (businessId: string) => void
}

// Helper function to create a hash for selected options to differentiate cart items
const createOptionsHash = (selectedOptions: SelectedOption[]): string => {
  if (!selectedOptions || selectedOptions.length === 0) return 'no-options'
  
  return selectedOptions
    .sort((a, b) => a.optionId.localeCompare(b.optionId))
    .map(option => `${option.optionId}:${option.price}`)
    .join('|')
}

// Helper function to calculate item total including options
const calculateItemTotal = (item: MenuItem, selectedOptions: SelectedOption[], quantity: number): number => {
  const basePrice = item.price
  const optionsPrice = selectedOptions.reduce((total, option) => total + option.price, 0)
  return (basePrice + optionsPrice) * quantity
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  businessId: '',

  addItem: (item: MenuItem, quantity = 1, selectedOptions = [], note = '') => {
    set((state) => {
      const optionsHash = createOptionsHash(selectedOptions)
      const itemKey = `${item.id}-${optionsHash}`
      
      const existingItem = state.items.find(cartItem => {
        const existingOptionsHash = createOptionsHash(cartItem.selectedOptions)
        return cartItem.menuItem.id === item.id && existingOptionsHash === optionsHash
      })

      if (existingItem) {
        return {
          items: state.items.map(cartItem => {
            const existingOptionsHash = createOptionsHash(cartItem.selectedOptions)
            return cartItem.menuItem.id === item.id && existingOptionsHash === optionsHash
              ? { ...cartItem, quantity: cartItem.quantity + quantity, note: note || cartItem.note }
              : cartItem
          })
        }
      }

      return {
        items: [...state.items, { menuItem: item, quantity, selectedOptions, note }]
      }
    })
  },

  removeItem: (itemId: string, optionsHash?: string) => {
    set((state) => ({
      items: state.items.filter(cartItem => {
        if (optionsHash) {
          const existingOptionsHash = createOptionsHash(cartItem.selectedOptions)
          return !(cartItem.menuItem.id === itemId && existingOptionsHash === optionsHash)
        }
        return cartItem.menuItem.id !== itemId
      })
    }))
  },

  updateQuantity: (itemId: string, quantity: number, optionsHash?: string) => {
    if (quantity <= 0) {
      get().removeItem(itemId, optionsHash)
      return
    }

    set((state) => ({
      items: state.items.map(cartItem => {
        if (optionsHash) {
          const existingOptionsHash = createOptionsHash(cartItem.selectedOptions)
          return cartItem.menuItem.id === itemId && existingOptionsHash === optionsHash
            ? { ...cartItem, quantity }
            : cartItem
        }
        return cartItem.menuItem.id === itemId
          ? { ...cartItem, quantity }
          : cartItem
      })
    }))
  },

  updateNote: (itemId: string, note: string, optionsHash?: string) => {
    set((state) => ({
      items: state.items.map(cartItem => {
        if (optionsHash) {
          const existingOptionsHash = createOptionsHash(cartItem.selectedOptions)
          return cartItem.menuItem.id === itemId && existingOptionsHash === optionsHash
            ? { ...cartItem, note }
            : cartItem
        }
        return cartItem.menuItem.id === itemId
          ? { ...cartItem, note }
          : cartItem
      })
    }))
  },

  clearCart: () => {
    set({ items: [] })
  },

  getTotal: () => {
    return get().items.reduce((total, cartItem) => {
      return total + calculateItemTotal(cartItem.menuItem, cartItem.selectedOptions, cartItem.quantity)
    }, 0)
  },

  getItemCount: () => {
    return get().items.reduce((count, cartItem) => count + cartItem.quantity, 0)
  },

  setBusinessId: (businessId: string) => {
    set({ businessId })
  }
}))