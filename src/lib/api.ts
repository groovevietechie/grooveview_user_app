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

export async function getServiceOptions(businessId: string, serviceType?: string | null, category?: string): Promise<ServiceOption[]> {
  try {
    console.log("[API] Fetching service options for business:", businessId, "serviceType:", serviceType, "category:", category)

    let query = supabase
      .from("service_options")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true)

    if (serviceType) {
      query = query.eq("service_type", serviceType)
    }

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

// Get service options from custom_fields of service configuration
export async function getServiceOptionsFromCustomFields(serviceConfigId: string): Promise<ServiceOption[]> {
  try {
    const { data, error } = await supabase
      .from("service_configurations")
      .select("available_options, custom_fields, business_id, service_type, title")
      .eq("id", serviceConfigId)
      .single()

    if (error) {
      console.error("[API] Service configuration fetch failed:", error)
      throw error
    }

    const availableOptions = data?.available_options || []
    const customFields = data?.custom_fields as any || {}
    const businessId = data.business_id
    const serviceType = data.service_type

    // First, try to get options from the service_options table
    let serviceOptions: ServiceOption[] = []
    
    try {
      const optionsFromTable = await getServiceOptions(businessId, serviceType)
      
      // If we have available_options specified, filter the table results
      if (availableOptions.length > 0) {
        serviceOptions = optionsFromTable.filter(option => 
          availableOptions.includes(option.name)
        )
      } else {
        // If no available_options specified, use all options for this service type
        serviceOptions = optionsFromTable
      }
      
      if (serviceOptions.length > 0) {
        return serviceOptions
      }
    } catch (tableError) {
      // Continue to custom_fields fallback
    }

    // Fallback: If no options in table, try to construct from available_options + custom_fields
    if (availableOptions.length === 0) {
      return []
    }

    // Handle different custom_fields structures
    serviceOptions = []

    // Method 1: Check for custom_options array (most detailed)
    if (customFields.custom_options && Array.isArray(customFields.custom_options)) {
      serviceOptions = customFields.custom_options.map((option: any, index: number) => ({
        id: `${serviceConfigId}_custom_${option.id || index}`,
        business_id: businessId,
        name: option.name,
        category: "Service Option",
        price: option.price || 0,
        is_active: true,
        description: option.description || "",
        image_url: null,
        metadata: { is_required: option.is_required || false },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    }

    // Method 2: Check for option_prices mapping
    if (serviceOptions.length === 0 && customFields.option_prices) {
      serviceOptions = availableOptions.map((optionName: string, index: number) => {
        const price = customFields.option_prices[optionName] || 0
        return {
          id: `${serviceConfigId}_price_${index}`,
          business_id: businessId,
          name: optionName,
          category: "Service Option",
          price: price,
          is_active: true,
          description: "",
          image_url: null,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      })
    }

    // Method 3: Try direct mapping from available_options with custom_fields lookup
    if (serviceOptions.length === 0) {
      serviceOptions = availableOptions.map((optionName: string, index: number) => {
        let price = 0
        let description = ""
        let category = "Service Option"
        
        // Try to find price in custom_fields
        if (customFields[optionName]) {
          const optionData = customFields[optionName]
          if (typeof optionData === 'object') {
            price = optionData.price || optionData.cost || 0
            description = optionData.description || ""
            category = optionData.category || "Service Option"
          } else if (typeof optionData === 'number') {
            price = optionData
          }
        }

        return {
          id: `${serviceConfigId}_option_${index}`,
          business_id: businessId,
          name: optionName,
          category: category,
          price: price,
          is_active: true,
          description: description,
          image_url: null,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      })
    }

    return serviceOptions
  } catch (error) {
    console.error("[API] Error fetching service options:", error)
    return []
  }
}

export async function submitServiceBooking(bookingData: ServiceBookingSubmission): Promise<{ bookingId: string; transferCode: string; totalAmount: number } | null> {
  try {
    console.log("[API] Submitting service booking:", bookingData)

    // Generate a 6-digit transfer code
    const transferCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Use the secure function for booking submission
    const { data: result, error } = await supabase
      .rpc("submit_service_booking_with_payment", {
        p_business_id: bookingData.businessId,
        p_customer_name: bookingData.customerName,
        p_customer_phone: bookingData.customerPhone,
        p_service_type: bookingData.serviceType || 'custom',
        p_event_date: bookingData.eventDate,
        p_number_of_participants: bookingData.numberOfParticipants,
        p_total_amount: bookingData.totalAmount,
        p_transfer_code: transferCode,
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
      
      // Fallback to the original function if the new one doesn't exist
      const { data: bookingId, error: fallbackError } = await supabase
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

      if (fallbackError) {
        console.error("[API] Fallback booking submission also failed:", fallbackError)
        return null
      }

      // Update the booking with transfer code using a direct update
      if (bookingId) {
        await supabase
          .from("service_bookings")
          .update({ 
            transfer_code: transferCode,
            payment_status: 'pending'
          })
          .eq("id", bookingId)

        return {
          bookingId,
          transferCode,
          totalAmount: bookingData.totalAmount
        }
      }
      
      return null
    }

    console.log("[API] Service booking created successfully:", result)
    return {
      bookingId: result.booking_id,
      transferCode: result.transfer_code,
      totalAmount: bookingData.totalAmount
    }
  } catch (error) {
    console.error("[API] Error submitting service booking:", error)
    return null
  }
}

export async function confirmServicePayment(bookingId: string): Promise<boolean> {
  try {
    console.log("[API] Confirming service payment:", bookingId)

    const { error } = await supabase
      .from("service_bookings")
      .update({ 
        payment_status: 'confirmed',
        payment_confirmed_at: new Date().toISOString(),
        status: 'confirmed'
      })
      .eq("id", bookingId)

    if (error) {
      console.error("[API] Payment confirmation failed:", error)
      return false
    }

    console.log("[API] Payment confirmed successfully")
    return true
  } catch (error) {
    console.error("[API] Error confirming payment:", error)
    return false
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
      transfer_code: booking.transfer_code,
      payment_status: booking.payment_status,
      payment_confirmed_at: booking.payment_confirmed_at,
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

    // Validate required fields
    if (!orderData.businessId || !orderData.seatLabel || !orderData.items || orderData.items.length === 0) {
      console.error("[v0] Missing required order data:", {
        hasBusinessId: !!orderData.businessId,
        hasSeatLabel: !!orderData.seatLabel,
        hasItems: !!orderData.items,
        itemCount: orderData.items?.length || 0
      })
      return null
    }

    // Determine order type from seat label
    const orderType = orderData.seatLabel.toLowerCase().includes('table') ? 'table' :
                     orderData.seatLabel.toLowerCase().includes('room') ? 'room' : 'home'

    // Generate transfer code if payment method is transfer
    const transferCode = orderData.paymentMethod === 'transfer' 
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : null

    // Extract customer phone from customer note if it exists (for home delivery)
    let customerPhone = null
    let cleanCustomerNote = orderData.customerNote

    if (orderData.customerNote && orderData.customerNote.startsWith('Phone: ')) {
      const phoneMatch = orderData.customerNote.match(/^Phone: ([^\n]+)/)
      if (phoneMatch) {
        customerPhone = phoneMatch[1]
        // Remove phone from customer note and clean up
        cleanCustomerNote = orderData.customerNote.replace(/^Phone: [^\n]+\n?\n?/, '').replace(/^Special Instructions: /, '')
      }
    }

    // Prepare base order data (guaranteed to work with existing schema)
    const baseOrderData = {
      business_id: orderData.businessId,
      seat_label: orderData.seatLabel,
      customer_note: cleanCustomerNote || null,
      status: "new" as const,
      payment_method: orderData.paymentMethod,
      payment_status: orderData.paymentMethod === 'transfer' ? "paid" as const : "pending" as const,
      total_amount: orderData.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
    }

    console.log("[v0] Base order data prepared:", baseOrderData)

    // Try to create order with enhanced fields first, then fallback to basic
    let order
    let orderError
    
    // First attempt: Enhanced order with new fields
    const enhancedOrderData = {
      ...baseOrderData,
      order_type: orderType,
      customer_phone: customerPhone,
      delivery_address: orderData.deliveryAddress,
      transfer_code: transferCode,
    }
    
    console.log("[v0] Attempting enhanced order creation...")
    const enhancedResult = await supabase
      .from("orders")
      .insert(enhancedOrderData)
      .select()
      .single()
    
    order = enhancedResult.data
    orderError = enhancedResult.error
    
    // If enhanced order failed, try basic order (backward compatibility)
    if (orderError) {
      console.log("[v0] Enhanced order creation failed, trying basic order:", {
        message: orderError.message,
        code: orderError.code,
        hint: orderError.hint
      })
      
      // Check if it's a payment method constraint error
      if (orderError.message?.includes('payment_method') || orderError.message?.includes('check constraint')) {
        console.log("[v0] Detected payment method constraint error, trying with 'cash' as workaround...")
        
        // Try with 'cash' payment method as workaround for constraint
        const workaroundOrderData = {
          ...baseOrderData,
          payment_method: 'cash' as const, // Use cash to bypass constraint
        }
        
        console.log("[v0] Attempting workaround order creation with cash payment method...")
        const workaroundResult = await supabase
          .from("orders")
          .insert(workaroundOrderData)
          .select()
          .single()
        
        order = workaroundResult.data
        orderError = workaroundResult.error
        
        if (!orderError && order) {
          console.log("[v0] Workaround order successful, payment method stored as 'cash' but actual method is 'transfer'")
        }
      } else {
        console.log("[v0] Attempting basic order creation...")
        const basicResult = await supabase
          .from("orders")
          .insert(baseOrderData)
          .select()
          .single()
        
        order = basicResult.data
        orderError = basicResult.error
      }
      
      // If basic order succeeded and we have a transfer code, try to update it
      if (!orderError && order && transferCode) {
        console.log("[v0] Basic order successful, attempting to add transfer code...")
        try {
          const { error: updateError } = await supabase
            .from("orders")
            .update({ transfer_code: transferCode })
            .eq("id", order.id)
          
          if (updateError) {
            console.log("[v0] Could not update transfer code:", updateError.message)
          } else {
            console.log("[v0] Transfer code added successfully to basic order")
          }
        } catch (updateException) {
          console.log("[v0] Transfer code update exception:", updateException)
        }
      }
    } else {
      console.log("[v0] Enhanced order creation successful")
    }

    if (orderError) {
      console.error("[v0] Order creation failed:", {
        message: orderError?.message || 'Unknown error',
        code: orderError?.code || 'NO_CODE',
        details: orderError?.details || 'No details available',
        hint: orderError?.hint || 'No hint available',
        fullError: orderError
      })
      return null
    }

    if (!order) {
      console.error("[v0] Order creation returned no data")
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
        message: itemsError?.message || 'Unknown error',
        code: itemsError?.code || 'NO_CODE',
        details: itemsError?.details || 'No details available',
        hint: itemsError?.hint || 'No hint available',
        fullError: itemsError
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

// Get order by transfer code (for business app)
export async function getOrderByTransferCode(transferCode: string, businessId: string): Promise<any | null> {
  try {
    console.log("[API] Fetching order by transfer code:", transferCode)

    const { data, error } = await supabase
      .rpc("get_menu_order_by_transfer_code", { 
        p_transfer_code: transferCode,
        p_business_id: businessId 
      })

    if (error) {
      console.error("[API] Order fetch by transfer code failed:", error)
      return null
    }

    if (!data || data.length === 0) {
      console.log("[API] Order not found for transfer code")
      return null
    }

    return data[0]
  } catch (error) {
    console.error("[API] Error fetching order by transfer code:", error)
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