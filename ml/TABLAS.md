# Tablas intermedias de ML

Son la frontera entre las dos mitades del flujo: la parte de datos las produce y la parte de modelos las consume. Si necesitas cambiar una columna, avisa antes a la otra persona.

Todas viven en `ml/data/interim/`, que no se sube a git. Los CSV van en UTF-8, con el dato faltante como celda vacía.

Se generan desde `ml/` con `python prep/build.py` (dependencias en `prep/requirements.txt`). Se puede repetir cuando llegue más NDVI: las zonas que aún no lo tienen quedan con esas columnas vacías.

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

Cada zona tiene 8 sectores cuadrados de 750 m (unas 56 ha y unos 9 píxeles de MODIS), contiguos en 4 columnas y 2 filas, centrados en el punto de `zones.json`. La rotación simulada es un ciclo de 3 años de cultivo y 5 de descanso, desfasado entre sectores.

## 2. `monthly.csv`

Una fila por sector y mes, desde `2000-01`.

| Columna | Unidad | Escala |
| --- | --- | --- |
| `zone_id`, `sector_id`, `date` | | |
| `ndvi` | -1 a 1 | Sector. MODIS Terra y Aqua, píxeles con fiabilidad buena o marginal. Vacío si no hay dato válido |
| `precip_mm` | mm, total del mes | Zona. NASA GPM IMERG V07, celda de 0,1°. Final hasta septiembre de 2025 y, después, Late ajustado con la razón Final/Late de los 24 meses en que existen los dos. Vacío antes de 2000-06 |
| `temp_c` | °C, media del mes | Zona. NASA POWER `T2M` |
| `soil_moisture` | fracción de 0 a 1 | Zona. NASA POWER `GWETROOT` (humedad relativa de la zona de raíces), porque cubre todas las zonas desde 2000. SMAP solo empieza en 2015 |
| `roni` | índice | Global. Temporada de tres meses centrada en ese mes |

Las columnas de zona se repiten idénticas en todos los sectores de la misma zona.

La lluvia es de IMERG y no de NASA POWER porque, comparada con CHIRPS y ERA5 en las 8 zonas, es la que mejor explica el NDVI de Pumani (correlación de 0,84 entre la lluvia de diciembre a marzo y el NDVI de febrero a abril) y la que más se parece a CHIRPS (0,94). NASA POWER usa celdas de unos 50 km, da la misma lluvia a Pumani y Patacamaya y no capta la sequía de 2015-16.

## 3. `features.csv`

Una fila por sector y campaña. Todas las variables se conocen a inicios de octubre del año en que empieza la campaña; el objetivo se observa después.

| Columna | Definición |
| --- | --- |
| `zone_id`, `sector_id`, `season` | |
| `target_ndvi_anom` | Objetivo. Media de la anomalía de NDVI de febrero a abril de esa campaña. Vacío en la campaña en curso |
| `is_prediction_row` | `true` en la campaña en curso (`2026-27`), que es la que se predice |
| `roni_lag_0` ... `roni_lag_6` | RONI de julio-agosto-septiembre (`lag_0`, centrada en agosto) y de las 6 temporadas anteriores. Es la última que NOAA publica a inicios de octubre; la de agosto-septiembre-octubre aún no se conoce |
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
- **Tendencia del NDVI:** antes de calcular la anomalía del NDVI se quita la tendencia lineal entre años de cada sector y mes. El NDVI de Pumani sube desde 2000 y, sin esto, los años recientes parecerían mejores solo por ser recientes. El clima no se corrige.
- **Sin latitud ni longitud:** el modelo no debe usar la ubicación. `zone_id` y `sector_id` son claves, no variables del modelo.

## Provisional

- **Objetivo:** anomalía de NDVI de febrero a abril. La alternativa es el déficit de lluvia de la campaña.
- **Fecha de decisión:** inicios de octubre.- **Cuántos sectores por zona:** por definir. La tabla admite cualquier cantidad.
