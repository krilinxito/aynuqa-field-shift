# Pitch, guiones y entregables: Aynuqa Field Shift

Basado en la [Project Submission Guide de Space Apps 2026](https://www.spaceappschallenge.org/resources/project-submission-guide/). Reto: *Field Shift: Adapting Farms with NASA Data*. El pitch es presencial, ante jueces locales.

Los números de este documento salen de nuestros datos (`ml/outputs/`, API del 15 de noviembre de 2026). No agreguen cifras que no estén aquí: los jueces evalúan **Validez**. Lo marcado entre corchetes `[ ]` lo completa el equipo.

---

## 0. Checklist con plazo

**El envío cierra hoy, domingo 15 de noviembre, a las 23:59, hora del evento local.** Se puede guardar y reenviar muchas veces; vale el último guardado.

| Entregable | Formato obligatorio | Idioma | Dónde está |
| --- | --- | --- | --- |
| Project Name | Texto | Inglés | §7 |
| High-Level Project Summary | Texto | Inglés | §7 |
| **Link to Project Demo** | **Video de 30 s o menos** o **7 diapositivas como máximo** (con título e intro), en link público | Video en español con **subtítulos en inglés**, o todo en inglés. Diapositivas solo en inglés | Video §3, diapositivas §6 |
| Link to Final Project | Link público (GitHub, web o YouTube) | Inglés | Repo y video largo §4 |
| Detailed Project Description | Texto | Inglés | §7 |
| Use of SI (IA) | Texto, los jueces no lo ven | Inglés | §7 |
| NASA Data | Texto, **obligatorio para premio global** | Inglés | §7 |
| Space Agency Partner Data and Other References | Texto | Inglés | §7 |
| Pitch presencial | 3 minutos ante jueces locales | Español | §2 |

Reglas de la guía:

- **Un video de más de 30 s o más de 7 diapositivas queda fuera del juzgamiento global.**
- Links **públicos y sin login**. Pruébenlos en una ventana privada.
- **Ninguna persona menor de 18 años** en imágenes, video o audio.
- Lo generado con IA lleva marca visible: mis motion graphics llevan **"AI-generated graphics"**, y el audio o texto generado se declara en la descripción. **Sin logos ni marca de la NASA** en lo generado.
- Todo el formulario y lo enlazado va en inglés. El video puede ir en español con subtítulos en inglés.
- Al final: marcar "Terms and Conditions" y "Confirm All Work is Original", y tocar **Submit for Judging**.

Criterios de los jueces: **Impact, Creativity, Validity, Relevance, Presentation**.

---

## 1. Modelo de negocio (B2B)

**Clientes:** gobiernos municipales, la gobernación y ONG de desarrollo rural o de adaptación al cambio climático que ya trabajan con comunidades del altiplano.

**Usuarios:** las comunidades y sus promotores.

**Lo que compra la institución, en un solo paquete:**

| Componente | Qué incluye |
| --- | --- |
| Herramienta | La app configurada para cada comunidad: sus sectores, su historial satelital y el modelo de riesgo. Funciona sin señal y en español, aymara y quechua. |
| Acceso a internet | Un punto de conexión en la comunidad (por ejemplo, en la sede comunal) para sincronizar datos y decisiones. |
| Dispositivos | Celulares de gama baja con la app instalada para los promotores o la directiva. |
| Capacitación | Talleres para promotores y autoridades comunales: leer el consejo, entender la confianza, registrar decisiones y usar la app sin señal. |

**Lo que obtiene la institución:**

- Información por sector de cada comunidad a su cargo, basada en datos de la NASA.
- Un registro de lo que decidió cada comunidad, útil para seguimiento y para informar a sus financiadores.
- Una herramienta que puede sumar a programas de adaptación al cambio climático que ya ejecuta.

**Despliegue en una comunidad:**

1. Mapear los sectores reales con la comunidad. Hoy los límites son simulados.
2. Instalar el punto de conexión y entregar los dispositivos.
3. Capacitar a los promotores.
4. Acompañar la primera campaña y ajustar.

**Precio y piloto:** `[definir: costo por comunidad y por campaña, qué cubre cada parte]`. Propuesta: un piloto con `[N]` comunidades en la campaña `[año]`.

**Próximo paso del producto:** un panel para la institución con las decisiones y el riesgo de todas sus comunidades. Los datos ya se guardan en PostgreSQL; el panel no existe todavía.

---

## 2. Pitch presencial (3 minutos, español)

Ritmo de referencia: unas 140 palabras por minuto, entre 400 y 430 palabras en 3 minutos. Cada bloque marca el tiempo y qué mostrar en pantalla (celular espejado o proyector).

Datos verificados que se pueden decir:

- El índice RONI de NOAA marcó **+1,97** en agosto-octubre de 2026: hoy hay El Niño.
- Pumani tiene **13 sectores**. Sus límites y años de descanso son simulados.
- El modelo se entrena con **8 zonas** del altiplano y **26 campañas** desde el año 2000.
- Datos NASA usados:
  - **NASA POWER:** temperatura, humedad del suelo y radiación.
  - **GPM IMERG:** lluvia.
  - **MODIS NDVI:** verdor a 250 m, por AppEEARS.
  - **NASADEM:** terreno.
- Validación:
  - En zonas que no vio, el modelo **supera a las líneas base** (error 0,56 contra 0,73).
  - En temporadas que no vio, **todavía no las supera** (0,88 contra 0,74).
  - Por eso la app muestra la confianza de cada consejo. Hoy es **baja** en los 13 sectores.

### Pitch A (el que usamos): "Lo milenario y lo nuevo, decidiendo juntos"

Estructura: gancho, problema del reto, solución, producto, y cierre con escalabilidad y por qué usarlo. No hay presentación del equipo: el tiempo va al contenido. Sin términos económicos. Son unas 430 palabras. Diapositivas: `docs/pitch/index.html` (tecla N para ver este texto en pantalla).

**[0:00–0:20] Gancho** · Diapositivas 1 y 2
> En unas semanas empieza la siembra en el altiplano de La Paz. En comunidades como Pumani, toda la comunidad decide qué sector abrir para cultivar. Este año decide con El Niño activo: el índice de NOAA marcó +1,97. Si ustedes fueran parte de esa comunidad, ¿qué sector abrirían?

**[0:20–0:50] Problema** · Diapositiva 3
> Del reto Field Shift elegimos la aynuqa: la comunidad divide su tierra en sectores, cultiva algunos y deja descansar otros durante años para que el suelo se recupere. Con El Niño aumenta la probabilidad de sequía, y abrir un sector seco puede hacer perder la siembra del año. Hoy la comunidad elige de forma empírica, con la experiencia de años anteriores. Con el cambio climático, lamentablemente, esa experiencia falla. Además hay poca señal y pocos celulares.

**[0:50–1:15] Cómo lo resolvemos** · Diapositiva 4
> Aynuqa Field Shift estima para cada sector el riesgo de sequía y la recuperación del suelo. Con eso aconseja qué sector abrir, cuántos años más dejar descansar a los otros, qué sembrar y cuándo. Cada consejo dice qué tan seguros estamos.
>
> *Pantalla: la diapositiva aclara que la lluvia y la temperatura son iguales para toda la zona, y que el verdor (NDVI) y el terreno distinguen a cada sector. Si preguntan, se explica ahí.*

**[1:15–2:10] El producto** · Diapositivas 5, 6 y 7
> Esta es la app, hecha para celulares de gama baja. Abre directo en la comunidad y muestra el consejo del año agrupado por acción. Al tocar el sector 13, el que conviene abrir, aparece el consejo: papa, con siembra de octubre a noviembre y confianza baja.
>
> La comunidad anota lo que decidió, aunque elija otra cosa. Sin señal la app sigue funcionando: la decisión se guarda en el celular y se envía al volver la señal.
>
> A la llamita se le pregunta en lenguaje natural. El chat usa Gemini con llamadas a herramientas: cada número de la respuesta sale de nuestros datos, así no inventa cifras. Sin señal responde con los datos guardados.

**[2:10–2:32] Datos y validación** · Diapositiva 8
> Usamos la lluvia de GPM IMERG, la temperatura y la humedad del suelo de NASA POWER, el verdor (NDVI) de MODIS y el terreno de NASADEM. Entrenamos con 8 zonas del altiplano y 26 campañas desde el año 2000. En zonas que el modelo no vio, acierta mejor que las alternativas simples. En temporadas nuevas todavía no, y por eso la app siempre muestra la confianza.

**[2:32–2:50] Escalabilidad y futuro** · Diapositiva 9
> El modelo no usa latitud ni longitud: aprende de zonas parecidas. Por eso puede servir a otras comunidades del altiplano. Lo siguiente es trazar los límites reales con cada comunidad, sumar sensores de humedad en el campo y más temporadas para subir la confianza, y llegar a más comunidades con municipios y ONG.

**[2:50–3:00] Por qué usarlo** · Diapositiva 10
> La comunidad sigue decidiendo. Con Aynuqa Field Shift tiene datos de la NASA por sector, también sin señal, y sabe qué tan seguro es cada consejo. Lo milenario y lo nuevo, decidiendo juntos. Gracias.

**Preguntas (2 minutos)** · Diapositiva 11 de respaldo: números técnicos y qué es real y qué es simulado. Respuestas en la tabla de preguntas probables.

### Pitch B: "Datos NASA con resultados verificables"

**[0:00–0:20] Contexto**
> Las comunidades del altiplano rotan su tierra con la aynuqa. Con El Niño en +1,97, según NOAA, aumenta la probabilidad de sequía y cada decisión de la comunidad pesa más.

**[0:20–0:45] Para quién**
> Aynuqa Field Shift es un servicio para municipios y ONG que trabajan con comunidades rurales. Ellos lo despliegan: herramienta, conexión, celulares y capacitación para los promotores.

**[0:45–1:25] Cómo funciona**
> - **Escala de los datos:** la lluvia y la temperatura de NASA POWER son iguales para toda la comunidad, porque cae en una sola celda. Lo que distingue a cada sector es el verdor (NDVI) de MODIS a 250 metros y el terreno de NASADEM.
> - **Riesgo de sequía:** un modelo LightGBM usa lluvia de GPM IMERG, humedad del suelo, temperatura y el índice RONI de NOAA con varios meses de rezago, junto al terreno y el verdor previo. No usa la ubicación, así que sirve para otras comunidades parecidas.
> - **Recuperación del suelo:** el método RESTREND compara el verdor del sector con el que explicaría la lluvia.
> - **Tierras gemelas:** el sector más parecido en otra zona del altiplano y cómo cambió su verdor en El Niño 2015-16 o 2023-24.
>
> *Pantalla: modo avanzado con los factores del riesgo, el intervalo y la serie de NDVI.*

**[1:25–2:05] Validación**
> Probamos el modelo con el pasado, dejando fuera lo que se evaluaba. En zonas nuevas supera a las líneas base: error de 0,56 contra 0,73. En temporadas nuevas todavía no: 0,88 contra 0,74. En la prueba histórica de Pumani, la relación entre riesgo y verdor sale en la dirección contraria a la esperada. Reportamos estos resultados tal como salieron. Por eso cada consejo lleva su nivel de confianza, que hoy es bajo.

**[2:05–2:40] Producto para el campo**
> La app se instala en celulares de gama baja y funciona sin señal gracias a PowerSync. Está en español, aymara y quechua, con voz en los tres idiomas. El chat responde solo con números de nuestras herramientas. La comunidad registra su decisión, y la institución ve ese registro.

**[2:40–3:00] Próximos pasos**
> Con un piloto podemos mapear los sectores reales, sumar sensores de campo y agregar campañas para que la confianza del modelo suba con evidencia. Buscamos un municipio o una ONG para empezar con `[N]` comunidades.

### Pitch C: "Problema, solución y despliegue"

**[0:00–0:30] Problema**
> En el altiplano boliviano, las comunidades rotan su tierra con la aynuqa: cultivan unos sectores y dejan descansar otros. Con El Niño en +1,97, según NOAA, aumenta la probabilidad de sequía. Abrir el sector equivocado puede costar una campaña.

**[0:30–0:50] Cliente y usuario**
> Nuestros clientes son municipios, la gobernación y ONG de desarrollo rural. Los usuarios son las comunidades: muchas personas mayores, con poca señal y celulares básicos, que hablan español, aymara o quechua.

**[0:50–1:15] Solución**
> Para cada sector, la app muestra:
> - el riesgo de sequía;
> - cuánto se recuperó el suelo;
> - qué conviene hacer: abrir, seguir en descanso, qué sembrar y cuándo.
>
> Cada consejo indica su nivel de confianza. La institución entrega el paquete completo: herramienta, punto de internet, celulares y capacitación.

**[1:15–1:55] Demo**
> - **Entrada:** se entra directo, sin registro.
> - **Inicio:** el consejo del año agrupado por acción, y la comparación con un año normal.
> - **Ficha del sector:** el consejo en grande, la confianza y el botón Escuchar.
> - **Decisión:** la comunidad la anota y la llamita, la mascota de la app, lo celebra.
> - **Modo avión:** la app sigue funcionando y el chat responde con los datos guardados.

**[1:55–2:25] Datos NASA y validación**
> - **Lluvia:** GPM IMERG.
> - **Temperatura y humedad del suelo:** NASA POWER.
> - **Verdor:** MODIS.
> - **Terreno:** NASADEM.
> - **El Niño:** el índice RONI de NOAA.
>
> Entrenado con 8 zonas y 26 campañas. En zonas nuevas supera a las líneas base. En temporadas nuevas todavía no, y la app lo refleja en la confianza.

**[2:25–2:50] Impacto para la institución**
> Información por sector para cada comunidad, un registro de decisiones para el seguimiento, y una herramienta que se suma a programas de adaptación existentes. El modelo se puede llevar a otras comunidades del altiplano.

**[2:50–3:00] Pedido**
> Proponemos un piloto con `[N]` comunidades. Gracias.

### Preguntas probables de los jueces

| Pregunta | Respuesta corta |
| --- | --- |
| ¿Cómo llega a las comunidades? | Con los municipios y las ONG que ya trabajan con ellas: mapean los sectores, dejan la app instalada y capacitan a los promotores. |
| ¿Qué tan preciso es? | En zonas nuevas supera a las líneas base (error 0,56 contra 0,73). En temporadas nuevas todavía no (0,88 contra 0,74). La app muestra la confianza, que hoy es baja. |
| ¿Qué es real y qué es simulado? | Clima, verdor, terreno y RONI son reales. Los límites de los sectores, los años de descanso y los sensores son simulados, y la app lo indica en pantalla. |
| ¿Por qué la lluvia es igual para todos los sectores? | La celda de NASA POWER cubre toda la comunidad. Cada sector se distingue por su verdor (250 m) y su terreno. |
| ¿Funciona sin internet? | Sí. Los datos quedan guardados en el celular y las decisiones se envían al volver la señal. El chat responde con los datos guardados. |
| ¿El chat puede inventar números? | Con señal usa Gemini y solo números de nuestras herramientas. Sin señal usa respuestas armadas con los datos guardados. |
| ¿Aymara y quechua? | La interfaz está traducida y la voz usa modelos de Meta para aymara central y quechua del sur de Bolivia. Las traducciones necesitan revisión de hablantes nativos. |
| ¿Qué ve la institución? | Hoy las decisiones se guardan en su base de datos. El panel para la institución es el siguiente paso. |

---

## 3. Video demo oficial (30 segundos o menos, en inglés)

Este es el demo que se sube al formulario. Todo en inglés: voz, textos en pantalla y subtítulos en inglés (ayudan si hay ruido). Máximo 30 s. Sigue los tiempos de la guía: 0:00, 0:02, 0:05, 0:10 y de 0:20 a 0:30. Son unas 70 palabras para 28 s.

Formato recomendado: horizontal **16:9, 1920×1080**, con la grabación del celular al centro y los motion graphics a los lados. Las tomas del celular salen de `C:\Users\barry\Videos\Aynuqa_demo\`.

| Tiempo | Imagen | Voz (inglés) | Motion graphics |
| --- | --- | --- | --- |
| 0:00–0:02 | Equipo a cámara, todos mayores de 18 | "We are Manada Prime." | "Manada Prime" en barra inferior |
| 0:02–0:07 | Paisaje del altiplano o animación de sectores | "In the Andes, communities rotate their fields based on experience. Climate change is making that experience fail." | Sectores animados: en cultivo y en descanso |
| 0:07–0:10 | Título de la app en el celular | "And El Niño, at plus 1.97, raises the chance of drought." | Título e indicador "RONI +1.97 (NOAA)" |
| 0:10–0:18 | Celular: consejos por acción (escena 02), sector 13 con su confianza (escena 04), guardar la decisión sin señal (escena 07) | "Aynuqa Field Shift uses NASA data to advise each field: what to open, what to plant and when, with its confidence. Even offline." | Etiquetas de texto "GPM IMERG", "NASA POWER", "MODIS NDVI", "NASADEM", sin logos. Ícono de sin señal |
| 0:18–0:25 | Celular: pregunta libre a la llamita y su respuesta con la confianza (escena 12) | "Ask the llama in plain language. Tool calling keeps every number tied to our data." | Esquema: pregunta → herramienta → dato con fuente |
| 0:25–0:28 | La llamita celebrando, cierre | "The ancient and the new, deciding together." | Nombre, lema y URL. Marca **"AI-generated graphics"** |

Notas:

- **Duren 28 s o menos** para tener margen, y revisen la duración en YouTube después de subirlo.
- Digan "raises the chance of drought". Eviten "brings drought" o "will cause drought".

---

## 4. Video de demo larga (respaldo, 2 minutos, en inglés)

Opcional: si el **Link to Final Project** es el repo, no hace falta. Sirve como respaldo en el pitch presencial si falla el celular. Todo en inglés, igual que el video de 30 s. Las tomas están en `C:\Users\barry\Videos\Aynuqa_demo\`; `demo_completa.mp4` ya las trae en este orden, sin voz. Son unas 185 palabras para 2 minutos: queda espacio para que se vea la app entre frase y frase.

| # | Tiempo | Archivo | Qué se ve | Voz (inglés) |
| --- | --- | --- | --- | --- |
| 1 | 0:00–0:08 | Equipo a cámara | Presentación | "We are Manada Prime, and this is Aynuqa Field Shift." |
| 2 | 0:08–0:18 | escena01 | Entra directo a Pumani; la llamita saluda | "In the Andes, communities rotate their fields with the aynuqa. The app opens straight into the community, no sign-up." |
| 3 | 0:18–0:35 | escena02 y escena03 | Consejo agrupado por acción e interruptor "Hoy con El Niño / año normal" | "This is this year's advice for every field, grouped by what to do. One tap compares it with a normal year. Today El Niño is at plus 1.97, which raises the chance of drought." |
| 4 | 0:35–0:50 | escena04 | Ficha del sector 13: abrir, papa, de octubre a noviembre, confianza baja | "Tap a field to see its advice. Sector 13 can open for planting: potatoes, from October to November. The app always shows how confident we are. Here, it's low." |
| 5 | 0:50–1:02 | escena06 | "¿Por qué damos este consejo?" | "It also explains why. Rain and temperature are the same for the whole area. What sets each field apart is its greenness, NDVI from MODIS, and its terrain." |
| 6 | 1:02–1:22 | escena12 | Pregunta libre a la llamita y respuesta de Gemini con su confianza | "You can ask the llama in plain language. The chat runs on Gemini with tool calling: every number in the answer comes from our data, so it doesn't make figures up." |
| 7 | 1:22–1:40 | escena07 y escena08 | Sin señal: guardar la decisión ("Se enviará cuando haya señal") y el chat responde con los datos guardados | "Signal is poor in the highlands, so the app works offline. The community records its decision on the phone, and the llama still answers from saved data." |
| 8 | 1:40–1:50 | escena09 | Vuelve la señal: la decisión pasa a "Enviada" | "When the signal comes back, the decision is sent on its own." |
| 9 | 1:50–2:00 | escena11 | Modo avanzado: riesgo con intervalo, factores, NDVI | "For more detail, advanced mode shows every number behind the advice. The ancient and the new, deciding together." |

Notas:

- La app está en español. Si hace falta, el editor puede poner una etiqueta corta en inglés sobre cada pantalla, como en el video de 30 s.
- Digan "raises the chance of drought". Eviten "brings drought".

---

## 5. Guía para grabar (lo que me pasan a mí)

### Qué grabar

1. **Pantalla del celular** con la grabadora del sistema (en Android, "Grabar pantalla"):
   - 1080p o más, 30 fps, vertical.
   - Activar "Mostrar toques" (Opciones de desarrollador) para que se vean los dedos.
   - Modo **no molestar**, para que no salten notificaciones.
   - Letra normal. Instalar la app antes (botón "Instalar") para que se vea sin la barra del navegador.
   - Una toma por escena de las tablas de §3 y §4. Gestos lentos, y 2 s de espera después de cada toque.
2. **Equipo a cámara:** 2 o 3 tomas cortas, horizontal, con luz de frente y fondo tranquilo. **Ningún menor de 18 años en cuadro.**
3. **Voz en off** grabada aparte, con el celular cerca de la boca y en un cuarto sin eco. Una pista por línea, con 2 s de silencio entre líneas.
4. **Celular en mano** (opcional, 5 a 10 s): alguien usando la app al aire libre, sin menores en cuadro.

### Cómo me lo pasan

- Archivos originales, por Google Drive o cable. WhatsApp los comprime.
- Nombres: `escena03_mapa_toma2.mp4`, `voz_0-10s_toma1.m4a`, `equipo_intro_toma1.mp4`.
- Una nota con la mejor toma de cada escena, el nombre del equipo y de cada integrante, la ciudad y la URL pública del repo.

### Lo que hago yo

- Motion graphics: sectores animados (cultivo y descanso), indicador RONI +1,97, etiquetas de datos NASA (solo texto), íconos del paquete B2B, título, cierre y subtítulos en inglés.
- Marca **"AI-generated graphics"** visible en cada pieza que genere.
- Montaje del video oficial (28 s como máximo) y del video de respaldo (2 min).

---

## 6. Alternativa: demo en 7 diapositivas (en inglés)

Si prefieren diapositivas. **Máximo 7, en inglés**, con poco texto e imágenes grandes. Deben aparecer el nombre del equipo, los integrantes y el reto.

1. **Title.** *Aynuqa Field Shift: NASA data for Andean communal land rotation.* Equipo, integrantes y reto *Field Shift: Adapting Farms with NASA Data*.
2. **The aynuqa.** Foto del altiplano y diagrama de sectores en cultivo y en descanso. "Communities rotate their land every year. El Niño (NOAA RONI +1.97) increases the likelihood of drought."
3. **Customers and users.** Municipalities, the regional government and NGOs deploy it; communities use it. Low-end phones, poor signal, Spanish, Aymara or Quechua.
4. **What it does.** Per sector: drought risk, soil recovery and a recommended action, always with its confidence. Capturas de la pantalla de inicio (consejos por acción) y de la ficha del sector.
5. **NASA data.** GPM IMERG (rainfall), NASA POWER (temperature, root-zone soil moisture, radiation), MODIS NDVI MOD13Q1/MYD13Q1 via AppEEARS (greenness, 250 m), NASADEM (terrain), plus NOAA RONI. Diagrama: datos, modelo, consejo.
6. **Validation.** New zones: beats baselines (RMSE 0.56 vs 0.73). New seasons: does not yet (0.88 vs 0.74). Confidence shown with every recommendation.
7. **Deployment package and next steps.** App configured per community, internet access point, phones, training. Pilot with `[N]` communities; next: real sector boundaries, field sensors, institution dashboard.

---

## 7. Textos para el formulario (inglés, listos para pegar)

Revisen nombres, links y lo marcado entre corchetes.

### Project Name

Aynuqa Field Shift

### High-Level Project Summary

> Aynuqa Field Shift helps Andean communities decide how to manage the aynuqa, the communal land rotation of the Bolivian Altiplano, during El Niño. NOAA's RONI reached +1.97 in Aug–Oct 2026, which increases the likelihood of drought.
>
> The app uses NASA data:
> - GPM IMERG rainfall;
> - NASA POWER soil moisture and temperature;
> - MODIS NDVI;
> - NASADEM terrain.
>
> With these it estimates each sector's drought risk and soil recovery. It turns them into advice: which sector to open, how long to extend the rest, and what and when to sow. Every recommendation shows its confidence.
>
> The app works offline on low-end phones, in Spanish, Aymara and Quechua, and records each community's decisions.
>
> It is designed as a service for municipalities, the regional government and NGOs. They deploy it to the communities they support with internet access, phones and training on how to use the tool.

### Link to Project Demo

`[URL pública del video de 30 s en YouTube o Drive]`

### Link to Final Project

`[URL pública del repositorio de GitHub]` y `[URL del video de demo larga]`

### Detailed Project Description

> **What it does.** Our case study is Pumani, in Aroma Province, La Paz (about 3,900 m). For each sector of the community, the system estimates:
> 1. the drought risk for the coming season;
> 2. the soil recovery during the rest period.
>
> It turns them into an action:
> - open for cultivation;
> - keep resting, or extend the rest by a number of years;
> - start resting after harvest.
>
> Each action comes with a suggested crop and sowing window. The app shows an "El Niño today" scenario, which is the current state, and a "normal year" comparison. It also shows "twin lands": the most similar sector in another Altiplano zone, with its observed NDVI anomaly during El Niño 2015–16 or 2023–24.
>
> **Who it is for.** Customers are municipalities, the La Paz regional government and NGOs working on rural development and climate adaptation. They deploy a package to the communities they support:
> - the app, configured with each community's sectors;
> - an internet access point;
> - low-end phones;
> - training for community promoters and leaders.
>
> Communities are the end users. The institution gets sector-level information for each community and a record of community decisions for monitoring and reporting.
>
> **How it works.**
> - **Data pipeline (Python).** Monthly NASA data for Pumani and 7 analog Altiplano zones (8 zones, 26 growing seasons since 2000):
>   - GPM IMERG rainfall, gap-filled with CHIRPS;
>   - NASA POWER temperature, root-zone soil moisture and radiation;
>   - MODIS NDVI at 250 m;
>   - NASADEM elevation, slope and aspect;
>   - NOAA's Relative Oceanic Niño Index (RONI) with lags.
> - **Drought risk.** A LightGBM model trained without latitude or longitude, so it can be applied to similar communities. SHAP identifies the main drivers of each prediction.
> - **Soil recovery.** RESTREND, the NDVI residual against rainfall.
> - **Twin lands.** Nearest-neighbor similarity on terrain, baseline soil moisture and mean NDVI.
> - **Scale.** Climate variables come from one NASA POWER cell, so they are the same for all sectors of a community. Sectors differ only in NDVI and terrain.
> - **Validation, reported as obtained.**
>   - Leave-one-zone-out: the model beats both baselines (RMSE 0.56 vs 0.73).
>   - Leave-one-season-out: it does not yet (0.88 vs 0.74–0.78).
>   - Pumani backtest: the season-level correlation goes in the opposite direction to the expected one.
>   - Every recommendation therefore carries a confidence level. It is currently low.
> - **Backend.** FastAPI serves the model outputs. A chat assistant (Google Gemini with tool calling) answers in simple language using only numbers returned by our tools.
> - **Offline-first app.** A Progressive Web App (React) syncs data to the phone with PowerSync (PostgreSQL to SQLite in the browser) and keeps working without signal.
>   - Decisions recorded offline upload when the signal returns.
>   - The chat answers from saved data.
>   - Responses are compressed for poor connections.
> - **Accessibility.**
>   - Spanish, Aymara and Quechua interface, with native Aymara and Quechua speech (Meta MMS-TTS).
>   - Large text and a satellite basemap of the sectors.
>   - An advanced mode with all technical numbers.
>   - A llama mascot that reminds users which sectors need attention.
>
> **What is simulated.** Sector boundaries, years of rest and field sensors are simulated and labeled on screen. Climate, vegetation, terrain and ENSO data are real.
>
> **Next steps.**
> - A pilot with `[N]` communities with a municipality or NGO.
> - Mapping real sector boundaries with each community.
> - Field sensors.
> - More seasons of validation.
> - A dashboard for the institution.
> - Review of translations by native speakers.
>
> **Tools.** Python (pandas, xarray, LightGBM, SHAP), FastAPI, PostgreSQL, PowerSync, SQLite (WASM), React, TypeScript, Vite, Docker, Google Gemini API, Meta MMS-TTS, WebLLM (optional on-device model).

### Use of Super Intelligence (SI)

> Yes.
>
> **In development.** The team designed the solution, the data rules and the business model. We used Claude (Anthropic) through Claude Code as a coding assistant to implement and test parts of the backend, frontend and documentation, following the team's instructions.
>
> **In the app:**
> - Google Gemini powers the chat assistant and is limited to numbers returned by our own tools.
> - Meta MMS-TTS generates the Aymara and Quechua speech.
> - An optional on-device model (Qwen2.5-0.5B via WebLLM) rewrites offline answers. Its output is discarded if it adds any number not present in the data.
>
> **In the demo video.** The motion graphics were generated with AI assistance and carry a visible "AI-generated graphics" watermark. No NASA branding was used in generated content.
>
> `[Agreguen cualquier otro uso de IA del equipo.]`

### NASA Data

Se cargan con **+ Add New Link**: un renglón por fila. **Link Text** es el nombre del dato y **Link Url** la URL completa. Todos los links se verificaron el 15 de noviembre de 2026: responden 200, son públicos y llevan a la página oficial del dato.

| Link Text | Link Url |
| --- | --- |
| NASA POWER (daily point API, AG community: temperature, soil moisture, solar radiation) | https://power.larc.nasa.gov/ |
| NASA POWER Daily API documentation | https://power.larc.nasa.gov/docs/services/api/temporal/daily/ |
| GPM IMERG Final Precipitation, monthly, V07 (GPM_3IMERGM) | https://www.earthdata.nasa.gov/data/catalog/ges-disc-gpm-3imergm-07 |
| GPM IMERG Late Precipitation, daily, V07 (GPM_3IMERGDL) | https://www.earthdata.nasa.gov/data/catalog/ges-disc-gpm-3imergdl-07 |
| MODIS/Terra Vegetation Indices 16-Day 250 m V061 (MOD13Q1, NDVI) | https://www.earthdata.nasa.gov/data/catalog/lpcloud-mod13q1-061 |
| MODIS/Aqua Vegetation Indices 16-Day 250 m V061 (MYD13Q1, NDVI) | https://www.earthdata.nasa.gov/data/catalog/lpcloud-myd13q1-061 |
| NASADEM Merged DEM Global 1 arc second V001 (elevation, slope, aspect) | https://www.earthdata.nasa.gov/data/catalog/lpcloud-nasadem-hgt-001 |
| NASA AppEEARS (used to extract MODIS NDVI and NASADEM) | https://appeears.earthdatacloud.nasa.gov/ |

### Space Agency Partner Data and Other References

No usamos datos de agencias socias. Aquí van los demás datos, modelos, código y tipografías que usamos, incluidas las herramientas con las que hicimos los videos. Mismo formato.

| Link Text | Link Url |
| --- | --- |
| NOAA CPC Relative Oceanic Niño Index (RONI) | https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt |
| NOAA CPC Oceanic Niño Index (ONI), reference only | https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt |
| CHIRPS v2.0 rainfall (UCSB Climate Hazards Center), gap-filling | https://www.chc.ucsb.edu/data/chirps |
| SENAMHI Bolivia, Ayo Ayo station (validation only) | https://senamhi.gob.bo/ |
| Esri World Imagery basemap (Esri, Maxar, Earthstar Geographics, GIS User Community) | https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a4 |
| Meta MMS-TTS Aymara voice (facebook/mms-tts-ayr, CC-BY-NC 4.0) | https://huggingface.co/facebook/mms-tts-ayr |
| Meta MMS-TTS Quechua voice (facebook/mms-tts-quh, CC-BY-NC 4.0) | https://huggingface.co/facebook/mms-tts-quh |
| Google Gemini API | https://ai.google.dev/gemini-api/docs |
| Google Gen AI Python SDK (google-genai) | https://github.com/googleapis/python-genai |
| WebLLM (MLC), optional on-device model | https://github.com/mlc-ai/web-llm |
| Qwen2.5-0.5B-Instruct (MLC build used by WebLLM) | https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC |
| LightGBM | https://github.com/lightgbm-org/LightGBM |
| SHAP | https://github.com/shap/shap |
| pandas | https://pandas.pydata.org/ |
| xarray | https://xarray.dev/ |
| FastAPI | https://fastapi.tiangolo.com/ |
| PostgreSQL | https://www.postgresql.org/ |
| PowerSync (self-hosted service) | https://github.com/powersync-ja/powersync-service |
| React | https://react.dev/ |
| Vite | https://vite.dev/ |
| Workbox (offline caching) | https://developer.chrome.com/docs/workbox/ |
| Docker | https://www.docker.com/ |
| Atkinson Hyperlegible font (SIL OFL) | https://fonts.google.com/specimen/Atkinson+Hyperlegible |
| Lora font (SIL OFL) | https://fonts.google.com/specimen/Lora |
| faster-whisper (demo video: subtitle timing) | https://github.com/SYSTRAN/faster-whisper |
| noisereduce (demo video: audio cleanup) | https://github.com/timsainb/noisereduce |
| FFmpeg (demo video: editing and encoding) | https://ffmpeg.org/ |
| Playwright (demo video: screen recording and motion graphics) | https://playwright.dev/ |
| Project source code (GitHub) | https://github.com/krilinxito/aynuqa-field-shift |
| Demo video (YouTube) | https://youtu.be/_nsD0_TYTzk |

Notas:

- La página de CHIRPS en la IRI Data Library (de donde descarga el código) ahora pide inicio de sesión; por eso el link es la página pública de UCSB.
- NASADEM_NC.001 no tiene página propia: su DOI lleva a la misma página de NASADEM.
- La documentación de Gemini redirige a Google AI Studio ("Docs - Gemini API").

---

## 8. Cómo decirlo

| Usen | Eviten |
| --- | --- |
| "El Niño aumenta la probabilidad de sequía" | "Va a haber sequía" |
| "Confianza baja; es una guía para la comunidad" | "El modelo predice con precisión" |
| "Los límites y años de descanso son simulados" | Presentar los sectores como reales |
| "La lluvia es la misma para toda la comunidad" | Diferencias de lluvia entre sectores |
| "La tierra gemela tuvo una anomalía de verdor de X" | Cultivos, rendimientos o pérdidas inventados |
| "La comunidad decide" | "La app decide" |
| "Un piloto con `[N]` comunidades" | Clientes o convenios que todavía no existen |
