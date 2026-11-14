# AYNUQA FIELD SHIFT — Arquitectura frontend

> Fase 00 · Arquitectura propuesta. No crea componentes, servicios ni dependencias.

## 1. Objetivos arquitectónicos

La arquitectura debe:

- entregar una PWA mobile-first que funcione en celulares de gama baja y con conectividad intermitente;
- mantener el territorio de Pumani como único ámbito geográfico;
- separar presentación, estado, acceso a datos y visualización geoespacial;
- consumir los contratos oficiales sin inventar endpoints ni recalcular ciencia en la interfaz;
- permitir intercambiar mocks y API real sin condicionales dentro de los componentes;
- conservar sector y escenario al alternar entre experiencia sencilla y análisis avanzado;
- degradar de Three.js a una vista 2D funcional;
- hacer visibles procedencia, simulación, actualización, incertidumbre y datos faltantes;
- permitir desarrollo incremental durante el hackathon sin crear componentes monolíticos.

## 2. Restricciones y fuente de verdad

1. `contracts/api.md`, `contracts/*.schema.json` y `contracts/examples/api/` son la fuente de verdad del transporte.
2. Los schemas tienen `additionalProperties: false`; un campo nuevo requiere cambio coordinado del contrato.
3. Los valores `null` significan dato faltante. La UI no los convierte en cero ni los interpola.
4. El frontend no calcula riesgo, recuperación, anomalías, backtest, correlaciones, alertas ni confianza.
5. Formatear, filtrar un rango ya entregado, ordenar para presentación o convertir un valor `0..1` a porcentaje visual no constituye un cálculo científico; aun así debe ocurrir en adaptadores/selectores, no dentro de JSX.
6. Lluvia, temperatura, humedad de suelo y RONI son regionales. Solo NDVI, terreno, rotación, riesgo, recuperación y recomendación diferencian sectores.
7. `scenario=nino` representa el estado real actual con RONI observado; `normal` es la comparación con RONI supuesto en cero.
8. Los límites de sectores, años de rotación y sensores son simulados. `data_source=mock` se muestra como “Datos de demostración”.
9. El alcance geográfico queda fijado en Pumani. No se diseña abstracción de búsqueda global.

### Estado actual de los contratos

En la inspección de Fase 00, `team/front` está en `0af0be7` y los contratos existen en `origin/main` a partir de `60055cb`/`cc85250`. La arquitectura se ha definido leyendo esos archivos directamente desde `origin/main`; deben integrarse en `team/front` antes de implementar la capa de datos.

## 3. Estructura de carpetas propuesta

La siguiente estructura es una especificación; no se crea en Fase 00.

