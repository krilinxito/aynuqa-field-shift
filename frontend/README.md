# frontend/

Equipo Front. Rama: `team/front`.

App web instalable (PWA) con React y Vite, pensada para que personas mayores del campo la usen en su celular.

## Qué hay hoy

Cuatro pantallas, una acción principal en cada una:

| Ruta | Pantalla |
| --- | --- |
| `/comunidad` | ¿De qué comunidad es usted? Solo se puede elegir la zona que devuelve la API (hoy, Pumani); las demás dicen "Todavía sin datos". |
| `/mi-comunidad` | Pantalla principal: resumen de toda la comunidad. Sectores agrupados por lo que conviene hacer (abrir, seguir en descanso, seguir cultivando, pasar a descanso), tierras gemelas, riesgo de sequía por nivel, dibujo plano de los sectores y clima de la zona. Compara "Hoy, con El Niño" con "Si fuera un año normal". Se imprime para la asamblea. No asume cuántos sectores hay. |
| `/sector?sector=S3` | Detalle de un sector, al tocarlo en el resumen: recomendación, motivos, riesgo, recuperación del suelo, tierra gemela y confianza. |
| `/preguntar` | Chat con la llamita: preguntas para tocar, dictado por voz y respuestas que se pueden escuchar. Pregunta sobre toda la comunidad, o sobre un sector si se llega desde su detalle. |

`/` lleva al resumen si la persona ya eligió comunidad (se recuerda en el celular); si no, a elegirla.

El resumen de comunidad solo agrupa, cuenta y pone en palabras lo que trae `/api/sectors`: no promedia ni calcula predicciones (`src/features/community/communityText.ts`).

Accesibilidad, que manda sobre lo demás:

- Letra base de 19 px y botón "Letra grande" (23 px). Botones de 56 px o más.
- "Escuchar" lee el consejo y las respuestas con la voz del celular; "Hablar" dicta la pregunta. Si el celular no puede, el botón no aparece.
- El nivel se lee con palabra y barras, nunca solo con color. Sin siglas: "verdor" en vez de NDVI.
- Títulos en Lora itálica; texto corrido en Atkinson Hyperlegible recta, porque la itálica chica cuesta leerla. Fuentes locales, sin internet.
- Sprites de píxeles propios (`src/shared/sprites/`): llamas, planta, sol, nube, chakana. Las franjas de aguayo separan secciones en lugar de cajas.

Fuera de alcance por ahora: terreno 3D, línea de tiempo, sensores y backtest. La capa de datos ya los soporta (`DataRepository`).

`DESIGN_SPEC.md`, `ARCHITECTURE.md` e `IMPLEMENTATION_PLAN.md` describen el plan inicial (Montserrat, cuatro rutas, Three.js). La parte visual y las rutas fueron reemplazadas por lo de arriba; la capa de datos sigue vigente.

## Componentes

Las piezas se arman por composición, con contexto `{ state, actions, meta }` y sin props booleanas:

- `CommunityOverview.Provider` + `.Heading`, `.Actions`, `.Listen`, `.Twins`, `.Risk`, `.Map`, `.Weather` (`src/features/community/`).
- `SectorInsight.Provider` + `.Heading`, `.Recommendation`, `.Listen`, `.Reasons`, `.Risk`, `.Recovery`, `.Twin`, `.ZoneWeather`, `.Provenance` (`src/features/insight/`).
- `Chat.Provider` + `.OfflineNotice`, `.Messages`, `.Suggestions`, `.Composer`, `.DictateButton` (`src/features/chat/`). Solo el provider conoce `sendChat`.
- `ChoiceList.Root` + `.Available` / `.Unavailable`, y `SectorMap` (`src/features/picker/`).
- `SpeechProvider`, `ListenButton`, `useDictation` (`src/features/speech/`).

Los textos del consejo salen de `src/features/insight/insightText.ts`: solo ponen en palabras los valores de la API; si falta un dato dicen "sin dato".

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

`VITE_DATA_MODE=mock` es el modo predeterminado de desarrollo. Usa los fixtures oficiales de `contracts/examples/api/`. Para consumir FastAPI configura `VITE_DATA_MODE=api` y una `VITE_API_BASE_URL` HTTP(S) válida. No existe fallback silencioso desde API a mocks. Todas las variables `VITE_*` quedan expuestas al navegador: nunca deben contener secretos, claves de Gemini ni tokens administrativos.

