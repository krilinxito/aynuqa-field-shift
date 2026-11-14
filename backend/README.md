# backend/

Equipo Back. Rama: `team/back`.

API con FastAPI y SQLite que cumple `contracts/`.

## Contexto del plan

El plan completo del equipo (sacado de `aynuqa-plan-Hackaton.pdf`) está en
[`BACKEND_PLAN.md`](BACKEND_PLAN.md). Léelo antes de empezar: incluye los
requisitos M/S/C, la integración ML → SQLite, las reglas del simulador de
sensores, el chat con function calling y las **decisiones pendientes** donde
el plan y este README difieren (sección 10).

## Regla principal

Back no calcula predicciones, anomalías, correlaciones ni similitudes. Todo eso lo exporta ML; Back lo carga y lo sirve.

## Alcance

Imprescindible:

- Todos los endpoints de `contracts/api.md`; al inicio sirven los ejemplos (mock) y luego los datos reales.
- Carga de los archivos de ML en SQLite (ver "Integración con ML"), con tests de `jsonschema`.
- Cliente de NASA POWER solo para los días recientes (ver "Caché de NASA POWER").
- Simulador de sensores (ver "Simulador de sensores").
- `POST /api/chat` con Gemini y cinco herramientas (ver "Chat").
- CORS, `.env`, `/health` y errores claros.

Deseable: cliente `earthaccess` para IMERG y SMAP, reporte para la asamblea (markdown o PDF), Docker compose.

Si sobra tiempo: canal de Telegram.

## Integración con ML

ML deja sus resultados en `ml/outputs/`, en JSON:

| Archivo | Endpoint que lo sirve |
| --- | --- |
| `predictions.json` | `GET /api/sectors?scenario=normal\|nino` |
| `history.json` | `GET /api/sectors/{id}/history` |
| `backtest_2015-16.json`, `backtest_2023-24.json` | `GET /api/backtest?event=...` |
| `analogs.json` | Herramienta de chat `get_twin_precedent` |

Cómo se cargan:

- Al iniciar el servidor (`lifespan` de FastAPI), Back lee los archivos y los guarda en SQLite. Los `GET` leen de SQLite, nunca del archivo.
- `POST /api/admin/reload` vuelve a cargarlos sin reiniciar. ML lo llama después de `make predict`. Exige la cabecera `X-Admin-Token` con el valor de `ADMIN_TOKEN`.
- Si un archivo no existe o no cumple el schema, Back sirve el ejemplo de `contracts/` para ese endpoint y lo dice en `/health` (`"source": "mock"` o `"real"` por cada archivo).
- La ruta se configura con `ML_OUTPUTS_DIR` (por defecto `../ml/outputs`).

`/history` no hace ningún join: `history.json` ya trae el clima de la zona, el RONI y el NDVI por sector. `/backtest` devuelve las métricas tal como las exportó ML.

## Caché de NASA POWER

El histórico desde 2000 es de ML. El cliente de Back solo cubre los días posteriores a la última fecha de `history.json`, para mostrar el estado reciente de la zona.

- Consulta `daily/point` con `T2M`, `PRECTOTCORR`, `GWETROOT` y `ALLSKY_SFC_SW_DWN`, una sola vez para la zona (no por sector).
- Tabla `power_cache` con clave primaria `(lat, lon, parameter, date)`; `lat` y `lon` redondeadas a 2 decimales. Columnas: `value` y `fetched_at`.
- Expiración: las filas con fecha de más de 90 días no caducan. Las más recientes se vuelven a pedir si `fetched_at` tiene más de 24 horas, porque NASA POWER corrige los datos recientes.
- NASA POWER marca los datos faltantes con `-999`: se guardan como `null`.

## Simulador de sensores

Todo simulado, siempre con `is_simulated: true`.

- Una lectura cada 30 minutos por sector, con hora de Bolivia (UTC-4).
- **Reproducible:** cada valor se calcula a partir de `(sector_id, ts)` con semilla fija 42. La misma hora devuelve siempre el mismo valor, así los gráficos no saltan al refrescar.
- **Rangos base** para unos 3.900 m:
  - `air_temp_c`: entre -5 y 16, con ciclo diario (mínima cerca de las 05:00, máxima cerca de las 14:00) y ruido de ±0,5.
  - `soil_moisture`: entre 10 y 35 (porcentaje), con variación lenta y ruido de ±0,5.
  - `canopy_temp_delta_c`: entre -1 y 4, más alto al mediodía.
- **Alerta de helada:** `frost_alert` es `true` cuando `air_temp_c <= 0.0`.
- **Estrés hídrico:** `soil_moisture < 12` y `canopy_temp_delta_c > 2.5` durante al menos 3 lecturas seguidas.
- **Dos eventos programados**, que se repiten cada día para que siempre caigan dentro de las últimas 48 horas:
  - Helada: en un sector, entre las 04:00 y las 06:30, la temperatura baja de 0.
  - Estrés hídrico: en otro sector, entre las 11:00 y las 16:00, se cumplen las dos condiciones de arriba.

