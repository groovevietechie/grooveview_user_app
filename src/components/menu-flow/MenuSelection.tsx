"use client"

import type React from "react"

import Image from "next/image"
import type { Menu } from "@/types/database"

interface MenuSelectionProps {
  menus: Menu[]
  onSelectMenu: (menu: Menu) => void
  themeColor: string
}

export default function MenuSelection({ menus, onSelectMenu, themeColor }: MenuSelectionProps) {
  return (
    <div className="w-full space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: themeColor }}>
          Select Menu
        </h1>
        <p className="text-gray-600 text-sm mt-1">Browse our available menus</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => onSelectMenu(menu)}
            className="group text-left transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={
              {
                borderColor: themeColor,
                "--tw-ring-color": themeColor,
              } as React.CSSProperties
            }
          >
            <div className="bg-white border-2 rounded-lg overflow-hidden">
              {menu.image_url && (
                <div className="relative h-40 overflow-hidden bg-gray-100">
                  <Image
                    src={menu.image_url || "/placeholder.svg"}
                    alt={menu.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              )}

              <div className="p-4">
                <h3
                  className="font-bold text-lg text-gray-900 group-hover:text-opacity-90"
                  style={{ color: themeColor }}
                >
                  {menu.name}
                </h3>
                {menu.description && <p className="text-gray-600 text-sm mt-2 line-clamp-2">{menu.description}</p>}
              </div>

              <div className="h-1 group-hover:h-2 transition-all" style={{ backgroundColor: themeColor }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
