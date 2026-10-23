import { getCollection } from 'astro:content';

import { mapLocations, type MapLocation } from './map-locations';

/*
 * Las ubicaciones de proyectos en venta ya viven
 * en la colección `projects`.
 *
 * Durante la migración conservamos aquí únicamente
 * las ubicaciones auxiliares que todavía no pertenecen
 * a un proyecto YAML.
 */
const auxiliaryLocations: MapLocation[] = mapLocations.filter(
  (location) => location.category !== 'venta',
);

/*
 * Construye el dataset cartográfico utilizado
 * por el mapa maestro.
 *
 * Los proyectos son la fuente de verdad para:
 *
 * - nombre comercial
 * - coordenadas
 * - categoría
 * - visibilidad en Home
 *
 * `reconciled` no participa en ninguna lógica.
 */
export async function getMapLocations(): Promise<MapLocation[]> {
  const projects = await getCollection('projects');

  const projectLocations: MapLocation[] = projects.flatMap((project) => {
    const { location } = project.data;

    const homeMap = location.map?.home;
    const coordinates = location.coordinates;

    if (homeMap?.visible !== true || !coordinates) {
      return [];
    }

    return [
      {
        id: project.id,
        name: project.data.name,
        lat: coordinates.lat,
        lng: coordinates.lng,
        category: homeMap.category,
      },
    ];
  });

  /*
   * Orden estable para que la numeración de pins y selector
   * no dependa del orden interno del content loader.
   *
   * Sólo ordenamos proyectos; renta/oficina conservan
   * todavía su orden histórico.
   */
  projectLocations.sort((a, b) =>
    a.name.localeCompare(b.name, 'es', {
      sensitivity: 'base',
    }),
  );

  return [...projectLocations, ...auxiliaryLocations];
}
