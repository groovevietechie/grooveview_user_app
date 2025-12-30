import { supabase } from "./supabase"
import type { Business, Menu, MenuCategory, MenuItem, OrderSubmission, ServiceConfiguration, ServiceOption, ServiceBooking, ServiceBookingSubmission, ServiceStatus } from "@/types/database"

// Business API
export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const { data, error } = await supabase.from("businesses").select("*").eq("slug", slug).single()

  if (error) {
    console.error("[GrooveVie API] Error fetching business:", error.message)
    return null
  }

  return data
}

// Menu API
export async function getMenusByBusinessId(businessId: string): Promise<Menu[]> {
  const { data, error } = await supabase
    .from("menus")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching menus:", error)
    return []
  }

  return data || []
}

// Menu Categories API
export async function getCategoriesByMenuId(menuId: string): Promise<MenuCategory[]> {
  const { data, error } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("menu_id", menuId)
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  return data || []
}

// Menu Items API
export async function getItemsByCategoryId(categoryId: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_available", true)
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching items:", error)
    return []
  }

  return data || []
}

// Get full menu structure for a business
export async function getFullMenu(businessId: string): Promise<{
  menus: Menu[]
  categories: MenuCategory[]
  items: MenuItem[]
}> {
  const menus = await getMenusByBusinessId(businessId)

  if (menus.length === 0) {
    return { menus: [], categories: [], items: [] }
  }

  const menuIds = menus.map((menu) => menu.id)
  const { data: categories, error: categoriesError } = await supabase
    .from("menu_categories")
    .select("*")
    .in("menu_id", menuIds)
    .order("display_order", { ascending: true })

  if (categoriesError) {
    console.error("[GrooveVie API] Error fetching categories:", categoriesError.message)
    return { menus, categories: [], items: [] }
  }

  const categoryIds = categories?.map((cat) => cat.id) || []
  const { data: items, error: itemsError } = await supabase
    .from("menu_items")
    .select("*")
    .in("category_id", categoryIds)
    .eq("is_available", true)
    .order("display_order", { ascending: true })

  if (itemsError) {
    console.error("[GrooveVie API] Error fetching items:", itemsError.message)
    return { menus, categories: categories || [], items: [] }
  }

  return {
    menus,
    categories: categories || [],
    items: items || [],
  }
}

// Service API
export async function getServiceConfigurations(businessId: string): Promise<ServiceConfiguration[]> {
  try {
    console.log("[API] Fetching service configurations for business:", businessId)

    const { data, error } = await supabase
      .from("service_configurations")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[API] Service configurations fetch failed:", error)
      throw error
    }

    console.log("[API] Service configurations fetched:", data?.length || 0)

    // Transform to match ServiceConfiguration interface
    return (data || []).map((item: any) => ({
      id: item.id,
      business_id: item.business_id,
      service_type: item.service_type,
      title: item.title,
      description: item.description,
      is_active: item.is_active,
      base_price: item.pricing_structure?.base_price || 0,
      pricing_structure: {
        durations: item.pricing_structure?.durations || []
      },
      available_options: item.available_options || [],
      metadata: {
        terms: item.terms,
        conditions: item.conditions,
        custom_fields: item.custom_fields || {},
      },
      created_at: item.created_at,
      updated_at: item.updated_at,
    }))
  } catch (error) {
    console.error("[API] Error fetching service configurations:", error)
    return []
  }
}

export async function getServiceOptions(businessId: string, category?: string): Promise<ServiceOption[]> {
  try {
    console.log("[API] Fetching service options for business:", businessId, "category:", category)

    let query = supabase
      .from("service_options")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true)

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query.order("category", { ascending: true }).order("name", { ascending: true })

    if (error) {
      console.error("[API] Service options fetch failed:", error)
      throw error
    }

    console.log("[API] Service options fetched:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("[API] Error fetching service options:", error)
    throw error
  }
}

