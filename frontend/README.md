# frontend/

Equipo Front. Rama: `team/front`.

Panel web con Vite y Three.js, legible en celular.

## Alcance

Imprescindible:

- Consumir primero los ejemplos de `contracts/` (mock); luego la API mediante `VITE_API_BASE_URL`.
- Terreno 3D a partir de un mapa de altura de NASADEM, con sectores coloreados por riesgo y selección al tocar.
- Selector de escenario normal / El Niño que actualiza colores y recomendaciones.
- Panel lateral del sector: métricas, riesgo, recuperación, drivers, recomendación, confianza y etiqueta "datos simulados".
- Línea de tiempo de 2000 a hoy con la banda de El Niño y las series de NDVI y lluvia.
- Panel de chat conectado a `POST /api/chat`, con sugerencias de preguntas.
- Reporte imprimible para la asamblea.
- Buen rendimiento en celulares: pocos polígonos y texturas pequeñas.

Deseable: panel de sensores con alertas (helada, estrés), vista de backtest, comparación lado a lado normal vs El Niño.

Si sobra tiempo: modo narrativo para el pitch.

## Configuración

Copia `.env.example` a `.env` y completa los valores.

## Cómo correr

Pendiente: se documenta cuando exista la app.
