---
name: Backend run
description: Levantar la API FastAPI de Aynuqa Field Shift en el puerto 8000 y verificar /health
---

# Levantar el backend

## Cuándo usar

Cuando necesites probar la API en local o verificar que arranca bien.

## Pasos

1. Copia la configuración si no existe: `cp .env.example .env` y completa los
   valores (los secretos van solo en `.env`).
2. Activa el entorno virtual: `source .venv/bin/activate`.
3. Levanta el servidor en el puerto **8000** (el mismo de
   `VITE_API_BASE_URL` en el frontend):

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

4. Verifica el estado:

   ```bash
   curl http://localhost:8000/health
   ```

   Debe indicar, por cada archivo de ML, si la fuente es `mock` o `real`.

5. Prueba los endpoints de `contracts/api.md` que hayas tocado.

## Notas

- Base SQLite en `backend/data/app.db` (ignorada en git).
- Después de `make predict` en ML, llama a `POST /api/admin/reload` con la
  cabecera `X-Admin-Token` para recargar los datos sin reiniciar (ver skill
  `ml-integration`).
- No commitees el `.env` ni la base de datos.
