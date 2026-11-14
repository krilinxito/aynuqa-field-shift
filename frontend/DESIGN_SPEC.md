# AYNUQA FIELD SHIFT — Especificación de diseño

> Fase 00 · Documento de dirección visual y experiencia. No contiene implementación.

## 1. Propósito y principios

AYNUQA FIELD SHIFT es una herramienta de apoyo a decisiones para la comunidad de Pumani. Su interfaz debe ayudar a responder, con rapidez y evidencia, tres preguntas: qué está ocurriendo en el territorio, qué sector requiere atención y qué acción conviene considerar. No reemplaza a la asamblea ni al criterio agronómico.

Principios rectores:

1. **Territorio antes que tablero.** La maqueta topográfica o su alternativa 2D ocupa la superficie principal; los datos explican el territorio, no compiten con él.
2. **Decisión antes que métrica.** En modo sencillo se muestra primero la recomendación, luego sus motivos, riesgo, recuperación y confianza.
3. **Lenguaje cotidiano antes que siglas.** “Vegetación por debajo de lo habitual” precede a “anomalía NDVI”. RONI y NDVI se explican en contexto y no se exigen para usar el producto.
4. **Zona y sector no se mezclan.** Lluvia, temperatura, humedad regional y RONI se presentan como condiciones de Pumani. Vegetación, terreno, rotación, riesgo, recuperación y recomendación se asocian al sector.
5. **La incertidumbre siempre se ve.** Toda predicción muestra confianza. El Niño aumenta probabilidades; nunca se presenta como causa segura.
6. **Lo simulado siempre se identifica.** Polígonos, rotación y sensores simulados llevan una indicación textual cercana. El color no es la única señal.
7. **Mobile-first real.** El caso base es un celular de gama baja, al aire libre y con señal intermitente.
8. **Profundidad progresiva.** El modo sencillo es predeterminado. El análisis avanzado amplía la misma selección de sector y escenario, sin reiniciar el contexto.

## 2. Lectura de las referencias

Las dos imágenes de `referencia/` fueron inspeccionadas. Se usan como dirección compositiva, no como plantillas ni como fuente de color.

### Referencia 1 — `Captura de pantalla 2026-11-14 131443.png`

- **Composición:** división casi equilibrada entre una superficie de contexto a la izquierda y un mapa continuo a la derecha. La fotografía superior y la información inferior forman una sola columna editorial, no una cuadrícula de widgets independientes.
- **Distribución:** navegación vertical muy estrecha, contenido principal amplio y un panel flotante secundario sobre el mapa. La relación entre objeto seleccionado y contexto geográfico es inmediata.
- **Tipografía:** cifras grandes y livianas, títulos breves, subtítulos pequeños; el contraste de escala establece la jerarquía más que los contenedores.
- **Jerarquía:** primero se reconoce el lugar, luego sus indicadores y finalmente las acciones. Las métricas se agrupan por proximidad y divisores suaves.
- **Navegación:** iconos compactos con estado activo inequívoco. Para AYNUQA se conservarán etiquetas visibles junto a los iconos por accesibilidad.
- **Aplicación al producto:** terreno protagonista, diagnóstico contextual adyacente, rail lateral en escritorio y detalle del sector sin abandonar la geografía.
- **Qué no se adopta:** fotografía inmobiliaria, chat flotante sobre el mapa, botones circulares repetidos, colores originales ni el uso frecuente de superficies redondeadas.

### Referencia 2 — `Captura de pantalla 2026-11-14 131456.png`