```text
frontend/
├─ public/
│  ├─ icons/                     # iconos PWA finales
│  └─ offline/                   # recursos estáticos mínimos autorizados
├─ src/
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ router.tsx
│  │  ├─ providers/
│  │  │  ├─ AppStateProvider.tsx
│  │  │  ├─ DataRepositoryProvider.tsx
│  │  │  └─ ConnectivityProvider.tsx
│  │  ├─ layout/
│  │  │  ├─ AppShell.tsx
│  │  │  ├─ DesktopRail.tsx
│  │  │  ├─ MobileBottomNav.tsx
│  │  │  └─ AppHeader.tsx
│  │  └─ state/
│  │     ├─ appState.ts
│  │     ├─ appReducer.ts
│  │     └─ urlState.ts
│  ├─ routes/
│  │  ├─ TerritoryRoute.tsx
│  │  ├─ AnalysisRoute.tsx
│  │  ├─ AssistantRoute.tsx
│  │  ├─ ReportRoute.tsx
│  │  └─ NotFoundRoute.tsx
│  ├─ features/
│  │  ├─ territory/
│  │  │  ├─ components/
│  │  │  ├─ three/
│  │  │  │  ├─ TerrainScene.ts
│  │  │  │  ├─ TerrainController.ts
│  │  │  │  ├─ SectorLayer.ts
│  │  │  │  ├─ cameraPolicy.ts
│  │  │  │  └─ performancePolicy.ts
│  │  │  ├─ two-d/
│  │  │  │  ├─ TerritoryMap2D.tsx
│  │  │  │  └─ geometryProjection.ts
│  │  │  ├─ hooks/
│  │  │  └─ model/
│  │  ├─ diagnosis/
│  │  │  ├─ components/
│  │  │  ├─ presenters/
│  │  │  └─ model/
│  │  ├─ scenarios/
│  │  │  ├─ components/
│  │  │  └─ selectors/
│  │  ├─ analysis/
│  │  │  ├─ components/
│  │  │  ├─ charts/
│  │  │  └─ presenters/
│  │  ├─ history/
│  │  │  ├─ components/
│  │  │  └─ selectors/
│  │  ├─ backtest/
│  │  ├─ twins/
│  │  ├─ sensors/
│  │  ├─ chat/
│  │  ├─ reports/
│  │  └─ intro/
│  ├─ data/
│  │  ├─ contracts/
│  │  │  ├─ api.types.ts
│  │  │  ├─ contractGuards.ts
│  │  │  └─ contractMetadata.ts
│  │  ├─ repositories/
│  │  │  ├─ DataRepository.ts
│  │  │  ├─ MockDataRepository.ts
│  │  │  ├─ ApiDataRepository.ts
│  │  │  └─ createDataRepository.ts
│  │  ├─ transport/
│  │  │  ├─ httpClient.ts
│  │  │  ├─ apiErrors.ts
│  │  │  └─ requestPolicy.ts
│  │  ├─ adapters/
│  │  │  ├─ sectorAdapter.ts
│  │  │  ├─ historyAdapter.ts
│  │  │  ├─ backtestAdapter.ts
│  │  │  └─ metadataAdapter.ts
│  │  └─ cache/
│  │     ├─ lastKnownGoodStore.ts
│  │     └─ cacheKeys.ts
│  ├─ domain/
│  │  ├─ territory.ts
│  │  ├─ diagnosis.ts
│  │  ├─ history.ts
│  │  ├─ provenance.ts
│  │  └─ result.ts
│  ├─ shared/
│  │  ├─ components/
│  │  │  ├─ BrandMark.tsx
│  │  │  ├─ DataProvenance.tsx
│  │  │  ├─ ConfidenceLabel.tsx
│  │  │  ├─ AsyncBoundary.tsx
│  │  │  ├─ InlineNotice.tsx
│  │  │  └─ VisuallyHidden.tsx
│  │  ├─ hooks/
│  │  ├─ formatting/
│  │  ├─ accessibility/
│  │  └─ utils/
│  ├─ styles/
│  │  ├─ tokens.css
│  │  ├─ globals.css
│  │  ├─ print.css
│  │  └─ fonts.css
│  ├─ pwa/
│  │  ├─ registerServiceWorker.ts
│  │  ├─ updatePolicy.ts
│  │  └─ offlinePolicy.ts
│  ├─ assets/
│  │  ├─ fonts/
│  │  └─ territory/              # NASADEM procesado y fallback verificados
│  └─ main.tsx
├─ tests/
│  ├─ contract/
│  ├─ integration/
│  ├─ accessibility/
│  └─ e2e/
├─ DESIGN_SPEC.md
├─ ARCHITECTURE.md
└─ IMPLEMENTATION_PLAN.md
```

### Reglas de organización

- `routes/` compone features; no contiene lógica de contrato o Three.js.
- Cada `feature` encapsula presentación, selectores y comportamiento de su dominio.
- `shared/` solo recibe elementos genuinamente reutilizados; no se convierte en un cajón genérico.
- `data/` conoce DTOs y endpoints. `features/` consume modelos de dominio o resultados tipados.
- `territory/three` no importa componentes de diagnóstico; comunica selección mediante una interfaz estrecha.
- Los CSS Modules viven junto al componente que estilizan; los únicos estilos globales son tokens, normalización, fuente, accesibilidad y print.
- Ningún archivo de componente debería concentrar ruta, fetch, adaptación, escena y presentación.

