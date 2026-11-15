# AYNUQA FIELD SHIFT — Plan de implementación

> **Nota (14 nov 2026):** Las fases 03 en adelante de este documento fueron reemplazadas por la interfaz descrita en `README.md` (paleta del altiplano, cuatro pantallas, sin 3D). La capa de datos sigue vigente.

> Fases 00–09 · Orden de construcción propuesto. Este documento no autoriza avanzar de fase automáticamente.

## 1. Estrategia de entrega

La implementación sigue cuatro ideas:

1. **Contrato antes que interfaz:** integrar y validar los contratos antes de consumir datos.
2. **2D antes que 3D:** entregar primero la decisión completa y accesible; Three.js mejora la representación, no desbloquea el producto.
3. **Vertical slices:** cada fase termina en un flujo demostrable y probado, no en capas técnicas aisladas.
4. **Offline y accesibilidad desde el inicio:** se preparan en la base y se endurecen antes del cierre.

Orden obligatorio:

```text
00 Especificación
  → 01 Fundación
  → 02 Contratos y datos
  → 03 Sistema visual y navegación
  → 04 Experiencia sencilla 2D
  → 05 Territorio 3D e intro
  → 06 Análisis avanzado
  → 07 Sensores y asistente
  → 08 Informe, PWA y offline
  → 09 Calidad y entrega
```

No se inicia una fase si sus criterios de entrada no están satisfechos. Los elementos “deseables” pueden recortarse, pero nunca a costa de procedencia, simulación, confianza, fallback 2D o claridad de datos regionales/sectoriales.

## 2. Dependencias transversales

### Dependencias de repositorio

- Trabajar en `team/front`.
- Integrar los contratos recientes de `origin/main` con autorización del equipo antes de Fase 01/02.
- No modificar `contracts/` desde frontend.
- Mantener cambios dentro de `frontend/`.

### Dependencias de datos

- JSON Schemas y ejemplos API integrados.
- Coordenadas/polígonos simulados con etiquetado explícito.
- Activo NASADEM verificado antes de presentar topografía como real.
- API disponible solo cuando se active `ApiDataRepository`; los mocks permiten avanzar sin ella.

### Dependencias de diseño

- Montserrat en pesos 400, 500, 600 y 700, preferiblemente autoalojada.
- Logo provisional circular hasta recibir marca oficial.
- Paleta y restricciones de `DESIGN_SPEC.md`.
- Validación de contraste de colores derivados antes de congelar tokens.

### Dependencias técnicas previstas

- React, TypeScript, Vite.
- React Router.
- Three.js.
- CSS Modules y variables CSS.
- `vite-plugin-pwa`.
- Herramientas de test, accesibilidad y validación contractual elegidas en Fase 01 con atención al peso.

No se instala ninguna dependencia en Fase 00.

## 3. Matriz de fases

| Fase | Resultado demostrable | Depende de |
| --- | --- | --- |
| 00 | Especificación visual, arquitectura y plan aprobables | Inspección de repo, contratos y referencias |
| 01 | App base ejecutable con rutas, pruebas y PWA mínima | 00 y contratos integrados |
| 02 | Misma UI de prueba alimentada por mock o API | 01 y contratos disponibles |
| 03 | Shell responsive y accesible en todos los breakpoints | 01–02 |
| 04 | Flujo sencillo completo con territorio 2D | 02–03 |
| 05 | Terreno 3D real con fallback 2D e intro no bloqueante | 04 y NASADEM verificado |
| 06 | Análisis avanzado contextual y accesible | 02, 04 |
| 07 | Sensores simulados y chat stateless | 02, 03, 04 |
| 08 | Informe imprimible y uso offline confiable | 04–07 |
| 09 | Release candidata validada en calidad, rendimiento y demo | 01–08 |

## 4. Fase 00 — Preparación y especificación

### Objetivo

Entender el repositorio, contratos, referencias y restricciones; acordar una dirección visual y una arquitectura implementable sin escribir producto.

### Entregables

- `frontend/DESIGN_SPEC.md`.
- `frontend/ARCHITECTURE.md`.
- `frontend/IMPLEMENTATION_PLAN.md`.
- Exclusión local de `/referencia/` en `.git/info/exclude` si era necesaria.
- Informe de rama, sincronización, riesgos y pendientes.

### Dependencias

- `README.md`, `CLAUDE.md`, `frontend/README.md`.
- Contratos y ejemplos de `origin/main` cuando no estén integrados en la rama.
- Dos imágenes locales de referencia.

