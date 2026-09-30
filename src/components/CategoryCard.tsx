import Image from 'next/image'
import { MenuCategory } from '@/types/database'

interface CategoryCardProps {
  category: MenuCategory
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg border border-amber-400/30 hover:border-amber-400/60 transition-colors">
      {category.image_url && (
        <Image
          src={category.image_url}
          alt={category.name}
          width={40}
          height={40}
          className="rounded-lg object-cover ring-2 ring-amber-400/30"
        />
      )}
      <div>
        <h3 className="text-lg font-medium text-amber-50">{category.name}</h3>
        {category.description && (
          <p className="text-amber-200/70 text-sm">{category.description}</p>
        )}
      </div>
    </div>
  )
}