## 4. Rutas y navegación

| Ruta | Nivel | Responsabilidad |
| --- | --- | --- |
| `/` | Redirección | Llevar a `/territorio` conservando parámetros válidos |
| `/territorio` | Sencillo | Terreno, selección, estado general, recomendación, motivos y confianza |
| `/analisis` | Avanzado | Historia, indicadores, escenarios, backtest, gemelos y sensores |
| `/asistente` | Complementario | Chat stateless con contexto opcional de sector/escenario |
| `/informe` | Complementario | Vista imprimible de zona, sector, escenario, diagnóstico y procedencia |
| `*` | Sistema | Error 404 con retorno a Territorio |

Parámetros de búsqueda compartidos:

- `sector=S1..S8`
- `scenario=nino|normal`
- `from=YYYY-MM` y `to=YYYY-MM` solo donde aplique
- `section=history|backtest|twins|sensors` en Análisis

El modo no se duplica como parámetro: `/territorio` es la experiencia sencilla y `/analisis` es el área ampliada. El estado compartido sincroniza sector y escenario con la URL, por lo que cambiar de ruta no los pierde. Los valores inválidos se corrigen a defaults seguros y se anuncian solo si afectan la decisión.

## 5. Componentes principales y límites

### App shell

- `AppShell`: regiones semánticas, skip link, área de avisos y outlet.
- `DesktopRail` / `MobileBottomNav`: mismos destinos y etiquetas, distinta composición responsiva.
- `AppHeader`: marca reemplazable, ubicación Pumani, conectividad y última actualización.
- `ScenarioSwitch`: presenta “El Niño actual” y “Año normal”; escribe estado compartido.

### Territorio

- `TerritoryViewport`: decide 3D o 2D según capacidad/preferencia/fallo.
- `TerrainScene`: ciclo de vida del renderer, escena, cámara y recursos; no obtiene datos por red.
- `SectorLayer`: convierte geometrías entregadas en objetos seleccionables y aplica estilos de estado.
- `TerritoryMap2D`: fallback funcional con la misma interfaz de selección.
- `SectorList`: alternativa accesible a la manipulación espacial.
- `TerritoryLegend`: niveles con texto, no solo color.

### Diagnóstico sencillo

- `SectorSummary`: orquesta contenido del sector seleccionado.
- `RecommendationStatement`: acción y texto contractual, sin inferencias propias.
- `RiskSummary` / `RecoverySummary`: score, nivel, intervalo si corresponde y confianza.
- `ReasonList`: drivers y razones ya entregadas.
- `ZoneConditions`: clima y RONI regionales, una sola vez.
- `TwinPrecedent`: contenido opcional; acepta `null` y evita promesas causales.
- `DataProvenance`: `data_source`, `updated_at` e indicadores de simulación.

### Análisis

- `AnalysisWorkspace`: composición de secciones y rango temporal.
- `HistoryChart`: series contractuales con huecos para `null`.
- `ScenarioComparison`: dos respuestas de `/api/sectors`, alineadas por `sector_id`.
- `BacktestView`: serie regional como evidencia principal; sectorial como secundaria.
- `SensorTimeline`: lecturas y alertas ya calculadas por backend; sello simulado.
- `MetricTable`: alternativa accesible de los gráficos.

### Chat y reportes

- `ChatComposer`: envía un mensaje independiente; no simula historial de backend.
- `ChatAnswer`: respuesta, fuentes, nota de confianza y actualización.
- `AssemblyReport`: estructura imprimible con fuentes, confianza y limitaciones.
- `PrintAction`: usa impresión del navegador; no crea un endpoint PDF inexistente.