- **Composición:** encabezado corto, gran indicador dominante, transacciones organizadas en filas y un gráfico que ocupa una superficie completa. Un panel derecho concentra una tarea específica.
- **Distribución:** el contenido se agrupa por bandas editoriales. El gráfico no vive en una tarjeta pequeña: es una región principal con espacio para lectura.
- **Tipografía:** saludo y cifras con gran contraste de escala; rótulos discretos y valores destacados. La jerarquía se apoya en peso, tamaño y alineación.
- **Jerarquía:** una cifra principal orienta; los datos secundarios explican; la acción queda aislada en una zona propia.
- **Navegación:** rail lateral compacto y panel contextual persistente. El estado activo es visible sin depender de animación.
- **Aplicación al producto:** recomendación y riesgo como titulares; series históricas integradas en el área avanzada; diagnóstico en filas y bandas, no en una colección de tarjetas.
- **Qué no se adopta:** amarillo fluorescente, degradado multicolor de fondo, teclado financiero, cápsulas repetidas ni bordes excesivamente redondeados.

### Síntesis visual propia

La interfaz combinará la división territorial de la primera referencia con la jerarquía tipográfica y gráfica de la segunda. El resultado debe sentirse como un **atlas de decisión contemporáneo**: preciso, sereno, táctil y con grandes superficies continuas. No debe parecer una plantilla de analítica SaaS.

## 3. Identidad visual

### 3.1 Marca provisional

- Nombre visible: **AYNUQA FIELD SHIFT**.
- Marca provisional: círculo geométrico simple, sin detalle ornamental.
- El círculo vive en un componente de marca independiente de la navegación; el futuro logo podrá reemplazarlo sin cambiar dimensiones, rutas o estructura del menú.
- Tamaño recomendado: 28 px en móvil y 32 px en escritorio; área táctil mínima de 44 × 44 px cuando sea interactivo.
- La marca no comunica estado ni funciona como indicador de carga.

### 3.2 Paleta obligatoria

| Rol | Color | Uso |
| --- | --- | --- |
| Fondo principal | `#F8F4F2` | Lienzo, app shell, fondo de impresión claro |
| Acento | `#00CCA0` | Selección territorial, controles activos, líneas de énfasis, progreso |
| Texto y contraste | `#412F25` | Texto principal, iconos, bordes fuertes, superficies de alto contraste |

El acento `#00CCA0` no se usa como texto pequeño sobre `#F8F4F2`, porque esa combinación no ofrece contraste suficiente. Se reserva para áreas, líneas gruesas, focos gráficos y controles donde el texto interior sea `#412F25`.

### 3.3 Colores derivados funcionales

Los derivados solo existen para jerarquía, accesibilidad y estado. Antes de implementación se verificarán sus pares con una herramienta de contraste.

| Rol | Propuesta | Regla |
| --- | --- | --- |
| Fondo elevado tenue | `#FFFCFA` | Diferenciar paneles sin sombra |
| Verde muy tenue | `#E6F7F1` | Profundidad de fondo y selección suave |
| Acento oscuro | `#006B57` | Texto/enlace funcional cuando el acento base no contraste |
| Texto secundario | `#6F5D53` | Metadatos; nunca por debajo del contraste AA |
| Divisor | `#D8CEC8` | Bordes de 1 px y ejes |
| Riesgo bajo | `#176B55` | Siempre acompañado por “Riesgo bajo” |
| Riesgo medio | `#8A5A00` | Siempre acompañado por “Riesgo medio” |
| Riesgo alto/error | `#A33A32` | Siempre acompañado por texto y/o icono |
| Aviso/desactualizado | `#7A4F00` | Estado offline o dato antiguo, con fecha visible |

En gráficos y terreno, cada nivel combinará color con trama, contorno, etiqueta o forma. Ninguna interpretación dependerá solo de distinguir rojo y verde.

### 3.4 Degradados

Se permiten únicamente como atmósfera de fondo y transición espacial:

- De `#F8F4F2` a un verde muy tenue como `#E6F7F1`.
- Con diferencias de luminosidad pequeñas y sin múltiples puntos de color.
- En superficies amplias, nunca detrás de texto de baja jerarquía ni como relleno decorativo de cada bloque.
- La transición Tierra–Pumani puede usar el degradado para unir escenas, pero no simular datos.

