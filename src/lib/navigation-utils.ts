/**
 * Navigation utilities for consistent routing behavior
 */

export interface NavigationRoute {
  path: string
  title: string
  parent?: string
}

/**
 * Define the navigation hierarchy for the app
 */
export const navigationHierarchy: Record<string, NavigationRoute> = {
  home: {
    path: '/',
    title: 'Home'
  },
  menu: {
    path: '/b/[slug]',
    title: 'Menu',
    parent: 'home'
  },
  checkout: {
    path: '/b/[slug]/checkout',
    title: 'Checkout',
    parent: 'menu'
  },
  payment: {
    path: '/b/[slug]/payment',
    title: 'Payment',
    parent: 'checkout'
  },
  orderConfirmation: {
    path: '/b/[slug]/order/[orderId]',
    title: 'Order Confirmation',
    parent: 'menu'
  },
  orderTracking: {
    path: '/b/[slug]/orders',
    title: 'Order Tracking',
    parent: 'menu'
  }
}

/**
 * Get the parent route for a given path
 */
export function getParentRoute(currentPath: string, businessSlug?: string): string {
  // Extract business slug if not provided
  if (!businessSlug) {
    const pathSegments = currentPath.split('/')
    businessSlug = pathSegments[2]
  }

  // Define parent routes based on current path
  if (currentPath.includes('/payment')) {
    return `/b/${businessSlug}/checkout`
  }
  
  if (currentPath.includes('/checkout')) {
    return `/b/${businessSlug}`
  }
  
  if (currentPath.includes('/order/')) {
    return `/b/${businessSlug}`
  }
  
  if (currentPath.includes('/orders')) {
    return `/b/${businessSlug}`
  }
  
  // For menu pages, go to home
  if (isMenuPage(currentPath)) {
    return '/'
  }
  
  // Default fallback
  return businessSlug ? `/b/${businessSlug}` : '/'
}

/**
 * Check if the current path is a root level page
 */
export function isRootPage(path: string): boolean {
  return path === '/' || path === ''
}

/**
 * Check if the current path is a business menu page
 */
export function isMenuPage(path: string): boolean {
  const pathSegments = path.split('/')
  // Should be exactly /b/[slug] format (3 segments total)
  return pathSegments.length === 3 && pathSegments[1] === 'b' && pathSegments[2] !== ''
}

/**
 * Extract business slug from path
 */
export function getBusinessSlugFromPath(path: string): string | null {
  const pathSegments = path.split('/')
  if (pathSegments.length >= 3 && pathSegments[1] === 'b') {
    return pathSegments[2]
  }
  return null
}