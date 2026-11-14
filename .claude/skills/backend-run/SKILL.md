---
name: Backend run
description: Levantar la API FastAPI de Aynuqa Field Shift en el puerto 8000, con .env y verificación de /health
---

# Levantar el backend

## Cuándo usar

Cuando necesites probar la API en local o verificar que arranca bien.

## Pasos

1. Copia la configuración si no existe y complétala:

   ```bash
   cd backend
   cp .env.example .env
   ```

   Variables de `backend/.env.example`:
   - `LLM_API_KEY` — clave del proveedor del chat.
   - `LLM_MODEL` — modelo (no dejar el nombre fijo en el código).
   - `ADMIN_TOKEN` — token que exige el endpoint de recarga (`X-Admin-Token`).
   - `ML_OUTPUTS_DIR` — por defecto `../ml/outputs`.

2. Activa el entorno virtual: `source .venv/bin/activate`.

3. Levanta el servidor en el puerto **8000** (el mismo de
   `VITE_API_BASE_URL=http://localhost:8000`):

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

4. Verifica el estado:

   ```bash
   curl http://localhost:8000/health
   ```

   Debe indicar si la fuente de datos es real (`ml_real` / `"source": "real"`) o
   mock (`contracts_mock` / `"source": "mock"`) y que SQLite está conectado.

5. Prueba los endpoints de `contracts/api.md` que hayas tocado.

## Notas

- Base SQLite en `backend/data/` (ignorada en git). El nombre del archivo no está
  unificado: el plan usa `aynuqa.db` y el README `app.db` (ver
  `BACKEND_PLAN.md` sección 10).
- CORS abierto para desarrollo.
- Después de `make predict` en ML, llama al endpoint de recarga con
  `X-Admin-Token` para cargar los datos sin reiniciar (ver skill `ml-integration`).
- No commitees el `.env` ni la base de datos.
