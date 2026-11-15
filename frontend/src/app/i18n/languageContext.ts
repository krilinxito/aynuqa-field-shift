import { createContext, use } from 'react'

export type Language = 'es' | 'en' | 'ay' | 'qu'

export interface UiStrings {
  // Header & Nav
  largeText: string
  normalText: string
  downloadPhone: string
  installShort: string
  understood: string
  offlineNotice: string
  lastSyncNotice: (date: string) => string
  demoDataNotice: string
  navMyCommunity: string
  navAsk: string
  skipToContent: string
  mainNavLabel: string
  settings: string
  closeSettings: string
  languageLabel: string
  textSizeLabel: string
  show: string
  hide: string
  notFoundTitle: string
  notFoundBody: string
  backHome: string

  // Community picker (/comunidad)
  welcomeQuestion: string
  welcomeTap: string
  yourCommunity: string
  seeOtherCommunities: string
  seeOtherCommunitiesSub: string
  noDataYet: string

  // Community overview (/mi-comunidad)
  changeCommunity: string
  sectorsLead: (count: number) => string
  whatToDoThisYear: string
  oneSector: string
  manySectors: (count: number) => string
  askLlama: string
  moreDetailsStepByStep: string
  mapTitle: string
  mapSub: string
  mapHint: string
  riskWeatherTitle: string
  riskWeatherSub: string
  twinsTitle: string
  twinsSub: string
  printAssembly: string
  listenSummary: string
  listenAdvice: string
  listen: string
  stopListening: string
  loadingAudio: string

  // Scenario switch
  seeAdviceFor: string
  todayNino: string
  normalYear: string
  comparisonTitle: string
  comparisonBody: string

  // Sector detail (/sector)
  backTo: (name: string) => string
  simulatedRestNote: string
  mainAdvice: string
  howSure: string
  askAboutSector: string
  explanationStepByStep: string
  whyAdviceTitle: string
  whyAdviceSub: string
  whyShort: string
  twinSectionTitle: string
  twinSectionSub: (zone: string) => string
  weatherSectionTitle: string
  weatherSectionSub: string

  // Weather & Provenance
  weatherInZone: (name: string) => string
  equalForAllSectors: string
  simulatedFooter: string
  demoFooter: string
  updatedLabel: string

  // Chat (/preguntar)
  askLlamaTitle: string
  answersAboutCommunity: (name: string) => string
  answersAboutSector: (sector: string, name: string) => string
  comparingNormal: string
  chatOffline: string
  tapQuestion: string
  otherQuickQuestions: string
  youAsked: string
  noticeLabel: string
  retry: string
  llamaAnswers: string
  responding: string
  speak: string
  listening: string
  orWriteQuestion: string
  writePlaceholder: string
  askButton: string
  chatFootnote: string

  // Decisiones
  decisionTitle: string
  decisionIntro: string
  decisionRecommended: string
  decisionNoteLabel: string
  decisionNotePlaceholder: string
  decisionSave: string
  decisionSaved: string
  decisionSavedOffline: string
  decisionSaveError: string
  decisionHistory: string
  decisionFollowed: string
  decisionDifferent: string
  decisionPending: string
  decisionSynced: string
  decisionDelete: string

  // Modo avanzado y llamita
  advancedMode: string
  mascotTalkative: string
  mascotAutoSpeak: string
  mascotNotify: string
  advancedTitle: string
  advancedZoneTitle: string
  advancedBacktestTitle: string
  advancedNdviTitle: string
  advancedTableToggle: string

  // Llamita mascota
  mascotLabel: string
  mascotTap: string
  mascotClose: string

  // Mapa de sectores
  mapViewLabel: string
  mapPhoto: string
  mapColors: string
  mapLegendResting: string
  mapLegendCultivated: string
  mapLegendRisk: string
  mapNorthSimulated: string
  mapPhotoUnavailable: string
  mapSectorLabel: (number: string, risk: string) => string

  // IA sin señal
  localAiDownload: string
  localAiDownloading: (percent: number) => string
  localAiReady: string
  localAiError: string

  // Avisos de la llamita
  remindersUnsupported: string
  remindersDenied: string
  remindersOn: string

  // Actualización de la app
  updateAvailable: string
  updateNow: string
  updating: string
  updateLater: string
}

