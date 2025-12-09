import { notFound } from "next/navigation"
import { getBusinessBySlug } from "@/lib/api"
import type { Business } from "@/types/database"
import OrderTrackingPage from "@/components/OrderTrackingPage"

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

async function getBusinessData(slug: string): Promise<Business | null> {
  const business = await getBusinessBySlug(slug)
  return business
}

export default async function OrdersPage({ params }: PageProps) {
  const { slug } = await params
  const business = await getBusinessData(slug)

  if (!business) {
    notFound()
  }

  return <OrderTrackingPage business={business} />
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const business = await getBusinessData(slug)

  if (!business) {
    return {
      title: "Orders Not Found",
    }
  }

  return {
    title: `Order Tracking - ${business.name}`,
  }
}
