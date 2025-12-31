import { notFound } from "next/navigation"
import { getBusinessBySlug } from "@/lib/api"
import type { Business } from "@/types/database"
import MenuPaymentClient from "@/components/MenuPaymentClient"

interface PageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    amount?: string
  }>
}

async function getBusinessData(slug: string): Promise<Business | null> {
  const business = await getBusinessBySlug(slug)
  return business
}

export default async function MenuPayment({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { amount } = await searchParams
  
  const business = await getBusinessData(slug)

  if (!business) {
    notFound()
  }

  if (!amount) {
    notFound()
  }

  return (
    <MenuPaymentClient 
      business={business} 
      totalAmount={parseFloat(amount)}
    />
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const business = await getBusinessData(slug)

  if (!business) {
    return {
      title: "Payment",
    }
  }

  return {
    title: `Complete Payment - ${business.name}`,
  }
}