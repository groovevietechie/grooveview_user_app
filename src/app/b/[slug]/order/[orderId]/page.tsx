import { notFound } from 'next/navigation'
import { getBusinessBySlug } from '@/lib/api'
import { Business } from '@/types/database'
import OrderConfirmationPage from '@/components/OrderConfirmationPage'

interface PageProps {
  params: {
    slug: string
    orderId: string
  }
}

async function getBusinessData(slug: string): Promise<Business | null> {
  const business = await getBusinessBySlug(slug)
  return business
}

export default async function OrderConfirmation({ params }: PageProps) {
  const business = await getBusinessData(params.slug)

  if (!business) {
    notFound()
  }

  return <OrderConfirmationPage business={business} orderId={params.orderId} />
}

export async function generateMetadata({ params }: PageProps) {
  const business = await getBusinessData(params.slug)

  if (!business) {
    return {
      title: 'Order Confirmation'
    }
  }

  return {
    title: `Order Confirmed - ${business.name}`,
  }
}