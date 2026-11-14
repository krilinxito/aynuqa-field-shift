# backend/

Equipo Back. Rama: `team/back`.

API con FastAPI y SQLite que cumple `contracts/`.

## Alcance

Imprescindible:

- Todos los endpoints de `contracts/api.md`; al inicio sirven los ejemplos (mock) y luego los datos reales.
- Cliente de NASA POWER (daily/point: `T2M`, `PRECTOTCORR`, `GWETROOT`, `ALLSKY_SFC_SW_DWN`) con caché en SQLite.
- Tabla `predictions` que carga la salida de `ml/` y la sirve según el schema, con tests de `jsonschema`.
- Simulador de sensores (humedad de suelo, temperatura del aire, diferencia de temperatura de dosel, alerta de helada) con ruido y dos eventos programados. Siempre `is_simulated: true`.
- `POST /api/chat`: modelo de lenguaje con herramientas (`get_sector`, `compare_scenarios`, `get_history`, `get_sensors`). El modelo solo explica; los números salen de la API. Responde en español simple, con la confianza, y dice "no tengo ese dato" si falta.
- CORS, `.env`, `/health` y errores claros.

Correcciones que afectan a la API:

- **Escala:** los sectores caen en la misma celda de NASA POWER, así que el clima se consulta y se guarda una sola vez para la zona, no por sector. Por sector solo cambian el NDVI, el terreno, la recuperación y la recomendación.
- **Índice de El Niño:** es el RONI de NOAA, no el ONI. El campo de la serie histórica se llama `roni`.
- **Escenarios:** `nino` es el estado real de hoy (RONI observado); `normal` es la comparación.
- **Backtest:** la respuesta principal es una serie temporal de la zona; la parte por sector lleva solo NDVI.
- **Chat:** nunca afirma impactos como seguros. El Niño "aumenta la probabilidad de sequía".
- **PWA:** el frontend guarda la última respuesta para usarla sin señal. Las respuestas de `GET` deben ser livianas e incluir la fecha de actualización.

Deseable: cliente `earthaccess` para IMERG y SMAP, reporte para la asamblea (markdown o PDF), Docker compose.

Si sobra tiempo: canal de Telegram.

## Configuración

Copia `.env.example` a `.env` y completa los valores.

## Cómo correr

Pendiente: se documenta cuando exista la API.