## 6. Estado compartido

### Estado de navegación/decisión

Un `AppStateProvider` pequeño, basado en reducer y sincronizado con React Router, mantiene:

```text
selectedSectorId: SectorId | null
scenario: "nino" | "normal"
dateRange: { from: YearMonth; to: YearMonth } | null
analysisSection: "history" | "backtest" | "twins" | "sensors"
territoryMode: "auto" | "3d" | "2d"
```

Prioridad de hidratación:

1. parámetros válidos de URL;
2. última selección local válida;
3. primer sector de la respuesta y escenario `nino`.

`selectedSectorId` y `scenario` se reflejan en la URL. La preferencia 2D/3D puede persistirse localmente. No se persisten respuestas de chat como si fueran sesiones.

### Estado de servidor

Se mantiene fuera del reducer de UI mediante hooks/controladores de consulta:

- `idle | loading | success | stale | error`;
- datos actuales y último dato válido;
- clave formada por método y parámetros contractuales;
- `AbortController` para cancelar peticiones obsoletas al cambiar escenario/sector;
- deduplicación básica por clave;
- metadatos de caché y `updated_at`.

No se añade una biblioteca global de estado si React Context, reducer y una capa de consulta pequeña cubren el alcance. Cualquier dependencia adicional debe justificarse en Fase 01.

### Estado local

Hover espacial, cámara, panel desplegado, foco y leyenda se mantienen en el componente/feature más cercano. Los frames de Three.js nunca pasan por React state.

## 7. Contrato de `DataRepository`

La interfaz refleja únicamente endpoints existentes:

```text
getHealth(): Promise<HealthResponse>
getSectors(scenario: Scenario): Promise<SectorRiskResponse>
getSectorHistory(sectorId: SectorId, range?: DateRange): Promise<HistoryResponse>
getSectorSensors(sectorId: SectorId, hours?: number): Promise<SensorsResponse>
getBacktest(event: BacktestEvent): Promise<BacktestResponse>
sendChat(request: ChatRequest): Promise<ChatResponse>
```

`POST /api/admin/reload` no forma parte de la experiencia de agricultor. Si en el futuro existe una herramienta administrativa, usará una interfaz separada y nunca expondrá el token en el bundle público.

### `MockDataRepository`

- Consume directamente los ejemplos oficiales de `contracts/examples/api/` una vez integrados en la rama.
- No reescribe ni “mejora” valores.
- Selecciona `sectors_nino.json` o `sectors_normal.json` según escenario.
- Filtra la serie histórica al rango solicitado sin calcular o rellenar puntos.
- Devuelve el ejemplo disponible para backtest y registra explícitamente qué eventos mock existen.
- Emula asincronía y fallos solo mediante opciones de desarrollo deterministas, nunca cambiando el contenido científico.
- Conserva `data_source: "mock"` y todos los `is_simulated`.
- Para endpoints sin ejemplo compatible no inventa respuesta: devuelve un error de fixture ausente claramente tipado.

Los fixtures no se copiarán manualmente a múltiples ubicaciones. La implementación debe elegir una de estas opciones, en orden de preferencia:

1. importación estática de los JSON contractuales desde el repositorio durante el build;
2. tarea de sincronización verificable con hash y prueba de paridad, solo si Vite no permite la primera;
3. servidor mock local que lea los contratos, si ya existe en backend.

### `ApiDataRepository`

- Usa `VITE_API_BASE_URL`, ya declarado en `.env.example`.
- Construye solo las rutas de `contracts/api.md`.
- Codifica parámetros y valida `sectorId`, `scenario`, rango y `hours` antes de enviar.
- Maneja timeout, cancelación, HTTP y cuerpo `error.schema.json` de forma diferenciada.
- Valida la forma de respuestas en el límite de red durante desarrollo/pruebas; en producción se decidirá según presupuesto de bundle.
- No interpreta `502 llm_unavailable` como fallo general del territorio.
- Nunca envía `X-Admin-Token` desde la aplicación pública.

