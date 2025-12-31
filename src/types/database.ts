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
  link_code?: string
  payment_account_number?: string
  payment_account_name?: string
  payment_bank?: string
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
  estimated_ready_time?: string
  estimated_delivery_time?: string
  business_comment?: string
  order_type: OrderType
  customer_phone?: string
  delivery_address?: string
  transfer_code?: string
  payment_confirmed_at?: string
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

export type OrderStatus = "new" | "accepted" | "preparing" | "ready" | "served" | "cancelled"
export type OrderType = "table" | "room" | "home"
export type PaymentMethod = "cash" | "card" | "mobile" | "transfer"
export type PaymentStatus = "pending" | "paid" | "failed"

// Service Types
export interface ServiceConfiguration {
  id: string
  business_id: string
  service_type: string | null
  title: string
  description?: string
  is_active: boolean
  base_price: number
  pricing_structure: {
    durations: Array<{
      label: string
      hours: number
      multiplier: number
    }>
  }
  available_options: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ServiceOption {
  id: string
  business_id: string
  name: string
  category: string
  price: number
  is_active: boolean
  description?: string
  image_url?: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ServiceBooking {
  id: string
  business_id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  service_type: string | null
  status: ServiceStatus
  booking_date: string
  event_date: string
  number_of_participants: number
  total_amount: number
  service_details: Record<string, unknown>
  transfer_code?: string
  payment_status: PaymentStatus
  payment_confirmed_at?: string
  created_at: string
  updated_at: string
}

export interface ServiceBookingSubmission {
  businessId: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  serviceType: string | null
  eventDate: string
  numberOfParticipants: number
  totalAmount: number
  items: ServiceCartItem[]
  preOrderEnabled: boolean
  preOrderItems: PreOrderItem[]
  specialRequests?: string
  bookingDetails: Record<string, unknown>
}

export interface ServiceCartItem {
  serviceOption: ServiceOption
  quantity: number
  note?: string
}

export type ServiceStatus = "pending" | "confirmed" | "inProgress" | "completed" | "cancelled"

// Service Cart Types
export interface ServiceCart {
  serviceType: string | null
  items: ServiceCartItem[]
  selectedDuration?: {
    label: string
    hours: number
    multiplier: number
  }
  preOrderEnabled: boolean
  preOrderItems: PreOrderItem[]
  bookingDetails: {
    customerName: string
    customerPhone: string
    customerEmail?: string
    eventDate: string
    numberOfParticipants: number
    specialRequests?: string
  }
}

export interface PreOrderItem {
  menuItem: MenuItem
  quantity: number
  note?: string
}

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