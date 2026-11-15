# Pitch, guiones y entregables: Aynuqa Field Shift

Basado en la [Project Submission Guide de Space Apps 2026](https://www.spaceappschallenge.org/resources/project-submission-guide/). Reto: *Field Shift: Adapting Farms with NASA Data*.

Todos los números de este documento salen de nuestros datos (`ml/outputs/`, API del 15 de noviembre de 2026). No agreguen cifras que no estén aquí: los jueces evalúan **Validez**.

---

## 0. Checklist con plazo

**El envío cierra hoy, domingo 15 de noviembre, a las 23:59, hora del evento local.** Se puede guardar y reenviar muchas veces; vale el último guardado.

| Entregable | Formato obligatorio | Idioma | Estado |
| --- | --- | --- | --- |
| Project Name | Texto | Inglés | Borrador en §6 |
| High-Level Project Summary | Texto | Inglés | Borrador en §6 |
| **Link to Project Demo** | **Video ≤ 30 s** o **≤ 7 diapositivas** (incluye título e intro), en link público | Video en español con **subtítulos en inglés**, o todo en inglés. Diapositivas: solo inglés | Guion en §2, diapositivas en §5 |
| Link to Final Project | Link público (GitHub, web o YouTube) | Inglés | Repo y demo larga §3 |
| Detailed Project Description | Texto | Inglés | Borrador en §6 |
| Use of SI (IA) | Texto (no lo ven los jueces) | Inglés | Borrador en §6 |
| NASA Data | Texto, **obligatorio para premio global** | Inglés | Borrador en §6 |
| Space Agency Partner Data and Other References | Texto | Inglés | Borrador en §6 |
| Pitch presencial | 3 min ante jueces locales | Español | §1 |

Reglas que no hay que romper:

- **Más de 30 s de video o más de 7 diapositivas quedan fuera del juzgamiento global.**
- Links **públicos, sin login**. Pruébenlos en una ventana privada.
- **Nada de personas menores de 18 años** en imágenes, video ni audio.
- Lo generado con IA lleva marca visible. Mis motion graphics llevan la marca de agua **"AI-generated graphics"**, y el audio o texto generado se declara en la descripción. **Sin logos ni marca de la NASA** en lo generado.
- Todo el formulario y lo enlazado, en inglés. La excepción es el video con subtítulos en inglés.
- Hay que marcar "Terms and Conditions" y "Confirm All Work is Original" y tocar **Submit for Judging**.

Criterios de los jueces: **Impact, Creativity, Validity, Relevance, Presentation**.

---

## 1. Pitch presencial (3 minutos, español)

Ritmo de referencia: unas 140 palabras por minuto, o sea 400 a 430 palabras en 3 minutos. Cada pitch marca el tiempo y qué mostrar en pantalla (celular espejado o proyector). Reemplacen `[EQUIPO]` y los nombres.

Datos que se pueden decir en voz alta, todos verificados:

- El RONI de NOAA marcó **+1,97** en agosto-octubre de 2026: hoy hay El Niño.
- El modelo se entrena con **8 zonas** del altiplano y **26 campañas** desde el año 2000.
- Pumani tiene **13 sectores**. Los límites y los años de descanso son simulados.
- Datos NASA usados:
  - NASA POWER: temperatura, humedad del suelo en la raíz y radiación.
  - GPM IMERG: lluvia.
  - MODIS NDVI, de Terra y Aqua, por AppEEARS: verdor a 250 m.
  - NASADEM: terreno.
- Validación honesta:
  - Probado en zonas que no vio, el modelo **supera a las líneas base** (error 0,56 contra 0,73).
  - Probado en temporadas que no vio, **todavía no** (0,88 contra 0,74).
  - Por eso hoy la app muestra **confianza baja** en los 13 sectores, y lo dice.

### Pitch A: "La asamblea" (historia, para impacto y presentación)

**[0:00–0:25] Gancho**
> Imaginen la asamblea de Pumani, en el altiplano de La Paz, a casi 4.000 metros. Hay que decidir qué sector se abre para sembrar y cuál sigue descansando. Esa decisión se toma así desde hace siglos: se llama **aynuqa**, la rotación comunal de la tierra. Funciona porque se adapta. Pero este año hay algo distinto.
>
> *Pantalla: foto del altiplano o la pantalla de inicio de la app con la cordillera.*

**[0:25–0:50] Problema**
> El índice oficial de NOAA marcó El Niño en **+1,97**. El Niño **aumenta la probabilidad** de sequía en el altiplano. No la garantiza, pero la aumenta. La asamblea tiene que decidir igual, sin saber cuál sector va a aguantar mejor.

**[0:50–1:10] Solución**
> Somos `[EQUIPO]` y hicimos **Aynuqa Field Shift**: datos de la NASA convertidos en un consejo que la asamblea entiende. Para cada sector estimamos dos cosas: el riesgo de sequía y cuánto se recuperó el suelo con el descanso. Y lo traducimos en algo concreto: abrir, seguir descansando, qué sembrar y cuándo.
>
> *Pantalla: Mi comunidad, con el consejo agrupado por acción.*

**[1:10–1:55] Demo en vivo**
> Esta es la app en un celular. Este es el mapa con la foto satelital: el borde de cada sector dice su riesgo. Toco el sector 4. El consejo va primero, en grande, y al lado siempre: **qué tan seguros estamos**. Se puede escuchar, también en aymara y quechua. La asamblea anota su decisión, aunque sea distinta al consejo. Y si se va la señal, que en el campo pasa siempre, la app sigue funcionando: la decisión queda guardada en el celular y sube sola cuando vuelve la señal.
>
> *Pantalla: mapa, sector 4, Escuchar, guardar decisión con modo avión.*

**[1:55–2:25] Por qué confiar, y por qué no del todo**
> Entrenamos con 8 zonas del altiplano y 26 campañas desde el 2000: lluvia de GPM IMERG, humedad del suelo de NASA POWER, verdor de MODIS y terreno de NASADEM. Y lo probamos con el pasado. En zonas que el modelo no vio, acierta mejor que las alternativas simples. En temporadas nuevas, todavía no. Por eso la app no promete: hoy dice **"confianza baja"** y lo muestra.

**[2:25–2:50] Futuro**
> Con sensores de campo reales y los límites reales de cada comunidad, esto se puede usar en cualquier comunidad análoga del altiplano, porque el modelo no depende de la ubicación: depende del clima y del terreno.

**[2:50–3:00] Cierre**
> La aynuqa ya sabe adaptarse. Nosotros solo le damos ojos desde el espacio. La decisión sigue siendo de la asamblea.

### Pitch B: "Datos NASA con honestidad" (para validez y relevancia)

**[0:00–0:20] Gancho**
> ¿Cómo decide una comunidad qué tierra sembrar cuando El Niño está en +1,97? En el altiplano boliviano, con la aynuqa: una rotación comunal de siglos. Nosotros le sumamos los satélites de la NASA.

**[0:20–0:45] El reto y la escala**
> El reto Field Shift pide adaptar la agricultura con datos de la NASA. Nuestro caso es Pumani, a 3.900 metros. Un detalle de escala que respetamos: la lluvia y la temperatura de NASA POWER son iguales para toda la comunidad, porque es la misma celda. Lo que distingue a un sector de otro es el **verdor MODIS a 250 m** y el **terreno de NASADEM**. No inventamos diferencias de clima entre sectores.

**[0:45–1:25] Cómo funciona**
> - **Riesgo de sequía:** un modelo LightGBM con anomalías de lluvia (GPM IMERG, completada con CHIRPS), humedad del suelo, temperatura y el índice RONI de NOAA con meses de rezago, más el terreno y el verdor previo. Sin latitud ni longitud, para que sirva en otras comunidades.
> - **Recuperación del suelo:** RESTREND, que mira cuánto verdor tiene el sector frente al que la lluvia explicaría.
> - **Tierras gemelas:** buscamos el sector más parecido en otra zona y mostramos cómo respondió su verdor en El Niño 2015-16 o 2023-24. Es un dato observado, no una predicción.
>
> *Pantalla: modo avanzado con factores, intervalo y la serie de NDVI.*

**[1:25–2:05] Validez**
> Lo probamos con el pasado y dejamos fuera lo que se evaluaba. Probado en zonas nuevas, supera a las líneas base: error 0,56 contra 0,73. Probado en temporadas nuevas, no las supera: 0,88 contra 0,74. Y en el backtest de Pumani la correlación sale al revés de lo esperado. **Lo reportamos tal cual.** Por eso cada consejo lleva su confianza, y hoy dice "baja". Una herramienta que exagera es peor que no tener herramienta.

**[2:05–2:40] Producto para el campo**
> Lo pusimos en manos de la gente, no en un dashboard: una app instalable para celulares de gama baja que funciona sin señal gracias a PowerSync. Viene en español, aymara y quechua, con voz nativa, y tiene un chat que solo usa números de nuestras herramientas. La comunidad registra su decisión, aunque no siga el consejo.

**[2:40–3:00] Cierre**
> Próximo paso: sensores reales y límites reales de los sectores, y más campañas para que la confianza suba con evidencia, no con promesas. Aynuqa Field Shift: datos de la NASA al servicio de una decisión que sigue siendo de la comunidad.

### Pitch C: "Problema, solución, impacto" (clásico, el más seguro)

**[0:00–0:30] Problema**
> En el altiplano boliviano, las comunidades rotan su tierra con la aynuqa: unos sectores se cultivan y otros descansan hasta que el suelo se recupera. Hoy, con El Niño en +1,97 según NOAA, aumenta la probabilidad de sequía, y cada decisión de la asamblea pesa más: abrir el sector equivocado puede costar una campaña.

**[0:30–0:45] Usuario**
> Nuestro usuario no es un científico: es una asamblea comunal, muchas veces de personas mayores, con celulares básicos y mala señal, que habla español, aymara o quechua.

**[0:45–1:10] Solución**
> Aynuqa Field Shift les dice, sector por sector:
> 1. el riesgo de sequía;
> 2. si el suelo ya se recuperó;
> 3. qué hacer: abrir, seguir descansando, qué sembrar y cuándo.
>
> Siempre con su nivel de confianza, porque nada de esto es seguro.

**[1:10–1:55] Demo**
> - **Entrar:** se entra directo, sin registro.
> - **Mapa satelital:** el borde de cada sector marca su riesgo.
> - **Ficha del sector:** el consejo en grande, con su confianza, y el botón Escuchar.
> - **La llamita:** la mascota avisa qué sector mirar y celebra cuando la asamblea anota su decisión.
> - **Sin señal:** modo avión, y todo sigue ahí. El chat también contesta con lo guardado.

**[1:55–2:25] Datos NASA**
> - **Lluvia:** NASA GPM IMERG.
> - **Temperatura, humedad del suelo y radiación:** NASA POWER.
> - **Verdor:** MODIS NDVI, por AppEEARS.
> - **Terreno:** NASADEM.
> - **El Niño:** el índice RONI de NOAA.
>
> Entrenado con 8 zonas del altiplano y 26 campañas. Validado con el pasado: generaliza bien a zonas nuevas y todavía no a temporadas nuevas, y lo decimos.

**[2:25–2:50] Impacto**
> Menos campañas perdidas por abrir el sector equivocado. Un registro de lo que decidió la comunidad para aprender año a año. Y un modelo que sirve para otras comunidades del altiplano, porque no depende del lugar sino de las condiciones.

**[2:50–3:00] Cierre**
> La aynuqa ya sabe adaptarse. Le dimos datos de la NASA en su idioma y en su celular. Gracias.

### Preguntas probables de los jueces

| Pregunta | Respuesta corta y honesta |
| --- | --- |
| ¿Qué tan preciso es? | En zonas nuevas supera a las líneas base (error 0,56 contra 0,73). En temporadas nuevas todavía no (0,88 contra 0,74). Por eso mostramos la confianza, que hoy es baja. |
| ¿Qué es real y qué es simulado? | Reales: clima, verdor, terreno y RONI. Simulados: los límites de los sectores, los años de descanso y los sensores, y la app lo dice en pantalla. |
| ¿Por qué no usan la lluvia por sector? | La celda de NASA POWER cubre toda la comunidad. Inventar diferencias sería falso. Por sector solo distinguen el NDVI (250 m) y el terreno. |
| ¿Funciona sin internet? | Sí. PowerSync guarda los datos en el celular y las decisiones suben solas al volver la señal. El chat contesta con plantillas y lo guardado. |
| ¿Y el chat inventa? | Con señal usa Gemini y solo números de nuestras herramientas. Sin señal usa plantillas, y si hay IA local, se descarta cualquier número que no esté en los datos. |
| ¿Aymara y quechua? | La interfaz está traducida y la voz es nativa con Meta MMS (Aymara central y quechua del sur de Bolivia). Las traducciones las debe revisar un hablante nativo. |
| ¿Qué sigue? | Límites reales con la comunidad, sensores reales, más campañas y revisión con hablantes nativos. |

---

## 2. Video demo oficial (30 segundos o menos)

**Este es el demo que se sube al formulario.** Máximo 30 s, con subtítulos en inglés si hablan en español. Sigue la estructura que pide la guía: 0:00, 0:02, 0:05, 0:10, 0:20 a 0:30.

Formato recomendado: horizontal **16:9, 1920×1080**, con la grabación del celular al centro y los motion graphics a los lados. Así se ve bien en YouTube y en el proyector.

| Tiempo | Imagen (qué se ve) | Voz (español) | Subtítulo (inglés) | Motion graphics |
| --- | --- | --- | --- | --- |
| 0:00–0:02 | Integrante(s) del equipo a cámara, todos mayores de 18 | "Somos `[EQUIPO]`, de `[CIUDAD]`." | "We are `[TEAM]`, from `[CITY]`." | Nombre del equipo en barra inferior |
| 0:02–0:05 | Paisaje del altiplano o animación de sectores de cultivo y descanso | "En el altiplano, las comunidades rotan su tierra: la aynuqa." | "In the Bolivian Andes, communities rotate their land: the aynuqa." | Mapa animado: sectores que se encienden y apagan (cultivo y descanso) |
| 0:05–0:10 | Logo o título de la app en el celular | "Aynuqa Field Shift: decidir qué sembrar con El Niño en +1,97." | "Aynuqa Field Shift: deciding what to plant with El Niño at +1.97." | Título grande y tagline. Indicador "RONI +1.97 (NOAA)" |
| 0:10–0:20 | Grabación del celular: mapa satelital, ficha del sector 4 con su confianza, guardar decisión en modo avión | "Con lluvia, verdor y terreno de satélites NASA, cada sector recibe un consejo con su confianza, en su idioma y sin señal." | "With NASA rainfall, greenness and terrain data, each sector gets advice with its confidence, in their language, even offline." | Etiquetas que aparecen junto a cada dato: "GPM IMERG", "MODIS NDVI", "NASADEM", "NASA POWER" (solo texto, sin logos). Ícono de "sin señal" |
| 0:20–0:30 | La llamita celebrando y la asamblea o el equipo mirando el celular | "La decisión sigue siendo de la comunidad. Nosotros le damos ojos desde el espacio." | "The decision stays with the community. We give it eyes from space." | Cierre: nombre del proyecto y URL del repo. Marca **"AI-generated graphics"** |

Notas:

- Si el video entero se narra en inglés, los subtítulos siguen siendo útiles para la sala.
- **Duren 28 s o menos** para tener margen. Revisen la duración real en YouTube después de subirlo.
- No digan "trae sequía": digan "aumenta la probabilidad de sequía".

---

## 3. Video de demo larga (respaldo, 2 minutos)

No es el demo oficial, porque ese debe durar 30 s. Sirve como **Link to Final Project** junto al repositorio, o en el pitch presencial si falla el celular en vivo.

| # | Tiempo | Toma | Qué mostrar | Voz guía |
| --- | --- | --- | --- | --- |
| 1 | 0:00–0:10 | Equipo a cámara | Presentación | "Somos `[EQUIPO]` y esto es Aynuqa Field Shift." |
| 2 | 0:10–0:25 | Celular: abrir la app | Entra directo a Pumani; la llamita saluda | "Se abre y entra directo a la comunidad, sin registrarse." |
| 3 | 0:25–0:45 | Celular: Mi comunidad | Consejo agrupado (abrir, seguir en descanso…), interruptor "Hoy con El Niño / año normal" | "El consejo de este año, sector por sector, y la comparación con un año normal." |
| 4 | 0:45–1:00 | Celular: mapa | Foto satelital, borde por riesgo, tocar el sector 4 | "Sobre la foto satelital, el borde marca el riesgo de sequía." |
| 5 | 1:00–1:15 | Celular: ficha del sector | Consejo, "qué tan seguros estamos", Escuchar en aymara | "Siempre con su confianza. Y se puede escuchar en aymara y quechua." |
| 6 | 1:15–1:30 | Celular: modo avanzado | Riesgo con intervalo, factores, serie NDVI | "Para técnicos, todos los números del modelo." |
| 7 | 1:30–1:50 | Celular: modo avión | Guardar decisión sin señal ("Se enviará cuando haya señal"), la llamita celebra, chat sin señal contesta | "Sin señal, todo sigue: la decisión se guarda y el chat contesta con lo guardado." |
| 8 | 1:50–2:00 | Celular: volver la señal | La decisión pasa a "Enviada" | "Al volver la señal, la decisión sube sola." |

---

## 4. Guía para grabar (lo que me pasan a mí)

### Qué grabar

1. **Pantalla del celular** con la grabadora del sistema (Android: "Grabar pantalla"):
   - Resolución 1080p o más, 30 fps, vertical.
   - Activen "Mostrar toques" (Opciones de desarrollador → Mostrar toques) para que se vean los dedos.
   - Modo **no molestar** para que no salten notificaciones. Batería y hora visibles no importan.
   - Tamaño de letra normal. Instalen la app antes (botón "Instalar") para que se vea sin barra del navegador.
   - Una toma por escena de las tablas §2 y §3. Hagan cada gesto lento y esperen 2 s después de cada toque.
2. **Equipo a cámara**, 2 o 3 tomas cortas, horizontal, con luz de frente y fondo tranquilo. **Ningún menor de 18 años en cuadro.**
3. **Voz en off** aparte, grabada con el celular cerca de la boca en un cuarto sin eco. Una pista por línea de la tabla, con 2 s de silencio entre líneas.
4. **Toma real del celular en mano** (opcional, 5 a 10 s): alguien usando la app al aire libre, sin mostrar caras de menores.

### Cómo me lo pasan

- Archivos originales, sin comprimir por WhatsApp. Mejor por Google Drive o cable.
- Nombres de archivo: `escena03_mapa_toma2.mp4`, `voz_0-10s_toma1.m4a`, `equipo_intro_toma1.mp4`.
- Una nota con: la mejor toma de cada escena, el nombre del equipo y de cada integrante, la ciudad y la URL pública del repo.

### Lo que hago yo con eso

- **Motion graphics:**
  - el mapa de sectores animado (cultivo y descanso);
  - el indicador RONI +1,97;
  - las etiquetas de datos NASA, solo en texto y sin logos;
  - el título, el cierre y los subtítulos en inglés.
- La marca **"AI-generated graphics"** visible en cada pieza que genere yo.
- Montaje del video oficial (≤ 30 s, verificando la duración) y del de respaldo (2 min).

---

## 5. Alternativa: demo en 7 diapositivas (en inglés)

Si prefieren diapositivas en vez de video. **Máximo 7, en inglés**, con poco texto e imágenes grandes. La guía pide que se vean el nombre del equipo, los integrantes y el reto.

1. **Title.** *Aynuqa Field Shift: NASA data for the Andean communal crop rotation.* Equipo, integrantes y reto *Field Shift: Adapting Farms with NASA Data*.
2. **The aynuqa.** Foto del altiplano y un diagrama de sectores en cultivo y en descanso. "Communities rotate land for centuries. El Niño (NOAA RONI +1.97) increases the likelihood of drought."
3. **The user.** Una asamblea comunal: celulares básicos, mala señal, español, aymara o quechua. Captura de la pantalla principal.
4. **What it does.** Sector por sector: drought risk, soil recovery and an action (open, extend rest, what and when to sow), always with confidence. Capturas del mapa satelital y de la ficha del sector.
5. **NASA data.** GPM IMERG (rainfall), NASA POWER (temperature, root-zone soil moisture, radiation), MODIS NDVI MOD13Q1/MYD13Q1 via AppEEARS (greenness, 250 m), NASADEM (terrain), más NOAA RONI. Un diagrama: datos → modelo → consejo.
6. **Honest validation.** Probado en zonas nuevas, supera a las líneas base (RMSE 0,56 contra 0,73). Probado en temporadas nuevas, todavía no (0,88 contra 0,74). Por eso se muestra la confianza.
7. **Works in the field and future.** Offline, voz en aymara y quechua, decisiones de la comunidad. Próximo paso: límites reales, sensores reales y más campañas.

---

## 6. Textos para el formulario (inglés, listos para pegar)

Revisen nombres, links y lo marcado entre corchetes.

### Project Name

Aynuqa Field Shift

### High-Level Project Summary

> Aynuqa Field Shift is a decision-support app for Andean communities that practice the aynuqa, a centuries-old communal land rotation in the Bolivian Altiplano. With El Niño underway (NOAA RONI +1.97 for Aug–Oct 2026), the likelihood of drought increases and each assembly decision about which sector to open or rest matters more. Using NASA data (GPM IMERG rainfall, NASA POWER soil moisture and temperature, MODIS NDVI and NASADEM terrain), our model estimates each sector's drought risk and soil recovery and turns them into concrete advice: which sector to open, how long to extend the rest, and what and when to sow. Every prediction shows its confidence, and we report our validation honestly. The app is built for low-end phones and poor connectivity: it works offline, speaks Spanish, Aymara and Quechua, and lets the community record its own decisions. The final decision always stays with the assembly.

### Link to Project Demo

`[URL pública del video de 30 s en YouTube o Drive]`

### Link to Final Project

`[URL pública del repositorio de GitHub]` y `[URL del video de demo larga]`

### Detailed Project Description

> **What it does.** For each sector of the community (case study: Pumani, Aroma Province, La Paz, ~3,900 m), the system estimates:
> 1. the drought risk for the coming season;
> 2. the soil recovery during the rest period.
>
> It turns them into an action: open for cultivation, keep resting, extend the rest by N years, or start resting after harvest, plus a suggested crop and sowing window. It shows an "El Niño today" scenario (the real current state) and a "normal year" comparison. It also shows "twin lands": the most similar sector in another Altiplano zone and how its vegetation actually responded during El Niño 2015–16 or 2023–24. These are observed NDVI anomalies, not predictions.
>
> **How it works.**
> - **Data pipeline (Python).** Monthly NASA data for Pumani and 7 analog Altiplano zones (8 zones, 26 growing seasons since 2000):
>   - GPM IMERG rainfall, gap-filled with CHIRPS;
>   - NASA POWER temperature, root-zone soil moisture and radiation;
>   - MODIS NDVI at 250 m;
>   - NASADEM elevation, slope and aspect;
>   - NOAA's Relative Oceanic Niño Index (RONI) with lags.
> - **Drought risk.** A LightGBM model trained without latitude or longitude, so it can transfer to analogous communities. SHAP gives the main drivers of each prediction.
> - **Soil recovery.** RESTREND (NDVI residual against rainfall).
> - **Twin lands.** Nearest-neighbor similarity on terrain, baseline soil moisture and mean NDVI.
> - **Scale.** Climate variables are zone-level (same NASA POWER cell for all sectors). Only NDVI and terrain differ between sectors, and we never present climate differences between sectors.
> - **Validation, reported as is.**
>   - In leave-one-zone-out cross-validation the model beats both baselines (RMSE 0.56 vs 0.73).
>   - In leave-one-season-out it does not (0.88 vs 0.74–0.78).
>   - In the Pumani backtest the season-level correlation has the opposite sign to the expected one.
>   - That is why every recommendation carries a confidence level, which is currently "low".
> - **Backend.** FastAPI loads the ML outputs and serves them. A chat assistant (Google Gemini with tool calling) answers in simple language using only numbers returned by our tools.
> - **Offline-first app.** A Progressive Web App (React) syncs data to the phone with PowerSync (PostgreSQL → SQLite in the browser). It keeps working without signal:
>   - the community can record decisions, which upload when signal returns;
>   - the chat answers from saved data using templates.
>   - Responses are compressed (Brotli/gzip) for poor connections.
> - **Accessibility.**
>   - Spanish, Aymara and Quechua interface.
>   - Text-to-speech with native Aymara and Quechua voices (Meta MMS-TTS).
>   - Large text, and a satellite basemap of the sectors.
>   - An "advanced mode" with all technical numbers.
>   - A llama mascot that reminds the community which sector to check.
>
> **What is simulated.** Sector boundaries, years of rest and field sensors are simulated and labeled as such on screen. Climate, vegetation, terrain and ENSO data are real.
>
> **Benefits and goals.** Fewer seasons lost by opening the wrong sector, a record of community decisions to learn from year to year, and a transferable approach for other Altiplano communities. Next steps: real sector boundaries with the community, real field sensors, more seasons of validation, and review of translations by native speakers.
>
> **Tools.** Python (pandas, xarray, LightGBM, SHAP), FastAPI, PostgreSQL, PowerSync, SQLite (WASM), React, TypeScript, Vite, Docker, Google Gemini API, Meta MMS-TTS, WebLLM (optional on-device model).

### Use of Super Intelligence (SI)

> Yes.
> - **Code.** The team designed the solution and its data and modeling rules. We used Claude (Anthropic) via Claude Code as a coding assistant to implement and test parts of the backend, frontend and documentation under the team's direction.
> - **In the app:**
>   - Google Gemini powers the chat assistant, restricted to numbers returned by our own tools;
>   - Meta MMS-TTS generates the Aymara and Quechua speech;
>   - an optional on-device model (Qwen2.5-0.5B via WebLLM) rephrases offline answers and is discarded if it adds any number not present in the data.
> - **Demo video.** Motion graphics in the demo video were generated with AI assistance and carry a visible "AI-generated graphics" watermark.
> - No NASA branding was used in generated content.
>
> `[Completen con cualquier otro uso de IA del equipo.]`

### NASA Data

> - **NASA POWER** (Prediction Of Worldwide Energy Resources), daily point API, AG community: T2M (temperature), PRECTOTCORR (precipitation), GWETROOT (root-zone soil wetness) and ALLSKY_SFC_SW_DWN (solar radiation), 2000–2026, for 8 Altiplano zones.
> - **GPM IMERG V07** (NASA GES DISC): monthly Final (GPM_3IMERGM) and daily Late (GPM_3IMERGDL) precipitation via OPeNDAP.
> - **MODIS Vegetation Indices MOD13Q1.061 and MYD13Q1.061** (Terra and Aqua, 250 m, 16-day NDVI), retrieved through **NASA AppEEARS** (LP DAAC).
> - **NASADEM** (NASADEM_HGT / NASADEM_NC.001) elevation, slope and aspect, retrieved through AppEEARS.

### Space Agency Partner Data and Other References

> - **NOAA CPC Relative Oceanic Niño Index (RONI)** and ONI (reference only): https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt
> - **CHIRPS v2.0** (UCSB Climate Hazards Center) via the IRI Data Library: rainfall gap-filling.
> - **SENAMHI Bolivia**, Ayo Ayo station: validation of satellite rainfall and temperature, not used for training.
> - **Esri World Imagery** basemap: Esri, Maxar, Earthstar Geographics and the GIS User Community.
> - **Meta MMS-TTS** models facebook/mms-tts-ayr and facebook/mms-tts-quh (CC-BY-NC 4.0).
> - **Google Gemini API** (google-genai), **WebLLM** (MLC) with Qwen2.5-0.5B-Instruct.
> - **Open-source software:** LightGBM, SHAP, pandas, xarray, FastAPI, PowerSync, React, Vite, Workbox, Atkinson Hyperlegible and Lora fonts (OFL).
> - `[Agreguen cualquier dato de las agencias socias si lo usaron. Hoy no usamos ninguno.]`

---

## 7. Qué decir y qué no

| Sí | No |
| --- | --- |
| "El Niño aumenta la probabilidad de sequía" | "Va a haber sequía" |
| "Confianza baja; es una guía" | "El modelo predice con precisión" |
| "Límites y años de descanso simulados" | Presentar los sectores como reales |
| "La lluvia es la misma para toda la comunidad" | Diferencias de lluvia entre sectores |
| "La tierra gemela tuvo una anomalía de verdor de X" | Inventar cultivos, rendimientos o pérdidas |
| "La decisión es de la asamblea" | "La app decide" |