### Selección de implementación

`createDataRepository` crea una sola instancia al arrancar, mediante configuración explícita de entorno (por ejemplo `mock` o `api`). Los componentes reciben `DataRepository` por contexto e ignoran qué implementación está activa.

## 8. Tipos, validación y adaptación

### DTOs contractuales

Los tipos TypeScript deben generarse o verificarse contra JSON Schema. No se mantienen modelos manuales divergentes. La automatización elegida en Fase 01 debe:

- incluir propiedades requeridas aunque acepten `null`;
- conservar enums literales;
- fallar ante propiedades adicionales;
- detectar cambios de schema en CI;
- evitar editar los schemas desde frontend.

### Modelos de dominio/presentación

Los adaptadores pueden producir modelos de lectura como:

- `ZoneConditionsViewModel`;
- `SectorDiagnosisViewModel`;
- `SeriesPointViewModel`;
- `ProvenanceViewModel`.

Su trabajo se limita a:

- traducción de enums a texto en español;
- formato de fecha, unidad y porcentaje;
- separación explícita entre zona y sector;
- propagación de `null` como ausencia;
- combinación de metadatos de procedencia sin alterar los valores.

La capa visual nunca accede a claves crudas para decidir ciencia (`score > 0.66`, cálculo de alerta, correlación, etc.). Consume `level`, flags y métricas ya entregadas.

## 9. Flujo de datos

```text
JSON Schema + api.md
          │
          ▼
DTOs contractuales y guards
          │
          ├───────────────┐
          ▼               ▼
MockDataRepository   ApiDataRepository
          └───────┬───────┘
                  ▼
         adaptadores de dominio
                  ▼
       caché / estado de consulta
                  ▼
       rutas y features de React
            ┌─────┴─────┐
            ▼           ▼
    Territorio 3D/2D  Diagnóstico/Análisis
```

Ejemplo de cambio de escenario:

1. El usuario activa “Año normal”.
2. El estado actualiza `scenario=normal` en URL y conserva `sector=S3`.
3. La consulta solicita `getSectors("normal")`.
4. La respuesta anterior permanece identificada como anterior hasta que llega la nueva; no se mezclan capas.
5. El adaptador separa `zone` de `sectors` y preserva procedencia.
6. Territorio y diagnóstico reciben el mismo snapshot y se actualizan de forma coherente.

## 10. Relación endpoint–interfaz

| Contrato | Consumidor principal | Consideraciones |
| --- | --- | --- |
| `GET /health` | AppHeader/diagnóstico técnico discreto | Estado y fuentes por grupo; no bloquear la app por su fallo |
| `GET /api/sectors?scenario=` | Territorio, modo sencillo, comparación | Snapshot atómico por escenario; clima en `zone` |
| `GET /api/sectors/{id}/history` | Historia avanzada | `null` crea huecos; solo NDVI varía por sector |
| `GET /api/sectors/{id}/sensors` | Sensores | Todo simulado; alertas vienen calculadas |
| `GET /api/backtest?event=` | Backtest | Zona primero, sector secundario, notas visibles |
| `POST /api/chat` | Asistente | Stateless, contexto opcional, fuentes visibles |
| Errores contractuales | Todos | Mensaje simple del backend más acción local de recuperación |

No existe endpoint específico para `twin_precedent`: está incluido en cada sector de `/api/sectors`; el ejemplo independiente valida su forma. Tampoco existe endpoint de reporte/PDF.

## 11. Estrategia Three.js

### Separación de responsabilidades

- React crea/destruye el host y envía snapshots serializables.
- `TerrainController` posee renderer, cámara, raycasting y loop.
- `SectorLayer` mapea `sector_id` a objetos y emite `onSectorSelect(id)`.
- El estado seleccionado entra desde React; la escena no mantiene una verdad paralela.
- El diagnóstico no consulta objetos Three.js.

