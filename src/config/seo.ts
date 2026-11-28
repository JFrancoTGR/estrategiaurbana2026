export const SEO_CONFIG = {
  siteUrl: 'https://estrategiaurbana.com.mx',

  siteName: 'Estrategia Urbana',

  language: 'es-MX',

  locale: 'es_MX',

  ogType: 'website',

  defaultImage: {
    path: '/seo/corporate.jpg',
    alt: 'Estrategia Urbana — Desarrollos inmobiliarios',
    width: 1260,
    height: 709,
    type: 'image/jpeg',
  },

  twitterCard: 'summary_large_image',

  robots: {
    production: 'index, follow, max-image-preview:large',
    staging: 'noindex, nofollow',
  },
} as const;
