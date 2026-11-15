# Archivos de ML para Back

ML los genera con `python -m ml.run predict --input ml/data/interim` en `ml/outputs/`, en JSON con UTF-8. Back los carga en SQLite al iniciar y con `POST /api/admin/reload`.

Hay un juego completo de ejemplo en `contracts/examples/ml_outputs/`. Back lo sirve mientras ML no entregue los archivos reales.

| Archivo | Forma | Se valida con |
| --- | --- | --- |
| `predictions.json` | `{generated_at, scenarios: {normal, nino}}`. Cada escenario es la respuesta completa de `GET /api/sectors` | `sector_risk.schema.json` |
| `history.json` | `{generated_at, data_source, from, to, sectors: {S1: [...], ...}}`. Cada lista es la `series` de `GET /api/sectors/{id}/history` | `history.schema.json` |
| `backtest_<evento>.json` | La respuesta completa de `GET /api/backtest`. Eventos: `2015-16`, `2023-24`, `2020-22` | `backtest.schema.json` |
| `analogs.json` | `{generated_at, data_source, precedents: [...]}`. Un precedente por sector y por evento de El Niño | `twin_precedent.schema.json` |

## Reglas

- `history.json` trae la serie completa de cada sector, con el clima de la zona repetido. Back no hace ningún join.
- En los archivos reales, `data_source` es `real`.
- `get_twin_precedent(sector_id, scenario)` devuelve, para `nino`, el precedente con mayor `similarity` de ese sector. Para `normal` no hay precedente.
- Un dato satelital faltante va como `null`.
