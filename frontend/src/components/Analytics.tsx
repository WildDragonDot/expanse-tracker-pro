'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

// Google Analytics pageview tracking
export function pageview(url: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

// Google Analytics event tracking
export function event({ action, category, label, value }: {
  action: string
  category: string
  label?: string
  value?: number
}) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Google Tag Manager dataLayer push
export function gtmEvent(eventName: string, eventData?: any) {
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    ;(window as any).dataLayer.push({
      event: eventName,
      ...eventData,
    })
  }
}

export default function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      pageview(pathname)
    }
  }, [pathname])

  if (!GA_MEASUREMENT_ID && !GTM_ID) {
    return null
  }

  return (
    <>
      {/* Google Analytics */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true,
                  cookie_flags: 'SameSite=None;Secure'
                });
              `,
            }}
          />
        </>
      )}

      {/* Google Tag Manager */}
      {GTM_ID && (
        <>
          <Script
            id="google-tag-manager"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${GTM_ID}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}
    </>
  )
}

// Custom event tracking hooks
export function useAnalytics() {
  const trackEvent = (action: string, category: string, label?: string, value?: number) => {
    event({ action, category, label, value })
    gtmEvent(action, { category, label, value })
  }

  const trackExpenseAdded = (amount: number, category: string) => {
    trackEvent('expense_added', 'Expenses', category, amount)
  }

  const trackIncomeAdded = (amount: number, source: string) => {
    trackEvent('income_added', 'Income', source, amount)
  }

  const trackBudgetCreated = (name: string, amount: number) => {
    trackEvent('budget_created', 'Planning', name, amount)
  }

  const trackShoppingItemAdded = (category: string) => {
    trackEvent('shopping_item_added', 'Shopping', category)
  }

  const trackReportGenerated = (type: string) => {
    trackEvent('report_generated', 'Reports', type)
  }

  const trackUserRegistered = () => {
    trackEvent('user_registered', 'Authentication', 'Register')
  }

  const trackUserLoggedIn = () => {
    trackEvent('user_logged_in', 'Authentication', 'Login')
  }

  return {
    trackEvent,
    trackExpenseAdded,
    trackIncomeAdded,
    trackBudgetCreated,
    trackShoppingItemAdded,
    trackReportGenerated,
    trackUserRegistered,
    trackUserLoggedIn,
  }
}