Quedan excluidos los degradados arcoíris, neón, púrpura-azul típicos de SaaS y cualquier fondo multicolor sin función.

## 4. Tipografía

La única familia es **Montserrat**. Para garantizar funcionamiento offline, en una fase posterior se alojarán localmente los subconjuntos y pesos necesarios.

| Estilo | Móvil | Escritorio | Peso | Interlineado | Uso |
| --- | --- | --- | --- | --- | --- |
| Display | 36–44 px | 52–64 px | 700 | 0.98–1.05 | Riesgo, cifra o decisión dominante |
| Título de página | 26–32 px | 36–44 px | 700 | 1.05–1.12 | Territorio, Análisis |
| Título de sección | 20–24 px | 24–30 px | 600–700 | 1.15 | Recomendación, Historial |
| Subtítulo/control | 15–17 px | 15–18 px | 600 | 1.25 | Navegación y acciones |
| Cuerpo | 16 px mínimo | 16–18 px | 400 | 1.5–1.65 | Explicaciones y motivos |
| Metadato | 13–14 px | 13–14 px | 500 | 1.35–1.45 | Fuente, fecha, unidad |
| Etiqueta de gráfico | 12–13 px | 12–13 px | 500–600 | 1.3 | Ejes y leyendas |

Reglas:

- No usar mayúsculas sostenidas en párrafos. Se permiten en el wordmark y microetiquetas breves con tracking de `0.04em` a `0.08em`.
- Las cifras usan alineación tabular cuando se comparan en columnas.
- Los títulos no superan dos líneas en móvil.
- Los términos técnicos incluyen nombre cotidiano primero y sigla después: “Estado de la vegetación (NDVI)”.
- No reducir texto para hacer caber contenido; se reordena la composición.

## 5. Sistema espacial y geometría

Escala base de 4 px:

| Token conceptual | Valor | Uso principal |
| --- | --- | --- |
| `space-1` | 4 px | Ajustes internos mínimos |
| `space-2` | 8 px | Relación icono–etiqueta |
| `space-3` | 12 px | Grupos compactos |
| `space-4` | 16 px | Padding móvil estándar |
| `space-6` | 24 px | Separación de secciones |
| `space-8` | 32 px | Ritmo editorial |
| `space-12` | 48 px | Cambios de bloque |
| `space-16` | 64 px | Márgenes de escritorio |

- `border-radius: 0` por defecto.
- Radio de 2–4 px solo para controles cuyo reconocimiento o interacción lo requiera: campos, focus ring contenido, tooltip, selector segmentado.
- Divisores de 1 px sustituyen sombras y tarjetas.
- No hay sombras decorativas. Una sombra funcional mínima solo podrá indicar un elemento elevado temporal, como un menú abierto, tras validar contraste.
- Objetivos táctiles: 44 × 44 px mínimo; se recomienda 48 × 48 px para acciones principales.
- Márgenes laterales: 16 px a 320–390, 24–32 px a 768, 32–48 px a 1024 y 48–64 px a 1440+.

## 6. Iconografía y controles

- Iconos lineales simples, consistentes y siempre acompañados por etiqueta en navegación.
- No usar iconos para decorar títulos o métricas.
- Máximo cuatro destinos de primer nivel: **Territorio**, **Análisis**, **Asistente** e **Informe**.
- El selector de escenario expresa “El Niño actual” y “Año normal”; no se limita a `nino`/`normal`.
- El cambio “Sencillo / Avanzado” mantiene sector y escenario. “Avanzado” lleva al área de Análisis sin limpiar la selección.
- Los estados activo, hover, focus y disabled son distinguibles sin animación.
- El círculo de marca está desacoplado de los iconos del sistema.

## 7. Composición responsive

### 7.1 320, 360 y 390 px

Orden de lectura:

