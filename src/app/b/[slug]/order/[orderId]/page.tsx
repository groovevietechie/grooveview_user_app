import { notFound } from "next/navigation"
import { getBusinessBySlug } from "@/lib/api"
import type { Business } from "@/types/database"
import OrderConfirmationPage from "@/components/OrderConfirmationPage"

interface PageProps {
  params: Promise<{
    slug: string
    orderId: string
  }>
}

async function getBusinessData(slug: string): Promise<Business | null> {
  const business = await getBusinessBySlug(slug)
  return business
}

export default async function OrderConfirmation({ params }: PageProps) {
  const { slug, orderId } = await params
  const business = await getBusinessData(slug)

  if (!business) {
    notFound()
  }

  return <OrderConfirmationPage business={business} orderId={orderId} />
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const business = await getBusinessData(slug)

  if (!business) {
    return {
      title: "Order Confirmation",
    }
  }

  return {
    title: `Order Confirmed - ${business.name}`,
  }
}
