"use client"

import React, { useState, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { Fragment } from "react"
import { XMarkIcon, PlusIcon, MinusIcon, CheckIcon } from "@heroicons/react/24/outline"
import type { MenuItem, MenuItemOptionCategory, MenuItemOption, SelectedOption } from "@/types/database"
import { getContrastColor, lightenColor } from "@/lib/color-utils"
import Image from "next/image"

interface MenuItemOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  item: MenuItem
  themeColor: string
  onAddToCart: (quantity: number, selectedOptions: SelectedOption[], note?: string) => void
}

export default function MenuItemOptionsModal({
  isOpen,
  onClose,
  item,
  themeColor,
  onAddToCart,
}: MenuItemOptionsModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})
  const [note, setNote] = useState("")
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const contrastColor = getContrastColor(themeColor)
  const lightBg = lightenColor(themeColor, 96)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
      setSelectedOptions({})
      setNote("")
      setValidationErrors([])
    }
  }, [isOpen])

  const handleOptionSelect = (categoryId: string, optionId: string, allowMultiple: boolean) => {
    setSelectedOptions(prev => {
      const currentSelections = prev[categoryId] || []
      
      if (allowMultiple) {
        // Toggle option in multiple selection
        if (currentSelections.includes(optionId)) {
          return {
            ...prev,
            [categoryId]: currentSelections.filter(id => id !== optionId)
          }
        } else {
          return {
            ...prev,
            [categoryId]: [...currentSelections, optionId]
          }
        }
      } else {
        // Single selection - replace current selection
        return {
          ...prev,
          [categoryId]: currentSelections.includes(optionId) ? [] : [optionId]
        }
      }
    })
  }

  const validateSelections = (): boolean => {
    const errors: string[] = []
    
    if (!item.option_categories) return true

    item.option_categories.forEach(category => {
      const selections = selectedOptions[category.id] || []
      
      if (category.is_required && selections.length === 0) {
        errors.push(`Please select at least one option from "${category.name}"`)
      }
    })

    setValidationErrors(errors)
    return errors.length === 0
  }

  const calculateTotalPrice = (): number => {
    let total = item.price * quantity
    
    if (!item.option_categories) return total

    item.option_categories.forEach(category => {
      const selections = selectedOptions[category.id] || []
      selections.forEach(optionId => {
        const option = category.options.find(opt => opt.id === optionId)
        if (option && option.price) {
          total += option.price * quantity
        }
      })
    })

    return total
  }

  const handleAddToCart = () => {
    if (!validateSelections()) return

    const finalSelectedOptions: SelectedOption[] = []
    
    if (item.option_categories) {
      item.option_categories.forEach(category => {
        const selections = selectedOptions[category.id] || []
        selections.forEach(optionId => {
          const option = category.options.find(opt => opt.id === optionId)
          if (option) {
            finalSelectedOptions.push({
              optionId: option.id,
              categoryId: category.id,
              name: option.name,
              price: option.price || 0
            })
          }
        })
      })
    }

    onAddToCart(quantity, finalSelectedOptions, note.trim() || undefined)
    onClose()
  }

  const hasOptions = item.option_categories && item.option_categories.length > 0

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="relative">
                  {item.image_url ? (
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-white/90 text-sm">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 pb-4" style={{ backgroundColor: lightBg }}>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-gray-600 text-sm">{item.description}</p>
                      )}
                    </div>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Base Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Base Price</span>
                    <span className="text-lg font-bold" style={{ color: themeColor }}>
                      ₦{item.price.toLocaleString()}
                    </span>
                  </div>

                  {/* Option Categories */}
                  {hasOptions && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-900">Customize Your Order</h4>
                      
                      {item.option_categories!.map((category) => (
                        <div key={category.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                                {category.name}
                                {category.is_required && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                                    Required
                                  </span>
                                )}
                              </h5>
                              {category.description && (
                                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {category.allow_multiple ? "Select multiple" : "Select one"}
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-2">
                            {category.options
                              .filter(option => option.is_available)
                              .sort((a, b) => a.display_order - b.display_order)
                              .map((option) => {
                                const isSelected = (selectedOptions[category.id] || []).includes(option.id)
                                
                                return (
                                  <button
                                    key={option.id}
                                    onClick={() => handleOptionSelect(category.id, option.id, category.allow_multiple)}
                                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                                      isSelected 
                                        ? 'border-current shadow-sm' 
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    style={{
                                      borderColor: isSelected ? themeColor : undefined,
                                      backgroundColor: isSelected ? lightBg : undefined
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                          isSelected ? 'border-current' : 'border-gray-300'
                                        }`}
                                        style={{ borderColor: isSelected ? themeColor : undefined }}
                                      >
                                        {isSelected && (
                                          <CheckIcon className="w-3 h-3" style={{ color: themeColor }} />
                                        )}
                                      </div>
                                      <span className="font-medium text-gray-900">{option.name}</span>
                                    </div>
                                    {option.price && option.price > 0 && (
                                      <span className="font-semibold" style={{ color: themeColor }}>
                                        +₦{option.price.toLocaleString()}
                                      </span>
                                    )}
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <ul className="text-sm text-red-700 space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Special Instructions */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Any special requests or modifications..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent resize-none"
                      style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                      rows={3}
                    />
                  </div>

                  {/* Quantity and Add to Cart */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">Quantity</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                          style={{ backgroundColor: themeColor, color: contrastColor }}
                        >
                          <MinusIcon className="w-5 h-5" />
                        </button>
                        <span className="text-xl font-bold text-gray-900 min-w-[2rem] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                          style={{ backgroundColor: themeColor, color: contrastColor }}
                        >
                          <PlusIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-lg font-bold">
                      <span className="text-gray-900">Total</span>
                      <span style={{ color: themeColor }}>
                        ₦{calculateTotalPrice().toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      className="w-full py-4 rounded-lg font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{ backgroundColor: themeColor, color: contrastColor }}
                    >
                      Add {quantity} to Cart
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}