1. Encabezado compacto: marca, Pumani, conexión/actualización.
2. Selector de escenario de ancho completo.
3. Terreno o mapa 2D, entre 42 y 52 `svh`, con sector seleccionado y control de alternativa/lista.
4. Resumen del sector como flujo editorial: nombre, estado, recomendación, riesgo, recuperación, motivos, confianza, fecha y procedencia.
5. Navegación inferior permanente con cuatro iconos y etiquetas, considerando `safe-area-inset-bottom`.

Reglas móviles:

- Una sola columna; cero scroll horizontal.
- El terreno conserva prioridad sin ocultar la recomendación debajo de overlays permanentes.
- El detalle puede expandirse como sección en el flujo, no como una tarjeta flotante que cubra el mapa.
- Las listas de sectores ofrecen una alternativa accesible al toque sobre el terreno.
- Los controles críticos permanecen visibles y no dependen de hover.
- En 320 px se pueden abreviar metadatos, pero no etiquetas de navegación ni niveles de riesgo.

### 7.2 768 px

- En vertical: terreno superior amplio y diagnóstico inferior en dos bandas.
- En horizontal: navegación compacta y relación terreno/diagnóstico cercana a 60/40.
- El análisis puede mostrar gráfico y leyenda en la misma superficie, con tabla accesible debajo o en un panel alternable.

### 7.3 1024 px

- Rail lateral de 64–72 px con icono y etiqueta abreviada visible.
- Área territorial aproximada de 60–65% y diagnóstico contextual de 35–40%.
- El escenario se ubica junto al título del territorio, no como control flotante aislado.
- El análisis avanzado sustituye o amplía el panel contextual sin perder la selección en el mapa.

### 7.4 1440 px y superiores

- Rail lateral estable; contenido con márgenes de 48–64 px.
- Terreno de 62–68% y panel editorial de 32–38%, con ancho de lectura limitado.
- Series históricas pueden ocupar una banda inferior completa para evitar gráficos estrechos.
- No se multiplica el número de columnas por tener más espacio; se amplían las superficies útiles y el espacio negativo.

## 8. Experiencia por modo

### Modo sencillo — predeterminado

Para el sector seleccionado muestra, en este orden:

1. Estado general en una frase.
2. Recomendación accionable.
3. Riesgo de sequía, con nivel, valor legible y confianza.
4. Recuperación estimada, con nivel y confianza.
5. Dos o tres motivos principales (`drivers` y `reasons`) en español claro.
6. Precedente de tierra gemela si existe, presentado como precedente y no como garantía.
7. Fecha de actualización, procedencia (`mock`/`real`) y etiquetas de simulación.

La información climática regional se muestra una sola vez para Pumani. No se repite por sector.

### Modo avanzado — área Análisis

Mantiene `sector`, `scenario` y rango temporal. Organiza el contenido en secciones, no en un mosaico de tarjetas:

- Historia: vegetación, lluvia, humedad, temperatura y RONI.
- Anomalías: NDVI y precipitación, con unidades y valores faltantes explícitos.
- Comparación de escenarios: misma geometría y sector; diferencias de riesgo sin sugerir que el clima observado cambia entre sectores.
- Backtest: serie temporal regional primero; evidencia sectorial secundaria con notas y tamaños de muestra.
- Tierra gemela: similitud, evento y anomalía observada, sin cultivos o pérdidas inventadas.
- Sensores simulados: helada y estrés hídrico con sello “Simulado”.
- Confianza y procedencia siempre visibles.

## 9. Territorio 3D y alternativa 2D

### Representación 3D

- Maqueta topográfica editorial, no globo navegable ni simulador mundial.
- El relieve definitivo proviene de NASADEM. Hasta disponer del recurso verificado, cualquier placeholder se rotula como demostración y no como medición.
- Los polígonos de sectores son simulados y se etiquetan como tales.
- La selección usa contorno, cambio de textura/contraste y etiqueta; no solo color.
- El sector seleccionado se refleja simultáneamente en el diagnóstico y en la lista accesible.
- Controles limitados a rotación/inclinación y restablecer vista, con límites que impidan perder Pumani.
- El escenario cambia la capa diagnóstica, no la topografía ni la ubicación.

