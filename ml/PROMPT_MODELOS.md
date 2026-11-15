# Prompt para la parte de modelos y entrega

Copia todo lo que está debajo de la línea y pégalo a tu agente.

---

Estás en el repo aynuqa-field-shift, en la rama `team/ml`. Haz `git pull` antes de empezar.

Lee primero, en este orden: `CLAUDE.md`, `ml/README.md`, `ml/TABLAS.md`, `contracts/README.md`, `contracts/api.md` y `contracts/ml_outputs.md`.

## Contexto

Proyecto de hackathon (NASA Space Apps 2026): apoyo a la decisión para que una comunidad del altiplano boliviano adapte su rotación comunal (aynuqa) a El Niño. Por cada sector estimamos el riesgo de sequía y la recuperación del suelo, y lo convertimos en una recomendación.

En ML somos dos. Mi compañero hace la parte de datos: ingesta, limpieza y las tablas de `ml/TABLAS.md`. Yo hago la parte de modelos y entrega, que es la tuya. Las tablas reales ya están en `ml/data/interim/`, pero por ahora solo Pumani tiene NDVI; el de las zonas análogas se está descargando. Por eso vas a desarrollar con tablas de prueba y a probar con las reales cuando estén completas.

Lo que ya sabemos de los datos reales, para que no te sorprenda:

- El NDVI de febrero a abril depende mucho de la lluvia de diciembre a marzo (correlación de 0,84 en Pumani).
- La relación entre El Niño y la lluvia es débil y varía por año: correlación de -0,0 a -0,3 según la zona, más fuerte hacia el sur. 2015-16 y 2023-24 fueron algo secos en IMERG, pero no todos los años con RONI alto lo fueron.
- Por eso es probable que el modelo apenas supere las bases de comparación y que los escenarios `nino` y `normal` se diferencien poco. Si pasa, repórtalo así; no fuerces el resultado.

## Tu alcance

Trabaja solo en estas carpetas:

- `ml/models/`: entrenamiento, validación, recuperación y tierras gemelas.
- `ml/export/`: reglas de recomendación y exportación a JSON.
- `ml/tests/`: tests de lo anterior.
- `ml/requirements.txt`.

No toques `ml/ingest/`, `ml/prep/`, `ml/zones.json`, `ml/TABLAS.md` ni `contracts/`. Si necesitas un cambio en las tablas o en el contrato, dímelo y no lo cambies tú.

## Entradas

Las tres tablas de `ml/TABLAS.md`, en `ml/data/interim/`. Como aún no existen:

1. Crea un script que genere tablas de prueba con exactamente ese formato en `ml/data/fake/`: 3 zonas, 13 sectores por zona, meses desde 2000-01.
2. Todos tus scripts reciben la carpeta de entrada como argumento, para cambiar de `fake` a `interim` sin tocar el código.
3. Con tablas de prueba, exporta a `ml/outputs_fake/` (agrégala al `.gitignore`), nunca a `ml/outputs/`. `ml/outputs/` es solo para resultados de datos reales.

Las tablas de prueba solo sirven para comprobar que el código corre. No ajustes parámetros del modelo ni saques conclusiones con ellas.

## Qué construir

### 1. Modelo de riesgo de sequía

- Una fila por sector y campaña (`features.csv`). Objetivo: `target_ndvi_anom`.
- LightGBM con regresión por cuantiles (0,1; 0,5; 0,9).
- Variables: todas las columnas de `features.csv` menos las claves, el objetivo e `is_prediction_row`. Nunca latitud, longitud, `zone_id` ni `sector_id`.
- Modelo pequeño y muy regularizado: aunque haya muchas filas, el clima independiente son pocas celdas por 26 campañas (la lluvia viene de 8 celdas de IMERG; la temperatura y la humedad, de 6 celdas de NASA POWER), y las zonas vecinas se parecen mucho entre sí.
- Puntaje de riesgo (0 a 1): probabilidad de que la anomalía de la campaña sea menor que -0,5, estimada a partir de los cuantiles. Este umbral es provisional.
- Intervalo y confianza: usa la dispersión del puntaje entre los modelos de la validación cruzada. Confianza alta cuando el intervalo es estrecho.
- Escenarios: `nino` usa el RONI observado; `normal` pone `roni_lag_0` a `roni_lag_6` en 0 y deja lo demás igual.
- `drivers`: las 3 variables con mayor peso SHAP para ese sector, con una etiqueta en español simple.

