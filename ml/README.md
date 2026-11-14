# ml/

Equipo ML / Datos. Rama: `team/ml`.

Ingesta de datos, variables, modelos y exportación de predicciones según `contracts/`. Python, pandas, LightGBM y SHAP.

## Carpetas

- `data/`: datos descargados. Ignorada en git.
- `reports/`: figuras y resultados del backtest.

## Alcance

Imprescindible:

- 8 a 10 sectores simulados (polígonos) cerca de lat -17.09, lon -68.0, con altitud y pendiente de NASADEM y años de descanso según el ciclo publicado de Pumani (3 años de cultivo, unos 10 de descanso).
- Descarga histórica de 2000 a hoy: NASA POWER (`T2M`, `PRECTOTCORR`, `GWETROOT`, `ALLSKY_SFC_SW_DWN`), NDVI MODIS vía AppEEARS e IMERG (opcional).
- ONI de NOAA y variables con retrasos de 0 a 6 meses.
- Tabla de variables por sector y temporada.
- Modelo de riesgo de sequía: LightGBM con cuantiles, salida 0-1 con intervalo.
- Modelo de recuperación: NDVI corregido por lluvia (RESTREND).
- Escenario El Niño: ONI alto (+1.5 a +2) comparado con el escenario normal.
- Backtest de El Niño 2015-16 y 2023-24 frente a La Niña 2020-22, con correlación de Spearman y una figura en `reports/`.
- Importancia de variables con SHAP que muestre el peso del ONI.
- Exportación de predicciones según el schema con un solo comando: `make predict`.

Deseable: DAG de Airflow con tres tareas (ingesta, variables, predicción) o cron; reglas que convierten riesgo y recuperación en la recomendación (`action`, `text`, `reasons`).

Si sobra tiempo: HLS 30 m, ECOSTRESS.

## Real y simulado

- Real: datos satelitales y climáticos.
- Simulado: polígonos de los sectores y años de descanso.
- Limitación: SMAP solo existe desde 2015.

## Cómo correr

Pendiente: se documenta cuando exista el pipeline.
