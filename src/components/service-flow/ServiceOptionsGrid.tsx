"use client"

import { useState } from "react"
import Image from "next/image"
import type { ServiceConfiguration, ServiceOption } from "@/types/database"
import { useServiceStore } from "@/store/serviceStore"
import { ArrowLeftIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline"
import { getContrastColor, lightenColor } from "@/lib/color-utils"

interface ServiceOptionsGridProps {
  serviceConfiguration: ServiceConfiguration
  serviceOptions: ServiceOption[]
  onBack: () => void
  themeColor: string
}

export default function ServiceOptionsGrid({ 
  serviceConfiguration, 
  serviceOptions, 
  onBack, 
  themeColor 
}: ServiceOptionsGridProps) {
  const { items, addServiceItem, updateServiceQuantity, removeServiceItem } = useServiceStore()
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  // Group options by category
  const optionsByCategory = serviceOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = []
    }
    acc[option.category].push(option)
    return acc
  }, {} as Record<string, ServiceOption[]>)

  const categories = Object.keys(optionsByCategory)
  const displayOptions = selectedCategory 
    ? optionsByCategory[selectedCategory] || []
    : serviceOptions

  const getItemQuantity = (optionId: string) => {
    const item = items.find(item => item.serviceOption.id === optionId)
    return item?.quantity || 0
  }

  const handleAddItem = (option: ServiceOption) => {
    addServiceItem(option, 1)
  }

  const handleUpdateQuantity = (optionId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeServiceItem(optionId)
    } else {
      updateServiceQuantity(optionId, newQuantity)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price)
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          style={{ color: themeColor }}
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{serviceConfiguration.title}</h2>
          {serviceConfiguration.description && (
            <p className="text-gray-600 mt-1">{serviceConfiguration.description}</p>
          )}
          {serviceConfiguration.base_price > 0 && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Base Price: </span>
                {formatPrice(serviceConfiguration.base_price)}
                <span className="text-xs text-yellow-600 ml-1">(minimum service cost)</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === ""
                ? "text-white shadow-md"
                : "text-gray-600 bg-gray-100 hover:bg-gray-200"
            }`}
            style={selectedCategory === "" ? { backgroundColor: themeColor } : {}}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                selectedCategory === category
                  ? "text-white shadow-md"
                  : "text-gray-600 bg-gray-100 hover:bg-gray-200"
              }`}
              style={selectedCategory === category ? { backgroundColor: themeColor } : {}}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Options Grid */}
      {displayOptions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No options available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayOptions.map((option) => {
            const quantity = getItemQuantity(option.id)
            return (
              <div
                key={option.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {/* Option Image */}
                {option.image_url ? (
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                    <Image
                      src={option.image_url}
                      alt={option.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="h-48 flex items-center justify-center"
                    style={{ backgroundColor: lightenColor(themeColor, 95) }}
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: lightenColor(themeColor, 85) }}
                    >
                      <span className="text-2xl font-bold" style={{ color: themeColor }}>
                        {option.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Option Details */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                      {option.name}
                    </h3>
                    <span
                      className="font-bold text-lg"
                      style={{ color: themeColor }}
                    >
                      {formatPrice(option.price)}
                    </span>
                  </div>

                  {option.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {option.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full">
                      {option.category}
                    </span>

                    {/* Quantity Controls */}
                    {quantity > 0 ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleUpdateQuantity(option.id, quantity - 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center border-2 hover:bg-gray-50 transition-colors"
                          style={{ borderColor: themeColor, color: themeColor }}
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-lg min-w-[2rem] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(option.id, quantity + 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors"
                          style={{ backgroundColor: themeColor }}
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddItem(option)}
                        className="px-4 py-2 rounded-full text-white font-medium transition-all hover:shadow-md active:scale-95"
                        style={{ backgroundColor: themeColor }}
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}