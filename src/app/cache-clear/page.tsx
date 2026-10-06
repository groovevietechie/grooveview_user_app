'use client'

import { useEffect, useState } from 'react'

export default function CacheClearPage() {
  const [status, setStatus] = useState('Clearing cache...')
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    const clearCache = async () => {
      try {
        // Unregister all service workers
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.unregister()
          console.log('[Cache Clear] Unregistered service worker')
        }

        // Clear all caches
        const cacheNames = await caches.keys()
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName)
          console.log('[Cache Clear] Deleted cache:', cacheName)
        }

        // Clear localStorage
        localStorage.clear()
        console.log('[Cache Clear] Cleared localStorage')

        // Clear sessionStorage
        sessionStorage.clear()
        console.log('[Cache Clear] Cleared sessionStorage')

        setStatus('✅ Cache cleared successfully! Redirecting to menu...')
        setCleared(true)

        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } catch (error) {
        console.error('[Cache Clear] Error:', error)
        setStatus('❌ Error clearing cache. Check console for details.')
      }
    }

    if ('serviceWorker' in navigator && 'caches' in window) {
      clearCache()
    } else {
      setStatus('❌ Cache API not supported in this browser')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
            cleared ? 'bg-emerald-500/20 border border-emerald-400' : 'bg-amber-500/20 border border-amber-400 animate-spin'
          }`}>
            <span className="text-3xl">{cleared ? '✅' : '⚙️'}</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Cache Management</h1>
        <p className={`text-lg ${cleared ? 'text-emerald-300' : 'text-amber-200'}`}>
          {status}
        </p>
        {cleared && (
          <p className="text-sm text-slate-400 mt-4">
            You will be redirected shortly...
          </p>
        )}
      </div>
    </div>
  )
}
