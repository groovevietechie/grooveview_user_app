import { notFound } from "next/navigation"
import { getBusinessBySlug } from "@/lib/api"
import type { Business } from "@/types/database"
import TipsPage from "@/components/TipsPage"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ orderId?: string }>
}

async function getBusinessData(slug: string): Promise<Business | null> {
  return getBusinessBySlug(slug)
}

export default async function Tips({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { orderId } = await searchParams
  const business = await getBusinessData(slug)

  if (!business || !orderId) {
    notFound()
  }

  return <TipsPage business={business} orderId={orderId} />
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const business = await getBusinessData(slug)
  return {
    title: business ? `Tip Your Waiter - ${business.name}` : "Tip Your Waiter",
  }
}