### Activos territoriales

- NASADEM se procesa fuera del runtime a un heightmap/mesh simplificado y documentado.
- GeoJSON contractual define sectores simulados; no se deforma para encajar visualmente sin registrar la transformación.
- Se conserva referencia espacial/proyección en metadatos de asset.
- Hasta validar coordenadas de Pumani, la interfaz evita afirmar precisión parcelaria.

### Rendimiento

- Carga diferida del chunk Three.js al entrar a Territorio.
- Un solo renderer y un solo loop activo.
- Render bajo demanda cuando no hay interacción; animación continua solo durante intro o movimiento.
- Límite adaptativo de pixel ratio, geometría simplificada, materiales sin luces costosas y texturas comprimidas.
- Pausa en pestaña oculta y liberación explícita de geometrías/materiales al desmontar.
- Presupuesto inicial propuesto: app shell interactivo < 3 s en gama baja simulada; escena usable < 5 s con fallback inmediato.
- Medición antes de activar sombras, postprocesado o texturas adicionales; por defecto no se usan.

### Detección y fallback

Se usa 2D cuando:

- no hay contexto WebGL estable;
- el renderer falla o se pierde repetidamente;
- la política de rendimiento detecta incapacidad sostenida;
- el usuario elige “Vista 2D”.

La vista 2D recibe el mismo `TerritorySnapshot` y emite el mismo evento de selección. El cambio no recarga datos ni pierde contexto.

## 12. Intro y carga progresiva

`IntroCoordinator` observa tres condiciones independientes:

- app shell listo;
- recurso visual mínimo listo;
- límite de tiempo alcanzado.

No espera historia, sensores, chat ni todas las consultas. La intro se omite con movimiento reducido, apertura posterior de la sesión o fallo de render. La bandera de sesión solo controla la presentación, no el acceso a datos.

Después de la intro:

1. app shell y navegación;
2. último snapshot local si existe;
3. respuesta de sectores actualizada;
4. terreno 3D progresivo;
5. análisis pesado solo al solicitarlo.

## 13. PWA y offline

### Precache

Con `vite-plugin-pwa` se precargan:

- HTML/app shell y chunks críticos;
- Montserrat local mínima;
- iconos y manifest;
- fallback 2D y recursos territoriales esenciales dentro del presupuesto;
- página/estado offline.

El chunk de análisis, Three.js y activos grandes se cargan bajo demanda y se versionan.

### Runtime cache

| Recurso | Política propuesta |
| --- | --- |
| `GET /api/sectors` | Network First con timeout corto; fallback al último snapshot válido por escenario |
| Historia/backtest | Stale While Revalidate o Network First según tamaño; clave por parámetros |
| Sensores | Network First; indicar que la caché puede estar desactualizada |
| `GET /health` | Network Only o TTL muy corto |
| `POST /api/chat` | Network Only; nunca fabricar respuesta offline |
| Fuentes/assets versionados | Cache First con revisión por hash |

Cada registro persistido incluye clave, payload validado, `updated_at`, momento de caché y procedencia. Una respuesta inválida no reemplaza el último dato válido.

### Experiencia offline

- El app shell abre sin conexión.
- Se muestra el último dato válido con fecha visible.
- Si no hay dato previo, se explica qué estará disponible al recuperar conexión.
- Sector y escenario siguen siendo navegables si sus snapshots están cacheados.
- Chat queda inactivo con explicación clara.
- El usuario controla cuándo aplicar una nueva versión del service worker para no interrumpir una lectura.

### Almacenamiento

Cache Storage sirve assets y respuestas simples; IndexedDB puede almacenar snapshots estructurados si el tamaño/consulta lo justifica. No se guardan secretos, tokens administrativos ni contenido sensible. Debe existir política de versión y limpieza de caché antigua.