### Criterios de aceptación

- [x] No se crearon componentes, CSS, servicios ni dependencias.
- [x] Se documentaron paleta, Montserrat, espaciado, degradados, restricciones y responsive.
- [x] Se documentaron rutas, estado, repositorios, mocks, API, PWA, offline, Three.js y 2D.
- [x] El plan cubre Fases 00–09 con objetivos, entregables, dependencias, aceptación y pruebas.
- [x] Los endpoints y campos proceden del contrato; no se inventaron APIs.
- [x] Se identificó la falta de contratos recientes en `team/front`.
- [x] Las referencias locales quedaron protegidas sin modificar `.gitignore`.

### Pruebas necesarias

- Revisión manual de enlaces, cobertura y coherencia entre los tres documentos.
- `git status` para confirmar el alcance de archivos.
- `git check-ignore` y `git ls-files referencia`.
- Comparación `team/front..origin/main` para contratos.

### Puerta de salida

Aprobación explícita del responsable. Detenerse; no iniciar Fase 01 automáticamente.

## 5. Fase 01 — Fundación técnica

### Objetivo

Crear un esqueleto Vite + React + TypeScript estricto, con rutas vacías funcionales, calidad automatizada y registro PWA mínimo.

### Entregables

- Proyecto Vite dentro de `frontend/`, sin sobrescribir documentación.
- TypeScript estricto y aliases limitados/documentados.
- React Router con rutas `/territorio`, `/analisis`, `/asistente`, `/informe` y 404.
- `AppShell` semántico mínimo, todavía sin dashboard.
- CSS Modules configurado y entrada para variables CSS.
- Manifest y service worker mínimo con `vite-plugin-pwa`, sin política de datos definitiva.
- Scripts de desarrollo, build, typecheck, lint y test.
- Estrategia de tipos/validación JSON Schema seleccionada y documentada.

### Dependencias

- Fase 00 aprobada.
- Contratos recientes integrados en `team/front`.
- Autorización para instalar dependencias.
- Versiones de Node/npm acordadas.

### Criterios de aceptación

- [ ] `npm run dev` abre sin errores.
- [ ] `npm run build` y typecheck pasan.
- [ ] Todas las rutas cargan por acceso directo y navegación interna.
- [ ] No hay secretos en el bundle; `VITE_API_BASE_URL` sigue siendo configuración pública.
- [ ] El HTML tiene idioma español, viewport correcto, título y regiones semánticas.
- [ ] No se implementan todavía datos, gráficos ni Three.js.

### Pruebas necesarias

- Smoke test de cada ruta y 404.
- Build de producción y revisión de warnings.
- Navegación por teclado del shell mínimo.
- Instalabilidad básica del manifest en navegador compatible.

### Puerta de salida

Base reproducible en una instalación limpia y decisión registrada sobre generación/validación de tipos.

## 6. Fase 02 — Contratos y capa de datos

### Objetivo

Construir una frontera de datos tipada y comprobable, con `MockDataRepository` y `ApiDataRepository` intercambiables.

### Entregables

- DTOs derivados/verificados contra los JSON Schemas.
- `DataRepository` con los seis métodos públicos documentados en `ARCHITECTURE.md`.
- `MockDataRepository` consumiendo fixtures oficiales sin duplicación manual.
- `ApiDataRepository` usando `VITE_API_BASE_URL` y solo endpoints contractuales.
- Cliente HTTP con cancelación, timeout y errores tipados.
- Adaptadores zona/sector, procedencia, fechas, unidades y `null`.
- Capa de consulta/caché en memoria y último dato válido.
- Pantalla técnica temporal o tests que demuestren el intercambio mock/API; no dashboard final.

### Dependencias

- Fase 01.
- `contracts/api.md`, schemas y ejemplos presentes en la rama.
- API local opcional para pruebas de integración; mocks son suficientes para desarrollo.

### Criterios de aceptación

- [ ] Cambiar la configuración de fuente no exige modificar componentes.
- [ ] Todos los fixtures API validan contra su schema.
- [ ] `null` se preserva y no aparece como cero.
- [ ] `data_source`, `updated_at`, `is_simulated` y confianza sobreviven a los adaptadores.
- [ ] Regional y sectorial son modelos diferenciados.
- [ ] No hay cálculos científicos en repositorios, adaptadores o vistas.
- [ ] Peticiones canceladas u obsoletas no reemplazan el estado nuevo.
- [ ] Errores contractuales muestran código y mensaje aprovechables por la UI.

