# API

Base: `http://localhost:8000`. Todas las respuestas son JSON en UTF-8.

Cada endpoint tiene un schema en `contracts/` y un ejemplo en `contracts/examples/api/`. Los ejemplos son datos inventados para desarrollar (mock) y llevan `"data_source": "mock"`.

| Endpoint | Schema | Ejemplo |
| --- | --- | --- |
| `GET /api/sectors` | `sector_risk.schema.json` | `sectors_normal.json`, `sectors_nino.json` |
| `GET /api/sectors/{id}/history` | `history.schema.json` | `history_S1.json` |
| `GET /api/sectors/{id}/sensors` | `sensors.schema.json` | `sensors_S1.json` |
| `GET /api/backtest` | `backtest.schema.json` | `backtest_2015-16.json` |
| `POST /api/chat` | `chat_request.schema.json`, `chat_response.schema.json` | `chat_request.json`, `chat_response.json` |
| `POST /api/admin/reload` | `health.schema.json` | `health.json` |
| `GET /health` | `health.schema.json` | `health.json` |
| Errores | `error.schema.json` | `error.json` |

## Convenciones

- **Sectores:** `S1` a `S13`, como la aynuqa documentada de Pumani (13 sectores: 3 en cultivo y 10 en descanso). Están numerados en sentido horario desde el norte, y la rotación avanza en ese orden. Front no debe asumir una cantidad fija.
- **Escenarios:** `nino` es el estado real de hoy (RONI observado); `normal` es la comparación (RONI 0).
- **Fechas:** los meses van como `YYYY-MM`; los instantes, en ISO 8601 con hora de Bolivia (`-04:00`).
- **Datos faltantes:** `null`. Nunca se inventa un valor.
- **Niveles:** `low` si el puntaje es menor que 0,33; `medium` si es menor que 0,66; `high` en otro caso.
- **Confianza:** va como número de 0 a 1 (`confidence`) y como palabra (`confidence_label`): `baja` si es menor que 0,4; `media` hasta 0,7; `alta` por encima.
- **Simulado:** todo objeto simulado lleva `is_simulated: true`.
- **Origen:** `data_source` es `mock` (ejemplos de `contracts/`) o `real` (archivos de ML). Front debe mostrar una etiqueta cuando sea `mock`.
- **Actualización:** `updated_at` indica cuándo se generaron los datos. La app lo muestra cuando trabaja sin señal.

## Unidades

| Campo | Unidad | Escala |
| --- | --- | --- |
| `precip_mm` | mm, total del mes (NASA GPM IMERG; los meses recientes, CHIRPS ajustado) | Zona |
| `temp_c` | °C, media del mes | Zona |
| `soil_moisture` | Fracción de 0 a 1 (`GWETROOT`) | Zona |
| `roni` | Índice, sin unidad | Global |
| `ndvi` | De -1 a 1 | Sector |
| `ndvi_anomaly`, `observed_ndvi_anomaly` | Desviaciones estándar respecto al mismo mes desde 2000, sin la tendencia lineal entre años | Sector |
| `soil_moisture_pct` | Porcentaje de 0 a 100 (solo sensores) | Sector, simulado |
| `air_temp_c`, `canopy_temp_delta_c` | °C (solo sensores) | Sector, simulado |

La lluvia, la temperatura, la humedad de suelo y el RONI son iguales para todos los sectores, porque caen en la misma celda de IMERG y de NASA POWER.

## GET /api/sectors

Parámetro: `scenario` = `normal` o `nino` (por defecto, `nino`).

Devuelve la zona (clima y RONI) y la lista de sectores. Cada sector trae:

