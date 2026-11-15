# Desplegar en una VPS con Dokploy

Todo el sistema (app, API, base de datos y sincronización sin señal) se levanta con un solo archivo: `docker-compose.dokploy.yml`. Solo el servicio `web` es público; los demás quedan en una red interna.

```
Internet ──> Dokploy (Traefik, HTTPS) ──> web (nginx: app + proxy)
                                             ├── /api, /health ──> backend (FastAPI) ──> postgres
                                             └── /powersync    ──> powersync ──> postgres + powersync-storage
```

## Requisitos

- Una VPS con Dokploy instalado y al menos 2 GB de RAM. En reposo, los cinco servicios usan unos 500 MB, pero compilar la app en el deploy pide más. Con voz nativa en aymara y quechua (`TTS_LOCAL=true`), mejor 4 GB.
- Un dominio con un registro **A** que apunte a la IP de la VPS.

## Pasos

1. **Crear la app.** En Dokploy: *Create Project* > *Create Service* > **Compose**.
2. **Origen.** Elegir el repositorio de GitHub y la rama `main`.
3. **Archivo.** En *Compose Path*, poner `./docker-compose.dokploy.yml`.
4. **Variables.** En *Environment*, pegar el contenido de [`.env.dokploy.example`](../.env.dokploy.example) y completar los valores:
   - `PUBLIC_URL`: el dominio con `https://`, por ejemplo `https://aynuqa.example.com`.
   - Contraseñas y tokens largos y aleatorios. Se pueden generar con `openssl rand -hex 24`.
   - `LLM_API_KEY` y `LLM_MODEL` para el chat con Gemini.
5. **Dominio.** En *Domains* > *Add Domain*: servicio **`web`**, puerto **`80`**, el mismo dominio de `PUBLIC_URL` y HTTPS con Let's Encrypt.
6. **Deploy.** La primera vez tarda unos minutos porque compila la app y el backend.
7. **Probar.**
   - `https://<dominio>/health` debe responder `"status":"ok"`.
   - Abrir `https://<dominio>` en el celular, instalar la app y probar sin señal.

Antes del primer deploy, *Preview Compose* muestra el archivo final. Ahí se puede revisar que `web` tenga la red `aynuqa` y la de Dokploy.

## Actualizar

Cada push a `main` se puede desplegar con *Deploy* o con *Auto Deploy*. Los datos quedan en los volúmenes con nombre (`aynuqa_postgres`, `powersync_storage` y `aynuqa_backend`), así que no se pierden al redesplegar. Esos volúmenes se pueden respaldar desde Dokploy.

Los resultados del modelo (`ml/outputs/`) van dentro de la imagen del backend. Para publicar resultados nuevos alcanza con subirlos a `main` y redesplegar.

## Notas

- No se publica ningún puerto: no hace falta abrir nada en el firewall además de 80 y 443, que ya usa Dokploy.
- La clave que firma los tokens de PowerSync se crea sola y se guarda en el volumen `aynuqa_backend`.
- Si `PUBLIC_URL` cambia, hay que redesplegar. La app no se recompila: usa el dominio desde el que se abre.
