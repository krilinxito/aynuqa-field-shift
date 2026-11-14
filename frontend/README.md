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

- Precedente de tierra gemela en el panel del sector, cuando exista: zona, parecido y qué pasó con la vegetación, presentado como precedente y no como garantía.

Deseable: panel de sensores con alertas (helada, estrés), vista de backtest, comparación lado a lado El Niño vs normal.

Si sobra tiempo: modo narrativo para el pitch.

## Escala de los datos

Lluvia, temperatura y humedad de suelo son iguales para todos los sectores, porque caen en la misma celda de NASA POWER. Muéstralas una sola vez, como datos de la zona. Por sector solo cambian la vegetación (NDVI), el terreno, la recuperación y la recomendación.

## Configuración

Copia `.env.example` a `.env` y completa los valores públicos necesarios:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_DATA_MODE=mock
```

`VITE_DATA_MODE=mock` es el modo predeterminado de desarrollo. La selección del repositorio se implementará en Fase 02. Todas las variables `VITE_*` quedan expuestas al navegador: nunca deben contener secretos, claves de Gemini ni tokens administrativos.

## Cómo correr

Requisitos: Node.js `22.12+` o Node.js 24 LTS y npm.

```bash
npm install
npm run dev
```

La aplicación queda disponible en la URL indicada por Vite. Las rutas actuales son:

- `/territorio`
- `/analisis`
- `/asistente`
- `/informe`

El hosting de producción debe redirigir las rutas desconocidas a `index.html` para que el acceso directo y la recarga funcionen con React Router.

## Calidad

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

`npm run test:watch` mantiene Vitest en modo interactivo durante desarrollo.

## Estado compartido entre rutas

En Fase 01 la navegación conserva únicamente los parámetros `sector` y `scenario` al cambiar de sección. La URL será la fuente compartible de ese contexto. La validación de valores, hidratación desde datos y sincronización con estado de aplicación pertenecen a Fase 02; por ahora no se consulta ni se persiste ningún dato científico.

## Estrategia JSON Schema para Fase 02

Se adoptará una estrategia combinada, sin duplicar estructuras a mano:

1. **`json-schema-to-typescript` como herramienta de desarrollo** para generar DTOs TypeScript desde `contracts/*.schema.json`. Los archivos generados llevarán cabecera de código generado y una tarea reproducible comprobará que no estén desactualizados.
2. **AJV 2020 + `ajv-formats` en el límite de entrada** para validar fixtures y respuestas HTTP, incluyendo `date-time`, `null`, enums, `$defs` y `additionalProperties: false`.
3. Los schemas de `contracts/` permanecerán como única fuente de verdad. Los modelos de presentación se construirán después mediante adaptadores tipados, sin cálculos científicos.

Esta combinación separa dos necesidades: TypeScript protege el código durante compilación y AJV verifica datos externos en tiempo de ejecución. Las dependencias contractuales se instalarán y configurarán recién en Fase 02, después de medir su impacto en el bundle; el generador será exclusivamente de desarrollo.
