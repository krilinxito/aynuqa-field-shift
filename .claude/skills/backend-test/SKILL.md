---
name: Backend test
description: Correr los tests del backend de Aynuqa Field Shift y validar los JSON con jsonschema
---

# Tests del backend

## Cuándo usar

Antes de cada commit en `team/back` y después de tocar endpoints, carga de ML o
el simulador de sensores.

## Pasos

1. Activa el entorno virtual: `source .venv/bin/activate` (o créalo con
   `python -m venv .venv` si no existe).
2. Instala dependencias si hace falta: `pip install -r requirements.txt`.
3. Corre los tests: `pytest -q`.
4. Valida los ejemplos y los archivos de ML contra los schemas de `contracts/`
   usando `jsonschema`.
5. Si un test falla, arréglalo antes de commitear. No comitees con tests rojos.

## Qué cubrir

- Cada endpoint de `contracts/api.md` devuelve la forma correcta.
- Los archivos de `ml/outputs/` cumplen su schema; si no, el backend sirve el
  mock y lo dice en `/health`.
- `POST /api/admin/reload` exige `X-Admin-Token`.
- El simulador de sensores es reproducible (misma semilla 42 para
  `(sector_id, ts)`) y marca `is_simulated: true`.

## Regla

Es un hackathon de 48 horas: los tests deben ser rápidos y enfocados en el
contrato, no en cobertura exhaustiva.