### Alternativa 2D

- Disponible por detección de WebGL, rendimiento bajo, preferencia del usuario o error de escena.
- Reutiliza GeoJSON, selección, leyendas, etiquetas y estado de aplicación.
- Debe ofrecer la misma decisión y contenido; solo cambia la representación espacial.
- Puede usar SVG o Canvas liviano. La lista de sectores sigue siendo la alternativa semántica principal.

## 10. Animación inicial documentada

Secuencia:

1. Tierra geométrica simple sobre fondo principal.
2. Giro lento mientras se preparan app shell, fuente esencial y recurso territorial mínimo.
3. Al estar listo el contenido esencial o cumplirse un tiempo máximo, inicia el acercamiento.
4. La Tierra aumenta de escala y su geometría se abstrae.
5. La forma y el color enlazan con el relieve de Pumani.
6. Aparece el sistema operativo con el foco en el encabezado principal.

Condiciones:

- No bloquea consultas remotas ni espera indefinidamente; el contenido entra con estados parciales.
- Se reproduce una vez por sesión o primera apertura, no en navegación interna.
- Con `prefers-reduced-motion: reduce`, se sustituye por un fundido corto o entrada inmediata.
- Si falla WebGL, la secuencia termina en la representación 2D.
- La Tierra no es interactiva y no introduce navegación global.
- Duración objetivo normal: 1.8–2.8 s; límite duro recomendado: 4 s antes de mostrar la aplicación.
- Debe existir una acción “Omitir” accesible si supera 2 s.

## 11. Estados de interfaz

| Estado | Comportamiento |
| --- | --- |
| Inicio | Esqueleto estructural estable; no simula cifras ni parpadea |
| Carga parcial | Territorio, zona y diagnóstico aparecen por partes con etiqueta de carga específica |
| Éxito | Fecha, fuente y confianza visibles cerca del resultado |
| Sin dato (`null`) | “Sin dato disponible”; nunca `0`, guion ambiguo ni valor inventado |
| Mock | “Datos de demostración” cerca del conjunto afectado |
| Simulado | “Sector simulado”, “Rotación simulada” o “Sensor simulado” según alcance |
| Offline con caché | Banner persistente: “Sin conexión · mostrando datos del {fecha}” |
| Offline sin caché | App shell y ayuda de recuperación; no se muestra un diagnóstico vacío como válido |
| Dato desactualizado | Fecha y aviso no alarmista; acción “Intentar actualizar” |
| Error recuperable | Mensaje en español, causa práctica si se conoce y acción de reintento |
| Error WebGL | Cambio automático a 2D y aviso discreto |
| Chat offline | Campo deshabilitado con explicación; conserva sugerencias, no inventa respuesta |
| Selección | Sector identificado en terreno, lista, encabezado y URL/estado compartido |
| Conflicto de escenario | Nunca mezcla respuestas; se conserva la anterior hasta que la nueva esté lista o se indica transición |

Los avisos usan `aria-live="polite"`; los errores de acción usan anuncio inmediato solo cuando sea necesario.

## 12. Accesibilidad

Objetivo: WCAG 2.2 AA.

