# Aynuqa Field Shift

Un apoyo a la decisión para que las comunidades andinas adapten su rotación comunal (aynuqa) al cambio climático y a El Niño, con datos de la NASA.

Proyecto para el reto *Field Shift: Adapting Farms with NASA Data* de NASA Space Apps 2026.

## El problema

En el altiplano boliviano, las comunidades rotan sus tierras desde hace siglos con un sistema comunal llamado aynuqa. La comunidad divide su territorio en sectores: cultiva algunos durante unos años y deja descansar otros hasta diez, para que el suelo se recupere.

El sistema funciona porque se adapta, pero hoy enfrenta el cambio climático y un El Niño fuerte que aumenta la probabilidad de sequía en el altiplano. Los descansos se acortan, la lluvia llega tarde y cada decisión de la asamblea se vuelve más difícil.

El Niño no es una hipótesis: el índice relativo de NOAA (RONI) marcó +1,97 en agosto-octubre de 2026. Con un evento de esta magnitud los impactos típicos son más probables, pero no están garantizados, y así lo decimos.

## Qué hace

Para cada sector de la comunidad, el sistema estima dos cosas:

- **Riesgo de sequía** del próximo ciclo.
- **Recuperación del suelo** durante el descanso.

Cada resultado se convierte en una recomendación concreta: qué sector abrir, cuánto alargar el descanso, qué sembrar y cuándo. Toda predicción se muestra con su confianza.

La comunidad lo usa desde el celular, como una app instalable (PWA) que sigue mostrando los últimos datos cuando no hay señal. La interfaz es minimalista: pocas pantallas, texto grande y solo lo necesario para decidir. Ofrece tres cosas:

- El terreno en 3D con los sectores coloreados por riesgo, y un selector entre el escenario El Niño (el estado real de hoy) y un año normal como comparación.
- Un asistente por chat que responde en español simple.
- Un reporte imprimible para la asamblea.

El sistema se valida con el pasado (backtest): compara cómo se comportó la zona durante El Niño de 2015-16 y 2023-24 frente a La Niña de 2020-22. Si el resultado es modesto, se dice.

No reemplaza a la asamblea ni al agrónomo. Les da evidencia para decidir mejor.

## Caso de estudio

Altiplano central de La Paz, comunidad tipo Pumani (Provincia Aroma, cerca de Ayo Ayo, unos 3.900 m). Coordenadas aproximadas: -17.09, -68.0 (por verificar).

## Datos

| Fuente | Qué aporta | Resolución aproximada |
| --- | --- | --- |
| NASA POWER | Temperatura, lluvia, humedad de suelo, radiación | 0,5° (unos 50 km) |
| IMERG | Lluvia | 0,1° (unos 10 km) |
| SMAP L4 | Humedad de suelo (solo desde 2015) | 9 km |
| MODIS/VIIRS NDVI (AppEEARS) | Vegetación | 250 m |
| NASADEM | Altitud y pendiente | 30 m |
| RONI (NOAA) | Índice relativo de El Niño | Global |

La historia climática cubre desde 2000 hasta hoy.

Desde febrero de 2026 NOAA usa el índice relativo (RONI) como índice oficial de El Niño, y es el que usa el modelo. El ONI clásico sigue publicándose y queda solo como referencia.

## Escala de los datos

Los sectores de una comunidad caben en pocos kilómetros, así que todos caen en la misma celda de NASA POWER y, casi siempre, en la misma de SMAP. Esto define qué puede decir el sistema:

- **A escala de zona:** lluvia, temperatura, humedad de suelo y El Niño. Son iguales para todos los sectores, y el riesgo de sequía es sobre todo una señal de la zona.
- **A escala de sector:** vegetación (NDVI) y terreno (altitud y pendiente). Es lo único que distingue un sector de otro.

Por eso el backtest principal es una serie temporal de la zona. La comparación entre sectores se hace solo con NDVI y se presenta como evidencia secundaria.

## Qué es real y qué es simulado

- **Real:** los datos satelitales y climáticos.
- **Simulado:** los polígonos de los sectores, los años de descanso (según el ciclo publicado de Pumani) y los sensores de campo. Todo dato simulado lleva `is_simulated: true` y se etiqueta en pantalla.
- La recuperación se calcula con NDVI real corregido por lluvia (RESTREND). Su vínculo con los años de descanso es ilustrativo.

## Estructura del repo

```
contracts/   Contrato de datos compartido: schema JSON, endpoints y ejemplos (mock)
backend/     API con FastAPI y SQLite, simulador de sensores y chat
ml/          Ingesta de datos, variables, modelos, backtest y exportación de predicciones
frontend/    App web instalable (PWA) con Vite y Three.js
docs/        Guion del demo, documentación de datos NASA y declaración de uso de IA
```

Cada carpeta tiene su propio README con el alcance del equipo.

## Cómo trabajamos

| Rama | Equipo | Carpeta |
| --- | --- | --- |
| `team/back` | Back | `backend/` |
| `team/ml` | ML / Datos | `ml/` |
| `team/front` | Front | `frontend/` |

- Cada equipo trabaja solo en su carpeta y en su rama.
- Los cambios entran a `main` por Pull Requests pequeños.
- `contracts/` es el acuerdo entre los tres equipos. Si necesitas cambiarlo, avisa al equipo antes de tocarlo.
- Front y Back empiezan con los ejemplos de `contracts/` (mock) y luego pasan a los datos reales.
- Los secretos van solo en `.env`, nunca en el repo.

Las reglas completas para trabajar con Claude Code están en `CLAUDE.md`.

## Estado

Repo recién creado: solo contiene la estructura inicial. El primer paso es definir el contrato de datos en `contracts/`.