export const UI_STRINGS: Record<Language, UiStrings> = {
  es: {
    largeText: 'Letra grande',
    normalText: 'Letra normal',
    downloadPhone: 'Instalar en el celular',
    installShort: 'Instalar',
    understood: 'Entendido',
    offlineNotice: 'Sin señal. Se muestran los últimos datos guardados.',
    lastSyncNotice: (date) => `Última conexión con datos: ${date}.`,
    demoDataNotice: 'Datos de demostración',
    navMyCommunity: 'Mi comunidad',
    navAsk: 'Preguntar',
    skipToContent: 'Saltar al contenido',
    mainNavLabel: 'Navegación principal',
    settings: 'Ajustes',
    closeSettings: 'Cerrar ajustes',
    languageLabel: 'Idioma',
    textSizeLabel: 'Tamaño de letra',
    show: 'Ver',
    hide: 'Ocultar',
    notFoundTitle: 'Esta página no existe',
    notFoundBody: 'Puede volver al inicio con el botón.',
    backHome: 'Volver al inicio',

    welcomeQuestion: '¿De qué comunidad es usted?',
    welcomeTap: 'Toque su comunidad para entrar.',
    yourCommunity: 'Su comunidad',
    seeOtherCommunities: 'Ver otras comunidades',
    seeOtherCommunitiesSub: 'Toque si busca otra comunidad del altiplano',
    noDataYet: 'Todavía sin datos.',

    changeCommunity: '← Cambiar comunidad',
    sectorsLead: (n) => `${n} sectores · Toque uno para ver su consejo`,
    whatToDoThisYear: 'Qué conviene este año',
    oneSector: '1 sector',
    manySectors: (n) => `${n} sectores`,
    askLlama: 'Preguntar a la llamita',
    moreDetailsStepByStep: 'Más detalles paso a paso (toque para abrir):',
    mapTitle: 'Dibujo de los sectores',
    mapSub: 'Ver el mapa y elegir tocando',
    mapHint: 'Toque un número en el dibujo para abrirlo.',
    riskWeatherTitle: 'Riesgo de sequía y clima',
    riskWeatherSub: 'Niveles de riesgo, lluvia y temperatura',
    twinsTitle: 'Tierras gemelas',
    twinsSub: 'Qué pasó en comunidades parecidas',
    printAssembly: 'Imprimir para la asamblea',
    listenSummary: 'Escuchar el resumen',
    listenAdvice: 'Escuchar el consejo',
    listen: 'Escuchar',
    stopListening: 'Parar',
    loadingAudio: 'Cargando… (toque para parar)',

    seeAdviceFor: 'Ver el consejo para:',
    todayNino: 'Hoy, con El Niño',
    normalYear: 'Si fuera un año normal',
    comparisonTitle: 'Esto es una comparación.',
    comparisonBody: 'No es lo que pasa hoy: hoy hay El Niño.',

    backTo: (name) => `← Volver a ${name}`,
    simulatedRestNote: 'Años de descanso simulados',
    mainAdvice: 'Consejo principal',
    howSure: 'Qué tan seguros estamos:',
    askAboutSector: 'Preguntar sobre este sector',
    explanationStepByStep: 'Explicación paso a paso (toque para abrir):',
    whyAdviceTitle: '¿Por qué damos este consejo?',
    whyAdviceSub: 'Motivos, riesgo de sequía y suelo',
    whyShort: '¿Por qué?',
    twinSectionTitle: 'Qué pasó en una tierra parecida',
    twinSectionSub: (z) => `Comparación con ${z}`,
    weatherSectionTitle: 'El tiempo en la zona',
    weatherSectionSub: 'Lluvia, temperatura y humedad',

    weatherInZone: (name) => `El tiempo en toda la zona de ${name}`,
    equalForAllSectors: 'Es igual para todos los sectores.',
    simulatedFooter: 'Datos simulados: límites y descanso. Clima y verdor de satélites NASA.',
    demoFooter: 'Datos de demostración: números de ejemplo.',
    updatedLabel: 'Actualizado:',

    askLlamaTitle: 'Pregunte a la llamita',
    answersAboutCommunity: (name) => `Responde sobre la comunidad de ${name}`,
    answersAboutSector: (s, name) => `Responde sobre el ${s} de ${name}`,
    comparingNormal: ', comparando con un año normal',
    chatOffline: 'Sin señal. La llamita contesta con lo guardado en el celular.',
    tapQuestion: 'Toque una pregunta',
    otherQuickQuestions: 'Otras preguntas rápidas:',
    youAsked: 'Usted preguntó',
    noticeLabel: 'Aviso',
    retry: 'Intentar de nuevo',
    llamaAnswers: 'La llamita responde',
    responding: 'Respondiendo',
    speak: 'Hablar',
    listening: 'Escuchando…',
    orWriteQuestion: 'O escriba su pregunta',
    writePlaceholder: 'Escriba aquí su pregunta…',
    askButton: 'Preguntar',
    chatFootnote:
      'La llamita usa los datos de la comunidad. La decisión final es de la asamblea.',
    decisionTitle: '¿Qué decidió la comunidad?',
    decisionIntro: 'Si la asamblea ya decidió, anótelo aquí. No es obligatorio y puede elegir algo distinto al consejo.',
    decisionRecommended: 'lo recomendado',
    decisionNoteLabel: 'Nota (opcional)',
    decisionNotePlaceholder: 'Por ejemplo: lo hablamos en la asamblea del domingo',
    decisionSave: 'Guardar decisión',
    decisionSaved: 'Decisión guardada.',
    decisionSavedOffline: 'Decisión guardada en el celular. Se enviará cuando haya señal.',
    decisionSaveError: 'No se pudo guardar. Intente de nuevo.',
    decisionHistory: 'Decisiones anotadas',
    decisionFollowed: 'Siguió el consejo',
    decisionDifferent: 'Eligió otra cosa',
    decisionPending: 'Se enviará cuando haya señal',
    decisionSynced: 'Enviada',
    decisionDelete: 'Borrar',
    advancedMode: 'Modo avanzado (números técnicos)',
    mascotTalkative: 'Llamita habladora',
    mascotAutoSpeak: 'Que la llamita hable en voz alta sola',
    mascotNotify: 'Que la llamita me avise (notificación)',
    advancedTitle: 'Números técnicos',
    advancedZoneTitle: 'Zona: clima y El Niño (igual para todos los sectores)',
    advancedBacktestTitle: '¿Acertó el modelo en años pasados? (backtest)',
    advancedNdviTitle: 'Verdor del sector (NDVI) mes a mes',
    advancedTableToggle: 'Ver los números en tabla',
    mascotLabel: 'La llamita',
    mascotTap: 'Tocar a la llamita para que hable',
    mascotClose: 'Cerrar lo que dice la llamita',
    mapViewLabel: 'Cómo ver el mapa',
    mapPhoto: 'Foto satelital',
    mapColors: 'Dibujo',
    mapLegendResting: 'Rayado: en descanso',
    mapLegendCultivated: 'Liso: en cultivo',
    mapLegendRisk: 'Borde: riesgo de sequía (bajo, medio, alto)',
    mapNorthSimulated: 'Arriba es el norte. Límites de sectores simulados.',
    mapPhotoUnavailable: 'La foto no cargó (sin señal). Se muestra el dibujo.',
    mapSectorLabel: (n, risk) => `Sector ${n}, riesgo ${risk}. Tocar para abrir.`,
    localAiDownload: 'Descargar la llamita sin señal (IA, unos 400 MB, una vez)',
    localAiDownloading: (p) => `Descargando la llamita sin señal… ${p} %`,
    localAiReady: 'Llamita sin señal lista ✓ (contesta mejor sin internet)',
    localAiError: 'No se pudo descargar. Intente con wifi.',
    remindersUnsupported: 'Este celular no permite avisos con la app cerrada. Instale la app en Android (Chrome) para recibirlos.',
    remindersDenied: 'No dio permiso para avisos. Puede cambiarlo en los ajustes del celular.',
    remindersOn: 'Listo: si pasan 3 días sin visitar, la llamita le avisa.',
    updateAvailable: 'Hay una versión nueva de la app.',
    updateNow: 'Actualizar',
    updating: 'Actualizando…',
    updateLater: 'Después',
  },
  en: {
    largeText: 'Large text',
    normalText: 'Normal text',
    downloadPhone: 'Install on your phone',
    installShort: 'Install',
    understood: 'Got it',
    offlineNotice: 'No signal. Showing the last saved data.',
    lastSyncNotice: (date) => `Last data connection: ${date}.`,
    demoDataNotice: 'Demo data',
    navMyCommunity: 'My community',
    navAsk: 'Ask',
    skipToContent: 'Skip to content',
    mainNavLabel: 'Main navigation',
    settings: 'Settings',
    closeSettings: 'Close settings',
    languageLabel: 'Language',
    textSizeLabel: 'Text size',
    show: 'Show',
    hide: 'Hide',
    notFoundTitle: 'This page does not exist',
    notFoundBody: 'You can go back to the start with the button.',
    backHome: 'Back to start',

    welcomeQuestion: 'Which community are you from?',
    welcomeTap: 'Tap your community to enter.',
    yourCommunity: 'Your community',
    seeOtherCommunities: 'See other communities',
    seeOtherCommunitiesSub: 'Tap if you are looking for another Altiplano community',
    noDataYet: 'No data yet.',

    changeCommunity: '← Change community',
    sectorsLead: (n) => `${n} fields · Tap one to see its advice`,
    whatToDoThisYear: 'What to do this year',
    oneSector: '1 field',
    manySectors: (n) => `${n} fields`,
    askLlama: 'Ask the llama',
    moreDetailsStepByStep: 'More details, step by step (tap to open):',
    mapTitle: 'Map of the fields',
    mapSub: 'See the map and pick by tapping',
    mapHint: 'Tap a number on the map to open it.',
    riskWeatherTitle: 'Drought risk and weather',
    riskWeatherSub: 'Risk levels, rain and temperature',
    twinsTitle: 'Twin lands',
    twinsSub: 'What happened in similar communities',
    printAssembly: 'Print for the community meeting',
    listenSummary: 'Listen to the summary',
    listenAdvice: 'Listen to the advice',
    listen: 'Listen',
    stopListening: 'Stop',
    loadingAudio: 'Loading… (tap to stop)',

    seeAdviceFor: 'See the advice for:',
    todayNino: 'Today, with El Niño',
    normalYear: 'If it were a normal year',
    comparisonTitle: 'This is a comparison.',
    comparisonBody: 'It is not what is happening now: today there is El Niño.',

    backTo: (name) => `← Back to ${name}`,
    simulatedRestNote: 'Simulated years of rest',
    mainAdvice: 'Main advice',
    howSure: 'How sure we are:',
    askAboutSector: 'Ask about this field',
    explanationStepByStep: 'Step-by-step explanation (tap to open):',
    whyAdviceTitle: 'Why do we give this advice?',
    whyAdviceSub: 'Reasons, drought risk and soil',
    whyShort: 'Why?',
    twinSectionTitle: 'What happened on a similar land',
    twinSectionSub: (z) => `Comparison with ${z}`,
    weatherSectionTitle: 'Weather in the area',
    weatherSectionSub: 'Rain, temperature and soil moisture',

    weatherInZone: (name) => `Weather across the whole ${name} area`,
    equalForAllSectors: 'It is the same for every field.',
    simulatedFooter: 'Simulated data: field boundaries and rest years. Climate and greenness from NASA satellites.',
    demoFooter: 'Demo data: example numbers.',
    updatedLabel: 'Updated:',

    askLlamaTitle: 'Ask the llama',
    answersAboutCommunity: (name) => `Answers about the ${name} community`,
    answersAboutSector: (s, name) => `Answers about ${s.replace(/^el sector/i, 'field')} in ${name}`,
    comparingNormal: ', compared with a normal year',
    chatOffline: 'No signal. The llama answers with what is saved on the phone.',
    tapQuestion: 'Tap a question',
    otherQuickQuestions: 'Other quick questions:',
    youAsked: 'You asked',
    noticeLabel: 'Notice',
    retry: 'Try again',
    llamaAnswers: 'The llama answers',
    responding: 'Answering',
    speak: 'Speak',
    listening: 'Listening…',
    orWriteQuestion: 'Or type your question',
    writePlaceholder: 'Type your question here…',
    askButton: 'Ask',
    chatFootnote:
      'The llama uses the community data. The final decision belongs to the community.',
    decisionTitle: 'What did the community decide?',
    decisionIntro: 'If the community already decided, write it down here. It is optional, and it can be different from the advice.',
    decisionRecommended: 'recommended',
    decisionNoteLabel: 'Note (optional)',
    decisionNotePlaceholder: 'For example: we discussed it at Sunday’s meeting',
    decisionSave: 'Save decision',
    decisionSaved: 'Decision saved.',
    decisionSavedOffline: 'Decision saved on the phone. It will be sent when there is signal.',
    decisionSaveError: 'Could not save. Please try again.',
    decisionHistory: 'Recorded decisions',
    decisionFollowed: 'Followed the advice',
    decisionDifferent: 'Chose something else',
    decisionPending: 'Will be sent when there is signal',
    decisionSynced: 'Sent',
    decisionDelete: 'Delete',
    advancedMode: 'Advanced mode (technical numbers)',
    mascotTalkative: 'Chatty llama',
    mascotAutoSpeak: 'Let the llama speak out loud on its own',
    mascotNotify: 'Let the llama remind me (notification)',
    advancedTitle: 'Technical numbers',
    advancedZoneTitle: 'Area: climate and El Niño (same for every field)',
    advancedBacktestTitle: 'Was the model right in past years? (backtest)',
    advancedNdviTitle: 'Field greenness (NDVI) month by month',
    advancedTableToggle: 'See the numbers in a table',
    mascotLabel: 'The llama',
    mascotTap: 'Tap the llama to make it talk',
    mascotClose: 'Close what the llama says',
    mapViewLabel: 'How to see the map',
    mapPhoto: 'Satellite photo',
    mapColors: 'Drawing',
    mapLegendResting: 'Striped: resting',
    mapLegendCultivated: 'Plain: planted',
    mapLegendRisk: 'Border: drought risk (low, medium, high)',
    mapNorthSimulated: 'North is up. Field boundaries are simulated.',
    mapPhotoUnavailable: 'The photo did not load (no signal). Showing the drawing.',
    mapSectorLabel: (n, risk) => `Field ${n}, ${risk} risk. Tap to open.`,
    localAiDownload: 'Download the offline llama (AI, about 400 MB, once)',
    localAiDownloading: (p) => `Downloading the offline llama… ${p} %`,
    localAiReady: 'Offline llama ready ✓ (better answers without internet)',
    localAiError: 'Could not download. Try with wifi.',
    remindersUnsupported: 'This phone does not allow reminders while the app is closed. Install the app on Android (Chrome) to get them.',
    remindersDenied: 'You did not allow reminders. You can change it in the phone settings.',
    remindersOn: 'Done: if 3 days go by without a visit, the llama will remind you.',
    updateAvailable: 'A new version of the app is ready.',
    updateNow: 'Update',
    updating: 'Updating…',
    updateLater: 'Later',
  },
  ay: {
    largeText: "Jach'a qillqa",
    normalText: 'Qillqa',
    downloadPhone: 'Celulararu apaqaña',
    installShort: 'Apaqaña',
    understood: 'Walikiwa',
    offlineNotice: 'Janiw señal utjkiti. Qhipa imat yatiyawinakaw uñacht’ayasi.',
    lastSyncNotice: (date) => `Qhipa yatiyawi katuqata: ${date}.`,
    demoDataNotice: 'Uñacht’äwi yatiyawinaka',
    navMyCommunity: 'Markaja',
    navAsk: 'Jiskt’aña',
    skipToContent: 'Yatiyawiru saraña',
    mainNavLabel: 'Nayriri thakhi',
    settings: 'Wakicht’aña',
    closeSettings: 'Wakicht’äwi jist’antaña',
    languageLabel: 'Aru',
    textSizeLabel: 'Qillqa jach’a',
    show: 'Uñjaña',
    hide: 'Imaña',
    notFoundTitle: 'Aka laphix janiw utjkiti',
    notFoundBody: 'Qalltaruw kutt’asma.',
    backHome: 'Qalltaru kutt’aña',

    welcomeQuestion: '¿Kawkïri markatätasa?',
    welcomeTap: 'Markaman sutipa limt’amantañataki.',
    yourCommunity: 'Markama',
    seeOtherCommunities: 'Yaqha markanak uñjaña',
    seeOtherCommunitiesSub: 'Altiplano yaqha markanak thaqhañataki limt’am',
    noDataYet: 'Todavía sin datos (Janiw yatiyawi utjkiti).',

    changeCommunity: '← Marka turkaña',
    sectorsLead: (n) => `${n} aynuqa suyunaka · Mayaru limt’am iwxt’äwip uñjañataki`,
    whatToDoThisYear: 'Kunsa jichha marax luraña wakisi',
    oneSector: '1 suyu',
    manySectors: (n) => `${n} suyunaka`,
    askLlama: 'Qarwaru jiskt’aña',
    moreDetailsStepByStep: 'Juk’amp yatiyawinaka (lliwt’am uñjañataki):',
    mapTitle: 'Suyunakana jamuqapa',
    mapSub: 'Mapa uñjaña ukat limt’asa ajlliña',
    mapHint: 'Jamuqan mä jakhuru limt’am llawirañataki.',
    riskWeatherTitle: 'Waña pacha ukat jallu pacha',
    riskWeatherSub: 'Waña pacha, jallu ukat junt’u-thaya',
    twinsTitle: 'Kikpa uraqinaka (Tierras gemelas)',
    twinsSub: 'Kunas kikpa ayllunakan pasäna',
    printAssembly: 'Tantachäwitaki liq’suña (Imprimir)',
    listenSummary: 'Ist’aña (Resumen)',
    listenAdvice: 'Iwxt’äwi ist’aña',
    listen: 'Ist’aña',
    stopListening: 'Sayt’ayaña',
    loadingAudio: 'Apanintaski… (sayt’ayañataki limt’am)',

    seeAdviceFor: 'Iwxt’äwi uñjaña:',
    todayNino: 'Jichhürunaka, El Niño pachampi',
    normalYear: 'Waliki maräspa ukham (Año normal)',
    comparisonTitle: 'Akax mä kipkipäwiwa.',
    comparisonBody: 'Janiw jichhürjamäkiti: jichhax El Niño pachawa.',

    backTo: (name) => `← ${name} markaru kutt’aña`,
    simulatedRestNote: 'Samaraña maranakax uñacht’äwiwa',
    mainAdvice: 'Jach’a iwxt’äwi',
    howSure: 'Kunjam atinisiñasa:',
    askAboutSector: 'Aka suyut jiskt’aña',
    explanationStepByStep: 'Kunjamsa uñjasi (lliwt’am llawirañataki):',
    whyAdviceTitle: '¿Kunatsa aka iwxt’äwix churasï?',
    whyAdviceSub: 'Motivos, waña pacha ukat uraqi',
    whyShort: '¿Kunatsa?',
    twinSectionTitle: 'Kunas kikpa uraqin pasäna',
    twinSectionSub: (z) => `${z} markampi kipkipäwi`,
    weatherSectionTitle: 'Markana pachapa',
    weatherSectionSub: 'Jallu, thaya ukat uraqina umapi',

    weatherInZone: (name) => `${name} markana pachapa`,
    equalForAllSectors: 'Taqpach suyunakatakix pachparakiwa.',
    simulatedFooter: 'Datos simulados: samaraña maranaka. NASA satélitenakan yatiyawipa.',
    demoFooter: 'Datos de demostración: uñacht’äwi jakhunaka.',
    updatedLabel: 'Machaqachata:',

    askLlamaTitle: 'Qarwaru jiskt’am',
    answersAboutCommunity: (name) => `${name} markat jaysaski`,
    answersAboutSector: (s, name) => `${name} markan ${s} suyupat jaysaski`,
    comparingNormal: ', waliki marampi kipkipasa',
    chatOffline: 'Janiw señal utjkiti. Qarwax celularan imatanakampiw jaysi.',
    tapQuestion: 'Mä jiskt’äwi limt’am',
    otherQuickQuestions: 'Yaqha jiskt’äwinaka:',
    youAsked: 'Jumax jiskt’awaytawa',
    noticeLabel: 'Yatiyäwi',
    retry: 'Wasitat yant’aña',
    llamaAnswers: 'Qarwax jaysiwa',
    responding: 'Jaysaskiwa',
    speak: 'Arsuña',
    listening: 'Ist’askiwa…',
    orWriteQuestion: 'Jan ukax jiskt’äwima qillqam',
    writePlaceholder: 'Akaru jiskt’äwima qillqam…',
    askButton: 'Jiskt’aña',
    chatFootnote:
      'Qarwax markan yatiyawipampi yanapt’i. Tantachäwiw amti.',
    decisionTitle: '¿Kunsa ayllux amtäna?',
    decisionIntro: 'Tantachäwix amtchi ukhaxa, akan qillqt’am. Janiw wakiskiti, yaqha amtsa ajllitasma.',
    decisionRecommended: 'iwxt’ata',
    decisionNoteLabel: 'Qillqa (munasax)',
    decisionNotePlaceholder: 'Sañäni: tumingu tantachäwin parlapxta',
    decisionSave: 'Amta imaña',
    decisionSaved: 'Amtax imatawa.',
    decisionSavedOffline: 'Amtax celularan imatawa. Señal utjkani ukhaw apayasini.',
    decisionSaveError: 'Janiw imaskiti. Wasitat yant’am.',
    decisionHistory: 'Qillqt’at amtanaka',
    decisionFollowed: 'Iwxt’äwir arkäna',
    decisionDifferent: 'Yaqha ajllïna',
    decisionPending: 'Señal utjkani ukhaw apayasini',
    decisionSynced: 'Apayatawa',
    decisionDelete: 'Chhaqtayaña',
    advancedMode: 'Juk’amp yatxatäwi (jakhunaka)',
    mascotTalkative: 'Arst’iri qarwa',
    mascotAutoSpeak: 'Qarwax jach’at arsupan',
    mascotNotify: 'Qarwax yatiyitapan',
    advancedTitle: 'Jakhunaka (técnico)',
    advancedZoneTitle: 'Marka: pacha ukat El Niño (taqi suyutakix pachpa)',
    advancedBacktestTitle: '¿Nayra maranakan modelox atinti? (backtest)',
    advancedNdviTitle: 'Suyun ch’uxña (NDVI) sapa phaxsi',
    advancedTableToggle: 'Jakhunak tablan uñjaña',
    mascotLabel: 'Qarwa',
    mascotTap: 'Qarwar limt’am arsuñapataki',
    mascotClose: 'Qarwan arsutap jist’antaña',
    mapViewLabel: 'Kunjams mapa uñjaña',
    mapPhoto: 'Satélite jamuqa',
    mapColors: 'Siq’i',
    mapLegendResting: 'Siq’ita: samarañana',
    mapLegendCultivated: 'Llamp’u: yapuchäwina',
    mapLegendRisk: 'Thiya: waña pacha (jisk’a, taypi, jach’a)',
    mapNorthSimulated: 'Patax alay toqiwa. Suyunakan thiyanakapax uñacht’äwiwa.',
    mapPhotoUnavailable: 'Jamuqax janiw apanintkiti (jan señal). Siq’iw uñacht’ayasi.',
    mapSectorLabel: (n, risk) => `${n} suyu, waña ${risk}. Limt’am llawirañataki.`,
    localAiDownload: 'Jan señal qarwa apaqaña (IA, 400 MB, mä kuti)',
    localAiDownloading: (p) => `Jan señal qarwa apaqaski… ${p} %`,
    localAiReady: 'Jan señal qarwax wakicht’atawa ✓',
    localAiError: 'Janiw apaqañjamäkiti. Wifimpi yant’am.',
    remindersUnsupported: 'Aka celularax janiw yatiyawinak churkiti. Android (Chrome) ukan app uchantam.',
    remindersDenied: 'Janiw yatiyawinakatak iyaw sktati. Celularan wakicht’äwipan turkasma.',
    remindersOn: 'Walikiwa: 3 uru jan visitstaxa, qarwax yatiyätam.',
    updateAvailable: 'Hay una versión nueva de la app.',
    updateNow: 'Actualizar',
    updating: 'Actualizando…',
    updateLater: 'Después',
  },
  qu: {
    largeText: 'Hatun qillqa',
    normalText: 'Qillqa',
    downloadPhone: 'Celularman uraykachiy',
    installShort: 'Uraykachiy',
    understood: 'Allinmi',
    offlineNotice: 'Mana señal kanchu. Qhipa waqaychasqa willakuykuna rikuchikushan.',
    lastSyncNotice: (date) => `Qhipa willakuy chaskisqa: ${date}.`,
    demoDataNotice: 'Qhawarichiy willakuykuna',
    navMyCommunity: 'Aylluy',
    navAsk: 'Tapukuy',
    skipToContent: 'Willakuyman pasay',
    mainNavLabel: 'Hatun ñan',
    settings: 'Allichay',
    closeSettings: 'Allichayta wisq’ay',
    languageLabel: 'Simi',
    textSizeLabel: 'Qillqaq hatun kaynin',
    show: 'Qhaway',
    hide: 'Pakay',
    notFoundTitle: 'Kay p’anqaqa manam kanchu',
    notFoundBody: 'Qallariyman kutiyta atinki.',
    backHome: 'Qallariyman kutiy',

    welcomeQuestion: '¿Mayqin ayllumantataq kanki?',
    welcomeTap: 'Aylluykiq sutinta ñit’iy yaykunapaq.',
    yourCommunity: 'Aylluyki',
    seeOtherCommunities: 'Huk ayllukunata qhaway',
    seeOtherCommunitiesSub: 'Huk altiplano aylluta maskhaspaqa ñit’iy',
    noDataYet: 'Todavía sin datos (Manaraq willakuy kanchu).',

    changeCommunity: '← Aylluta t’ikray',
    sectorsLead: (n) => `${n} aynuqa suyukuna · Hukta ñit’iy yuyaychayninta qhawanapaq`,
    whatToDoThisYear: 'Imataq kunan wata ruway allin kanman',
    oneSector: '1 suyu',
    manySectors: (n) => `${n} suyukuna`,
    askLlama: 'Llamitata tapukuy',
    moreDetailsStepByStep: 'Astawan willakuykuna (ñit’iy kicharinapaq):',
    mapTitle: 'Suyukunaq siq’in (Mapa)',
    mapSub: 'Mapata qhaway chaymanta ñit’ispa akllay',
    mapHint: 'Siq’ipi huk yupayta ñit’iy kicharinapaq.',
    riskWeatherTitle: 'Ch’aki pacha chaymanta pacha qhaway',
    riskWeatherSub: 'Ch’aki pacha, para chaymanta q’uñi-chiri',
    twinsTitle: 'Kikillan allpakuna (Tierras gemelas)',
    twinsSub: 'Imataq kikillan ayllukunapi karqan',
    printAssembly: 'Huñunakuypaq horqoy (Imprimir)',
    listenSummary: 'Uyariy (Resumen)',
    listenAdvice: 'Yuyaychayta uyariy',
    listen: 'Uyariy',
    stopListening: 'Sayachiy',
    loadingAudio: 'Apamuchkan… (sayachinapaq ñit’iy)',

    seeAdviceFor: 'Yuyaychayta qhaway:',
    todayNino: 'Kunan, El Niño pachawan',
    normalYear: 'Allin wata hina (Año normal)',
    comparisonTitle: 'Kayqa tupachiyllam.',
    comparisonBody: 'Manam kunan p’unchaw hinachu: kunanqa El Niño kachkan.',

    backTo: (name) => `← ${name} aylluman kutiy`,
    simulatedRestNote: 'Samay watakunaqa rikch’anachisqam',
    mainAdvice: 'Hatun yuyaychay',
    howSure: 'Imayna atienekuyninchik:',
    askAboutSector: 'Kay suyumanta tapukuy',
    explanationStepByStep: 'Imaynamanta sut’inchay (ñit’iy kicharinapaq):',
    whyAdviceTitle: '¿Imaraykutaq kay yuyaychayta qunchik?',
    whyAdviceSub: 'Motivos, ch’aki pacha chaymanta allpa',
    whyShort: '¿Imarayku?',
    twinSectionTitle: 'Imataq kikillan allpapi karqan',
    twinSectionSub: (z) => `${z} aylluwan tupachiy`,
    weatherSectionTitle: 'Aylluq pachan',
    weatherSectionSub: 'Para, q’uñi chaymanta allpaq unun',

    weatherInZone: (name) => `${name} aylluq pachan`,
    equalForAllSectors: 'Llapan suyukunapaq kaqllataqmi.',
    simulatedFooter: 'Datos simulados: samay watakuna. NASA satélitemanta willakuy.',
    demoFooter: 'Datos de demostración: qhawarichiy yupaykuna.',
    updatedLabel: 'Musuqchasqa:',

    askLlamaTitle: 'Llamitata tapukuy',
    answersAboutCommunity: (name) => `${name} ayllumanta kutichin`,
    answersAboutSector: (s, name) => `${name} aylluq ${s} suyunmanta kutichin`,
    comparingNormal: ', allin watawan tupachispa',
    chatOffline: 'Mana señal kanchu. Llamitaqa celularpi waqaychasqawan kutichin.',
    tapQuestion: 'Huk tapukuyta ñit’iy',
    otherQuickQuestions: 'Huk utqay tapukuykuna:',
    youAsked: 'Tapukurqanki',
    noticeLabel: 'Willakuy',
    retry: 'Wakmantawan ruway',
    llamaAnswers: 'Llamita kutichin',
    responding: 'Kutichichkan',
    speak: 'Rimay',
    listening: 'Uyarichkan…',
    orWriteQuestion: 'Utak tapukuyniykita qillqay',
    writePlaceholder: 'Kaypi tapukuyniykita qillqay…',
    askButton: 'Tapukuy',
    chatFootnote:
      'Llamitaqa aylluq willakuyninwan yanapan. Huñunakuymi qhipa simita nin.',
    decisionTitle: '¿Imatataq ayllu yuyaykurqan?',
    decisionIntro: 'Huñunakuy yuyaykurqanña chayqa, kaypi qillqay. Manam kamachikuychu, huk ruwaytapas akllayta atinki.',
    decisionRecommended: 'yuyaychasqa',
    decisionNoteLabel: 'Willay (munaspaqa)',
    decisionNotePlaceholder: 'Kayhina: domingo huñunakuypi rimarqayku',
    decisionSave: 'Yuyaykusqata waqaychay',
    decisionSaved: 'Waqaychasqañam.',
    decisionSavedOffline: 'Celularpi waqaychasqam. Señal kaptin apachikunqa.',
    decisionSaveError: 'Mana waqaychakunchu. Wakmanta ruway.',
    decisionHistory: 'Qillqasqa yuyaykusqakuna',
    decisionFollowed: 'Yuyaychayta qatirqan',
    decisionDifferent: 'Huk ruwayta akllarqan',
    decisionPending: 'Señal kaptin apachikunqa',
    decisionSynced: 'Apachisqañam',
    decisionDelete: 'Pichay',
    advancedMode: 'Astawan yachay (yupaykuna)',
    mascotTalkative: 'Rimaq llamita',
    mascotAutoSpeak: 'Llamita kunkanwan rimachun',
    mascotNotify: 'Llamita willawachun',
    advancedTitle: 'Yupaykuna (técnico)',
    advancedZoneTitle: 'Ayllu: pacha chaymanta El Niño (llapan suyupaq kaqlla)',
    advancedBacktestTitle: '¿Ñawpa watakunapi modelo atinchu? (backtest)',
    advancedNdviTitle: 'Suyuq q’umir kaynin (NDVI) sapa killa',
    advancedTableToggle: 'Yupaykunata tablapi qhaway',
    mascotLabel: 'Llamita',
    mascotTap: 'Llamitata ñit’iy rimananpaq',
    mascotClose: 'Llamitaq nisqanta wisq’ay',
    mapViewLabel: 'Imaynatam mapata qhawana',
    mapPhoto: 'Satélite rikch’ay',
    mapColors: 'Siq’i',
    mapLegendResting: 'Siq’isqa: samaypi',
    mapLegendCultivated: 'Llamp’u: tarpuypi',
    mapLegendRisk: 'Pata: ch’aki pacha (pisi, chawpi, hatun)',
    mapNorthSimulated: 'Hanaqqa wichay ladom. Suyukunaq patanqa rikch’anachisqam.',
    mapPhotoUnavailable: 'Rikch’ayqa mana chayamunchu (mana señal). Siq’im rikuchikun.',
    mapSectorLabel: (n, risk) => `${n} suyu, ch’aki ${risk}. Ñit’iy kicharinapaq.`,
    localAiDownload: 'Mana señal llamitata uraykachiy (IA, 400 MB, huk kutilla)',
    localAiDownloading: (p) => `Mana señal llamitata uraykachichkan… ${p} %`,
    localAiReady: 'Mana señal llamitaqa listañam ✓',
    localAiError: 'Mana uraykachiyta atikunchu. Wifiwan ruway.',
    remindersUnsupported: 'Kay celularqa mana willakuykunata qunchu. Android (Chrome) nisqapi appta churay.',
    remindersDenied: 'Mana willakuykunapaq ari nirqankichu. Celularpa allichayninpi t’ikrayta atinki.',
    remindersOn: 'Listo: 3 p’unchaw mana watukuspaqa, llamita willasunki.',
    updateAvailable: 'Hay una versión nueva de la app.',
    updateNow: 'Actualizar',
    updating: 'Actualizando…',
    updateLater: 'Después',
  },
}