### Pruebas necesarias

- Contract tests de todos los fixtures.
- Batería compartida para ambas implementaciones del repositorio.
- Tests de `normal`/`nino`, `null`, rangos, `hours` y request de chat con campos opcionales.
- Integración contra API local si está disponible.
- Tests de cancelación, timeout, 404, 422 y 502.

### Puerta de salida

Un mismo caso de prueba devuelve modelos de dominio equivalentes desde mock y API.

## 7. Fase 03 — Sistema visual, app shell y navegación

### Objetivo

Implementar la identidad aprobada y una navegación mobile-first accesible, todavía con contenido estructural.

### Entregables

- Variables CSS de color, tipografía, espaciado, divisor, foco y estado.
- Montserrat local en pesos necesarios con estrategia de carga.
- Estilos globales mínimos y CSS Modules por componente.
- Marca circular provisional reemplazable.
- Barra inferior móvil y rail lateral de escritorio con iconos y etiquetas.
- Header con Pumani, estado de conexión y fecha disponible.
- `ScenarioSwitch`, regiones semánticas, skip link y sistema de avisos.
- Layouts verificados en 320, 360, 390, 768, 1024 y 1440 px.

### Dependencias

- Fases 01–02.
- `DESIGN_SPEC.md` aprobado.
- Iconos funcionales elegidos con licencia y peso revisados.

### Criterios de aceptación

- [ ] Paleta obligatoria y Montserrat son las únicas bases visuales.
- [ ] Radio es 0 por defecto y nunca supera 4 px por función.
- [ ] No hay glassmorphism, sombras decorativas, dots parpadeantes ni tarjetas repetitivas.
- [ ] Navegación tiene icono, etiqueta, foco visible y objetivo táctil mínimo.
- [ ] No existe overflow horizontal a ningún ancho objetivo.
- [ ] Sector y escenario se mantienen al cambiar de ruta.
- [ ] La jerarquía funciona sin depender del color.

### Pruebas necesarias

- Capturas visuales por breakpoint.
- Navegación por teclado, lector de pantalla básico y zoom 200%.
- Contraste automatizado y revisión manual de foco.
- Prueba táctil en viewport real o emulado.
- Prueba de textos largos y escalado del sistema.

### Puerta de salida

Shell navegable y estable, con composición editorial reconocible antes de añadir visualizaciones.

## 8. Fase 04 — Experiencia sencilla y territorio 2D

### Objetivo

Entregar el flujo de decisión principal completo y accesible usando primero una representación 2D.

### Entregables

- Vista Territorio con Pumani y sectores contractuales.
- Selección sincronizada entre mapa 2D, lista y diagnóstico.
- Condiciones regionales mostradas una sola vez.
- Estado general, recomendación, riesgo, recuperación, motivos y confianza.
- Procedencia, actualización y etiquetas de simulación visibles.
- Cambio `nino`/`normal` que conserva sector y evita mezclar snapshots.
- Precedente de tierra gemela opcional y correcto para `null`.
- Estados de carga, vacío, error, offline con/sin caché y dato desactualizado.

### Dependencias

- Fases 02–03.
- Geometrías de sectores disponibles en `/api/sectors`.
- Decisión de proyección 2D documentada.

### Criterios de aceptación

- [ ] Un usuario entiende la recomendación sin conocer NDVI o RONI.
- [ ] El mapa no permite explorar fuera del piloto ni buscar ubicaciones globales.
- [ ] La selección es posible sin mapa mediante lista accesible.
- [ ] La lluvia, temperatura, humedad y RONI no se presentan como diferencias sectoriales.
- [ ] Cada predicción muestra confianza y cada mock/simulación está etiquetado.
- [ ] `null` produce “Sin dato disponible” y un hueco, nunca un valor falso.
- [ ] Cambiar escenario mantiene sector y actualiza territorio/diagnóstico atómicamente.
- [ ] El flujo funciona a 320 px con navegación inferior visible.

### Pruebas necesarias

- E2E: seleccionar S1–S8, cambiar escenario, navegar y volver.
- Snapshot visual de niveles low/medium/high y datos `null`.
- Pruebas de error parcial y respuesta tardía.
- Accesibilidad del mapa/lista y anuncios de estado.
- Offline con snapshot previo y sin snapshot.

### Puerta de salida

La experiencia sencilla es útil y demostrable sin Three.js.

