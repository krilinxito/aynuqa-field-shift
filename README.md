# Aynuqa Field Shift

Un apoyo a la decisión para que las comunidades andinas adapten su rotación comunal (aynuqa) al cambio climático y a El Niño, con datos de la NASA.

Proyecto para el reto *Field Shift: Adapting Farms with NASA Data* de NASA Space Apps 2026.

## El problema

En el altiplano boliviano, las comunidades rotan sus tierras desde hace siglos con un sistema comunal llamado aynuqa. La comunidad divide su territorio en sectores: cultiva algunos durante unos años y deja descansar otros hasta diez, para que el suelo se recupere.

El sistema funciona porque se adapta, pero hoy enfrenta el cambio climático y un El Niño fuerte que trae sequía al altiplano. Los descansos se acortan, la lluvia llega tarde y cada decisión de la asamblea se vuelve más difícil.

## Qué hace

Para cada sector de la comunidad, el sistema estima dos cosas:

- **Riesgo de sequía** del próximo ciclo.
- **Recuperación del suelo** durante el descanso.

Cada resultado se convierte en una recomendación concreta: qué sector abrir, cuánto alargar el descanso, qué sembrar y cuándo. Toda predicción se muestra con su confianza.

La comunidad lo consulta de tres formas:

- Un panel web con el terreno en 3D y los sectores coloreados por riesgo, con selector de escenario normal o El Niño.
- Un asistente por chat que responde en español simple.
- Un reporte imprimible para la asamblea.

El sistema se valida con el pasado (backtest): si hubiera existido durante El Niño de 2015-16 y 2023-24, ¿habría recomendado distinto que en La Niña de 2020-22?

No reemplaza a la asamblea ni al agrónomo. Les da evidencia para decidir mejor.

## Caso de estudio

Altiplano central de La Paz, comunidad tipo Pumani (Provincia Aroma, cerca de Ayo Ayo, unos 3.900 m). Coordenadas aproximadas: -17.09, -68.0 (por verificar).

## Datos

| Fuente | Qué aporta |
| --- | --- |
| NASA POWER | Temperatura, lluvia, humedad de suelo, radiación |
| MODIS/VIIRS NDVI (AppEEARS) | Vegetación |
| IMERG | Lluvia |
| SMAP L4 | Humedad de suelo (solo desde 2015) |
| NASADEM | Altitud y pendiente |
| ONI (NOAA) | Índice de El Niño |

La historia climática cubre desde 2000 hasta hoy.

## Qué es real y qué es simulado

- **Real:** los datos satelitales y climáticos.
- **Simulado:** los polígonos de los sectores, los años de descanso (según el ciclo publicado de Pumani) y los sensores de campo. Todo dato simulado lleva `is_simulated: true` y se etiqueta en pantalla.
- La recuperación se calcula con NDVI real corregido por lluvia (RESTREND). Su vínculo con los años de descanso es ilustrativo.

## Estructura del repo

```
contracts/   Contrato de datos compartido: schema JSON, endpoints y ejemplos (mock)
backend/     API con FastAPI y SQLite, simulador de sensores y chat
ml/          Ingesta de datos, variables, modelos, backtest y exportación de predicciones
frontend/    Panel web con Vite y Three.js
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
