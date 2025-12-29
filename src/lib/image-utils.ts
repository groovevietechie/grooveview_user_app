/**
 * Utility functions for handling images in the customer app
 */

/**
 * Handle image loading errors by hiding the image element
 * and optionally showing a fallback
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  showFallback?: () => void
) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
  
  if (showFallback) {
    showFallback()
  }
}

/**
 * Get a fallback image URL based on the item type
 */
export const getFallbackImageUrl = (type: 'menu' | 'category' | 'item'): string => {
  const fallbacks = {
    menu: '/images/menu-fallback.jpg',
    category: '/images/category-fallback.jpg',
    item: '/images/item-fallback.jpg'
  }
  
  return fallbacks[type] || '/images/default-fallback.jpg'
}

/**
 * Check if an image URL is valid and accessible
 */
export const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Generate a color-based fallback for items without images
 */
export const generateColorFallback = (name: string, baseColor: string) => {
  // Simple hash function to generate consistent colors
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Generate a hue based on the hash
  const hue = Math.abs(hash) % 360
  
  return {
    backgroundColor: `hsl(${hue}, 70%, 95%)`,
    textColor: `hsl(${hue}, 70%, 30%)`,
    initial: name.charAt(0).toUpperCase()
  }
}