- `geometry`, `centroid`, `area_ha`: límites simulados, GeoJSON con `[lon, lat]`.
- `terrain`: altitud, pendiente y orientación.
- `rotation`: `resting` o `cultivated`, y los años en ese estado (simulado).
- `vegetation`: último NDVI y su anomalía.
- `risk`: riesgo de sequía con `score`, `level`, `interval`, confianza y `drivers`.
- `recovery`: recuperación del suelo con `score`, `level`, confianza y `ndvi_residual`.
- `recommendation`: `action`, `text`, `reasons`, y según el caso `extend_rest_years`, `crop` y `sowing_window`.
- `twin_precedent`: precedente en una tierra gemela, o `null` (siempre `null` en el escenario `normal`).

Valores de `recommendation.action`:

| Valor | Significado |
| --- | --- |
| `open` | Abrir el sector para cultivo |
| `extend_rest` | Alargar el descanso (`extend_rest_years` dice cuántos años) |
| `start_rest` | Pasar a descanso al terminar la cosecha |
| `keep_cultivating` | Seguir cultivando |

## GET /api/sectors/{id}/history

Parámetros: `from` y `to` en `YYYY-MM` (por defecto, toda la serie desde `2000-01`).

Devuelve la serie mensual `{date, ndvi, precip_mm, soil_moisture, temp_c, roni}`. Solo `ndvi` cambia entre sectores.

## GET /api/sectors/{id}/sensors

Parámetro: `hours`, de 1 a 168 (por defecto, 48).

Devuelve una lectura cada 30 minutos: `{ts, soil_moisture_pct, air_temp_c, canopy_temp_delta_c, frost_alert, water_stress_alert, is_simulated}`. Todo es simulado.

- `frost_alert`: `air_temp_c <= 0.0`.
- `water_stress_alert`: `soil_moisture_pct < 12` y `canopy_temp_delta_c > 2.5` en 3 lecturas seguidas.

## GET /api/backtest

Parámetro: `event` = `2015-16`, `2023-24` (El Niño) o `2020-22` (La Niña).

- `zone`: el backtest principal. Serie mensual de la zona con `roni`, `predicted_risk`, `observed_ndvi_anomaly` y `precip_anomaly_pct`, sus promedios y la correlación de Spearman.
  - El modelo pronostica una vez por campaña, a inicios de octubre. `predicted_risk` repite ese pronóstico de octubre a junio y es `null` de julio a septiembre, cuando aún no se había emitido.
  - `metric` compara el riesgo con la anomalía de NDVI de febrero a abril en todas las campañas de la zona (`n` es el número de campañas), cada una predicha sin verse a sí misma. Se espera un valor negativo: más riesgo, menos verdor.
- `per_sector` y `per_sector_metric`: evidencia secundaria, solo con NDVI. Con 13 sectores la correlación puede ser `null` o poco confiable; `note` lo advierte.
- `held_out`: `true` si el evento quedó fuera del entrenamiento.

Back no calcula nada de esto: devuelve lo que exportó ML.

## POST /api/chat

Cuerpo: `{message, sector_id?, scenario?}`. No hay sesiones ni historial: cada mensaje se responde por separado.

Respuesta: `{answer, sources, confidence_note, updated_at}`. `sources` lista las herramientas usadas y los campos consultados.

## POST /api/admin/reload

Vuelve a cargar los archivos de `ml/outputs/`. Exige la cabecera `X-Admin-Token`. Responde igual que `/health`.

## GET /health

`{status, version, updated_at, sources}`. `sources` dice, para `predictions`, `history`, `backtest` y `analogs`, si se están sirviendo datos `mock` o `real`.

## Errores

`{"error": {"code", "message"}}`, con el mensaje en español simple.

| HTTP | `code` | Cuándo |
| --- | --- | --- |
| 404 | `sector_not_found` | El sector no existe |
| 404 | `event_not_found` | El evento de backtest no existe |
| 422 | `invalid_request` | Parámetro o cuerpo inválido |
| 401 | `unauthorized` | Falta `X-Admin-Token` o es incorrecto |
| 502 | `llm_unavailable` | El modelo de lenguaje no respondió |
