import { notFound } from "next/navigation"
import { getBusinessBySlug } from "@/lib/api"
import type { Business } from "@/types/database"
import MenuOrderPaymentClient from "@/components/MenuOrderPaymentClient"

interface PageProps {
  params: Promise<{
    slug: string
    orderId: string
  }>
  searchParams: Promise<{
    code?: string
    amount?: string
  }>
}

async function getBusinessData(slug: string): Promise<Business | null> {
  const business = await getBusinessBySlug(slug)
  return business
}

export default async function MenuOrderPayment({ params, searchParams }: PageProps) {
  const { slug, orderId } = await params
  const { code, amount } = await searchParams
  
  const business = await getBusinessData(slug)

  if (!business) {
    notFound()
  }

  if (!code || !amount) {
    notFound()
  }

  return (
    <MenuOrderPaymentClient 
      business={business} 
      orderId={orderId}
      transferCode={code}
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