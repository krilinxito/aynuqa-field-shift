---
name: Backend endpoint
description: Crear o modificar un endpoint FastAPI del backend de Aynuqa Field Shift respetando contracts/ y backend/README.md
---

# Crear o modificar un endpoint del backend

## Cuándo usar

Cuando pidan agregar, cambiar o corregir un endpoint de la API en `backend/`.

## Antes de empezar

1. Lee `contracts/api.md` y `contracts/sector_risk.schema.json`: el contrato manda.
2. Lee `backend/README.md`: es lo vigente. `backend/BACKEND_PLAN.md` es el plan
   original del PDF; donde difiere, manda el README (la sección 10 del plan ya
   está resuelta).
3. Confirma que estás en la rama `team/back`.

## Endpoints previstos (contrato)

- `GET /health`
- `GET /api/sectors?scenario=normal|nino`
- `GET /api/sectors/{id}/history?from=2000-01&to=2026-11`
- `GET /api/sectors/{id}/sensors?hours=48`
- `GET /api/backtest?event=2015-16|2023-24|2020-22`
- `POST /api/chat`
- `POST /api/admin/reload`
- `GET /api/report` *(extra, fuera de `contracts/api.md`)*

## Pasos

1. Define request y response exactamente como el contrato: nombres, unidades,
   `is_simulated`, y la confianza como número (`confidence`) y como palabra
   (`confidence_label`: `baja` < 0,4; `media` hasta 0,7; `alta` por encima).
2. Implementa la ruta en FastAPI (el proyecto usa `backend/app/...`, con la app
   en `app.main:app`).
3. Si el dato viene de ML, léelo de SQLite, nunca del archivo JSON.
4. Si falta un dato, devuelve `null`; no lo inventes.
5. Si el contrato debe cambiar, avísalo antes de tocarlo y actualiza el ejemplo
   o mock correspondiente en `contracts/`.
6. Agrega o actualiza el test del endpoint (ver skill `backend-test`).
7. Actualiza `/health` si cambia la fuente del dato.

## Reglas

- Back no calcula predicciones, anomalías, correlaciones ni similitudes.
- Las respuestas de `GET` deben ser livianas e incluir la fecha de actualización
  (la PWA las guarda para uso sin señal).
- El clima es de la zona: no presentes diferencias de lluvia o temperatura entre
  sectores.
- No cambies `contracts/` por tu cuenta.
- Haz un commit pequeño y descriptivo al terminar.
