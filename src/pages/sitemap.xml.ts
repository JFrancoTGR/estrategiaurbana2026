import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

import { SEO_CONFIG } from '../config/seo';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const isProduction =
    site?.origin === SEO_CONFIG.siteUrl && import.meta.env.BASE_URL === '/';

  if (!isProduction) {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
        },
      },
    );
  }

  /*
   * Páginas estáticas públicas.
   */
  const staticRoutes = [
    '/',
    '/proyectos-en-venta/',
    '/proyectos-entregados/',
    '/socios-estrategicos/',
  ];

  /*
   * Proyectos con página de detalle pública.
   */
  const projects = await getCollection(
    'projects',
    ({ data }) => data.detail?.visible === true,
  );

  const projectRoutes = projects.map((project) => `/proyectos/${project.id}/`);

  /*
   * Zonas con página individual.
   */
  const zones = await getCollection('zones');

  const zoneRoutes = zones.map((zone) => `/zonas/${zone.id}/`);

  /*
   * Consolidar rutas y eliminar duplicados.
   */
  const routes = [
    ...new Set([...staticRoutes, ...projectRoutes, ...zoneRoutes]),
  ].sort();

  /*
   * Generar URLs absolutas.
   */
  const urls = routes.map((route) => {
    const url = new URL(route, SEO_CONFIG.siteUrl).href;

    return `  <url>
    <loc>${url}</loc>
  </url>`;
  });

  /*
   * Construir documento XML.
   */
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n');

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
