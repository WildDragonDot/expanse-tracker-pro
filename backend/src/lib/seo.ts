import { Metadata } from 'next'

export const siteConfig = {
  name: 'Expense Tracker Pro',
  title: 'Expense Tracker Pro - Smart Personal Finance Management',
  description: 'Track expenses, manage budgets, plan shopping, and control your finances with AI-powered insights. Free personal finance app with smart analytics and expense tracking.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://yourapp.com',
  ogImage: '/og-image.jpg',
  keywords: [
    'expense tracker',
    'budget planner',
    'personal finance',
    'money management',
    'expense management',
    'budget app',
    'finance tracker',
    'spending tracker',
    'financial planning',
    'money tracker',
    'expense app',
    'budget tracking',
    'financial management',
    'income tracker',
    'shopping list',
    'bill tracker',
    'subscription tracker',
    'smart finance',
    'expense analytics',
    'financial health score'
  ],
  authors: [
    {
      name: 'Expense Tracker Team',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://yourapp.com',
    },
  ],
  creator: 'Expense Tracker Team',
  publisher: 'Expense Tracker Pro',
  category: 'Finance',
  classification: 'Personal Finance Management',
  language: 'en',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
}

export function generateMetadata({
  title,
  description,
  image,
  noIndex = false,
  keywords,
  canonical,
}: {
  title?: string
  description?: string
  image?: string
  noIndex?: boolean
  keywords?: string[]
  canonical?: string
}): Metadata {
  const metaTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title
  const metaDescription = description || siteConfig.description
  const metaImage = image || siteConfig.ogImage
  const metaKeywords = keywords || siteConfig.keywords

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords.join(', '),
    authors: siteConfig.authors,
    creator: siteConfig.creator,
    publisher: siteConfig.publisher,
    category: siteConfig.category,
    classification: siteConfig.classification,
    robots: noIndex ? 'noindex,nofollow' : siteConfig.robots,
    alternates: {
      canonical: canonical || siteConfig.url,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: canonical || siteConfig.url,
      title: metaTitle,
      description: metaDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: metaImage,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [metaImage],
      creator: '@expensetracker',
      site: '@expensetracker',
    },
    icons: {
      icon: [
        { url: '/icon-16.svg', sizes: '16x16', type: 'image/svg+xml' },
        { url: '/icon-32.svg', sizes: '32x32', type: 'image/svg+xml' },
      ],
      apple: [
        { url: '/icon-152.svg', sizes: '152x152', type: 'image/svg+xml' },
        { url: '/icon-192.svg', sizes: '180x180', type: 'image/svg+xml' },
      ],
      other: [
        {
          rel: 'mask-icon',
          url: '/icon-192.svg',
        },
      ],
    },
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: siteConfig.name,
    },
    formatDetection: {
      telephone: false,
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    },
  }
}

// Page-specific metadata
export const pageMetadata = {
  home: {
    title: 'Home',
    description: 'Manage your personal finances with smart expense tracking, budget planning, and financial insights.',
    keywords: ['expense tracker home', 'finance dashboard', 'budget overview'],
  },
  dashboard: {
    title: 'Dashboard',
    description: 'View your financial overview, spending analytics, and smart insights in one place.',
    keywords: ['finance dashboard', 'expense analytics', 'spending overview'],
  },
  expenses: {
    title: 'Expenses',
    description: 'Track and manage all your expenses with detailed categorization and smart analytics.',
    keywords: ['track expenses', 'expense management', 'spending tracker'],
  },
  planning: {
    title: 'Budget Planning',
    description: 'Plan your budgets for festivals, events, and monthly expenses with smart cost estimation.',
    keywords: ['budget planning', 'expense planning', 'financial planning'],
  },
  shopping: {
    title: 'Shopping Lists',
    description: 'Organize shopping by categories, track costs, and manage your shopping efficiently.',
    keywords: ['shopping list', 'shopping tracker', 'grocery list'],
  },
  analytics: {
    title: 'Analytics',
    description: 'Deep dive into your spending patterns with advanced analytics and visualizations.',
    keywords: ['expense analytics', 'spending analysis', 'financial insights'],
  },
  settings: {
    title: 'Settings',
    description: 'Manage your account settings, preferences, and customize your expense tracking experience.',
    keywords: ['account settings', 'user preferences', 'app settings'],
  },
  login: {
    title: 'Login',
    description: 'Sign in to your expense tracker account to manage your finances.',
    keywords: ['login', 'sign in', 'account access'],
    noIndex: true,
  },
  register: {
    title: 'Register',
    description: 'Create a free account to start tracking your expenses and managing your finances.',
    keywords: ['register', 'sign up', 'create account'],
  },
}

// Structured data for rich snippets
export function generateWebAppStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'Expense Tracking',
      'Budget Planning',
      'Shopping Lists',
      'Financial Analytics',
      'Smart Insights',
      'Multi-currency Support',
      'Data Export',
      'Secure & Private',
    ],
  }
}

export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon-192.svg`,
    description: siteConfig.description,
    sameAs: [
      'https://twitter.com/expensetracker',
      'https://facebook.com/expensetracker',
      'https://linkedin.com/company/expensetracker',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@yourapp.com',
    },
  }
}

export function generateBreadcrumbStructuredData(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`,
    })),
  }
}

export function generateFAQStructuredData(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}
