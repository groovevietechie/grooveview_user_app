"use client"

import { useState } from "react"
import type { ServiceConfiguration, ServiceOption } from "@/types/database"
import { useServiceStore } from "@/store/serviceStore"
import { ArrowLeftIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline"

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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

      {/* Options List */}
      {displayOptions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No options available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayOptions.map((option) => {
            const quantity = getItemQuantity(option.id)
            return (
              <div
                key={option.id}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  {/* Option Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                        {option.name}
                      </h3>
                      <span
                        className="font-bold text-lg ml-4 flex-shrink-0"
                        style={{ color: themeColor }}
                      >
                        {formatPrice(option.price)}
                      </span>
                    </div>
                    
                    {option.description && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {option.description}
                      </p>
                    )}
                    
                    <span className="inline-block text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full">
                      {option.category}
                    </span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    {quantity > 0 ? (
                      <>
                        <button
                          onClick={() => handleUpdateQuantity(option.id, quantity - 1)}
                          className="w-9 h-9 rounded-full flex items-center justify-center border-2 hover:bg-gray-50 transition-colors"
                          style={{ borderColor: themeColor, color: themeColor }}
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-lg min-w-[2.5rem] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(option.id, quantity + 1)}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors hover:shadow-md"
                          style={{ backgroundColor: themeColor }}
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleAddItem(option)}
                        className="px-6 py-2.5 rounded-full text-white font-medium transition-all hover:shadow-md active:scale-95 flex items-center gap-2"
                        style={{ backgroundColor: themeColor }}
                      >
                        <PlusIcon className="w-4 h-4" />
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