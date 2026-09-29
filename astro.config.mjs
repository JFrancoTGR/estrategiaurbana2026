// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://estrategiaurbana.info',

  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },

  vite: {
    build: {
      cssMinify: 'esbuild',
    },
  },
});
