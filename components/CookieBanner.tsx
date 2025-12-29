'use client'

import { useState, useEffect } from 'react'

// Cookie Categories
export type CookieCategory = 'necessary' | 'analytics'

export interface CookieConsent {
  necessary: boolean // Always true, can't be disabled
  analytics: boolean
  timestamp: number
}

// Cookie Configuration
const COOKIE_CONFIG = {
  CONSENT_COOKIE_NAME: 'grtngs_cookie_consent',
  CONSENT_VERSION: '1.0',
  CONSENT_DURATION_DAYS: 365,
  BANNER_DELAY_MS: 1000,
} as const

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    timestamp: Date.now(),
  })

  useEffect(() => {
    // Check if user has already given consent
    const storedConsent = getCookieConsent()

    if (!storedConsent) {
      // Show banner after short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, COOKIE_CONFIG.BANNER_DELAY_MS)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    const newConsent: CookieConsent = {
      necessary: true,
      analytics: true,
      timestamp: Date.now(),
    }
    saveConsent(newConsent)
    setShowBanner(false)
  }

  const handleAcceptNecessary = () => {
    const newConsent: CookieConsent = {
      necessary: true,
      analytics: false,
      timestamp: Date.now(),
    }
    saveConsent(newConsent)
    setShowBanner(false)
  }

  const handleSavePreferences = () => {
    const newConsent: CookieConsent = {
      ...consent,
      necessary: true, // Always true
      timestamp: Date.now(),
    }
    saveConsent(newConsent)
    setShowBanner(false)
  }

  const handleToggle = (category: CookieCategory) => {
    if (category === 'necessary') return // Can't disable necessary cookies

    setConsent(prev => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  if (!showBanner) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" />

      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-2xl shadow-2xl">
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="text-4xl">🍪</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Wir verwenden Cookies
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Wir nutzen Cookies und ähnliche Technologien, um dir die beste Erfahrung auf unserer Website zu bieten.
                  Einige Cookies sind technisch notwendig, während andere uns helfen, die Website zu verbessern und personalisierte
                  Inhalte anzubieten.
                </p>
              </div>
            </div>

            {/* Cookie Details (expandable) */}
            {showDetails && (
              <div className="space-y-4 mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                {/* Necessary Cookies */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                        <div className="w-4 h-4 bg-white rounded-full" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Notwendige Cookies</h3>
                        <p className="text-xs text-gray-400">Immer aktiv</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 ml-15">
                    Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.
                    Sie speichern z.B. deine Cookie-Einstellungen, Session-Informationen und ermöglichen sichere Bereiche.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggle('analytics')}
                        className={`w-12 h-6 rounded-full flex items-center transition-all duration-300 ${
                          consent.analytics
                            ? 'bg-blue-500 justify-end'
                            : 'bg-gray-600 justify-start'
                        } px-1`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full" />
                      </button>
                      <div>
                        <h3 className="text-white font-semibold">Analyse Cookies</h3>
                        <p className="text-xs text-gray-400">Optional</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 ml-15">
                    Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren, indem Informationen
                    anonym gesammelt und gemeldet werden. Dies hilft uns, die Website zu verbessern.
                  </p>
                </div>

              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all text-sm font-medium"
              >
                {showDetails ? '✕ Details ausblenden' : '⚙️ Cookie-Einstellungen'}
              </button>

              <button
                onClick={handleAcceptNecessary}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all text-sm font-medium"
              >
                Nur Notwendige
              </button>

              {showDetails && (
                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg transition-all text-sm font-semibold"
                >
                  Auswahl speichern
                </button>
              )}

              <button
                onClick={handleAcceptAll}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all text-sm font-semibold shadow-lg"
              >
                Alle akzeptieren
              </button>
            </div>

            {/* Legal Links */}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs text-gray-400">
              <a href="/datenschutz" className="hover:text-white transition-colors">
                Datenschutz
              </a>
              <span className="text-gray-600">|</span>
              <span>Version {COOKIE_CONFIG.CONSENT_VERSION}</span>
              <span className="text-gray-600">|</span>
              <span>Private App - Nur für Freunde & Familie</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Helper Functions
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(COOKIE_CONFIG.CONSENT_COOKIE_NAME)
    if (!stored) return null

    const parsed = JSON.parse(stored)

    // Check if consent is still valid (not expired)
    const expiryDate = parsed.timestamp + (COOKIE_CONFIG.CONSENT_DURATION_DAYS * 24 * 60 * 60 * 1000)
    if (Date.now() > expiryDate) {
      localStorage.removeItem(COOKIE_CONFIG.CONSENT_COOKIE_NAME)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function saveConsent(consent: CookieConsent): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(
      COOKIE_CONFIG.CONSENT_COOKIE_NAME,
      JSON.stringify(consent)
    )

    // Dispatch custom event so other parts of the app can react
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
      detail: consent
    }))

    // Apply consent immediately
    applyConsent(consent)
  } catch (error) {
    console.error('Failed to save cookie consent:', error)
  }
}

export function applyConsent(consent: CookieConsent): void {
  // Analytics
  if (consent.analytics) {
    // Enable analytics tracking
    // Example: window.gtag?.('consent', 'update', { analytics_storage: 'granted' })
    console.log('Analytics enabled')
  } else {
    // Disable analytics tracking
    // Example: window.gtag?.('consent', 'update', { analytics_storage: 'denied' })
    console.log('Analytics disabled')
  }
}

// Check if user has given consent for a specific category
export function hasConsent(category: CookieCategory): boolean {
  const consent = getCookieConsent()
  if (!consent) return false
  return consent[category]
}

// Reset consent (useful for testing or user request)
export function resetConsent(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(COOKIE_CONFIG.CONSENT_COOKIE_NAME)
  window.location.reload()
}
