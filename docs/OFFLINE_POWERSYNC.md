# Modo sin señal con PowerSync

## Objetivo

La aplicación conserva en el celular la última información recibida para que una persona comunaria pueda consultar sectores, recomendaciones, clima, historial, sensores y backtest aunque pierda la señal o vuelva a abrir la PWA. El chat no se guarda porque necesita una respuesta nueva del backend.

## Flujo de datos

```text
ML / contratos -> FastAPI -> PostgreSQL -> PowerSync -> SQLite (OPFS, celular) -> React
                                  |                          |
                                  +---- API HTTP inicial ----+
```

- `backend` valida y guarda instantáneas JSON en `offline_snapshots`.
- `powersync/sync-config.yaml` define un Sync Stream global, de solo lectura, para esa tabla.
- PowerSync replica los cambios de PostgreSQL.
- `@powersync/web` guarda la réplica en SQLite WASM. En navegadores compatibles utiliza OPFS; si no existe, el SDK aplica su alternativa automática.
- El repositorio del frontend consulta SQLite primero y usa la API como arranque inicial si la primera sincronización todavía no terminó.
- El encabezado avisa cuando no hay señal, muestra la fecha de la última sincronización y conserva los últimos datos válidos si una actualización falla.

## Levantar el stack local

Requisitos: Docker Desktop, Node.js 22.12+ y npm.

1. Copie `.env.example` a `.env` y cambie las claves locales si el equipo quedará expuesto en una red.
2. Ejecute desde la raíz:

   ```powershell
   docker compose up --build -d
   docker compose ps
   ```

3. Configure el frontend en `frontend/.env`:

   ```env
   VITE_DATA_MODE=api
   VITE_API_BASE_URL=http://localhost:8000
   VITE_POWERSYNC_ENABLED=true
   VITE_DEMO_DATA=false
   ```

4. Inicie la PWA:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

Servicios locales:

| Servicio | Dirección |
| --- | --- |
| FastAPI | `http://localhost:8000` |
| Swagger | `http://localhost:8000/docs` |
| PowerSync | `http://localhost:8080` |
| PostgreSQL origen | `localhost:5432` |

## Prueba manual sin señal

1. Abra la app con señal y espere a que desaparezca “Actualizando datos guardados”.
2. En DevTools, Application > Storage, compruebe el almacenamiento OPFS.
3. Active Offline en Network o apague la conexión.
4. Recargue `/mi-comunidad`: deben aparecer los sectores guardados.
5. El encabezado debe decir “Sin señal” y mostrar la última conexión con datos.
6. `/preguntar` debe seguir avisando que el chat necesita señal.

## Seguridad y producción

- Los JWT de desarrollo se firman con una clave efímera creada al iniciar FastAPI. En producción se debe cargar una clave estable desde un gestor de secretos para evitar invalidar sesiones al reiniciar.
- Cambie `ADMIN_TOKEN`, `POWERSYNC_ADMIN_TOKEN` y las contraseñas de PostgreSQL.
- Publique FastAPI y PowerSync con HTTPS. `POWERSYNC_PUBLIC_URL` debe ser una dirección accesible desde los celulares, no un nombre interno de Docker.
- Restrinja `CORS_ORIGINS` al dominio real.
- Las instantáneas actuales son públicas para todas las comunidades. Cuando existan cuentas, agregue `community_id` y filtre el stream con el sujeto del JWT.

## Operación

- Cambios en `powersync/sync-config.yaml` requieren `docker compose restart powersync`.
- `POST /api/admin/reload`, con `X-Admin-Token`, vuelve a validar y cargar las instantáneas.
- Los volúmenes `aynuqa_postgres` y `powersync_storage` conservan datos al detener contenedores. No use `docker compose down -v` salvo que quiera borrar las bases locales.
