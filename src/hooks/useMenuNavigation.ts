"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import type { MenuCategory } from "@/types/database"

export type NavigationStep = "menus" | "items" | "services"

interface NavigationState {
  step: NavigationStep
  selectedCategoryId?: string
  selectedServiceId?: string
  activeTab?: string
}

export function useMenuNavigation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Parse current state from URL
  const getCurrentState = useCallback((): NavigationState => {
    const step = (searchParams.get("view") as NavigationStep) || "menus"
    const selectedCategoryId = searchParams.get("category") || undefined
    const selectedServiceId = searchParams.get("service") || undefined
    const activeTab = searchParams.get("tab") || undefined
    
    return {
      step,
      selectedCategoryId,
      selectedServiceId,
      activeTab
    }
  }, [searchParams])

  const [navigationState, setNavigationState] = useState<NavigationState>(getCurrentState)

  // Update state when URL changes (back/forward navigation)
  useEffect(() => {
    const newState = getCurrentState()
    setNavigationState(newState)
  }, [getCurrentState])

  // Navigate to a new state and update URL
  const navigateTo = useCallback((newState: Partial<NavigationState>) => {
    const currentState = getCurrentState()
    const updatedState = { ...currentState, ...newState }
    
    // Build new URL parameters
    const params = new URLSearchParams()
    
    if (updatedState.step !== "menus") {
      params.set("view", updatedState.step)
    }
    
    if (updatedState.selectedCategoryId) {
      params.set("category", updatedState.selectedCategoryId)
    }
    
    if (updatedState.selectedServiceId) {
      params.set("service", updatedState.selectedServiceId)
    }
    
    if (updatedState.activeTab) {
      params.set("tab", updatedState.activeTab)
    }

    // Update URL without page reload
    const newUrl = params.toString() ? `?${params.toString()}` : ""
    router.push(newUrl, { scroll: false })
    
    setNavigationState(updatedState)
  }, [getCurrentState, router])

  // Navigate to category items view
  const navigateToCategory = useCallback((category: MenuCategory, activeTab?: string) => {
    navigateTo({
      step: "items",
      selectedCategoryId: category.id,
      activeTab
    })
  }, [navigateTo])

  // Navigate to service view
  const navigateToService = useCallback((serviceId: string) => {
    navigateTo({
      step: "services",
      selectedServiceId: serviceId,
      activeTab: "services"
    })
  }, [navigateTo])

  // Navigate back to menus
  const navigateToMenus = useCallback((activeTab?: string) => {
    navigateTo({
      step: "menus",
      selectedCategoryId: undefined,
      selectedServiceId: undefined,
      activeTab
    })
  }, [navigateTo])

  // Handle browser back button
  const handleBack = useCallback(() => {
    const currentState = getCurrentState()
    
    if (currentState.step === "items" || currentState.step === "services") {
      // Go back to menus view, preserving the active tab
      navigateToMenus(currentState.activeTab)
    } else {
      // If already on menus, let browser handle normal back navigation
      router.back()
    }
  }, [getCurrentState, navigateToMenus, router])

  return {
    navigationState,
    navigateToCategory,
    navigateToService,
    navigateToMenus,
    handleBack
  }
}