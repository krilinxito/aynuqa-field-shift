# ml/

Equipo ML / Datos. Rama: `team/ml`.

Ingesta de datos, variables, modelos y exportación de resultados según `contracts/`. Python, pandas, LightGBM y SHAP.

## Carpetas

- `data/`: datos descargados. Ignorada en git.
- `outputs/`: archivos que consume Back. Se suben a git.
- `reports/`: figuras y resultados del backtest.

## Escala: qué es de zona y qué es de sector

Los 8 a 10 sectores de Pumani caben en pocos kilómetros y caen en la misma celda de NASA POWER (0,5°, unos 50 km) y, casi siempre, en la misma de SMAP L4 (9 km).

- **Variables de zona** (un solo valor para todos los sectores de una zona): lluvia, temperatura, humedad de suelo, radiación y RONI. Se descargan una vez por zona, no por sector.
- **Variables de sector:** NDVI (250 m), altitud, pendiente y orientación (NASADEM, 30 m) y años de descanso (simulados).

El riesgo de sequía es sobre todo una señal de zona; la diferencia entre sectores viene del NDVI y del terreno. No presentes diferencias de lluvia o temperatura entre sectores de una misma zona.

## Índice de El Niño

- Usa el **RONI** de NOAA, oficial desde febrero de 2026: `https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt`.
- El ONI clásico (`oni.ascii.txt`) sigue actualizándose y sirve solo como referencia. Los dos archivos se verificaron el 14 de noviembre de 2026; el último valor (agosto-octubre de 2026) es RONI +1,97 y ONI +2,46.
- El escenario El Niño usa el RONI observado: es el estado real de hoy, no una hipótesis. El escenario normal (RONI cercano a 0) es la comparación.

## Entrenamiento multi-zona (tierras gemelas)

Una sola comunidad da muy pocas muestras: todos sus sectores comparten el mismo clima. Para que el modelo aprenda de más de una historia climática, se entrena con Pumani y con 6 a 8 zonas agrícolas análogas del altiplano.

Criterios para elegir las zonas:

- Altitud parecida, régimen semiárido y rotación comunal similar.
- **Celdas distintas de NASA POWER.** Una zona en la misma celda que Pumani aporta sectores (NDVI y terreno) pero no una historia de clima nueva.
- Verificar la altitud real con NASADEM antes de fijar la lista.

Candidatas: Patacamaya, Ayo Ayo, Jesús de Machaca y Toledo. Dos avisos:

- Pumani está cerca de Ayo Ayo, y Patacamaya queda a pocos kilómetros: es probable que las tres compartan celda de NASA POWER. Sirven para NDVI y terreno, no como clima independiente.
- Toledo (cerca de 3.700 m) y Patacamaya (cerca de 3.790 m) parecen quedar por debajo del rango de 3.800 a 4.100 m. Si NASADEM lo confirma, hay que ampliar el rango a 3.700 m o cambiar de zona.

Variables del modelo:

- De sector: `elevation`, `slope`, `aspect`, `ndvi_restrend`, NDVI previo y años de descanso.
- De zona: anomalías de lluvia, temperatura y humedad de suelo, y `roni_lag_0` a `roni_lag_6`.
- **Sin latitud ni longitud.** El modelo aprende de las condiciones físicas y climáticas, no de la ubicación, para poder aplicarse a otro territorio análogo.

Fuera del modelo, y por qué:

- `tipo_cultivo`: no hay ninguna fuente real de cultivo por parcela.
- `smap_downscaled`: el plan no define un método para bajar SMAP de 9 km a escala de sector. La humedad de suelo se usa a su resolución real, como dato de zona. NASA POWER (`GWETROOT`) es la base porque cubre desde 2000; SMAP solo existe desde 2015 y queda como deseable.

Los polígonos de las zonas análogas son simulados, igual que los de Pumani: lo real es lo que el satélite midió dentro de ellos.

## Precedentes en tierras gemelas

Para cada sector de Pumani se busca el sector más parecido de otra zona y se informa cómo respondió su vegetación en un El Niño pasado.