### 2. Validación y backtest

- Validación dejando fuera una campaña completa (todas las zonas a la vez). Al evaluar un evento, ese evento no puede estar en el entrenamiento.
- Validación aparte dejando fuera una zona completa.
- Dos bases de comparación: predecir siempre 0, y una regresión lineal solo con `roni_lag_0`. Reporta si LightGBM las supera o no.
- Backtest de El Niño 2015-16 y 2023-24 y de La Niña 2020-22, con las predicciones de la validación. El resultado principal es la serie de la zona; la parte por sector es secundaria y lleva una advertencia, porque con 13 sectores la correlación no es confiable.
- Importancia global con SHAP y una figura en `<carpeta de salida>/reports/` que muestre el peso del RONI.
- Si un resultado es modesto, repórtalo tal cual.

### 3. Recuperación del suelo (RESTREND)

- Por sector, ajusta el NDVI de febrero a abril de cada campaña contra la lluvia de octubre a marzo.
- El residuo es lo que la lluvia no explica. `ndvi_residual` es el residuo medio de las últimas campañas (las de descanso si el sector está en descanso, las últimas 3 si no).
- `score`: posición de ese residuo entre todos los sectores, de 0 a 1.
- La relación con los años de descanso es ilustrativa, porque la rotación es simulada. Decláralo.

### 4. Tierras gemelas

- Vector por sector: altitud, pendiente, seno y coseno de la orientación, humedad de suelo media y NDVI medio, estandarizados.
- Para cada sector de Pumani, el sector más parecido de otra zona.
- Precedente: la anomalía de NDVI observada en ese sector gemelo en 2015-16 y en 2023-24.
- No incluyas cultivo ni porcentaje de pérdida: no hay datos reales.

### 5. Reglas de recomendación

Reglas fijas, no un modelo. Entradas: nivel de riesgo, nivel de recuperación, estado y años de rotación. Salida según `contracts/sector_risk.schema.json`: `action` (`open`, `extend_rest`, `start_rest`, `keep_cultivating`), `text`, `reasons` y los campos opcionales. Texto en español simple. Nunca afirmes que habrá sequía: El Niño "aumenta la probabilidad".

### 6. Exportación

- Genera los archivos de `contracts/ml_outputs.md`: `predictions.json`, `history.json`, `backtest_2015-16.json`, `backtest_2023-24.json`, `backtest_2020-22.json` y `analogs.json`.
- Incluye solo los sectores de Pumani con `display: true`.
- Valida cada archivo con `jsonschema` contra los schemas de `contracts/` antes de guardarlo. Si no cumple, falla sin sobrescribir el archivo anterior.
- Niveles y etiquetas de confianza según los umbrales de `contracts/api.md`.
- `data_source` es `real` solo cuando la entrada es `ml/data/interim/`.

### 7. Un solo comando

Un comando que corra entrenamiento, validación y exportación en orden, por ejemplo `python -m ml.run predict --input data/interim`. Usa Python y no `make` como único camino: en Windows `make` no está instalado. Puedes agregar además un `Makefile` con `make predict` que llame a ese comando.

## Reglas

- Python 3.11 o superior, `requirements.txt` y entorno virtual.
- Si falta un dato, va `null`. No inventes valores.
- Commits pequeños y frecuentes en `team/ml`, con `git pull` antes de cada push. No hagas commit de `ml/data/`, `ml/outputs_fake/` ni `ml/.env`.
- Tests con `pytest` para las reglas, la exportación y la validación contra el contrato.

Primero propón un plan corto con criterios de aceptación y luego empieza sin esperar confirmación. Al final dime qué decidiste y qué quedó pendiente de los datos reales.
