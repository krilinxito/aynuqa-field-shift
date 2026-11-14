# Plan de Backend — Aynuqa Field Shift

> Este documento preserva **todo el contexto de backend del plan del equipo**
> (`aynuqa-plan-Hackaton.pdf`, noviembre 2026). Es la referencia completa para
> construir `backend/`. Las divergencias con `backend/README.md` (que ya pasó
> por correcciones de revisión) están listadas al final como decisiones
> pendientes; ninguna se ha resuelto unilateralmente.

## 1. Requisitos del equipo Back según el plan

Prioridades: **M** = imprescindible, **S** = deseable, **C** = si sobra tiempo.

- **M — Servidor FastAPI y Contrato Intacto:** exponer en el puerto 8000
  (compatible con `VITE_API_BASE_URL`) los 6 endpoints oficiales de
  `contracts/api.md`, sirviendo inicialmente los ejemplos mock de `contracts/`
  y luego datos reales desde SQLite, validados con `jsonschema`.
- **M — Sincronización Automática ML → SQLite:** cargar en el inicio
  (`lifespan` de FastAPI) y mediante el endpoint interno
  `POST /api/admin/reload-predictions` las salidas exportadas por ML
  (`predictions`, `history`, `backtest` y catálogo de `tierras_gemelas`),
  manteniendo un fallback transparente a los mocks si algún archivo aún no
  fue generado.
- **M — Cliente NASA POWER con Caché en SQLite:** consultar la API
  `daily/point` (`T2M`, `PRECTOTCORR`, `GWETROOT`, `ALLSKY_SFC_SW_DWN`) para
  la zona de Pumani (-17.09, -68.0), con clave primaria `(sector_id, date)` y
  TTL de 24 horas para los datos del mes actual.
- **M — Simulador Determinista de Sensores:** generar 48 horas de lecturas
  reproducibles (`random.seed(42)`) con rangos realistas del altiplano a
  3.900 m (-5 °C a 16 °C en aire; 10 % a 35 % en humedad de suelo),
  disparando 2 eventos programados (helada y estrés hídrico) y marcando
  siempre `is_simulated: true`.
- **M — Asistente `/api/chat` Stateless con 5 Herramientas y Tierras Gemelas:**
  integrar un modelo de lenguaje vía SDK compatible con OpenAI (con soporte
  para modelos gratuitos en la nube y fallback a Qwen local) que consulte
  5 herramientas internas (`get_sector`, `compare_scenarios`, `get_history`,
  `get_sensors`, `buscar_precedente_tierra_gemela`), responda en español
  simple citando siempre la confianza y declare "no tengo ese dato" cuando
  falte información.
- **M — Infraestructura Base:** configuración de CORS, variables de entorno
  en `.env`, endpoint `/health`, manejo de errores claros y dependencias
  definidas en `requirements.txt` o `uv`.
- **S — Cliente `earthaccess`** para IMERG y SMAP.
- **S — Endpoint de reporte para la asamblea** (Markdown o PDF), con
  `docker-compose.yml`.

## 2. Arquitectura de datos y sincronización con ML

- Al iniciar la app (`lifespan` de FastAPI), inicializar
  `backend/data/aynuqa.db` en SQLite.
- Si existen los archivos generados por ML en `ml/outputs/`, cargarlos en las
  tablas de SQLite (`predictions`, `sector_history`, `backtests`,
  `twin_lands`). Si aún no existen, cargar automáticamente los mocks válidos
  de `contracts/mocks/` para no bloquear a Frontend.
- Exponer un endpoint interno que recargue los archivos de `ml/outputs/` en
  SQLite bajo demanda cuando ML ejecute `make predict`, validando la
  estructura con `jsonschema`.

### Rutas y archivos estandarizados (integración ML → Backend)

ML exporta en `ml/outputs/` mediante `make predict`, con **cuatro archivos de
nombre fijo**:

