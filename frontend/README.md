# frontend/

Equipo Front. Rama: `team/front`.

App web instalable (PWA) con Vite y Three.js, pensada para que la gente del campo la use en su celular.

## Para quién se diseña

Celulares de gama baja, pantalla chica, señal débil o intermitente y uso al aire libre. Eso manda sobre cualquier otra decisión de diseño.

## PWA

- Instalable en la pantalla de inicio: manifest con nombre, íconos y color de tema.
- Service worker (por ejemplo, con `vite-plugin-pwa`) que guarda la app y la última respuesta de la API.
- Sin señal, la app abre y muestra los últimos datos guardados, con la fecha de la última actualización a la vista.
- El chat necesita conexión: sin señal lo dice con claridad en vez de fallar.
- Descarga inicial liviana: pocos polígonos, texturas pequeñas, sin dependencias pesadas de más.

## Diseño minimalista

- Pocas pantallas y una sola acción principal en cada una.
- Texto grande, alto contraste y botones fáciles de tocar.
- Pocos colores: el color se reserva para el nivel de riesgo, siempre acompañado de texto.
- Solo lo necesario para decidir: recomendación, motivos y confianza primero; el detalle, después.
- Español simple, sin términos técnicos.

## Alcance

Imprescindible:

- Consumir primero los ejemplos de `contracts/` (mock); luego la API mediante `VITE_API_BASE_URL`.
- PWA instalable con los últimos datos disponibles sin señal.
- Terreno 3D liviano a partir de un mapa de altura de NASADEM, con sectores coloreados por riesgo y selección al tocar.
- Selector de escenario: El Niño (el estado real de hoy) frente a un año normal.
- Panel del sector: recomendación, riesgo, recuperación, drivers, confianza y etiqueta "datos simulados".
- Línea de tiempo de 2000 a hoy con la banda de El Niño (RONI) y las series de NDVI y lluvia.
- Panel de chat conectado a `POST /api/chat`, con sugerencias de preguntas.
- Reporte imprimible para la asamblea.

Deseable: panel de sensores con alertas (helada, estrés), vista de backtest, comparación lado a lado El Niño vs normal.

Si sobra tiempo: modo narrativo para el pitch.

## Escala de los datos

Lluvia, temperatura y humedad de suelo son iguales para todos los sectores, porque caen en la misma celda de NASA POWER. Muéstralas una sola vez, como datos de la zona. Por sector solo cambian la vegetación (NDVI), el terreno, la recuperación y la recomendación.

## Configuración

Copia `.env.example` a `.env` y completa los valores.

## Cómo correr

Pendiente: se documenta cuando exista la app.
