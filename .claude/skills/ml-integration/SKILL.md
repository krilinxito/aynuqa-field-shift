---
name: ML integration
description: Cargar los JSON de ml/outputs en SQLite y exponerlos, incluyendo POST /api/admin/reload
---

# Integración ML → Back

## Cuándo usar

Cuando haya que cargar o recargar en el backend los resultados que exporta ML.

## Archivos y endpoints

| Archivo en `ml/outputs/` | Endpoint que lo sirve |
| --- | --- |
| `predictions.json` | `GET /api/sectors?scenario=normal\|nino` |
| `history.json` | `GET /api/sectors/{id}/history` |
| `backtest_2015-16.json`, `backtest_2023-24.json` | `GET /api/backtest?event=...` |
| `analogs.json` | Herramienta de chat `get_twin_precedent` |

## Pasos

1. Al iniciar el servidor (`lifespan` de FastAPI), lee cada archivo y guárdalo
   en SQLite. Los `GET` leen de SQLite, nunca del archivo.
2. Implementa `POST /api/admin/reload` para recargar sin reiniciar. Debe exigir
   la cabecera `X-Admin-Token` con el valor de `ADMIN_TOKEN`.
3. Si un archivo no existe o no cumple el schema, sirve el ejemplo de
   `contracts/` y refléjalo en `/health` (`"source": "mock"` o `"real"` por archivo).
4. La ruta de salida se configura con `ML_OUTPUTS_DIR` (por defecto `../ml/outputs`).
5. No hagas joins: `history.json` ya trae clima de la zona, RONI y NDVI por
   sector; `/backtest` devuelve las métricas tal como las exportó ML.

## Reglas

- Back no calcula predicciones, anomalías ni correlaciones.
- Valida cada archivo con `jsonschema` antes de cargarlo (ver skill `backend-test`).
- Unidades: `soil_moisture` es porcentaje en los sensores y fracción 0–1 en el
  histórico (`GWETROOT`). El contrato debe declarar la unidad.
