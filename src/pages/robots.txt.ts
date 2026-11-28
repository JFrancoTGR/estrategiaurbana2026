import type { APIRoute } from 'astro';

import { SEO_CONFIG } from '../config/seo';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const isProduction =
    site?.origin === SEO_CONFIG.siteUrl && import.meta.env.BASE_URL === '/';

  const robots = isProduction
    ? [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${SEO_CONFIG.siteUrl}/sitemap.xml`,
        '',
      ].join('\n')
    : ['User-agent: *', 'Allow: /', ''].join('\n');

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
