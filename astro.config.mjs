// @ts-check
import { defineConfig } from 'astro/config';

const isProduction = process.env.SITE_ENV === 'production';

export default defineConfig({
  site: isProduction
    ? 'https://estrategiaurbana.com.mx'
    : 'https://estrategiaurbana.info',

  base: isProduction ? '/' : '/web2026/',

  vite: {
    // Preserve standard and prefixed backdrop-filter declarations.
    // Prevent glassmorphism regressions in production builds.
    build: {
      cssMinify: 'esbuild',
    },
  },
});