- Contraste AA para texto, controles, estados y foco. El acento base no se usa como texto de bajo contraste.
- Foco visible de al menos 2–3 px, separado del borde del control y nunca eliminado.
- Orden de tabulación equivalente al orden visual.
- Enlace “Saltar al contenido”. Regiones `header`, `nav`, `main`, `aside` y `footer` con nombres claros.
- Navegación operable con teclado, lector de pantalla y tacto.
- Objetivos táctiles de al menos 44 × 44 px y separación suficiente.
- El terreno tiene lista/tabla equivalente para seleccionar sectores; la escena 3D no es el único control.
- Gráficos con título, resumen textual, leyenda, unidades y tabla de datos accesible.
- Color reforzado con texto, tramas, contornos o formas.
- Respeto a `prefers-reduced-motion`, `prefers-contrast` cuando sea viable y zoom de texto hasta 200%.
- Mensajes y ayuda en español simple; las siglas incluyen definición contextual.
- Fechas en formato comprensible y unidades unidas al valor.
- El reporte imprimible mantiene orden semántico, alto contraste y no depende de fondos.

## 13. Heurísticas de Nielsen aplicadas

| Heurística | Aplicación en AYNUQA |
| --- | --- |
| Visibilidad del estado | Conexión, carga, escenario, sector, fuente, fecha y confianza siempre reconocibles |
| Correspondencia con el mundo real | “Lluvia”, “descanso”, “vegetación” y “sector”; tecnicismos como detalle opcional |
| Control y libertad | Cambiar sector/escenario, volver a vista sencilla, omitir intro y restablecer vista |
| Consistencia y estándares | Mismos nombres, niveles, unidades y patrones en territorio, análisis e informe |
| Prevención de errores | Deshabilitar acciones imposibles offline, confirmar solo acciones irreversibles futuras, validar rango temporal |
| Reconocer antes que recordar | Sector y escenario visibles; sugerencias del chat; leyendas junto al gráfico |
| Flexibilidad y eficiencia | Acceso directo a Análisis, persistencia de selección y rangos recientes para usuarios avanzados |
| Estética minimalista | Una acción principal, superficies continuas, divisores y ausencia de decoración sin función |
| Recuperación ante errores | Mensaje claro, datos preservados, reintento y fallback 2D/offline |
| Ayuda y documentación | Ayuda contextual breve junto a RONI, confianza y simulación; nunca un tutorial obligatorio |

## 14. Criterios para evitar una interfaz genérica

Una propuesta se rechaza si cumple cualquiera de estos patrones:

- Usa una cuadrícula de tarjetas redondeadas intercambiables como estructura principal.
- Relega el territorio a una tarjeta más pequeña que los indicadores.
- Presenta más de una cifra dominante sin una decisión clara.
- Usa sombras, glassmorphism, brillos o degradados para crear jerarquía.
- Repite iconos en cada título o agrega indicadores sin una acción asociada.
- Oculta fuente, fecha, confianza o simulación en tooltips.
- Muestra clima distinto por sector o presenta El Niño como certeza causal.
- Introduce búsqueda mundial, selector de país o mapa global interactivo.
- Usa texto comercial, párrafos extensos o una portada tipo landing antes de la herramienta.
- Sustituye estados reales por animaciones decorativas o puntos parpadeantes.

Se considera alineada si:

- El territorio y la recomendación se entienden en los primeros segundos.
- La composición usa tipografía, alineación y espacio negativo como jerarquía.
- El modo sencillo funciona sin conocer NDVI, RONI o machine learning.
- El modo avanzado profundiza sin cambiar de producto ni perder contexto.
- La experiencia sigue siendo completa en 2D, offline con caché y con movimiento reducido.

## 15. Decisiones pendientes para validación visual

- Validar los derivados de estado con pruebas de contraste sobre fondo, gráficos y terreno.
- Probar Montserrat en pantallas de 320 px y bajo brillo exterior.
- Confirmar con usuarios la comprensión de “Recuperación estimada”, “Confianza” y “Año normal”.
- Validar que cuatro destinos inferiores sean reconocibles sin saturar 320 px.
- Probar si el diagnóstico móvil funciona mejor en flujo continuo o panel expandible, sin cubrir el territorio.
- Definir la simplificación de NASADEM y la textura 2D una vez disponible el recurso real.
