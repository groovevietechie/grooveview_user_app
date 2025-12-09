import { supabase } from './supabase'
import { Business, Menu, MenuCategory, MenuItem, OrderSubmission } from '@/types/database'

// Business API
export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching business:', error)
    return null
  }

  return data
}

// Menu API
export async function getMenusByBusinessId(businessId: string): Promise<Menu[]> {
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching menus:', error)
    return []
  }

  return data || []
}

// Menu Categories API
export async function getCategoriesByMenuId(menuId: string): Promise<MenuCategory[]> {
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('menu_id', menuId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data || []
}

// Menu Items API
export async function getItemsByCategoryId(categoryId: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_available', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching items:', error)
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

  const menuIds = menus.map(menu => menu.id)
  const { data: categories, error: categoriesError } = await supabase
    .from('menu_categories')
    .select('*')
    .in('menu_id', menuIds)
    .order('display_order', { ascending: true })

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError)
    return { menus, categories: [], items: [] }
  }

  const categoryIds = categories?.map(cat => cat.id) || []
  const { data: items, error: itemsError } = await supabase
    .from('menu_items')
    .select('*')
    .in('category_id', categoryIds)
    .eq('is_available', true)
    .order('display_order', { ascending: true })

  if (itemsError) {
    console.error('Error fetching items:', itemsError)
    return { menus, categories: categories || [], items: [] }
  }

  return {
    menus,
    categories: categories || [],
    items: items || []
  }
}

// Order API
export async function submitOrder(orderData: OrderSubmission): Promise<string | null> {
  try {
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        business_id: orderData.businessId,
        seat_label: orderData.seatLabel,
        customer_note: orderData.customerNote,
        status: 'new',
        payment_method: orderData.paymentMethod,
        payment_status: 'pending',
        total_amount: orderData.items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0)
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return null
    }

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      item_note: item.note
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Try to delete the order if items failed
      await supabase.from('orders').delete().eq('id', order.id)
      return null
    }

    return order.id
  } catch (error) {
    console.error('Error submitting order:', error)
    return null
  }
}