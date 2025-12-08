import { notFound } from 'next/navigation'
import { getBusinessBySlug, getFullMenu } from '@/lib/api'
import { Business } from '@/types/database'
import MenuPage from '@/components/MenuPage'

interface PageProps {
  params: {
    slug: string
  }
}

async function getBusinessData(slug: string): Promise<{
  business: Business | null
  menuData: any
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

  return {
    title: `${business.name} - Menu`,
    description: `Order food from ${business.name}`
  }
}