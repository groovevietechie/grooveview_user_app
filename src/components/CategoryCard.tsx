import Image from 'next/image'
import { MenuCategory } from '@/types/database'

interface CategoryCardProps {
  category: MenuCategory
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <div className="flex items-center gap-3">
      {category.image_url && (
        <Image
          src={category.image_url}
          alt={category.name}
          width={40}
          height={40}
          className="rounded-lg object-cover"
        />
      )}
      <div>
        <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
        {category.description && (
          <p className="text-gray-600 text-sm">{category.description}</p>
        )}
      </div>
    </div>
  )
}