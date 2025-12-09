export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  address?: string
  phone?: string
  hours?: Record<string, unknown>
  logo_url?: string
  theme_color_hex: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Menu {
  id: string
  business_id: string
  name: string
  description?: string
  image_url?: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface MenuCategory {
  id: string
  menu_id: string
  name: string
  description?: string
  image_url?: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  category_id: string
  name: string
  description?: string
  price: number
  image_url?: string
  is_available: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  business_id: string
  customer_id?: string
  seat_label: string
  customer_note?: string
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  total_amount: number
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  item_note?: string
}

export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'served' | 'cancelled'
export type PaymentMethod = 'cash' | 'card' | 'mobile'
export type PaymentStatus = 'pending' | 'paid' | 'failed'

// Cart types
export interface CartItem {
  menuItem: MenuItem
  quantity: number
  note?: string
}

export interface Cart {
  items: CartItem[]
  businessId: string
}

// Order types for submission
export interface OrderSubmission {
  businessId: string
  items: {
    menuItemId: string
    quantity: number
    unitPrice: number
    note?: string
  }[]
  seatLabel: string
  customerNote?: string
  paymentMethod: PaymentMethod
  deliveryAddress?: string
}