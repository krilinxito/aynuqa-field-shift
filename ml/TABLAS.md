# Tablas intermedias de ML

Son la frontera entre las dos mitades del flujo: la parte de datos las produce y la parte de modelos las consume. Si necesitas cambiar una columna, avisa antes a la otra persona.

Todas viven en `ml/data/interim/`, que no se sube a git. Los CSV van en UTF-8, con el dato faltante como celda vacía.

Varias definiciones de este archivo son provisionales y están marcadas así. Se cierran cuando lleguen los datos reales.

## Claves

- `zone_id`: el `id` de `ml/zones.json` (por ejemplo, `pumani`).
- `sector_id`: `S1`, `S2`, ... dentro de cada zona. La clave única de un sector es `(zone_id, sector_id)`.
- `date`: mes, `YYYY-MM`.
- `season`: campaña agrícola de julio a junio, escrita `2015-16` (julio de 2015 a junio de 2016).

## 1. `sectors.geojson`

Una `Feature` por sector, con el polígono en `[lon, lat]`. Propiedades:

| Propiedad | Tipo | Nota |
| --- | --- | --- |
| `zone_id` | texto | |
| `sector_id` | texto | |
| `display` | booleano | `true` en los 8 sectores de Pumani que muestra la app |
| `area_ha` | número | |
| `elevation_m` | número | De NASADEM |
| `slope_pct` | número | De NASADEM |
| `aspect_deg` | número | De NASADEM, 0 a 360 |
| `rotation_status` | `resting` o `cultivated` | Simulado |
| `rotation_years` | entero | Años en ese estado. Simulado |
| `is_simulated` | `true` | Los límites y la rotación son simulados |

## 2. `monthly.csv`

Una fila por sector y mes, desde `2000-01`.

| Columna | Unidad | Escala |
| --- | --- | --- |
| `zone_id`, `sector_id`, `date` | | |
| `ndvi` | -1 a 1 | Sector. Vacío si no hay dato válido |
| `precip_mm` | mm, total del mes | Zona |
| `temp_c` | °C, media del mes | Zona |
| `soil_moisture` | fracción de 0 a 1 | Zona |
| `roni` | índice | Global. Temporada de tres meses centrada en ese mes |

Las columnas de zona se repiten idénticas en todos los sectores de la misma zona.

## 3. `features.csv`

Una fila por sector y campaña. Todas las variables se conocen el 1 de octubre del año en que empieza la campaña; el objetivo se observa después.

| Columna | Definición |
| --- | --- |
| `zone_id`, `sector_id`, `season` | |
| `target_ndvi_anom` | Objetivo. Media de la anomalía de NDVI de febrero a abril de esa campaña. Vacío en la campaña en curso |
| `is_prediction_row` | `true` en la campaña en curso (`2026-27`), que es la que se predice |
| `roni_lag_0` ... `roni_lag_6` | RONI de septiembre (`lag_0`) y de los 6 meses anteriores |
| `precip_anom_3m` | Anomalía de la lluvia de julio a septiembre |
| `precip_anom_12m` | Anomalía de la lluvia de octubre a septiembre |
| `temp_anom_3m` | Anomalía de la temperatura de julio a septiembre |
| `soil_moisture_anom` | Anomalía de la humedad de suelo de septiembre |
| `ndvi_anom_prev_peak` | Anomalía de NDVI de febrero a abril de la campaña anterior |
| `ndvi_anom_sep` | Anomalía de NDVI de septiembre |
| `elevation_m`, `slope_pct` | |
| `aspect_sin`, `aspect_cos` | Seno y coseno de la orientación |
| `rotation_years` | Simulado |

- **Anomalía:** desviaciones estándar respecto al mismo mes (o al mismo periodo) en todos los años desde 2000, calculada por sector para el NDVI y por zona para el clima.
- **Sin latitud ni longitud:** el modelo no debe usar la ubicación. `zone_id` y `sector_id` son claves, no variables del modelo.

## Provisional

- **Objetivo:** anomalía de NDVI de febrero a abril. La alternativa es el déficit de lluvia de la campaña.
- **Fecha de decisión:** 1 de octubre.
- **Cuántos sectores por zona:** por definir. La tabla admite cualquier cantidad.