type Replacement = string | ((match: string, ...groups: string[]) => string)

const MONTHS: Record<string, string> = {
  enero: 'January', febrero: 'February', marzo: 'March', abril: 'April', mayo: 'May', junio: 'June',
  julio: 'July', agosto: 'August', septiembre: 'September', octubre: 'October', noviembre: 'November', diciembre: 'December',
}
const LEVELS: Record<string, string> = { alto: 'high', alta: 'high', medio: 'medium', media: 'medium', bajo: 'low', baja: 'low' }
const month = (name: string) => MONTHS[name.toLowerCase()] ?? name
const level = (name: string) => LEVELS[name.toLowerCase()] ?? name
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
/** "el sector 4" → "field 4"; "los sectores 1, 2 y 3" → "fields 1, 2 and 3". */
const fieldsEn = (text: string) =>
  text.replace(/^el sector (\d+)$/i, 'field $1').replace(/^los sectores (.+) y (\d+)$/i, 'fields $1 and $2')

const PHRASE_REPLACEMENTS: Record<
  Exclude<Language, 'es'>,
  ReadonlyArray<[RegExp, Replacement]>
> = {
  en: [
    // Respuestas sin señal (localAnswers.ts)
    [/Se puede abrir (el sector \d+|los sectores [\d, y]+) para cultivo\./gi, (_m, w) => `${cap(fieldsEn(w))} can open for planting.`],
    [/Se puede abrir (el sector \d+|los sectores [\d, y]+)\./gi, (_m, w) => `${cap(fieldsEn(w))} can open.`],
    [/Este año no se sugiere abrir ningún sector\./gi, 'This year no field is suggested to open.'],
    [/Riesgo alto de sequía en (.+?)\./gi, 'High drought risk in $1.'],
    [/Ningún sector tiene riesgo alto\./gi, 'No field has high risk.'],
    [/Este año no se sugiere sembrar en ningún sector\./gi, 'This year no field is suggested for planting.'],
    [/: este año no se sugiere sembrar\./gi, ': no planting is suggested this year.'],
    [/Conviene seguir en descanso: /gi, 'Keep resting: '],
    [/Ningún sector necesita alargar el descanso\./gi, 'No field needs a longer rest.'],
    [/Hoy hay El Niño \(índice RONI de NOAA: ([^)]+)\)\. El Niño aumenta la probabilidad de sequía; no es seguro que ocurra\./gi, 'Today there is El Niño (NOAA RONI index: $1). El Niño raises the chance of drought; it is not certain to happen.'],
    [/Está viendo la comparación con un año normal, sin El Niño\./gi, 'You are seeing the comparison with a normal year, without El Niño.'],
    [/No tengo ese dato guardado\./gi, 'I do not have that data saved.'],
    [/El Niño se mide con el RONI de NOAA\./gi, 'El Niño is measured with NOAA’s RONI.'],
    [/Respuesta sin señal, con los datos guardados\./gi, 'Answer without signal, using saved data.'],
    // Consejo principal (viene de los resultados del modelo)
    [/Se puede abrir este sector para cultivo\./gi, 'This field can open for planting.'],
    [/Mantener este sector en descanso\./gi, 'Keep this field resting.'],
    [/Extender el descanso de este sector\./gi, 'Extend the rest of this field.'],
    [/Continuar cultivando este sector\./gi, 'Keep planting this field.'],
    [/Seguir cultivando este sector un año más\./gi, 'Keep planting this field for one more year.'],
    [/Pasar este sector a descanso cuando termine la cosecha\./gi, 'Let this field rest after the harvest.'],
    // Motivos
    [/Como es costumbre en la aynuqa, el primer año se siembra papa \(de octubre a noviembre\)\./gi, 'As is customary in the aynuqa, potatoes are planted the first year (October to November).'],
    [/Completó (\d+) años de descanso y la recuperación del suelo es (alta|media|baja)\./gi, (_m, n, l) => `It completed ${n} years of rest and soil recovery is ${({ alta: 'high', media: 'medium', baja: 'low' } as Record<string, string>)[l.toLowerCase()]}.`],
    [/El riesgo de sequía es (alto|medio|bajo)\./gi, (_m, l) => `Drought risk is ${({ alto: 'high', medio: 'medium', bajo: 'low' } as Record<string, string>)[l.toLowerCase()]}.`],
    [/El suelo necesita descansar para recuperar su fertilidad\./gi, 'The soil needs rest to recover its fertility.'],
    [/Le faltan (\d+) año\(s\) para completar el descanso\./gi, (_m, n) => `${n} more year${n === '1' ? '' : 's'} to complete its rest.`],
    [/Lleva (\d+) año\(s\) de cultivo; el ciclo de la aynuqa es de (\d+) años\./gi, (_m, n, c) => `${n} year${n === '1' ? '' : 's'} of planting so far; the aynuqa cycle is ${c} years.`],
    [/Lleva (\d+) año\(s\) de descanso; el ciclo de la aynuqa es de (\d+) años\./gi, (_m, n, c) => `${n} year${n === '1' ? '' : 's'} of rest so far; the aynuqa cycle is ${c} years.`],
    [/Ya lleva (\d+) años seguidos de cultivo, el ciclo completo de la aynuqa\./gi, '$1 years of planting in a row, the full aynuqa cycle.'],
    // Factores del riesgo
    [/El Niño \(índice RONI de ([a-z]+) a ([a-z]+)\)/gi, (_m, a, b) => `El Niño (RONI index, ${month(a)} to ${month(b)})`],
    [/Temperatura de ([a-z]+) a ([a-z]+)/gi, (_m, a, b) => `Temperature, ${month(a)} to ${month(b)}`],
    [/Estado de la vegetación en campaña anterior/gi, 'Vegetation in the previous season'],
    [/: sube el riesgo\./gi, ': raises the risk.'],
    [/: baja el riesgo\./gi, ': lowers the risk.'],
    // Acciones
    [/Pasar a descanso después de la cosecha/gi, 'Rest after the harvest'],
    [/Abrir para cultivo/gi, 'Open for planting'],
    [/Seguir en descanso/gi, 'Keep resting'],
    [/Seguir cultivando/gi, 'Keep planting'],
    [/Otra cosa/gi, 'Something else'],
    // Estado del sector
    [/En descanso hace (\d+) años?/gi, (_m, n) => `Resting for ${n} year${n === '1' ? '' : 's'}`],
    [/En cultivo hace (\d+) años?/gi, (_m, n) => `Planted for ${n} year${n === '1' ? '' : 's'}`],
    [/Descanso sugerido: (\d+) años? más\./gi, (_m, n) => `Suggested rest: ${n} more year${n === '1' ? '' : 's'}.`],
    [/Cultivo sugerido: papa\./gi, 'Suggested crop: potato.'],
    [/Cultivo sugerido: quinua\./gi, 'Suggested crop: quinoa.'],
    [/Siembra: octubre a noviembre\./gi, 'Sowing: October to November.'],
    // Confianza
    [/Tómelo solo como una señal: los datos no alcanzan para más\./gi, 'Take it only as a signal: the data is not enough for more.'],
    [/Es una guía, no una certeza\./gi, 'It is a guide, not a certainty.'],
    [/Los datos coinciden bastante, pero nada es seguro\./gi, 'The data agrees fairly well, but nothing is certain.'],
    [/La confianza más baja de estos consejos es (baja|media|alta)\./gi, (_m, l) => `The lowest confidence of this advice is ${level(l)}.`],
    [/Confianza (baja|media|alta)/gi, (_m, l) => `Confidence: ${level(l)}`],
    // Riesgo y suelo
    [/El Niño aumenta la probabilidad de sequía en el próximo ciclo\. No es seguro que ocurra\./gi, 'El Niño raises the chance of drought in the next season. It is not certain to happen.'],
    [/Así se vería el riesgo en un año normal, sin El Niño\./gi, 'This is how the risk would look in a normal year, without El Niño.'],
    [/Riesgo de sequía: (alto|medio|bajo)/gi, (_m, l) => `Drought risk: ${level(l)}`],
    [/Riesgo de sequía\./gi, 'Drought risk.'],
    [/Riesgo (alto|medio|bajo)/gi, (_m, l) => `${cap(level(l))} risk`],
    [/Recuperación del suelo: buena/gi, 'Soil recovery: good'],
    [/Recuperación del suelo: a medias/gi, 'Soil recovery: partial'],
    [/Recuperación del suelo: poca/gi, 'Soil recovery: low'],
    [/El verdor del sector muestra que el suelo descansó bien\./gi, 'The field’s greenness shows the soil rested well.'],
    [/El verdor del sector muestra que el suelo todavía se está recuperando\./gi, 'The field’s greenness shows the soil is still recovering.'],
    [/El verdor del sector muestra que al suelo le falta recuperarse\./gi, 'The field’s greenness shows the soil still needs to recover.'],
    // Tierras gemelas
    [/En (.+?) hay una tierra (muy parecida|parecida|algo parecida) a este sector\./gi, (_m, z, sim) => `In ${z} there is a land ${({ 'muy parecida': 'very similar', parecida: 'similar', 'algo parecida': 'somewhat similar' } as Record<string, string>)[sim.toLowerCase()]} to this field.`],
    [/Allí, durante El Niño de ([\d-]+), el verdor del campo/gi, 'There, during El Niño $1, the greenness of the land'],
    [/estuvo muy por debajo de lo normal/gi, 'was well below normal'],
    [/estuvo por debajo de lo normal/gi, 'was below normal'],
    [/estuvo cerca de lo normal/gi, 'was close to normal'],
    [/estuvo por encima de lo normal/gi, 'was above normal'],
    [/no tiene dato/gi, 'has no data'],
    [/en la tierra parecida/gi, 'on the similar land'],
    [/Se parece (al sector|a los sectores)/gi, (_m, w) => (w.toLowerCase() === 'al sector' ? 'It resembles field' : 'It resembles fields')],
    [/Es lo que pasó allá: sirve como precedente, no como garantía\./gi, 'That is what happened there: it is a precedent, not a guarantee.'],
    // Clima de la zona
    [/\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de (\d{4})\b/gi, (_m, mo, y) => `${month(mo)} ${y}`],
    [/El Niño está fuerte/gi, 'El Niño is strong'],
    [/El Niño está moderado/gi, 'El Niño is moderate'],
    [/El Niño está débil/gi, 'El Niño is weak'],
    [/El Niño no está activo/gi, 'El Niño is not active'],
    [/Hay La Niña/gi, 'There is La Niña'],
    [/Comparación: como si El Niño no estuviera activo\./gi, 'Comparison: as if El Niño were not active.'],
    [/\(índice ([^)]+)\)/gi, '(index $1)'],
    [/Lluvia del mes/gi, 'Rain this month'],
    [/Temperatura\b/g, 'Temperature'],
    [/Humedad del suelo/gi, 'Soil moisture'],
    [/, igual que lo normal/gi, ', same as normal'],
    [/ más que lo normal/gi, ' above normal'],
    [/ menos que lo normal/gi, ' below normal'],
    [/sin dato/gi, 'no data'],
    // Resumen hablado
    [/Comunidad de (.+?)\./g, 'Community of $1.'],
    [/Esto es una comparación con un año normal\./gi, 'This is a comparison with a normal year.'],
    [/Qué conviene este año\./gi, 'What to do this year.'],
    [/Consejo: /g, 'Advice: '],
    [/Motivos: /g, 'Reasons: '],
    // Sectores
    [/los sectores ([\d, ]+) y (\d+)/gi, 'fields $1 and $2'],
    [/a los sectores/gi, 'fields'],
    [/al sector (\d+)/gi, 'field $1'],
    [/el sector (\d+)/gi, 'field $1'],
    [/(\d+) sectores/gi, '$1 fields'],
    [/ en fields/g, ' in fields'],
    [/ en field/g, ' in field'],
    [/\bpapa\b/gi, 'potato'],
    [/\bquinua\b/gi, 'quinoa'],
  ],
  ay: [
    [/Abrir para cultivo/gi, 'Yapuchañataki llawiraña (Abrir para cultivo)'],
    [/Seguir en descanso/gi, 'Samarañanakakïpan (Seguir en descanso)'],
    [/Seguir cultivando/gi, 'Yapuchaskakiña (Seguir cultivando)'],
    [/Otra cosa/gi, 'Yaqha luräwi (Otra cosa)'],
    [
      /Pasar a descanso después de la cosecha/gi,
      'Apthapi qhipat samarañaru uchaña',
    ],
    [
      /Se puede abrir este sector para cultivo\./gi,
      'Aka suyux yapuchañataki llawirasispa.',
    ],
    [
      /Mantener este sector en descanso\./gi,
      'Aka suyux samarañanakakïpan (Mantener en descanso).',
    ],
    [
      /Extender el descanso de este sector\./gi,
      'Aka suyux juk’amp maranak samaraskpan.',
    ],
    [
      /Continuar cultivando este sector\./gi,
      'Aka suyun yapuchaskakiñawa.',
    ],
    [/En descanso hace (\d+) años?/gi, 'Samarañan $1 mara'],
    [/En cultivo hace (\d+) años?/gi, 'Yapuchäwin $1 mara'],
    [/Confianza alta/gi, 'Confianza alta (Jach’a atinisiña)'],
    [/Confianza media/gi, 'Confianza media (Taypi atinisiña)'],
    [/Confianza baja/gi, 'Confianza baja (Jisk’a atinisiña)'],
    [/Riesgo de sequía: alto/gi, 'Riesgo de sequía: alto (Jach’a waña pacha)'],
    [/Riesgo de sequía: medio/gi, 'Riesgo de sequía: medio (Taypi waña pacha)'],
    [/Riesgo de sequía: bajo/gi, 'Riesgo de sequía: bajo (Jisk’a waña pacha)'],
    [/Riesgo alto/gi, 'Riesgo alto (Jach’a waña)'],
    [/Riesgo medio/gi, 'Riesgo medio (Taypi waña)'],
    [/Riesgo bajo/gi, 'Riesgo bajo (Jisk’a waña)'],
    [/Recuperación del suelo: buena/gi, 'Uraqin samarañapa: wali askiwa'],
    [/Recuperación del suelo: a medias/gi, 'Uraqin samarañapa: taypikiwa'],
    [/Recuperación del suelo: poca/gi, 'Uraqin samarañapa: juk’akiwa'],
    [/Cultivo sugerido: papa/gi, 'Yapuchaña: ch’uqi (papa)'],
    [/Cultivo sugerido: quinua/gi, 'Yapuchaña: jupha (quinua)'],
    [/Siembra: octubre a noviembre/gi, 'Yapuchaña pacha: taypi sata – lapaka'],
    [/Descanso sugerido: (\d+) años? más/gi, 'Samaraña: $1 mara juk’ampi'],
  ],
  qu: [
    [/Abrir para cultivo/gi, 'Tarpunapaq kichariy (Abrir para cultivo)'],
    [/Seguir en descanso/gi, 'Samayllapiraq kakuchun (Seguir en descanso)'],
    [/Seguir cultivando/gi, 'Tarpuyllapuni (Seguir cultivando)'],
    [/Otra cosa/gi, 'Huk ruway (Otra cosa)'],
    [
      /Pasar a descanso después de la cosecha/gi,
      'Pallay qhipata samayman churay',
    ],
    [
      /Se puede abrir este sector para cultivo\./gi,
      'Kay suyutaqa tarpunapaq kicharisunmanmi.',
    ],
    [
      /Mantener este sector en descanso\./gi,
      'Kay suyuqa samayllapiraq kakuchun (Mantener en descanso).',
    ],
    [
      /Extender el descanso de este sector\./gi,
      'Kay suyuqa astawan watakuna samachun.',
    ],
    [/Continuar cultivando este sector\./gi, 'Kay suyupi tarpuyllapuni.'],
    [/En descanso hace (\d+) años?/gi, 'Samaypi $1 wataña'],
    [/En cultivo hace (\d+) años?/gi, 'Tarpuypi $1 wataña'],
    [/Confianza alta/gi, 'Confianza alta (Hatun atienekuy)'],
    [/Confianza media/gi, 'Confianza media (Chawpi atienekuy)'],
    [/Confianza baja/gi, 'Confianza baja (Pisi atienekuy)'],
    [/Riesgo de sequía: alto/gi, 'Riesgo de sequía: alto (Hatun ch’aki pacha)'],
    [/Riesgo de sequía: medio/gi, 'Riesgo de sequía: medio (Chawpi ch’aki pacha)'],
    [/Riesgo de sequía: bajo/gi, 'Riesgo de sequía: bajo (Pisi ch’aki pacha)'],
    [/Riesgo alto/gi, 'Riesgo alto (Hatun ch’aki)'],
    [/Riesgo medio/gi, 'Riesgo medio (Chawpi ch’aki)'],
    [/Riesgo bajo/gi, 'Riesgo bajo (Pisi ch’aki)'],
    [/Recuperación del suelo: buena/gi, 'Allpaq kallpan: allin samasqa'],
    [/Recuperación del suelo: a medias/gi, 'Allpaq kallpan: chawpilla'],
    [/Recuperación del suelo: poca/gi, 'Allpaq kallpan: pisilla'],
    [/Cultivo sugerido: papa/gi, 'Tarpuna: papa'],
    [/Cultivo sugerido: quinua/gi, 'Tarpuna: kinwa (quinua)'],
    [/Siembra: octubre a noviembre/gi, 'Tarpuy pacha: octubre – noviembre'],
    [/Descanso sugerido: (\d+) años? más/gi, 'Samay: $1 wata astawan'],
  ],
}

export function translatePhrase(text: string, lang: Language): string {
  if (lang === 'es' || !text) {
    return text
  }
  let out = text
  for (const [pattern, replacement] of PHRASE_REPLACEMENTS[lang]) {
    out = out.replace(pattern, replacement as (substring: string, ...args: string[]) => string)
  }
  return out
}

export interface LanguageContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: UiStrings
  tr: (text: string) => string
}

export const LanguageContext = createContext<LanguageContextValue>({
  lang: 'es',
  setLang: () => {},
  t: UI_STRINGS.es,
  tr: (text) => text,
})

export function useLanguage(): LanguageContextValue {
  return use(LanguageContext)
}
