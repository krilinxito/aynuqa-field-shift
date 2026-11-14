---
name: ML integration
description: Cargar los JSON de ml/outputs en SQLite y recargarlos, respetando las decisiones pendientes de nombres
---

# Integración ML → Back

## Cuándo usar

Cuando haya que cargar o recargar en el backend los resultados que exporta ML.

## Antes de empezar: nombres aún no unificados

El plan del PDF y `backend/README.md` **no coinciden** en los nombres. Están en
`backend/BACKEND_PLAN.md` sección 10 (puntos 3, 4, 5, 12). Antes de codificar,
confirma con el equipo qué nombres quedan; no inventes un tercer nombre.

| Qué | Plan (PDF) | `backend/README.md` (repo) |
| --- | --- | --- |
| Historial | `history_monthly.json` | `history.json` |
| Backtest | `backtest_results.json` (uno) | `backtest_<evento>.json` (uno por evento) |
| Tierras gemelas | `twin_lands.json` | `analogs.json` |
| Endpoint de recarga | `POST /api/admin/reload-predictions` | `POST /api/admin/reload` |
| Tablas | `sector_history`, `backtests`, `twin_lands`, `nasa_power_cache` | `history`, `backtest`, `analogs`, `power_cache` |

`predictions.json` sí coincide en ambos.

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
2. Implementa el endpoint de recarga (nombre pendiente) para recargar en caliente
   cuando ML ejecute `make predict`. Debe exigir `X-Admin-Token` = `ADMIN_TOKEN`.
3. **Fallback a mocks:** si un archivo no existe o no cumple el schema, carga el
   ejemplo de `contracts/` y refléjalo en `/health` (`"source": "mock"` o
   `"real"` por archivo). Así Front no se bloquea en la primera hora.
4. La ruta de salida se configura con `ML_OUTPUTS_DIR` (por defecto `../ml/outputs`).
5. No hagas joins: el historial ya trae clima de la zona, RONI y NDVI por sector;
   `/backtest` devuelve las métricas tal como las exportó ML (Back **no** calcula
   Spearman ni anomalías de NDVI).
6. Valida cada archivo con `jsonschema` antes de cargarlo (ver skill `backend-test`).

## Caché de NASA POWER (si lo tocas)

- Consulta `daily/point` (`T2M`, `PRECTOTCORR`, `GWETROOT`, `ALLSKY_SFC_SW_DWN`)
  **una sola vez para la zona** (-17.09, -68.0), no por sector.
- Valida la latitud al hemisferio sur (`-18.0 <= lat <= -16.0`); corrige la
  errata 17.09 → -17.09 antes de consultar o guardar.
- NASA POWER marca los faltantes con `-999`: guárdalos como `null`.
- TTL: histórico (2000-2025) sin expiración; datos recientes del mes actual con
  TTL de 24 h (el plan y el README lo expresan distinto; ver sección 10, punto 6).

## Reglas

- Back no calcula predicciones, anomalías ni correlaciones.
- Unidades: `soil_moisture` es porcentaje en los sensores y fracción 0–1 en el
  histórico (`GWETROOT`). Declara la unidad.
- La tabla de tierra gemela no inventa cultivos ni porcentajes de pérdida.
