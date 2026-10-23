# Legacy project map migration V2

Este paquete contiene 21 YAML legacy con el bloque `location` extendido.

Todos tienen:

- `location.coordinates`
- `location.map.home.visible: true`
- `location.map.home.category: venta`
- `location.map.detail.visible: false`

`reconciled` es solamente una marca temporal de auditoría y no debe usarse en lógica de UI o filtrado.

## Pendientes de reconciliación manual

- `concepcion-beistegui.yaml` ← punto provisional `Cuauhtémoc 857` (19.3868, -99.1552)
- `elysee-polanco.yaml` ← punto provisional `Campos Elíseos 369` (19.4283, -99.1915)
- `garden-condesa.yaml` ← punto provisional `Nuevo León 36` (19.4142, -99.1707)
- `garden-polanco.yaml` ← punto provisional `Hegel 721` (19.4286, -99.1878)
- `revillagigedo-365.yaml` ← punto provisional `Ignacio L. 19` (19.4346163, -99.1559151)
- `tennyson-121.yaml` ← punto provisional `Horacio 1716` (19.4375, -99.211)

Los otros 15 archivos utilizan correspondencias directas entre el nombre/dirección del YAML y el dataset actual del mapa.

Nota: estos YAML asumen el schema refinado donde `location.map.detail.visible: false` no requiere `zoom`.
