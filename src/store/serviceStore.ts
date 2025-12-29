import { create } from 'zustand'
import type { ServiceCart, ServiceCartItem, ServiceOption } from '@/types/database'

interface ServiceStore extends ServiceCart {
  addServiceItem: (item: ServiceOption, quantity?: number, note?: string) => void
  removeServiceItem: (itemId: string) => void
  updateServiceQuantity: (itemId: string, quantity: number) => void
  updateServiceNote: (itemId: string, note: string) => void
  clearServiceCart: () => void
  getServiceTotal: () => number
  getServiceItemCount: () => number
  setServiceType: (serviceType: string | null) => void
  updateBookingDetails: (details: Partial<ServiceCart['bookingDetails']>) => void
  setBusinessId: (businessId: string) => void
  businessId: string
}

export const useServiceStore = create<ServiceStore>((set, get) => ({
  serviceType: null,
  businessId: '',
  items: [],
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

  getServiceTotal: () => {
    return get().items.reduce((total, cartItem) => {
      return total + (cartItem.serviceOption.price * cartItem.quantity)
    }, 0)
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
}))