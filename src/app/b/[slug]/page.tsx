import { notFound } from 'next/navigation'
import { getBusinessBySlug, getFullMenu } from '@/lib/api'
import { Business, Menu, MenuCategory, MenuItem } from '@/types/database'
import MenuPage from '@/components/MenuPage'

interface PageProps {
  params: {
    slug: string
  }
}

async function getBusinessData(slug: string): Promise<{
  business: Business | null
  menuData: {
    menus: Menu[]
    categories: MenuCategory[]
    items: MenuItem[]
  } | null
}> {
  const business = await getBusinessBySlug(slug)

  if (!business) {
    return { business: null, menuData: null }
  }

  const menuData = await getFullMenu(business.id)

  return { business, menuData }
}

export default async function BusinessPage({ params }: PageProps) {
  const { business, menuData } = await getBusinessData(params.slug)

  if (!business) {
    notFound()
  }

  if (!business.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Business Temporarily Unavailable</h1>
          <p className="text-gray-600 mb-6">
            {business.name} is currently not accepting orders. Please check back later.
          </p>
          <div className="text-sm text-gray-500">
            Contact the business for more information.
          </div>
        </div>
      </div>
    )
  }

  if (!menuData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Menu Not Available</h1>
          <p className="text-gray-600 mb-6">
            The menu for {business.name} is currently not available. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <MenuPage
      business={business}
      menuData={menuData}
    />
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { business } = await getBusinessData(params.slug)

  if (!business) {
    return {
      title: 'Business Not Found'
    }
  }

  if (!business.is_active) {
    return {
      title: `${business.name} - Temporarily Unavailable`,
      description: `${business.name} is currently not accepting orders`
    }
  }

  return {
    title: `${business.name} - Menu`,
    description: `Order food from ${business.name}`
  }
}