## 9. Fase 05 — Territorio 3D y animación inicial

### Objetivo

Añadir una maqueta topográfica de Pumani basada en NASADEM y una intro minimalista, conservando el flujo 2D completo.

### Entregables

- Pipeline documentado para transformar NASADEM verificado en asset web liviano.
- `TerrainController`, cámara limitada, capa de sectores y raycasting.
- Resaltado accesible sincronizado con estado React.
- Política de calidad adaptativa, carga diferida y liberación de recursos.
- Detección de WebGL, pérdida de contexto, preferencia 2D y fallback automático.
- Intro Tierra→Pumani no interactiva, con tiempo máximo y acción Omitir.
- Variante para `prefers-reduced-motion` y reproducción única por sesión.

### Dependencias

- Fase 04 estable.
- NASADEM y transformación/proyección verificadas.
- Presupuesto de asset y rendimiento acordado.

### Criterios de aceptación

- [ ] Ningún relieve inventado se presenta como NASADEM.
- [ ] La escena solo muestra Pumani y no habilita navegación global.
- [ ] Selección 3D, 2D y lista comparten el mismo `sector_id`.
- [ ] El escenario cambia diagnóstico/capa, no topografía.
- [ ] La intro no espera consultas remotas, no se repite internamente y no supera el límite definido.
- [ ] Con movimiento reducido se omite el giro/zoom.
- [ ] Fallar WebGL cambia a 2D sin perder selección ni datos.
- [ ] La escena se desmonta sin fugas importantes de memoria.

### Pruebas necesarias

- Visual QA del relieve, límites y selección.
- E2E con WebGL, sin WebGL y contexto perdido.
- Perfil de FPS, memoria, pixel ratio y carga en dispositivo/gama baja simulada.
- Intro con recursos rápidos, lentos, fallidos y movimiento reducido.
- Navegación repetida para detectar renderers duplicados.

### Puerta de salida

3D aporta comprensión territorial medible; si no alcanza rendimiento, 2D permanece predeterminado en dispositivos afectados.

## 10. Fase 06 — Análisis avanzado

### Objetivo

Incorporar profundidad analítica para usuarios experimentados sin contaminar el modo sencillo.

### Entregables

- Área `/analisis` que conserva sector y escenario.
- Series históricas de 2000 a fecha disponible: NDVI, lluvia, humedad, temperatura y RONI.
- Visualización de anomalías con unidades y huecos reales.
- Comparación normal/El Niño alineada por sector.
- Backtest por evento con serie regional prioritaria, métricas, `held_out`, `n` y notas.
- Tierra gemela con similitud, evento, anomalía observada y confianza.
- Tablas accesibles equivalentes y ayudas contextuales breves.
- Carga diferida de gráficos y datos avanzados.

### Dependencias

- Fases 02, 03 y 04.
- Ejemplos/API de historia y backtest.
- Decisión de biblioteca gráfica o SVG propio basada en peso/accesibilidad.

### Criterios de aceptación

- [ ] Sector y escenario persisten al entrar/salir de Análisis.
- [ ] La serie regional y NDVI sectorial se distinguen en leyenda y texto.
- [ ] `null` crea discontinuidad; no se interpola silenciosamente.
- [ ] Backtest regional aparece antes de evidencia por sector.
- [ ] Correlación `null` o modesta se muestra con su nota, sin ocultarla.
- [ ] Tierra gemela se presenta como precedente, nunca garantía, cultivo o porcentaje de pérdida.
- [ ] Cada gráfico tiene resumen, unidades, leyenda y tabla accesible.
- [ ] La vista sigue siendo usable en 320 px sin gráficos ilegibles ni scroll horizontal.

### Pruebas necesarias

- Unit tests de transformación puramente presentacional de series.
- E2E de rango, evento, sección y cambio de escenario.
- Casos con `null`, 322 puntos, métricas nulas y notas extensas.
- Accesibilidad de gráficos y tablas.
- Rendimiento de render y navegación en móvil.

### Puerta de salida

Un usuario avanzado puede reconstruir qué dato, periodo, escala y confianza sustentan el diagnóstico.

## 11. Fase 07 — Sensores simulados y asistente

### Objetivo

Completar las funciones conectadas de soporte: alertas de sensores y chat con Gemini vía backend.

### Entregables

