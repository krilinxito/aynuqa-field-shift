---
name: Backend endpoint
description: Crear o modificar un endpoint FastAPI del backend de Aynuqa Field Shift respetando contracts/api.md
---

# Crear o modificar un endpoint del backend

## Cuándo usar

Cuando pidan agregar, cambiar o corregir un endpoint de la API en `backend/`.

## Antes de empezar

1. Lee `contracts/api.md` y `contracts/sector_risk.schema.json`: el contrato manda.
2. Lee `backend/README.md` y la sección 10 de `backend/BACKEND_PLAN.md`
   (decisiones pendientes donde el plan y el README difieren).
3. Confirma que estás en la rama `team/back`.

## Pasos

1. Define el request y el response exactamente como el contrato: nombres,
   unidades, `is_simulated` y la confianza como número (`confidence`) y como
   palabra (`confidence_label`).
2. Implementa la ruta en FastAPI.
3. Si el dato viene de ML, léelo de SQLite, nunca del archivo JSON.
4. Si falta un dato, devuelve `null`; no lo inventes.
5. Si el contrato debe cambiar, avísalo antes de tocarlo y actualiza el ejemplo
   o mock correspondiente en `contracts/`.
6. Agrega o actualiza el test del endpoint (ver skill `backend-test`).
7. Actualiza `/health` si cambia la fuente del dato (`mock` o `real`).

## Reglas

- Back no calcula predicciones, anomalías ni correlaciones.
- Las respuestas de `GET` deben ser livianas e incluir la fecha de actualización
  (la PWA las guarda para uso sin señal).
- No cambies `contracts/` por tu cuenta.
- Haz un commit pequeño y descriptivo al terminar.
