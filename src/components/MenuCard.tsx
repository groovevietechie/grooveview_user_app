import Image from 'next/image'
import { Menu } from '@/types/database'

interface MenuCardProps {
  menu: Menu
}

export default function MenuCard({ menu }: MenuCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-2">
      <div className="flex items-start gap-2">
        {menu.image_url && (
          <Image
            src={menu.image_url}
            alt={menu.name}
            width={60}
            height={60}
            className="rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900">{menu.name}</h2>
          {menu.description && (
            <p className="text-gray-600 mt-1">{menu.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}