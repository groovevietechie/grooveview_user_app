import { supabase } from "./supabase"
import type { Business, Menu, MenuCategory, MenuItem, OrderSubmission, ServiceConfiguration, ServiceOption, ServiceBooking, ServiceBookingSubmission, ServiceStatus, Staff, Waiter, Tip } from "@/types/database"

// Business API
export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  // Normalize slug: decode URI encoding and replace spaces with hyphens
  const normalizedSlug = decodeURIComponent(slug).toLowerCase().replace(/\s+/g, "-")
  const { data, error } = await supabase.from("businesses").select("*").eq("slug", normalizedSlug).single()

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
    .select(`
      *,
      menu_item_option_categories (
        id,
        item_id,
        name,
        description,
        is_required,
        allow_multiple,
        display_order,
        created_at,
        updated_at,
        menu_item_options (
          id,
          category_id,
          name,
          price,
          is_available,
          display_order,
          created_at,
          updated_at
        )
      )
    `)
    .eq("category_id", categoryId)
    .eq("is_available", true)
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching items:", error)
    return []
  }

  return (data || []).map(item => ({
    ...item,
    option_categories: (item.menu_item_option_categories || [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((category: any) => ({
        ...category,
        options: (category.menu_item_options || [])
          .filter((option: any) => option.is_available)
          .sort((a: any, b: any) => a.display_order - b.display_order)
      }))
  }))
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
    .select(`
      *,
      menu_item_option_categories (
        id,
        item_id,
        name,
        description,
        is_required,
        allow_multiple,
        display_order,
        created_at,
        updated_at,
        menu_item_options (
          id,
          category_id,
          name,
          price,
          is_available,
          display_order,
          created_at,
          updated_at
        )
      )
    `)
    .in("category_id", categoryIds)
    .eq("is_available", true)
    .order("display_order", { ascending: true })

  if (itemsError) {
    console.error("[GrooveVie API] Error fetching items:", itemsError.message)
    return { menus, categories: categories || [], items: [] }
  }

  // Process items to include sorted option categories and options
  const processedItems = (items || []).map(item => ({
    ...item,
    option_categories: (item.menu_item_option_categories || [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((category: any) => ({
        ...category,
        options: (category.menu_item_options || [])
          .filter((option: any) => option.is_available)
          .sort((a: any, b: any) => a.display_order - b.display_order)
      }))
  }))

  return {
    menus,
    categories: categories || [],
    items: processedItems,
  }
}

// Staff API
export async function getStaffMembers(businessId: string): Promise<Staff[]> {
  try {
    console.log("[API] Fetching staff members for business:", businessId)

    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) {
      console.error("[API] Staff members fetch failed:", error)
      return []
    }

    console.log("[API] Staff members fetched:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("[API] Error fetching staff members:", error)
    return []
  }
}

// Order Statistics API
export async function getMenuItemOrderCounts(businessId: string): Promise<Record<string, number>> {
  try {
    console.log("[API] Fetching menu item order counts for business:", businessId)

    const { data, error } = await supabase
      .from("order_items")
      .select(`
        menu_item_id,
        quantity,
        orders!inner(business_id)
      `)
      .eq("orders.business_id", businessId)

    if (error) {
      console.error("[API] Order counts fetch failed:", error)
      return {}
    }

    // Aggregate counts by menu item
    const counts: Record<string, number> = {}
    data?.forEach((item: any) => {
      const itemId = item.menu_item_id
      counts[itemId] = (counts[itemId] || 0) + item.quantity
    })

    console.log("[API] Order counts fetched for", Object.keys(counts).length, "items")
    return counts
  } catch (error) {
    console.error("[API] Error fetching order counts:", error)
    return {}
  }
}

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
        p_referrer_staff_id: bookingData.referrerStaffId || null,
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

      // Update the booking with transfer code and referrer using a direct update
      if (bookingId) {
        const updateData: any = { 
          transfer_code: transferCode,
          payment_status: 'pending'
        }
        
        if (bookingData.referrerStaffId) {
          updateData.referrer_staff_id = bookingData.referrerStaffId
        }

        await supabase
          .from("service_bookings")
          .update(updateData)
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

    const paymentMethod = orderData.paymentMethod === 'tokens' ? 'cash' : orderData.paymentMethod
    const paymentStatus = (orderData.paymentMethod === 'transfer' || orderData.paymentMethod === 'tokens') ? "paid" as const : "pending" as const
    const totalAmount = orderData.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0)

    // Truly minimal — only original core columns guaranteed to exist
    const minimalOrderData = {
      business_id: orderData.businessId,
      seat_label: orderData.seatLabel,
      customer_note: cleanCustomerNote || null,
      status: "new" as const,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      total_amount: totalAmount,
    }

    console.log("[v0] Base order data prepared:", minimalOrderData)

    // Try to create order with enhanced fields first, then progressively fall back
    let order
    let orderError

    // Attempt 1: Full enhanced order (all columns)
    const enhancedOrderData = {
      ...minimalOrderData,
      customer_id: orderData.customerId || null,
      device_id: orderData.deviceId || null,
      token_payment_amount: orderData.tokenPaymentAmount || 0,
      order_type: orderType,
      customer_phone: customerPhone,
      delivery_address: orderData.deliveryAddress,
      transfer_code: transferCode,
      waiter_id: orderData.waiterId || null,
    }

    console.log("[v0] Attempting enhanced order creation...")
    const enhancedResult = await supabase.from("orders").insert(enhancedOrderData).select().single()
    order = enhancedResult.data
    orderError = enhancedResult.error

    // Attempt 2: Without newer optional columns (token_payment_amount, customer_id, device_id)
    if (orderError) {
      console.log("[v0] Enhanced failed:", orderError.message, "— trying mid-tier...")
      const midOrderData = {
        ...minimalOrderData,
        order_type: orderType,
        customer_phone: customerPhone,
        delivery_address: orderData.deliveryAddress,
        transfer_code: transferCode,
        waiter_id: orderData.waiterId || null,
      }
      const midResult = await supabase.from("orders").insert(midOrderData).select().single()
      order = midResult.data
      orderError = midResult.error
    }

    // Attempt 3: Truly minimal — original schema only
    if (orderError) {
      console.log("[v0] Mid-tier failed:", orderError.message, "— trying minimal...")
      const minResult = await supabase.from("orders").insert(minimalOrderData).select().single()
      order = minResult.data
      orderError = minResult.error
    }

    // After any successful insert, try to patch in optional fields
    if (!orderError && order) {
      const patches: Record<string, unknown> = {}
      if (orderData.customerId) patches.customer_id = orderData.customerId
      if (orderData.deviceId) patches.device_id = orderData.deviceId
      if (orderData.tokenPaymentAmount) patches.token_payment_amount = orderData.tokenPaymentAmount
      if (transferCode) patches.transfer_code = transferCode
      if (orderData.waiterId) patches.waiter_id = orderData.waiterId

      if (Object.keys(patches).length > 0) {
        try {
          await supabase.from("orders").update(patches).eq("id", order.id)
        } catch (_) {
          // Non-fatal — order was created, optional fields just couldn't be patched
        }
      }
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

    // Create order items with selected options
    const orderItems = orderData.items.map((item) => {
      const baseItem = {
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        item_note: item.note,
      }

      // If item has selected options, include them in the note
      if (item.selectedOptions && item.selectedOptions.length > 0) {
        const optionsText = item.selectedOptions.map(option => 
          option.price > 0 ? `${option.name} (+₦${option.price})` : option.name
        ).join(', ')
        
        const existingNote = item.note ? `${item.note}\n` : ''
        baseItem.item_note = `${existingNote}Options: ${optionsText}`
      }

      return baseItem
    })

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

// Waiters API
export async function getAvailableWaiters(businessId: string): Promise<Waiter[]> {
  try {
    const { data, error } = await supabase
      .from("waiters")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .eq("is_available_today", true)
      .order("name", { ascending: true })

    if (error) {
      console.error("[API] Waiters fetch failed:", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("[API] Error fetching waiters:", error)
    return []
  }
}

// Tips API
export async function submitTip(tipData: {
  businessId: string
  orderId: string
  waiterId: string
  customerId?: string
  amount: number
  rating?: number
  compliments?: string[]
  comment?: string
}): Promise<{ tipId: string; transferCode: string } | null> {
  try {
    const transferCode = Math.floor(100000 + Math.random() * 900000).toString()
    const { data, error } = await supabase
      .from("tips")
      .insert({
        business_id: tipData.businessId,
        order_id: tipData.orderId,
        waiter_id: tipData.waiterId,
        customer_id: tipData.customerId || null,
        amount: tipData.amount,
        payment_method: "transfer",
        transfer_code: transferCode,
        payment_status: "pending",
        rating: tipData.rating || null,
        compliments: tipData.compliments || [],
        comment: tipData.comment || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[API] Tip submission failed:", error)
      return null
    }
    return { tipId: data.id, transferCode }
  } catch (error) {
    console.error("[API] Error submitting tip:", error)
    return null
  }
}

export async function confirmTipPayment(tipId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("tips")
      .update({
        payment_status: "paid",
        payment_confirmed_at: new Date().toISOString(),
      })
      .eq("id", tipId)

    if (error) {
      console.error("[API] Tip payment confirmation failed:", error)
      return false
    }
    return true
  } catch (error) {
    console.error("[API] Error confirming tip payment:", error)
    return false
  }
}

export async function getTipsByOrder(orderId: string): Promise<Tip[]> {
  try {
    const { data, error } = await supabase
      .from("tips")
      .select("*")
      .eq("order_id", orderId)

    if (error) {
      console.error("[API] Tips fetch failed:", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("[API] Error fetching tips:", error)
    return []
  }
}