## 14. Reporte imprimible

- Ruta `/informe`, construida con datos ya cargados y una consulta explícita si faltan.
- Hoja de estilos `print.css`, sin depender de fondos ni escena WebGL.
- Incluye Pumani, sector, escenario, recomendación, motivos, riesgo, recuperación, confianza, fecha, fuente, simulación y limitaciones.
- Los gráficos se imprimen con equivalente textual/tabular.
- No se promete generación PDF del servidor; el navegador permite imprimir o guardar como PDF.

## 15. Errores y recuperación

Modelo interno mínimo:

```text
NetworkError
TimeoutError
ContractError
ApiError(code, message, status)
FixtureMissingError
OfflineCacheMissError
WebGLCapabilityError
```

La UI traduce el tipo a una acción: reintentar, usar datos guardados, cambiar a 2D, corregir parámetro o volver al territorio. El detalle técnico queda en logging de desarrollo, no en el mensaje al agricultor.

Los errores son locales: una caída de Gemini no oculta el terreno; un fallo de sensores no borra el diagnóstico; un fallo 3D activa 2D.

## 16. Seguridad, privacidad y robustez

- React escapa contenido por defecto; no se renderiza HTML entregado por chat.
- Los mensajes del chat se limitan según schema y no se guardan como sesión.
- Variables `VITE_*` se consideran públicas; nunca contienen secretos.
- No se incorpora token de administración.
- Las URLs y parámetros se validan contra enums/rangos contractuales.
- La aplicación no usa coordenadas para habilitar exploración global.
- El service worker cachea solo orígenes y rutas permitidas.
- Los textos dejan claro que la herramienta apoya, no sustituye, decisiones comunitarias o agronómicas.

## 17. Estrategia de pruebas

### Contratos

- Todos los fixtures oficiales validan contra sus schemas.
- Tipos generados/derivados están actualizados.
- Mocks y API implementan la misma batería de pruebas de `DataRepository`.
- `null`, propiedades opcionales del request y enums se cubren explícitamente.

### Unidad

- adaptadores de fecha/unidad/procedencia;
- separación regional/sectorial;
- reducer y sincronización URL;
- política de caché y selección de fallback;
- límites de cámara y mapeo `sector_id`–objeto.

### Integración

- cambiar escenario conserva sector;
- cambiar de Territorio a Análisis conserva ambos;
- respuesta obsoleta/cancelada no reemplaza la nueva;
- mock/API producen la misma vista de dominio;
- errores parciales no derriban toda la ruta.

### Accesibilidad

- navegación completa por teclado;
- foco visible y orden lógico;
- nombres accesibles de navegación y controles;
- alternativa lista/tabla de terreno y gráficos;
- anuncios de carga/error/offline;
- contraste y zoom a 200%.

### E2E y responsive

- 320, 360, 390, 768, 1024 y 1440 px;
- sin overflow horizontal;
- uso táctil y navegación inferior;
- online, offline con caché y offline sin caché;
- WebGL disponible, ausente y contexto perdido;
- `prefers-reduced-motion`;
- impresión A4 y carta.

### Rendimiento

- tamaño de chunks y assets;
- tiempo hasta app shell y territorio usable;
- memoria al navegar repetidamente;
- frame time en gama baja simulada;
- consumo offline y actualización de service worker.

## 18. Decisiones diferidas, no bloqueantes para Fase 00

- Herramienta exacta para derivar tipos/guards desde JSON Schema.
- Biblioteca de gráficos o implementación SVG propia, decidida por peso y accesibilidad.
- Formato final del activo NASADEM y proyección geográfica.
- Umbral medible para degradación automática a 2D.
- Persistencia en Cache Storage frente a IndexedDB después de medir los payloads reales.
- Límites finales de bundle tras crear el esqueleto Vite.

Ninguna decisión diferida autoriza endpoints, cálculos o datos no presentes en los contratos.
