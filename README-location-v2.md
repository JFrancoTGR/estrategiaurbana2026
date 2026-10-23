# Project YAML Location V2

Borrador de la segunda versión del contrato de datos para los 10 proyectos que
actualmente tienen `detail.visible: true`.

## Cambios de estructura

`location` pasa a concentrar información geográfica del proyecto:

- `market`
- `zone`
- `label`
- `address`
- `coordinates.lat`
- `coordinates.lng`
- `map.home.visible`
- `map.home.category`
- `map.detail.visible`
- `map.detail.zoom`

`detail.intro.address` se elimina para evitar duplicación.

Se agrega `detail.location`, que contiene únicamente contenido editorial:

- `index`
- `title.lead`
- `title.emphasis`
- `body`

## Importante

Esta entrega es una V2 de contenido. Todavía requiere actualizar
`src/content.config.ts` antes de sustituir los YAML del repo, porque el schema
actual no admite estos campos y todavía exige `intro.address`.

## Coordenadas

Se reutilizaron coordenadas ya presentes en el mapa maestro para los proyectos
CDMX cuando existe una correspondencia clara.

NAOS utiliza la coordenada del enlace oficial de Google Maps del proyecto.

THE WAVVE y PORTTICA conservan `lat: null` / `lng: null` de forma intencional.
Sus direcciones sí están corroboradas, pero no se incluyó una coordenada
aproximada o inferida. Esos dos valores deben validarse antes de conectar el
nuevo componente de mapa.

## Editorial

El copy de ubicación de NAOS replica la referencia visual compartida.

El copy de ubicación de los demás proyectos es contenido de trabajo/provisional
redactado para probar la estructura del componente. Debe pasar por la futura
revisión editorial antes del release final.

## Legacy

Los proyectos legacy no están incluidos todavía en este paquete para evitar
mezclar dos migraciones.

El contrato acordado para ellos será:

```yaml
location:
  ...
  map:
    home:
      visible: true | false
      category: venta | renta | oficina

    detail:
      visible: false
```

Cuando migremos el mapa maestro, cada legacy tomará sus coordenadas del dataset
actual cuando exista correspondencia. Los proyectos legacy que hoy no están en
`map-locations.ts` deberán validarse antes de asignar coordenadas.