| # | Archivo | Contenido |
| --- | --- | --- |
| 1 | `ml/outputs/predictions.json` | Predicciones por sector para ambos escenarios (`normal` y `nino`), cumpliendo `contracts/sector_risk.schema.json` (incluye `drought_risk` y el objeto `recovery: {score, level, confidence, ndvi_residual}`). |
| 2 | `ml/outputs/history_monthly.json` | Serie mensual consolidada (2000-01 a 2026-11) por sector. |
| 3 | `ml/outputs/backtest_results.json` | Resultados de validación histórica para los eventos 2015-16, 2023-24 y 2020-22. |
| 4 | `ml/outputs/twin_lands.json` | Catálogo de vectores biofísicos y precedentes históricos de las zonas análogas del Altiplano (Patacamaya, Ayo Ayo, Jesús de Machaca, Toledo). |

- **Fallback inicial a mocks:** si al iniciar el servidor alguno de los
  archivos en `ml/outputs/` aún no existe, Back carga automáticamente los
  ejemplos de `contracts/` para no bloquear a Frontend desde la primera hora.
- **Mecanismo de disparo:** Back carga los archivos en SQLite al arrancar
  (`lifespan`) y expone `POST /api/admin/reload-predictions` para recargar en
  caliente cuando ML ejecute `make predict`.

## 3. Endpoints del contrato

- `GET /health` → `{"status": "ok", "data_source": "ml_real|contracts_mock",
  "sqlite_connected": true}`.
- `GET /api/sectors?scenario=normal|nino` → lee la tabla `predictions`
  filtrando por escenario; devuelve los 8-10 sectores de Pumani cumpliendo
  `contracts/sector_risk.schema.json` (incluye `drought_risk` y el objeto
  `recovery: {score, level, confidence, ndvi_residual}`).
- `GET /api/sectors/{id}/history?from=2000-01&to=2026-11` → serie mensual
  `{date, ndvi, precip_mm, soil_moisture, temp_c, oni}` desde la tabla
  `sector_history`.
- `GET /api/sectors/{id}/sensors?hours=48` → serie horaria reproducible con
  semilla determinista (ver sección 5).
- `GET /api/backtest?event=2015-16|2023-24|2020-22` → desde SQLite:
  `{event, per_sector: [{sector_id, predicted_risk, observed_ndvi_anomaly}],
  metric: {spearman}}`.
- `GET /api/report?scenario=normal|nino` → genera en Markdown/HTML imprimible
  el "Reporte para la Asamblea" (sector recomendado a abrir, sectores que
  deben extender descanso, cultivo sugerido, riesgos, nivel de confianza y
  nota de honestidad sobre datos simulados).
- `POST /api/chat` → ver sección 6.

### Propiedad y origen de los datos (`/history`, `/backtest` y `twin_lands`)

- **Fusión de fuentes en `/history`:** para evitar cruces lentos en tiempo
  real entre archivos crudos de `ml/data/`, Back sirve la serie histórica
  mensual `{date, ndvi, precip_mm, soil_moisture, temp_c, oni}` directamente
  desde la tabla `sector_history` (alimentada por
  `ml/outputs/history_monthly.json`). El cliente NASA POWER de Back consulta
  y cachea en SQLite las variables diarias recientes (`T2M`, `PRECTOTCORR`,
  `GWETROOT`, `ALLSKY_SFC_SW_DWN`), complementando el mes actual si aún no
  figura en el consolidado de ML.
- **Origen de `/backtest`:** Back **no calcula** la correlación de Spearman
  ni las anomalías históricas de NDVI; lee directamente la tabla `backtests`
  precalculada por ML y acepta por parámetro cualquiera de los tres eventos
  (`?event=2015-16`, `2023-24` o `2020-22`).
- **Inferencia por similitud en Tierras Gemelas:** Back no entrena modelos
  espaciales, pero almacena en la tabla `twin_lands` los vectores biofísicos
  normalizados (`elevacion`, `pendiente`, `orientacion`, `smap_downscaled`,
  `ndvi_restrend`, `oni_lag_0_6`) exportados por ML y calcula la similitud
  coseno en Python/SQLite cuando el asistente consulta precedentes de otros
  territorios.

## 4. Cliente NASA POWER con caché en SQLite

- Implementar `backend/app/services/nasa_power.py` consultando
  `https://power.larc.nasa.gov/api/temporal/daily/point` para `T2M`,
  `PRECTOTCORR`, `GWETROOT` y `ALLSKY_SFC_SW_DWN` en las coordenadas del
  sector (`lat -17.09, lon -68.0`).