- **Similitud:** k-NN o distancia coseno sobre vectores normalizados de altitud, pendiente, orientación, humedad de suelo base y NDVI medio. No hay datos de suelo en el plan, así que "suelo" es la humedad base.
- **Eventos:** El Niño 2015-16 y 2023-24, identificados por el RONI.
- **Qué se informa:** la anomalía de NDVI observada en la tierra gemela durante el evento. Es un dato real.
- **Qué no se informa:** cultivo de mejor desempeño ni porcentaje de pérdida. Se buscaron datos reales de rendimiento por zona y no existen a esa escala: solo hay cifras nacionales o departamentales, y las fuentes no coinciden entre sí. Si el equipo consigue la Encuesta Agropecuaria 2015 del INE por municipio, se puede agregar.
- **Precedente local primero:** Pumani también vivió 2015-16 y 2023-24. El precedente de la tierra gemela complementa al local, no lo reemplaza.

## Archivos que ML entrega a Back

Todos en `ml/outputs/`, en JSON con UTF-8. `make predict` los genera todos. Back no calcula nada: solo los carga.

| Archivo | Contenido |
| --- | --- |
| `predictions.json` | Predicciones por sector para los escenarios `normal` y `nino`, según `contracts/sector_risk.schema.json` |
| `history.json` | Serie mensual desde 2000: clima y RONI de la zona, y NDVI por sector |
| `backtest_2015-16.json`, `backtest_2023-24.json` | Resultado del backtest de cada evento, con sus métricas ya calculadas |
| `analogs.json` | Para cada sector y evento: tierra gemela, similitud y anomalía de NDVI observada |

El formato exacto de cada archivo se define en `contracts/`.

## Alcance

Imprescindible:

- 8 a 10 sectores simulados (polígonos) cerca de lat -17.09, lon -68.0, con altitud y pendiente de NASADEM y años de descanso según el ciclo publicado de Pumani (3 años de cultivo, unos 10 de descanso).
- Sectores simulados en 6 a 8 zonas análogas, con los mismos datos.
- Descarga histórica de 2000 a hoy: NASA POWER por zona (`T2M`, `PRECTOTCORR`, `GWETROOT`, `ALLSKY_SFC_SW_DWN`), NDVI MODIS por sector vía AppEEARS e IMERG (opcional).
- RONI de NOAA y variables con retrasos de 0 a 6 meses.
- Tabla de variables por sector y temporada, separando las de zona y las de sector.
- Modelo de riesgo de sequía: LightGBM con cuantiles, salida 0-1 con intervalo, entrenado con todas las zonas.
- Modelo de recuperación: NDVI corregido por lluvia (RESTREND).
- Escenarios: El Niño (RONI observado) frente a normal.
- Índice de tierras gemelas y precedentes (`analogs.json`).
- Backtest (ver abajo).
- Importancia de variables con SHAP que muestre el peso del RONI.
- Exportación a `ml/outputs/` con un solo comando: `make predict`.

Deseable: SMAP L4 desde 2015; DAG de Airflow con tres tareas (ingesta, variables, predicción) o cron; reglas que convierten riesgo y recuperación en la recomendación (`action`, `text`, `reasons`).

Si sobra tiempo: HLS 30 m, ECOSTRESS.

## Backtest

- **Principal:** serie temporal por zona. El Niño 2015-16 y 2023-24 frente a La Niña 2020-22, con una figura en `reports/`.
- **Sin fuga de datos:** al evaluar un evento, ese evento queda fuera del entrenamiento en todas las zonas. Si no, el modelo ya vio la respuesta.
- **Transferencia:** evaluar también dejando una zona completa fuera. Es la única evidencia de que el modelo sirve en un territorio que no vio.
- **Secundario:** comparación por sector, solo con NDVI. Un Spearman sobre 8 a 10 puntos puede salir débil o engañoso: repórtalo con esa advertencia.

## Honestidad de los resultados

- Si el backtest sale modesto, se reporta tal cual y se dice en el pitch.
- El Niño aumenta la probabilidad de sequía; no la garantiza. Ningún texto exportado debe afirmar el impacto como seguro.
- El modelo se puede aplicar a territorios análogos del altiplano. No se afirma que funcione en cualquier lugar del mundo.

## Real y simulado

- Real: datos satelitales y climáticos, incluida la anomalía de NDVI de las tierras gemelas.
- Simulado: polígonos de los sectores (en Pumani y en las zonas análogas) y años de descanso.
- Limitación: SMAP solo existe desde 2015.

## Dependencias

`requirements.txt` con un entorno virtual (`python -m venv .venv`). Python 3.11 o superior.

## Cómo correr

Pendiente: se documenta cuando exista el pipeline.
