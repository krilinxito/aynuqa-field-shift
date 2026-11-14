# contracts/

Contrato de datos compartido entre Back, ML y Front. Es el acuerdo entre los tres equipos: si necesitas cambiarlo, avisa antes de tocarlo.

## Qué va aquí

- `sector_risk.schema.json`: schema JSON de la respuesta por sector (riesgo de sequía, recuperación, recomendación, confianza, `is_simulated`).
- `api.md`: endpoints de la API con request, response y ejemplo de cada uno.
- Schemas de los archivos que ML entrega a Back.
- Ejemplos JSON válidos de cada respuesta, que sirven de mock para Front y Back.
- Un test pequeño que valida los ejemplos con `jsonschema`.

## Endpoints previstos

- `GET /api/sectors?scenario=normal|nino`
- `GET /api/sectors/{id}/history?from=2000-01&to=2026-11`
- `GET /api/sectors/{id}/sensors?hours=48`
- `GET /api/backtest?event=2015-16`
- `POST /api/chat`
- `POST /api/admin/reload` (interno, con `X-Admin-Token`)
- `GET /health`

## Archivos entre ML y Back

ML los deja en `ml/outputs/`; Back los carga en SQLite al iniciar y con `POST /api/admin/reload`.

| Archivo | Lo sirve |
| --- | --- |
| `predictions.json` | `GET /api/sectors` |
| `history.json` | `GET /api/sectors/{id}/history` |
| `backtest_<evento>.json` (por ejemplo, `backtest_2015-16.json`) | `GET /api/backtest` |
| `analogs.json` | Herramienta de chat `get_twin_precedent` |

## A tener en cuenta al definirlo

- El índice de El Niño es el RONI de NOAA: en la serie histórica el campo es `roni`, no `oni`.
- `scenario=nino` es el estado real de hoy; `scenario=normal` es la comparación.
- El clima (lluvia, temperatura, humedad de suelo) es de la zona, igual para todos los sectores. Conviene que el schema lo separe de los datos por sector (NDVI, terreno, recuperación, recomendación).
- Declarar la unidad de cada campo. `soil_moisture` es un porcentaje en los sensores y una fracción de 0 a 1 en el histórico.
- El backtest devuelve primero una serie temporal de la zona. La parte por sector lleva solo la anomalía de NDVI, y el Spearman por sector es secundario. Back no calcula nada: devuelve lo que exportó ML.
- El precedente de tierra gemela lleva tierra gemela, similitud, evento y anomalía de NDVI observada. No lleva cultivo ni porcentaje de pérdida.
- La confianza va como número (0 a 1) y como palabra (`baja`, `media`, `alta`).
- El chat es stateless: `{message, sector_id?, scenario?}` y nada más.
- Las respuestas incluyen la fecha de actualización, porque la app las guarda para usarlas sin señal.

## Estado

Todavía no hay schema ni ejemplos. Definirlos es el primer PR a `main` y lo hace una sola persona.