## Cómo correr

Requisitos: Node.js `22.12+` o Node.js 24 LTS y npm.

```bash
npm install
npm run dev
```

La aplicación queda disponible en la URL indicada por Vite.

Con `VITE_DATA_MODE=mock` el chat solo contesta la primera pregunta sugerida del sector 3 (el único fixture); para el chat real hace falta el backend y `VITE_DATA_MODE=api`.

### Verla en el celular con el backend

`vite.config.ts` reenvía `/api` y `/health` a `http://127.0.0.1:8000` y acepta dominios de ngrok. Con `VITE_API_BASE_URL=/` la app pide la API al mismo sitio que la sirve, así que basta un solo túnel:

```bash
VITE_DATA_MODE=api VITE_API_BASE_URL=/ npm run build
npx vite preview --port 4173
ngrok http 4173
```

Los íconos de la PWA se regeneran desde el sprite de la llama con `npm run generate:icons`.

El hosting de producción debe redirigir las rutas desconocidas a `index.html` para que el acceso directo y la recarga funcionen con React Router.

## Calidad

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

`npm run test:watch` mantiene Vitest en modo interactivo durante desarrollo.

## Contratos y capa de datos

Los schemas de `../contracts/*.schema.json` son la fuente de verdad. La Fase 02 incorpora:

- `DataRepository`, con implementaciones intercambiables `MockDataRepository` y `ApiDataRepository`;
- AJV 2020-12 y `ajv-formats` para validar fixtures, respuestas HTTP y formatos `date-time`;
- errores tipados para contrato, fixture ausente, red, timeout, API y configuración;
- caché ligera en memoria con deduplicación, cancelación y conservación del último dato válido;
- estado compartido de sector y escenario, sincronizado con la URL.

Los DTOs se regeneran de forma reproducible:

```bash
npm run generate:types
npm run check:generated-types
```

`json-schema-to-typescript` representa propiedades, enums, `null`, arrays y la referencia local `$defs/twin_precedent`. Restricciones que TypeScript no puede expresar por sí solo —formatos, patrones, mínimos, máximos y propiedades adicionales en datos externos— se aplican en runtime con AJV. Los archivos de `src/data/contracts/generated/` no se editan manualmente.

Cobertura actual de mocks:

- sectores S1–S8 en `nino` y `normal`;
- histórico y sensores solo para S1, dentro de la cobertura de sus fixtures;
- backtest solo para `2015-16`;
- chat solo para la solicitud oficial exacta del fixture;
- health según el fixture oficial.

Una combinación sin fixture produce `FixtureMissingError`; nunca se generan datos para completar la demo.

Discrepancia contractual conocida: `contracts/README.md` indica que RONI NOAA es el único dato real de los ejemplos, mientras `twin_precedent.schema.json` describe `is_simulated=false` como mediciones reales de NDVI y terreno. El frontend preserva los valores exactos sin corregirlos; el equipo de contratos debe resolver la redacción.

## Estado compartido entre rutas

La navegación conserva `sector` y `scenario` entre pantallas. La URL es la fuente compartible; el sector se valida contra la respuesta disponible y se resuelve en este orden: URL válida y sector válido en la URL (solo para el detalle). La comunidad y el tamaño de letra se guardan en el celular.

## Estrategia JSON Schema

Se adoptará una estrategia combinada, sin duplicar estructuras a mano:

1. **`json-schema-to-typescript` como herramienta de desarrollo** genera DTOs TypeScript desde `contracts/*.schema.json`. Los archivos generados llevan cabecera de código generado y una tarea reproducible comprueba que no estén desactualizados.
2. **AJV 2020 + `ajv-formats` en el límite de entrada** para validar fixtures y respuestas HTTP, incluyendo `date-time`, `null`, enums, `$defs` y `additionalProperties: false`.
3. Los schemas de `contracts/` permanecerán como única fuente de verdad. Los modelos de presentación se construirán después mediante adaptadores tipados, sin cálculos científicos.

Esta combinación separa dos necesidades: TypeScript protege el código durante compilación y AJV verifica datos externos en tiempo de ejecución. El generador es exclusivamente una dependencia de desarrollo.