export async function submitServiceBooking(bookingData: ServiceBookingSubmission): Promise<string | null> {
  try {
    console.log("[API] Submitting service booking:", bookingData)

    // Use the secure function for booking submission
    const { data: bookingId, error } = await supabase
      .rpc("submit_service_booking", {
        p_business_id: bookingData.businessId,
        p_customer_name: bookingData.customerName,
        p_customer_phone: bookingData.customerPhone,
        p_service_type: bookingData.serviceType || 'custom',
        p_event_date: bookingData.eventDate,
        p_number_of_participants: bookingData.numberOfParticipants,
        p_total_amount: bookingData.totalAmount,
        p_service_details: {
          items: bookingData.items.map(item => ({
            id: item.serviceOption.id,
            name: item.serviceOption.name,
            category: item.serviceOption.category,
            quantity: item.quantity,
            unit_price: item.serviceOption.price,
            total_price: item.serviceOption.price * item.quantity,
            note: item.note,
          })),
          pre_order_enabled: bookingData.preOrderEnabled,
          pre_order_items: bookingData.preOrderEnabled ? bookingData.preOrderItems.map(item => ({
            id: item.menuItem.id,
            name: item.menuItem.name,
            quantity: item.quantity,
            unit_price: item.menuItem.price,
            total_price: item.menuItem.price * item.quantity,
            note: item.note,
          })) : [],
          special_requests: bookingData.specialRequests,
          booking_details: bookingData.bookingDetails,
        },
        p_customer_email: bookingData.customerEmail || null,
      })

    if (error) {
      console.error("[API] Service booking submission failed:", error)
      return null
    }

    console.log("[API] Service booking created successfully:", bookingId)
    return bookingId
  } catch (error) {
    console.error("[API] Error submitting service booking:", error)
    return null
  }
}

export async function getServiceBookingStatus(bookingId: string): Promise<ServiceBooking | null> {
  try {
    console.log("[API] Fetching service booking status:", bookingId)

    // Use the secure function for booking status
    const { data, error } = await supabase
      .rpc("get_service_booking_status", { p_booking_id: bookingId })

    if (error) {
      console.error("[API] Service booking status fetch failed:", error)
      return null
    }

    if (!data || data.length === 0) {
      console.log("[API] Service booking not found")
      return null
    }

    const booking = data[0]
    console.log("[API] Service booking status fetched:", booking.status)
    return {
      id: booking.id,
      business_id: booking.business_id,
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      customer_email: booking.customer_email,
      service_type: booking.service_type,
      status: booking.status as ServiceStatus,
      booking_date: booking.booking_date,
      event_date: booking.event_date,
      number_of_participants: booking.number_of_participants,
      total_amount: booking.total_amount,
      service_details: booking.service_details,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
    }
  } catch (error) {
    console.error("[API] Error fetching service booking status:", error)
    return null
  }
}

// Order API
export async function submitOrder(orderData: OrderSubmission): Promise<string | null> {
  try {
    console.log("[v0] Submitting order:", orderData)

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        business_id: orderData.businessId,
        seat_label: orderData.seatLabel,
        customer_note: orderData.customerNote,
        status: "new",
        payment_method: orderData.paymentMethod,
        payment_status: "pending",
        total_amount: orderData.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
      })
      .select()
      .single()

    if (orderError) {
      console.error("[v0] Order creation failed:", {
        message: orderError.message,
        code: orderError.code,
        details: orderError.details,
        hint: orderError.hint,
      })
      return null
    }

    console.log("[v0] Order created successfully:", order.id)

    // Create order items
    const orderItems = orderData.items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      item_note: item.note,
    }))

    console.log("[v0] Creating order items:", orderItems)

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("[v0] Order items creation failed:", {
        message: itemsError.message,
        code: itemsError.code,
        details: itemsError.details,
        hint: itemsError.hint,
      })
      // Try to delete the order if items failed
      await supabase.from("orders").delete().eq("id", order.id)
      return null
    }

    console.log("[v0] Order items created successfully")
    return order.id
  } catch (error) {
    console.error("[v0] Unexpected error during order submission:", error)
    return null
  }
}

// Fetch orders with items for a business
export async function getOrdersByIds(orderIds: string[]): Promise<any[]> {
  if (orderIds.length === 0) return []

  try {
    const { data: orders, error } = await supabase
      .from("order_details")
      .select("*")
      .in("id", orderIds)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching orders:", error)
      return []
    }

    return (orders || []).map((order: any) => ({
      ...order,
      items: order.items ? (typeof order.items === "string" ? JSON.parse(order.items) : order.items) : [],
    }))
  } catch (error) {
    console.error("[v0] Error in getOrdersByIds:", error)
    return []
  }
}

// Deprecated function for backward compatibility
export async function getOrdersWithItems(businessId: string): Promise<any[]> {
  console.warn("[v0] getOrdersWithItems is deprecated. Use getOrdersByIds with device-specific order IDs instead.")
  return []
}