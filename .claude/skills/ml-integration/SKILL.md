---
name: ML integration
description: Cargar los JSON de ml/outputs en SQLite y recargarlos, con los nombres ya acordados en backend/README.md
---

# Integración ML → Back

## Cuándo usar

Cuando haya que cargar o recargar en el backend los resultados que exporta ML.

## Nombres acordados

Los nombres de `backend/README.md` y `contracts/` son los vigentes. Las
diferencias con el plan del PDF (`backend/BACKEND_PLAN.md`, sección 10) ya están
resueltas a favor del README; no vuelvas a los nombres del PDF.

| Qué | Nombre vigente |
| --- | --- |
| Historial | `history.json`, tabla `history` |
| Backtest | `backtest_<evento>.json` (uno por evento), tabla `backtests` |
| Tierras gemelas | `analogs.json`, tabla `analogs` |
| Endpoint de recarga | `POST /api/admin/reload` |

## Archivos y endpoints

| Archivo en `ml/outputs/` | Endpoint que lo sirve |
| --- | --- |
| `predictions.json` | `GET /api/sectors?scenario=normal\|nino` |
| `history.json` | `GET /api/sectors/{id}/history` |
| `backtest_<evento>.json` | `GET /api/backtest?event=...` |
| `analogs.json` | Herramienta de chat de tierra gemela |

## Pasos

1. Al iniciar el servidor (`lifespan` de FastAPI), inicializa la base SQLite y
   carga cada archivo de `ml/outputs/` en su tabla. Los `GET` leen de SQLite,
   nunca del archivo.
2. `POST /api/admin/reload` recarga en caliente cuando ML vuelve a exportar.
   Exige `X-Admin-Token` = `ADMIN_TOKEN`.
3. **Fallback a mocks:** si un archivo no existe o no cumple el schema, carga el
   ejemplo de `contracts/` y refléjalo en `/health` (`"source": "mock"` o
   `"real"` por archivo).
4. La ruta de salida se configura con `ML_OUTPUTS_DIR` (por defecto `../ml/outputs`).
5. No hagas joins: el historial ya trae clima de la zona, RONI y NDVI por sector;
   `/backtest` devuelve las métricas tal como las exportó ML (Back **no** calcula
   Spearman ni anomalías de NDVI).
6. Valida cada archivo con `jsonschema` antes de cargarlo (ver skill `backend-test`).

## Reglas

- Back no calcula predicciones, anomalías ni correlaciones.
- Back no consulta fuentes externas (ni NASA POWER): la historia termina en el
  último mes que exportó ML. ML calcula la lluvia con IMERG y CHIRPS; mezclar un
  mes parcial de otra fuente daría cifras no comparables.
- Unidades: `soil_moisture_pct` es porcentaje en los sensores y `soil_moisture`
  es fracción 0–1 en el histórico (`GWETROOT`).
- La tabla de tierra gemela no inventa cultivos ni porcentajes de pérdida.