- Guardar los resultados en `nasa_power_cache` con clave primaria compuesta
  `(sector_id, date)` (una versión del plan usa `(lat, lon, date)`; ver
  diferencias) para los parámetros T2M, PRECTOTCORR, GWETROOT y
  ALLSKY_SFC_SW_DWN.
- Los registros históricos (2000-2025) se almacenan **sin expiración**
  (TTL = null); los del año/mes en curso tienen **TTL = 24 horas**.

## 5. Simulador de sensores (reglas deterministas)

Rangos climáticos realistas para Pumani (~3.900 m s. n. m.); las lecturas
horarias de las últimas `hours=48` se generan dentro de rangos coherentes con
el altiplano central:

- `air_temp_c`: curva sinusoidal diaria entre **-5.0 °C** (madrugada) y
  **16.0 °C** (tarde), con ruido gaussiano acotado (una versión del plan
  usa -4.5 °C a 15.5 °C con sigma=0.4).
- `soil_moisture`: entre **10.0 %** y **35.0 %** (una versión del plan usa
  9.0 % a 32.0 %).
- `canopy_temp_delta_c`: entre **-1.5 °C** y **+3.5 °C**.

Umbrales de alerta y 2 eventos programados:

1. **Evento de helada:** `frost_alert: true` cuando `air_temp_c <= 0.0`
   (programado de forma pronunciada en las madrugadas de los sectores
   impares; una versión del plan dice sectores 1 y 3).
2. **Evento de estrés hídrico:** caída sostenida de `soil_moisture < 12.0 %`
   combinada con `canopy_temp_delta_c > 2.5 °C` (programado en los sectores
   2 y 4).

Reproducibilidad y transparencia: el generador usa una semilla determinista
basada en `random.seed(42)` más el identificador del sector (una versión usa
`random.seed(42 + int(sector_num))`, otra añade la marca de tiempo `ts`),
evitando que las gráficas del Frontend cambien erráticamente al refrescar.
Cada registro incluye obligatoriamente `"is_simulated": true`.

## 6. Asistente de asamblea (`POST /api/chat`) con function calling

### Proveedor, SDK y fallback local

- SDK `openai` en Python configurado mediante `.env`: `LLM_BASE_URL`,
  `LLM_API_KEY`, `LLM_MODEL`, para conectar con proveedores gratuitos
  (OpenCode / Antigravity / DeepSeek Free).
- Conmutación automática a `FALLBACK_LLM_BASE_URL` (ej.
  `http://localhost:11434/v1`, Qwen en Ollama local) en caso de error de red
  o límite de cuota.

### Memoria

- Endpoint **stateless**: no crea tablas de usuarios ni guarda historial de
  conversación en SQLite. Procesa `{message, sector_id?, scenario?}` y
  devuelve `{answer, sources: [{sector_id, fields}], confidence_note}`.

### Esquema unificado de 5 herramientas

El LLM solo explica los datos obtenidos mediante cinco funciones conectadas
a SQLite/servicios internos:

1. `get_sector(sector_id, scenario)`
2. `compare_scenarios(sector_id)`
3. `get_history(sector_id, from_date, to_date)`
4. `get_sensors(sector_id, hours)`
5. `buscar_precedente_tierra_gemela(sector_id, escenario_oni)`

### Herramienta 5: `buscar_precedente_tierra_gemela`

- **Input:** identificador del sector local y valor/categoría proyectada del
  índice de El Niño.
- **Proceso:** calcula similitud coseno entre el vector biofísico del sector
  en Pumani (altitud, pendiente, humedad base, residual NDVI y ONI) y el
  catálogo de regiones análogas del Altiplano (Patacamaya, Ayo Ayo, Jesús de
  Machaca, Toledo) en la tabla `twin_lands`; localiza el registro histórico
  más cercano en topografía, humedad base y anomalía climática.
- **Output (JSON):**

```json
{
  "sector_origen": "Sector 3 - Pumani",
  "tierra_gemela_referencia": "Zona Análoga Patacamaya (Altitud: 3890m, Pendiente: 4.2%)",
  "similitud_biofisica": 0.94,
  "evento_historico_analogico": "El Niño 2015-2016 (ONI: +2.3)",
  "cultivo_mejor_desempeno": "Quinua Real",
  "reduccion_perdida_estimada_pct": 38.5,
  "climate_data_simulated": false,
  "agronomic_outcome_simulated": true
}
```

