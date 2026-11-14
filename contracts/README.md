# contracts/

Contrato de datos compartido entre Back, ML y Front. Es el acuerdo entre los tres equipos: si necesitas cambiarlo, avisa antes de tocarlo.

## Qué va aquí

- `sector_risk.schema.json`: schema JSON de la respuesta por sector (riesgo de sequía, recuperación, recomendación, confianza, `is_simulated`).
- `api.md`: endpoints de la API con request, response y ejemplo de cada uno.
- Ejemplos JSON válidos de cada respuesta, que sirven de mock para Front y Back.
- Un test pequeño que valida los ejemplos con `jsonschema`.

## Endpoints previstos

- `GET /api/sectors?scenario=normal|nino`
- `GET /api/sectors/{id}/history?from=2000-01&to=2026-11`
- `GET /api/sectors/{id}/sensors?hours=48`
- `GET /api/backtest?event=2015-16`
- `POST /api/chat`
- `GET /health`

## Estado

Todavía no hay schema ni ejemplos. Definirlos es el primer PR a `main` y lo hace una sola persona.