- Timeline de sensores por sector y rango de horas permitido.
- Alertas de helada y estrés hídrico consumidas como flags, no recalculadas.
- Etiqueta persistente “Sensores simulados”.
- Chat stateless con sugerencias de preguntas, contexto opcional y límite de 1000 caracteres.
- Respuesta con fuentes consultadas, nota de confianza y fecha.
- Estado offline y manejo específico de `llm_unavailable`.
- Protección contra HTML no confiable en respuestas.

### Dependencias

- Fases 02–04.
- Endpoints de sensores y chat disponibles o fixtures oficiales.
- Gemini configurado exclusivamente en backend.

### Criterios de aceptación

- [ ] Sensores y cada lectura se reconocen como simulados.
- [ ] Las alertas coinciden con los flags contractuales; frontend no aplica umbrales científicos.
- [ ] Chat envía mensajes independientes y no presupone sesión del servidor.
- [ ] El usuario ve herramientas/campos fuente y confianza de la respuesta.
- [ ] Sin conexión, el chat se deshabilita con explicación y el resto de la app continúa.
- [ ] Un 502 del LLM no afecta territorio o análisis.
- [ ] No se expone API key, token admin ni contenido HTML ejecutable.

### Pruebas necesarias

- Lecturas con/sin helada y con/sin estrés.
- Límites `hours=1..168` y mensaje `1..1000`.
- Chat con y sin sector/escenario.
- 401/422/502, timeout, offline y reintento.
- Teclado, lector de pantalla y manejo de foco tras recibir respuesta.

### Puerta de salida

Sensores y chat agregan contexto sin convertirse en fuentes de valores inventados ni puntos únicos de fallo.

## 12. Fase 08 — Reporte, PWA y offline

### Objetivo

Convertir el producto en una herramienta instalable, recuperable sin señal y útil para la asamblea.

### Entregables

- `/informe` con composición para pantalla e impresión.
- `print.css` para A4/carta y guardado PDF del navegador.
- Manifest final, iconos, theme/background colors y metadatos de instalación.
- Precache definitivo y runtime caching por endpoint.
- Last-known-good store versionado con `updated_at` y procedencia.
- Flujos offline con caché, sin caché, actualización pendiente y limpieza de versión.
- Prompt de actualización controlado por usuario.
- Auditoría de tamaño de assets/chunks y estrategia de lazy loading.

### Dependencias

- Flujos de Fases 04–07.
- Iconos finales o provisionales aceptados.
- Decisión Cache Storage/IndexedDB tras medir payloads.

### Criterios de aceptación

- [ ] La app instala y abre offline después de una visita válida.
- [ ] Los últimos sectores/escenarios guardados muestran fecha y estado offline.
- [ ] Una respuesta inválida no reemplaza el último dato bueno.
- [ ] Chat sigue siendo network-only.
- [ ] Actualizar el service worker no interrumpe una decisión en curso.
- [ ] El informe incluye zona, sector, escenario, recomendación, motivos, confianza, fuente, fecha y simulación.
- [ ] La impresión no depende de WebGL, fondos o color.
- [ ] No se cachean secretos ni rutas administrativas.

### Pruebas necesarias

- Instalación y relanzamiento offline.
- Offline con/sin caché por cada recurso crítico.
- Upgrade entre dos versiones del service worker.
- Corrupción/invalidación de caché y recuperación.
- Impresión A4 y carta, monocromo, salto de página y zoom.
- Auditoría PWA y presupuesto de almacenamiento.

### Puerta de salida

La decisión principal y el informe sobreviven a pérdida de red con procedencia clara; funciones online fallan de forma aislada.

## 13. Fase 09 — Calidad, rendimiento y entrega

### Objetivo

Cerrar accesibilidad, robustez, rendimiento, narrativa de demo y documentación operativa para una release candidata.

### Entregables

- Matriz final de requisitos y contratos.
- Correcciones de accesibilidad WCAG 2.2 AA.
- Optimización de bundle, fuentes, terreno y gráficos.
- Suite E2E en viewports objetivo y estados de red.
- Pruebas con usuarios o evaluación heurística documentada.
- README frontend actualizado: instalación, variables, scripts, mocks/API, PWA y límites conocidos.
- Checklist de demo con plan 2D/offline de respaldo.
- Lista de riesgos aceptados y trabajo posterior.

### Dependencias

- Fases 01–08 completas.
- Backend/ML o fixtures finales estables.
- Dispositivos/navegadores objetivo disponibles para prueba.

### Criterios de aceptación

