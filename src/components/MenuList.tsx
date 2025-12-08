import { Menu, MenuCategory, MenuItem } from '@/types/database'
import MenuCard from './MenuCard'
import CategoryCard from './CategoryCard'
import MenuItemCard from './MenuItemCard'

interface MenuListProps {
  menus: Menu[]
  categories: MenuCategory[]
  items: MenuItem[]
}

export default function MenuList({ menus, categories, items }: MenuListProps) {
  // Group categories by menu
  const categoriesByMenu = categories.reduce((acc, category) => {
    if (!acc[category.menu_id]) {
      acc[category.menu_id] = []
    }
    acc[category.menu_id].push(category)
    return acc
  }, {} as Record<string, MenuCategory[]>)

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category_id]) {
      acc[item.category_id] = []
    }
    acc[item.category_id].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  if (menus.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No menus available</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {menus.map((menu) => {
        const menuCategories = categoriesByMenu[menu.id] || []

        return (
          <div key={menu.id} className="space-y-6">
            {/* Menu Header */}
            <MenuCard menu={menu} />

            {/* Categories and Items */}
            <div className="space-y-6">
              {menuCategories.map((category) => {
                const categoryItems = itemsByCategory[category.id] || []

                return (
                  <div key={category.id} className="space-y-4">
                    <CategoryCard category={category} />

                    {categoryItems.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryItems.map((item) => (
                          <MenuItemCard key={item.id} item={item} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No items available in this category</p>
                    )}
                  </div>
                )
              })}

              {menuCategories.length === 0 && (
                <p className="text-gray-500 text-sm italic">No categories available in this menu</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}