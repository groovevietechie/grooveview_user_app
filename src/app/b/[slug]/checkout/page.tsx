import { notFound } from 'next/navigation'
import { getBusinessBySlug } from '@/lib/api'
import { Business } from '@/types/database'
import CheckoutPage from '@/components/CheckoutPage'

interface PageProps {
  params: {
    slug: string
  }
}

async function getBusinessData(slug: string): Promise<Business | null> {
  const business = await getBusinessBySlug(slug)
  return business
}

export default async function Checkout({ params }: PageProps) {
  const business = await getBusinessData(params.slug)

  if (!business) {
    notFound()
  }

  return <CheckoutPage business={business} />
}

export async function generateMetadata({ params }: PageProps) {
  const business = await getBusinessData(params.slug)

  if (!business) {
    return {
      title: 'Business Not Found'
    }
  }

  return {
    title: `Checkout - ${business.name}`,
  }
}