Ojo con las unidades: aquí `soil_moisture` es un porcentaje, y en el histórico viene de `GWETROOT`, que va de 0 a 1. El contrato debe dejar clara la unidad de cada uno.

## Chat

- **Proveedor:** Google Gemini, con el SDK `google-genai` y function calling.
- **Modelo:** se configura en `LLM_MODEL`. Elegir un modelo Flash vigente en la lista oficial de modelos de la API de Gemini; no dejar el nombre fijo en el código.
- **Sin memoria:** el endpoint es stateless. Recibe `{message, sector_id?, scenario?}` y responde. No hay tablas de usuarios, sesiones ni historial.
- **Máximo 5 rondas de herramientas** por mensaje; si se superan, responde "No tengo ese dato".
- **La recomendación no la crea el modelo:** viene de las reglas de ML dentro de `predictions.json`. El modelo la explica.

Herramientas:

| Herramienta | Qué devuelve |
| --- | --- |
| `get_sector(sector_id, scenario)` | Riesgo, recuperación, recomendación y confianza del sector |
| `compare_scenarios(sector_id)` | El mismo sector en `normal` y en `nino` |
| `get_history(sector_id, from, to)` | Serie mensual |
| `get_sensors(sector_id, hours)` | Lecturas simuladas |
| `get_twin_precedent(sector_id, scenario)` | Precedente en una tierra gemela, leído de `analogs.json` |

Cada herramienta devuelve la confianza como número y también como palabra (`confidence_label`: `baja` si es menor que 0,4, `media` hasta 0,7, `alta` por encima), para que el modelo no tenga que traducirla.

Ejemplo de `get_twin_precedent` (valores ilustrativos):

```json
{
  "sector_id": "S3",
  "twin_zone": "Jesús de Machaca",
  "twin_elevation_m": 3890,
  "twin_slope_pct": 4.2,
  "similarity": 0.94,
  "event": "2015-16",
  "observed_ndvi_anomaly": -0.8,
  "confidence": 0.6,
  "confidence_label": "media",
  "is_simulated": false
}
```

`is_simulated` es `false` porque el NDVI y el terreno de la tierra gemela son mediciones reales. No incluye cultivo ni porcentaje de pérdida: no hay datos reales a esa escala.

System prompt, tal cual va en el código:

```
Eres el asistente de la asamblea de una comunidad del altiplano boliviano que decide su rotación comunal (aynuqa).

Reglas:
1. Todos los números salen de las herramientas. Nunca calcules, estimes ni recuerdes cifras por tu cuenta. Si una herramienta no devuelve el dato, responde: "No tengo ese dato".
2. Cada vez que menciones un riesgo, una recuperación o una recomendación, di también su confianza: baja, media o alta.
3. La recomendación de cada sector viene del sistema. Explícala con sus motivos; no inventes una distinta.
4. El Niño aumenta la probabilidad de sequía; no la asegura. Nunca presentes un impacto como seguro.
5. La lluvia, la temperatura y la humedad del suelo son datos de toda la zona, iguales para todos los sectores. No digas que un sector recibió más lluvia que otro.
6. Cuando el escenario sea El Niño o el riesgo de sequía del sector sea alto, llama a get_twin_precedent antes de explicar la recomendación. Cuenta qué pasó con la vegetación en la tierra gemela durante ese evento pasado, y aclara que es un precedente, no una garantía.
7. Di cuándo un dato es simulado: los límites de los sectores, los años de descanso y los sensores lo son.
8. Responde en español simple, con frases cortas y sin términos técnicos, en un máximo de 120 palabras. Habla con respeto por la organización comunal: la asamblea decide; tú solo aportas evidencia.
9. Si te preguntan algo fuera de la rotación, el clima o los sectores de la comunidad, di que solo puedes ayudar con esos temas.
```

## Otras correcciones que afectan a la API

- **Escala:** los sectores caen en la misma celda de NASA POWER. El clima es de la zona; por sector solo cambian el NDVI, el terreno, la recuperación y la recomendación.
- **Índice de El Niño:** es el RONI de NOAA, no el ONI. El campo de la serie histórica se llama `roni`.
- **Escenarios:** `nino` es el estado real de hoy (RONI observado); `normal` es la comparación.
- **PWA:** el frontend guarda la última respuesta para usarla sin señal. Las respuestas de `GET` deben ser livianas e incluir la fecha de actualización.

## Infraestructura

- Python 3.11 o superior, `requirements.txt` y entorno virtual (`python -m venv .venv`).
- Puerto **8000**, el mismo de `VITE_API_BASE_URL` en el frontend.
- Base SQLite en `backend/data/app.db` (ignorada en git). Tablas: `predictions`, `history`, `backtest`, `analogs` y `power_cache`.

## Configuración

Copia `.env.example` a `.env` y completa los valores.

## Cómo correr

Pendiente: se documenta cuando exista la API. El comando previsto es `uvicorn app.main:app --reload --port 8000`.