- Nota del plan: la serie climática es real, pero el desempeño agronómico por
  variedad es **simulado** (se declara) para cumplir la regla de honestidad
  del proyecto.

### System prompt del asistente (según el plan)

```
Eres el asistente de apoyo a la decisión para la asamblea comunal del aynuqa
en Pumani. Responde en español simple y conciso (máximo 4-5 oraciones). No
inventes ni calcules números por tu cuenta: usa únicamente los valores
devueltos por tus herramientas. Incluye en cada respuesta el nivel de
confianza del modelo, menciona qué datos son simulados y, si un dato no
existe en las herramientas, responde exactamente 'no tengo ese dato'. Cuando
el índice ONI proyecte anomalías extremas de sequía o helada, invoca
buscar_precedente_tierra_gemela antes de emitir una recomendación de siembra
y explica a la asamblea qué ocurrió en territorios hermanos con
características físicas equivalentes durante eventos climáticos pasados
similares, manteniendo un lenguaje cercano y respetuoso de la organización
comunal.
```

Regla adicional para el system prompt: "Cuando el índice ONI proyecte
anomalías extremas de sequía o helada, invoca `buscar_precedente_tierra_gemela`
antes de emitir una recomendación de siembra. Explica a la asamblea qué ocurrió
en territorios hermanos con características físicas equivalentes durante
eventos climáticos pasados similares, manteniendo un lenguaje cercano y
respetuoso de la organización comunal."

## 7. Infraestructura, validación geográfica y esquema SQLite

- **Validación de coordenadas de Pumani:** dado que el prompt de ML contiene
  una errata con latitud positiva (lat 17.09), el cliente de NASA POWER y el
  cargador de sectores de Back validan que toda latitud esté en el hemisferio
  sur (`-18.0 <= lat <= -16.0`, corrigiendo automáticamente 17.09 → -17.09)
  antes de consultar la API de la NASA o guardar en SQLite.
- **Esquema de caché de NASA POWER:** tabla `nasa_power_cache` en
  `backend/aynuqa.db` con clave primaria compuesta `(sector_id, date)` sobre
  -17.09, -68.0 para `T2M`, `PRECTOTCORR`, `GWETROOT` y `ALLSKY_SFC_SW_DWN`.
  Datos de 2000-2025 permanentes (TTL = null); año en curso con TTL de 24 h.
- **Gestión de dependencias y puerto:** `requirements.txt` (compatible con
  pip y `uv`), CORS abierto para desarrollo y FastAPI en el puerto **8000**
  para coincidir con `VITE_API_BASE_URL=http://localhost:8000`.
- Tablas previstas: `predictions`, `sector_history`, `backtests`,
  `twin_lands`, `nasa_power_cache`.

## 8. Estrategia de entrenamiento multi-zona (contexto que afecta a Back)

Aunque es trabajo de ML, define lo que Back recibe y sirve:

- **Tierras gemelas / transfer learning espacial:** en lugar de entrenar solo
  con Pumani, se extraen series históricas (SMAP, MODIS/HLS, NASADEM, NOAA)
  de 6 a 8 regiones análogas del Altiplano que comparten rango altitudinal
  (3.800-4.100 m), régimen hídrico semiárido y rotación similar
  (ej. Patacamaya, Ayo Ayo, Jesús de Machaca, Toledo).
- **Agnosticismo de coordenadas:** latitud y longitud quedan **excluidas**
  como features. El modelo aprende solo de firmas biofísicas y climáticas
  (`elevacion`, `pendiente`, `orientacion`, `smap_downscaled`,
  `ndvi_restrend`, `tipo_cultivo`, `oni_lag_0_6`), para poder inferir riesgo
  hídrico y recuperación sobre cualquier territorio análogo.
- **Sustitución espacio-tiempo en inferencia:** cuando una parcela de Pumani
  enfrenta una anomalía climática sin precedente local reciente (ej. El Niño
  severo), el sistema identifica qué ocurrió en una parcela gemela con
  condiciones físicas equivalentes durante eventos extremos pasados
  (2015-16 o 2023-24) y pondera el desempeño observado de cada cultivo. La
  búsqueda usa similitud biofísica (distancia coseno o k-NN sobre vectores
  normalizados de topografía, suelo e índice de El Niño).

