# contracts/

Contrato de datos compartido entre Back, ML y Front. Es el acuerdo entre los tres equipos: si necesitas cambiarlo, avisa antes de tocarlo.

## Qué hay

- `api.md`: endpoints, convenciones, unidades y errores.
- `ml_outputs.md`: archivos que ML entrega a Back.
- `*.schema.json`: un schema JSON por respuesta.
- `examples/api/`: un ejemplo por endpoint. Front los usa como mock.
- `examples/ml_outputs/`: un juego completo de archivos de ML de ejemplo. Back los sirve hasta que lleguen los reales.
- `tests/`: valida todos los ejemplos contra sus schemas.

Los ejemplos son datos inventados para desarrollar, con 13 sectores simulados alrededor del pueblo de Pomani (Pumani), municipio de Ayo Ayo (lat -17.1344, lon -68.0692), con el ciclo documentado de 3 años de cultivo y 10 de descanso. Llevan `"data_source": "mock"`. El único dato real que contienen es el RONI de NOAA.

## Cómo validar

Desde la raíz del repo:

```
pip install -r contracts/requirements.txt
pytest contracts
```

## Decisiones del contrato

- El índice de El Niño es el RONI de NOAA: el campo es `roni`.
- `scenario=nino` es el estado real de hoy; `scenario=normal` es la comparación.
- El clima va en `zone`, una sola vez, porque es igual para todos los sectores. Por sector van el NDVI, el terreno, la rotación, el riesgo, la recuperación y la recomendación.
- `soil_moisture` es una fracción de 0 a 1 en el clima y en el histórico. En los sensores el campo se llama `soil_moisture_pct` y es un porcentaje.
- El backtest pone primero la serie temporal de la zona. La parte por sector es secundaria y solo usa NDVI.
- El precedente de tierra gemela informa la anomalía de NDVI observada. No lleva cultivo ni porcentaje de pérdida.
- La confianza va como número y como palabra (`baja`, `media`, `alta`).
- El chat es stateless.
- Los schemas no admiten campos extra: un campo nuevo es un cambio de contrato.

El precedente de tierra gemela está definido en `twin_precedent.schema.json` y repetido dentro de `sector_risk.schema.json`. Si cambias uno, cambia el otro; el test falla si quedan distintos.
