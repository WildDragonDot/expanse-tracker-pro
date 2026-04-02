'use client'

import type { ReactNode } from 'react'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { DataProvider } from '@/contexts/DataContext'
import ExpiryCheckerInitializer from '@/components/ExpiryCheckerInitializer'
import Analytics from '@/components/Analytics'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import PWALoader from '@/components/PWALoader'
import { siteConfig, generateWebAppStructuredData, generateOrganizationStructuredData } from '@/lib/seo'

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Essential Meta Tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="color-scheme" content="light dark" />
        <title>{siteConfig.title}</title>
        <meta name="description" content={siteConfig.description} />
        <meta name="keywords" content={siteConfig.keywords.join(', ')} />
        <meta name="author" content={siteConfig.creator} />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteConfig.url} />
        <meta property="og:title" content={siteConfig.title} />
        <meta property="og:description" content={siteConfig.description} />
        <meta property="og:image" content={`${siteConfig.url}/og-image.jpg`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content={siteConfig.name} />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@expensetracker" />
        <meta name="twitter:creator" content="@expensetracker" />
        <meta name="twitter:title" content={siteConfig.title} />
        <meta name="twitter:description" content={siteConfig.description} />
        <meta name="twitter:image" content={`${siteConfig.url}/og-image.jpg`} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={siteConfig.url} />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content={siteConfig.name} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={siteConfig.name} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3b82f6" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-152.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.svg" />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/icon-32.svg" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/icon-16.svg" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icon-192.svg" color="#3b82f6" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Structured Data - WebApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateWebAppStructuredData()),
          }}
        />
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateOrganizationStructuredData()),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Get saved theme or system preference
                  var theme = null;
                  try {
                    theme = localStorage.getItem('theme');
                  } catch (e) {
                    // localStorage might not be available (private browsing, etc.)
                  }
                  
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var actualTheme = theme || (prefersDark ? 'dark' : 'light');
                  
                  // Apply theme immediately
                  var root = document.documentElement;
                  if (actualTheme === 'dark') {
                    root.classList.add('dark');
                  } else {
                    root.classList.remove('dark');
                  }
                  
                  // Set color scheme for better browser integration
                  root.style.colorScheme = actualTheme;
                  
                  // Disable transitions initially to prevent flash
                  root.style.setProperty('--theme-transition', 'none');
                  
                  // Listen for system theme changes (only if no saved preference)
                  if (window.matchMedia && !theme) {
                    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
                      try {
                        if (!localStorage.getItem('theme')) {
                          var newTheme = e.matches ? 'dark' : 'light';
                          if (newTheme === 'dark') {
                            root.classList.add('dark');
                          } else {
                            root.classList.remove('dark');
                          }
                          root.style.colorScheme = newTheme;
                        }
                      } catch (err) {
                        // Ignore localStorage errors
                      }
                    });
                  }
                } catch (e) {
                  // Fallback to light theme if there's an error
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }

                // Register service worker for PWA (only in production)
                if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                        
                        // Check for updates
                        registration.addEventListener('updatefound', function() {
                          const newWorker = registration.installing;
                          if (newWorker) {
                            newWorker.addEventListener('statechange', function() {
                              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New service worker available, prompt user to refresh
                                console.log('New service worker available');
                              }
                            });
                          }
                        });
                      })
                      .catch(function(registrationError) {
                        console.warn('SW registration failed: ', registrationError);
                      });
                  });
                }

                // Global error handler to prevent white screens
                window.addEventListener('error', function(e) {
                  console.error('Global error:', e.error);
                  // Don't reload automatically, just log the error
                });

                window.addEventListener('unhandledrejection', function(e) {
                  console.error('Unhandled promise rejection:', e.reason);
                  // Don't reload automatically, just log the error
                });

                // Prevent white screen on app resume
                document.addEventListener('visibilitychange', function() {
                  if (!document.hidden) {
                    // App became visible, check if it's still responsive
                    setTimeout(function() {
                      if (document.body.children.length === 0) {
                        console.warn('Empty body detected, reloading...');
                        window.location.reload();
                      }
                    }, 1000);
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <Analytics />
        <PWALoader />
        <ErrorBoundary>
          <ThemeProvider>
            <NotificationProvider>
              <AuthProvider>
                <DataProvider>
                  <ExpiryCheckerInitializer />
                  <div className="min-h-screen transition-colors duration-300" suppressHydrationWarning>
                    {children}
                  </div>
                </DataProvider>
              </AuthProvider>
            </NotificationProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
