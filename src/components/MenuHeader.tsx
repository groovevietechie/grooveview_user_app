import Image from 'next/image'
import { Business } from '@/types/database'

interface MenuHeaderProps {
  business: Business
}

export default function MenuHeader({ business }: MenuHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Business Logo */}
          {business.logo_url ? (
            <Image
              src={business.logo_url}
              alt={business.name}
              width={48}
              height={48}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 text-xl font-bold">
                {business.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Business Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
            {business.address && (
              <p className="text-gray-600 text-sm">{business.address}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}