- [ ] Build, tipos, lint, unit, integración y E2E pasan.
- [ ] No hay errores de consola en flujos principales.
- [ ] 320, 360, 390, 768, 1024 y 1440 px carecen de overflow accidental.
- [ ] Navegación completa por teclado y foco visible.
- [ ] Contraste AA, alternativas de gráficos/territorio y movimiento reducido verificados.
- [ ] Fuente, fecha, confianza, `mock` y simulación aparecen en todos los puntos pertinentes.
- [ ] No existen endpoints inventados ni cálculo científico en componentes.
- [ ] PWA y fallback 2D funcionan en el guion de respaldo.
- [ ] Los presupuestos de rendimiento acordados se cumplen o las excepciones están documentadas.

### Pruebas necesarias

- Regresión completa automatizada.
- Auditoría manual de las diez heurísticas.
- Prueba de lector de pantalla al menos en un entorno principal.
- Lighthouse/Web Vitals como indicadores, más medición en gama baja real o simulada.
- Perfil de memoria WebGL y navegación prolongada.
- Ensayo de demo online, red lenta, offline y sin WebGL.
- Revisión de contenido en español por una persona no técnica.

### Puerta de salida

Release candidata aprobada por frontend, contratos y producto. Commit/push/PR solo con autorización y proceso del equipo.

## 14. Prioridades ante recorte de tiempo

### No recortables

- Modo sencillo, selección y escenario.
- Mock/API intercambiables.
- Confianza, procedencia, fecha y simulación.
- Separación regional/sectorial.
- Fallback 2D y lista accesible.
- Estados de error/offline esenciales.
- Navegación mobile-first.

### Recortables con degradación explícita

1. Sensores como sección avanzada, manteniendo los contratos.
2. Comparación lado a lado; conservar selector secuencial.
3. Animación de intro; entrada directa sigue siendo válida.
4. Detalle visual de Three.js; conservar relieve simplificado y 2D.
5. Múltiples vistas de gráfico; conservar una serie y tabla.

### No sustituir por datos falsos

Si falta NASADEM, API real, evento de backtest o fixture, se muestra la ausencia o se usa el mock oficial debidamente etiquetado. No se generan valores para “completar” la demo.

## 15. Riesgos y mitigaciones de ejecución

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Contratos no integrados en `team/front` | Bloquea tipos y mocks | Integrar `origin/main` antes de Fase 01/02 con autorización |
| Coordenadas de Pumani aún “por verificar” en README | Riesgo de precisión aparente | Etiquetar piloto y no afirmar precisión parcelaria hasta validar |
| Three.js en gama baja | Carga, memoria, batería | 2D primero, lazy load, DPR adaptativo, render bajo demanda |
| NASADEM pesado o sin procesar | Bloquea relieve real | Pipeline offline, LOD simple y fallback 2D |
| Montserrat y assets sin conexión | FOUC o ausencia offline | Autoalojar subconjuntos y precache mínimo |
| Historia larga y gráficos móviles | Legibilidad/rendimiento | Decimación solo visual documentada, rango y tabla; nunca alterar datos fuente |
| Service worker sirve datos viejos | Decisión con snapshot obsoleto | Fecha visible, stale state y actualización controlada |
| Mock confundido con real | Pérdida de confianza | Etiqueta persistente desde `data_source` y `is_simulated` |
| API/chat parcial | Pantalla completa inutilizable | Boundaries por feature y caché last-known-good |
| Paleta de tres colores insuficiente para estados | Accesibilidad | Derivados funcionales limitados, texto e iconos redundantes |

## 16. Definición de terminado por funcionalidad

Una funcionalidad solo está terminada cuando:

- consume un contrato existente o no consume red;
- contempla carga, éxito, `null`, error y offline cuando aplique;
- muestra fuente, fecha, confianza y simulación cuando correspondan;
- es usable con teclado, tacto y lector de pantalla;
- funciona a 320 px sin scroll horizontal;
- tiene pruebas proporcionales al riesgo;
- no añade cálculo científico ni alcance geográfico;
- no rompe el fallback 2D ni la selección compartida;
- está documentada si introduce una decisión técnica nueva.

## 17. Inicio permitido de la Fase 01

Antes de comenzar Fase 01 se requiere:

1. aprobación explícita de los documentos de Fase 00;
2. autorización para integrar los contratos de `origin/main` en `team/front`;
3. autorización para instalar dependencias;
4. confirmación del gestor/versiones de Node;
5. decisión sobre si el primer corte usa mock por defecto.

Hasta recibir esa aprobación, el trabajo se detiene al finalizar Fase 00.
