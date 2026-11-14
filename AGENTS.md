# Aynuqa Field Shift — instrucciones para agentes

Hackathon NASA Space Apps 2026 (reto *Field Shift: Adapting Farms with NASA
Data*). Apoyo a la decisión para que una comunidad del altiplano adapte su
rotación comunal (aynuqa) a El Niño y al cambio climático con datos NASA. El
sistema estima por sector el riesgo de sequía y la recuperación del suelo, y los
convierte en recomendaciones: qué sector abrir, cuánto extender el descanso, qué
sembrar y cuándo.

## Lee primero

- `CLAUDE.md` — contexto y reglas completas del proyecto. Léelo entero.
- `contracts/README.md` — contrato de datos entre Back, ML y Front.
- `backend/README.md` — cómo está hecho el backend (si trabajas en backend).
- `backend/BACKEND_PLAN.md` — plan original del PDF, solo como contexto
  histórico. Donde difiere de `backend/README.md` o de `contracts/`, mandan
  estos dos (la sección 10 ya está resuelta).
- `README.md` — visión general, datos usados y escala.

## Reglas clave

- Trabaja solo en la carpeta de tu equipo y en tu rama `team/<equipo>`:
  `backend/` en `team/back`, `ml/` en `team/ml`, `frontend/` en `team/front`.
- Respeta `contracts/`. Si necesitas cambiarlo, avísalo; no lo cambies por tu cuenta.
- No inventes datos satelitales: si falta un dato, devuelve `null`.
- Lo simulado (polígonos, años de descanso, sensores) lleva `is_simulated: true`.
- Muestra siempre la confianza: número (0 a 1) y palabra (`baja`, `media`, `alta`).
- El índice de El Niño es el RONI de NOAA (oficial desde feb 2026), no el ONI.
  En la serie histórica el campo se llama `roni`. El escenario `nino` es el
  estado real de hoy; `normal` es la comparación.
- No afirmes impactos como seguros: El Niño "aumenta la probabilidad de sequía".
- El clima (lluvia, temperatura, humedad de suelo) es de la zona, igual para
  todos los sectores. Solo el NDVI y el terreno distinguen sectores.
- Back no calcula predicciones, anomalías ni correlaciones: carga los JSON de
  `ml/outputs/` en SQLite y los sirve.
- El chat usa Gemini (`google-genai`), es stateless y sus números salen solo de
  sus 5 herramientas. Sin clave responde 502; no hay fallback local.
- Back no consulta fuentes externas: la historia es solo la que exporta ML.
- El frontend es una PWA minimalista para celulares de gama baja y mala señal.
- Todo texto para el usuario va en español simple.
- Los secretos van solo en `.env`.
- Haz commits pequeños y frecuentes en tu rama. Los cambios entran a `main` por
  Pull Requests pequeños.

## Verificación

- Backend: `pytest` y validación de ejemplos con `jsonschema`.
- Levantar la API: `uvicorn app.main:app --reload --port 8000` y revisar
  `GET /health`.

## Skills disponibles

- `backend-endpoint` — crear o modificar un endpoint FastAPI.
- `ml-integration` — cargar los JSON de ML en SQLite y recargarlos.
- `backend-test` — correr tests del backend y validar con `jsonschema`.
- `backend-run` — levantar el servidor y verificar `/health`.
