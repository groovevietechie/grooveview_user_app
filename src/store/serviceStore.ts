import { create } from 'zustand'
import type { ServiceCart, ServiceCartItem, ServiceOption, MenuItem } from '@/types/database'

interface ServiceStore extends ServiceCart {
  addServiceItem: (item: ServiceOption, quantity?: number, note?: string) => void
  removeServiceItem: (itemId: string) => void
  updateServiceQuantity: (itemId: string, quantity: number) => void
  updateServiceNote: (itemId: string, note: string) => void
  clearServiceCart: () => void
  getServiceTotal: (basePrice?: number) => number
  getServiceItemCount: () => number
  setServiceType: (serviceType: string | null) => void
  updateBookingDetails: (details: Partial<ServiceCart['bookingDetails']>) => void
  setBusinessId: (businessId: string) => void
  setSelectedDuration: (duration: { label: string; hours: number; multiplier: number }) => void
  // Pre-order functionality
  setPreOrderEnabled: (enabled: boolean) => void
  addPreOrderItem: (item: MenuItem, quantity?: number, note?: string) => void
  removePreOrderItem: (itemId: string) => void
  updatePreOrderQuantity: (itemId: string, quantity: number) => void
  updatePreOrderNote: (itemId: string, note: string) => void
  getPreOrderTotal: () => number
  getPreOrderItemCount: () => number
  businessId: string
}

export const useServiceStore = create<ServiceStore>((set, get) => ({
  serviceType: null,
  businessId: '',
  items: [],
  selectedDuration: undefined,
  preOrderEnabled: false,
  preOrderItems: [],
  bookingDetails: {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    eventDate: '',
    numberOfParticipants: 1,
    specialRequests: '',
  },

  addServiceItem: (item: ServiceOption, quantity = 1, note = '') => {
    set((state) => {
      const existingItem = state.items.find(cartItem => cartItem.serviceOption.id === item.id)

      if (existingItem) {
        return {
          items: state.items.map(cartItem =>
            cartItem.serviceOption.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + quantity, note: note || cartItem.note }
              : cartItem
          )
        }
      }

      return {
        items: [...state.items, { serviceOption: item, quantity, note }]
      }
    })
  },

  removeServiceItem: (itemId: string) => {
    set((state) => ({
      items: state.items.filter(cartItem => cartItem.serviceOption.id !== itemId)
    }))
  },

  updateServiceQuantity: (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeServiceItem(itemId)
      return
    }

    set((state) => ({
      items: state.items.map(cartItem =>
        cartItem.serviceOption.id === itemId
          ? { ...cartItem, quantity }
          : cartItem
      )
    }))
  },

  updateServiceNote: (itemId: string, note: string) => {
    set((state) => ({
      items: state.items.map(cartItem =>
        cartItem.serviceOption.id === itemId
          ? { ...cartItem, note }
          : cartItem
      )
    }))
  },

  clearServiceCart: () => {
    set({
      items: [],
      selectedDuration: undefined,
      preOrderEnabled: false,
      preOrderItems: [],
      bookingDetails: {
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        eventDate: '',
        numberOfParticipants: 1,
        specialRequests: '',
      }
    })
  },

  getServiceTotal: (basePrice = 0) => {
    const state = get()
    let total = basePrice

    // Add selected options
    total += state.items.reduce((sum, cartItem) => {
      return sum + (cartItem.serviceOption.price * cartItem.quantity)
    }, 0)

    // Add pre-order items if enabled
    if (state.preOrderEnabled) {
      total += state.preOrderItems.reduce((sum, preOrderItem) => {
        return sum + (preOrderItem.menuItem.price * preOrderItem.quantity)
      }, 0)
    }

    // Apply duration multiplier if selected
    if (state.selectedDuration) {
      total *= state.selectedDuration.multiplier
    }

    return total
  },

  getServiceItemCount: () => {
    return get().items.reduce((total, cartItem) => total + cartItem.quantity, 0)
  },

  setServiceType: (serviceType: string | null) => {
    set({ serviceType })
  },

  updateBookingDetails: (details: Partial<ServiceCart['bookingDetails']>) => {
    set((state) => ({
      bookingDetails: { ...state.bookingDetails, ...details }
    }))
  },

  setBusinessId: (businessId: string) => {
    set({ businessId })
  },

  setSelectedDuration: (duration: { label: string; hours: number; multiplier: number }) => {
    set({ selectedDuration: duration })
  },

  setPreOrderEnabled: (enabled: boolean) => {
    set({ preOrderEnabled: enabled })
  },

  addPreOrderItem: (item: MenuItem, quantity = 1, note = '') => {
    set((state) => {
      const existingItem = state.preOrderItems.find(preOrderItem => preOrderItem.menuItem.id === item.id)

      if (existingItem) {
        return {
          preOrderItems: state.preOrderItems.map(preOrderItem =>
            preOrderItem.menuItem.id === item.id
              ? { ...preOrderItem, quantity: preOrderItem.quantity + quantity, note: note || preOrderItem.note }
              : preOrderItem
          )
        }
      }

      return {
        preOrderItems: [...state.preOrderItems, { menuItem: item, quantity, note }]
      }
    })
  },

  removePreOrderItem: (itemId: string) => {
    set((state) => ({
      preOrderItems: state.preOrderItems.filter(preOrderItem => preOrderItem.menuItem.id !== itemId)
    }))
  },

  updatePreOrderQuantity: (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removePreOrderItem(itemId)
      return
    }

    set((state) => ({
      preOrderItems: state.preOrderItems.map(preOrderItem =>
        preOrderItem.menuItem.id === itemId
          ? { ...preOrderItem, quantity }
          : preOrderItem
      )
    }))
  },

  updatePreOrderNote: (itemId: string, note: string) => {
    set((state) => ({
      preOrderItems: state.preOrderItems.map(preOrderItem =>
        preOrderItem.menuItem.id === itemId
          ? { ...preOrderItem, note }
          : preOrderItem
      )
    }))
  },

  getPreOrderTotal: () => {
    return get().preOrderItems.reduce((total, preOrderItem) => {
      return total + (preOrderItem.menuItem.price * preOrderItem.quantity)
    }, 0)
  },

  getPreOrderItemCount: () => {
    return get().preOrderItems.reduce((total, preOrderItem) => total + preOrderItem.quantity, 0)
  },
}))