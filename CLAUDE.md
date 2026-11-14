# Aynuqa Field Shift

Hackathon NASA Space Apps 2026. Apoyo a la decisión para que una comunidad altiplánica (tipo Pumani, altiplano central de La Paz) adapte su rotación comunal (aynuqa) a El Niño y al cambio climático con datos NASA. El sistema estima por sector el riesgo de sequía y la recuperación del suelo, y los convierte en recomendaciones: qué sector abrir, cuánto extender el descanso, qué sembrar y cuándo.

Lee `README.md` y `contracts/` antes de empezar.

## Reglas

- Trabaja solo en la carpeta de tu equipo y en tu rama `team/<equipo>`: `backend/` en `team/back`, `ml/` en `team/ml`, `frontend/` en `team/front`.
- Respeta `contracts/`. Si necesitas cambiarlo, dilo; no lo cambies por tu cuenta.
- No inventes datos satelitales: si falta un dato, devuelve `null`.
- Los polígonos, los años de descanso y los sensores son simulados y deben marcar `is_simulated: true`.
- Muestra siempre la confianza de cada predicción.
- Todo texto para el usuario va en español simple.
- Los secretos van solo en `.env`.
- Es un hackathon de 48 horas: primero que funcione y se vea, luego que sea elegante.
- Haz commits pequeños y frecuentes en tu rama. Los cambios entran a `main` por Pull Requests pequeños.
