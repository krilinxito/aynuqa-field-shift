# Aynuqa Field Shift

Hackathon NASA Space Apps 2026. Apoyo a la decisión para que una comunidad altiplánica (tipo Pumani, altiplano central de La Paz) adapte su rotación comunal (aynuqa) a El Niño y al cambio climático con datos NASA. El sistema estima por sector el riesgo de sequía y la recuperación del suelo, y los convierte en recomendaciones: qué sector abrir, cuánto extender el descanso, qué sembrar y cuándo.

Lee `README.md` y `contracts/` antes de empezar.

## Reglas

- Trabaja solo en la carpeta de tu equipo y en tu rama `team/<equipo>`: `backend/` en `team/back`, `ml/` en `team/ml`, `frontend/` en `team/front`.
- Respeta `contracts/`. Si necesitas cambiarlo, dilo; no lo cambies por tu cuenta.
- No inventes datos satelitales: si falta un dato, devuelve `null`.
- Los polígonos, los años de descanso y los sensores son simulados y deben marcar `is_simulated: true`.
- Muestra siempre la confianza de cada predicción.
- El índice de El Niño es el RONI de NOAA (oficial desde febrero de 2026), no el ONI. El escenario El Niño es el estado real de hoy; el escenario normal es la comparación.
- No afirmes impactos como seguros: El Niño "aumenta la probabilidad de sequía", no "trae sequía".
- Respeta la escala de los datos: lluvia, temperatura y humedad de suelo son iguales para todos los sectores (misma celda de NASA POWER). Solo el NDVI y el terreno distinguen sectores. No presentes diferencias climáticas entre sectores.
- El backtest principal es una serie temporal de la zona. La comparación por sector usa solo NDVI. Si el resultado es modesto, dilo.
- El frontend es una PWA para celulares de gama baja y con mala señal. Diseño minimalista: pocas pantallas, texto grande, solo lo necesario para decidir.
- Todo texto para el usuario va en español simple.
- Los secretos van solo en `.env`.
- Es un hackathon de 48 horas: primero que funcione y se vea, luego que sea elegante.
- Haz commits pequeños y frecuentes en tu rama. Los cambios entran a `main` por Pull Requests pequeños.
