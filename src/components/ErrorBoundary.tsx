"use client"

import React from "react"
import { ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} retry={this.retry} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error?: Error
  retry: () => void
  themeColor?: string
}

export function DefaultErrorFallback({ error, retry, themeColor = "#6366F1" }: ErrorFallbackProps) {
  return (
    <div className="text-center py-16 bg-gradient-to-br from-red-50 to-white rounded-2xl border border-red-100 shadow-sm">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-gray-900 font-semibold text-lg mb-2">Something went wrong</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
        We encountered an error while loading this content. Please try again.
      </p>
      {process.env.NODE_ENV === 'development' && error && (
        <details className="text-left bg-gray-100 rounded-lg p-4 mb-4 text-xs">
          <summary className="cursor-pointer font-medium text-gray-700 mb-2">
            Error Details (Development)
          </summary>
          <pre className="whitespace-pre-wrap text-red-600">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}
      <button
        onClick={retry}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-all hover:shadow-lg"
        style={{ backgroundColor: themeColor }}
      >
        <ArrowPathIcon className="w-4 h-4" />
        Try Again
      </button>
    </div>
  )
}

export function MenuErrorFallback({ error, retry, themeColor = "#6366F1" }: ErrorFallbackProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-gray-900 font-medium text-lg mb-2">Failed to load menu</h3>
      <p className="text-gray-500 text-sm mb-4">
        There was a problem loading the menu content.
      </p>
      <button
        onClick={retry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:shadow-md"
        style={{ backgroundColor: themeColor }}
      >
        <ArrowPathIcon className="w-4 h-4" />
        Retry
      </button>
    </div>
  )
}

export function ServiceErrorFallback({ error, retry, themeColor = "#6366F1" }: ErrorFallbackProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-gray-900 font-medium text-lg mb-2">Service booking unavailable</h3>
      <p className="text-gray-500 text-sm mb-4">
        We're having trouble loading the service booking system.
      </p>
      <button
        onClick={retry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:shadow-md"
        style={{ backgroundColor: themeColor }}
      >
        <ArrowPathIcon className="w-4 h-4" />
        Try Again
      </button>
    </div>
  )
}