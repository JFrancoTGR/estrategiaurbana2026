// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://estrategiaurbana.info',
//   base: '/web2026',

  vite: {
    build: {
      cssMinify: 'esbuild',
    },
  },

});