## 9. Orden de trabajo (del plan, partes que tocan a Back)

1. **Hora 1:** contrato ampliado y mocks.
2. **Sábado:** API con mock y base (Back), mientras ML hace ingesta y primer
   modelo.
3. **Sábado noche:** integrar con datos reales.
4. **Domingo:** backtest, chat, reporte, pulido, video y entrega.

---

## 10. Diferencias con `backend/README.md` (decisiones pendientes)

El plan del PDF y `backend/README.md` (ya corregido en el repo) difieren en
estos puntos. **Hay que elegir una versión antes de codificar:**

| # | Tema | Plan (PDF) | `backend/README.md` (repo) | Comentario |
| --- | --- | --- | --- | --- |
| 1 | Índice de El Niño | ONI (NOAA `oni.ascii.txt`) | **RONI** (índice relativo, oficial desde feb 2026) | El repo ya corrigió esto: es RONI y el campo se llama `roni`. |
| 2 | Proveedor del chat | SDK `openai` con `LLM_BASE_URL`/`LLM_API_KEY`/`LLM_MODEL` + fallback `FALLBACK_LLM_BASE_URL` (Ollama Qwen) | **Gemini** con SDK `google-genai`, modelo configurable en `LLM_MODEL` | Elegir uno. El plan pide fallback; con Gemini habría que definir el fallback. |
| 3 | Nombre de archivos ML | `history_monthly.json`, `backtest_results.json` (uno solo), `twin_lands.json` | `history.json`, `backtest_<evento>.json` (uno por evento), `analogs.json` | Debe coincidir con lo que ML realmente exporta; es tema de `contracts/`. |
| 4 | Endpoint de recarga | `POST /api/admin/reload-predictions` | `POST /api/admin/reload` (con `X-Admin-Token`) | Elegir nombre único. |
| 5 | Tabla de caché POWER | `nasa_power_cache` con PK `(sector_id, date)`; otra sección del PDF usa `(lat, lon, date)` | `power_cache` con PK `(lat, lon, parameter, date)` | El PK del repo es más simple: POWER se consulta una sola vez para la zona, no por sector. |
| 6 | TTL de caché | Histórico 2000-2025 permanente; mes actual TTL 24 h | Filas de más de 90 días no caducan; recientes TTL 24 h | Similar en la práctica; unificar criterio. |
| 7 | Semilla del simulador | `random.seed(42 + int(sector_num))` o seed con `(sector_id, ts)` | Valor calculado a partir de `(sector_id, ts)` con semilla fija 42 | El del repo da lecturas estables por fecha y sector. |
| 8 | Rangos del simulador | -5.0 a 16.0 °C / 10-35 % (también -4.5 a 15.5 °C / 9-32 % en otra sección) | -5 a 16 °C / 10-35 % | Coinciden a grandes rasgos; fijar los números. |
| 9 | Sectores con eventos | Helada en sectores impares (o 1 y 3); estrés en 2 y 4 | Helada en un sector (04:00-06:30); estrés en otro (11:00-16:00), diario | Elegir cuántos sectores y qué patrón. |
| 10 | Herramienta de tierra gemela | Devuelve `cultivo_mejor_desempeno` y `reduccion_perdida_estimada_pct` con `agronomic_outcome_simulated: true` | **No** incluye cultivo ni porcentaje de pérdida; solo NDVI real observado | Conflicto de honestidad: el repo decidió no inventar cultivos ni pérdidas porque no hay datos reales a esa escala. El plan los declara como simulados. |
| 11 | Reporte de asamblea | `GET /api/report` dentro del alcance M del prompt Back | Deseable (S) | Decidir prioridad. |
| 12 | Tabla de historial | `sector_history` | `history` | Elegir nombre. |

> **Recomendación:** los ítems 1, 9 y 10 del repo ya pasaron revisión y
> protecten las reglas de honestidad del proyecto; para el resto (2, 3, 4, 12)
> conviene decidir en equipo y dejarlo escrito en `contracts/`.
