import { supabase } from "./supabase"
import type { Business, Menu, MenuCategory, MenuItem, OrderSubmission } from "@/types/database"

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
