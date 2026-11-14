---
name: Backend test
description: Correr los tests del backend de Aynuqa Field Shift y validar los JSON con jsonschema
---

# Tests del backend

## Cuándo usar

Antes de cada commit en `team/back` y después de tocar endpoints, la carga de ML
o el simulador de sensores.

## Pasos

1. Activa el entorno virtual: `source .venv/bin/activate` (créalo con
   `python -m venv .venv` si no existe).
2. Instala dependencias si hace falta: `pip install -r requirements.txt`
   (el archivo es compatible también con `uv`).
3. Corre los tests: `pytest -q`.
4. Valida los ejemplos y los archivos de ML contra los schemas de `contracts/`
   usando `jsonschema`.
5. Si un test falla, arréglalo antes de commitear. No comitees con tests rojos.

## Qué cubrir

- Cada endpoint de `contracts/api.md` devuelve la forma correcta (request,
  response, unidades, `confidence`/`confidence_label`).
- Los archivos de `ml/outputs/` cumplen su schema; si no, el backend sirve el
  mock de `contracts/` y lo dice en `/health`.
- El endpoint de recarga exige `X-Admin-Token`.
- El simulador de sensores es **reproducible**: el mismo `(sector_id, ts)` con
  semilla fija 42 devuelve el mismo valor, y todo lleva `is_simulated: true`.
- El simulador dispara sus 2 eventos (helada con `air_temp_c <= 0`; estrés
  hídrico con `soil_moisture < 12` y `canopy_temp_delta_c > 2.5`).

## Regla

Es un hackathon de 48 horas: los tests deben ser rápidos y enfocados en el
contrato, no en cobertura exhaustiva.
