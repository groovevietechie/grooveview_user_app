"use client"

import { SparklesIcon } from "@heroicons/react/24/outline"

interface LoadingSkeletonProps {
  themeColor: string
}

export function MenuCardSkeleton({ themeColor }: LoadingSkeletonProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-44 bg-gray-200"></div>
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  )
}

export function CategoryCardSkeleton({ themeColor }: LoadingSkeletonProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-24 bg-gray-200"></div>
    </div>
  )
}

export function MainCategoryLoadingSkeleton({ themeColor }: LoadingSkeletonProps) {
  return (
    <div className="w-full space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded-full animate-pulse"></div>
      </div>

      {/* Main Categories Skeleton */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-pulse">
            <div className="h-32 bg-gray-200"></div>
            <div className="p-3">
              <div className="h-8 bg-gray-200 rounded-full w-20 mx-auto"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Categories Section Skeleton */}
      <div className="space-y-4">
        <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CategoryCardSkeleton key={i} themeColor={themeColor} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function MenuGridSkeleton({ themeColor }: LoadingSkeletonProps) {
  return (
    <div className="grid grid-cols-2 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <MenuCardSkeleton key={i} themeColor={themeColor} />
      ))}
    </div>
  )
}

export function ItemGridSkeleton({ themeColor }: LoadingSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 animate-pulse">
          <div className="h-52 bg-gray-200"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="flex justify-between items-center mt-4">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
  themeColor: string
}

export function EmptyState({ title, description, icon, action, themeColor }: EmptyStateProps) {
  return (
    <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
      <div 
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: `${themeColor}10` }}
      >
        {icon || <SparklesIcon className="w-10 h-10" style={{ color: themeColor }} />}
      </div>
      <h3 className="text-gray-900 font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-4 max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  )
}