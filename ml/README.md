# ml/

Equipo ML / Datos. Rama: `team/ml`.

Ingesta de datos, variables, modelos y exportación de predicciones según `contracts/`. Python, pandas, LightGBM y SHAP.

## Carpetas

- `data/`: datos descargados. Ignorada en git.
- `reports/`: figuras y resultados del backtest.

## Escala: qué es de zona y qué es de sector

Los 8 a 10 sectores caben en pocos kilómetros y caen en la misma celda de NASA POWER (0,5°, unos 50 km) y, casi siempre, en la misma de SMAP L4 (9 km).

- **Variables de zona** (un solo valor para todos los sectores): lluvia, temperatura, humedad de suelo, radiación y RONI. Se descargan una vez para la zona, no por sector.
- **Variables de sector:** NDVI (250 m), altitud y pendiente (NASADEM, 30 m) y años de descanso (simulados).

El riesgo de sequía es sobre todo una señal de zona; la diferencia entre sectores viene del NDVI y del terreno. No presentes diferencias de lluvia o temperatura entre sectores.

## Índice de El Niño

- Usa el **RONI** de NOAA, oficial desde febrero de 2026: `https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt`.
- El ONI clásico (`oni.ascii.txt`) sigue actualizándose y sirve solo como referencia. Los dos archivos se verificaron el 14 de noviembre de 2026; el último valor (agosto-octubre de 2026) es RONI +1,97 y ONI +2,46.
- El escenario El Niño usa el RONI observado: es el estado real de hoy, no una hipótesis. El escenario normal (RONI cercano a 0) es la comparación.

## Alcance

Imprescindible:

- 8 a 10 sectores simulados (polígonos) cerca de lat -17.09, lon -68.0, con altitud y pendiente de NASADEM y años de descanso según el ciclo publicado de Pumani (3 años de cultivo, unos 10 de descanso).
- Descarga histórica de 2000 a hoy: NASA POWER para la zona (`T2M`, `PRECTOTCORR`, `GWETROOT`, `ALLSKY_SFC_SW_DWN`), NDVI MODIS por sector vía AppEEARS e IMERG (opcional).
- RONI de NOAA y variables con retrasos de 0 a 6 meses.
- Tabla de variables por sector y temporada, separando las de zona y las de sector.
- Modelo de riesgo de sequía: LightGBM con cuantiles, salida 0-1 con intervalo.
- Modelo de recuperación: NDVI corregido por lluvia (RESTREND).
- Escenarios: El Niño (RONI observado) frente a normal.
- Backtest principal como serie temporal de la zona: El Niño 2015-16 y 2023-24 frente a La Niña 2020-22, con una figura en `reports/`.
- Backtest secundario por sector, solo con NDVI. Un Spearman sobre 8 a 10 puntos puede salir débil o engañoso: repórtalo con esa advertencia.
- Importancia de variables con SHAP que muestre el peso del RONI.
- Exportación de predicciones según el schema con un solo comando: `make predict`.

Deseable: DAG de Airflow con tres tareas (ingesta, variables, predicción) o cron; reglas que convierten riesgo y recuperación en la recomendación (`action`, `text`, `reasons`).

Si sobra tiempo: HLS 30 m, ECOSTRESS.

## Honestidad de los resultados

- Si el backtest sale modesto, se reporta tal cual y se dice en el pitch.
- El Niño aumenta la probabilidad de sequía; no la garantiza. Ningún texto exportado debe afirmar el impacto como seguro.

## Real y simulado

- Real: datos satelitales y climáticos.
- Simulado: polígonos de los sectores y años de descanso.
- Limitación: SMAP solo existe desde 2015.

## Cómo correr

Pendiente: se documenta cuando exista el pipeline.
