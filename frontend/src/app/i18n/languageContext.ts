import { createContext, use } from 'react'

export type Language = 'es' | 'ay' | 'qu'

export interface UiStrings {
  // Header & Nav
  largeText: string
  normalText: string
  downloadPhone: string
  installHelpTitle: string
  installIos1: string
  installIos2: string
  installAndroid1: string
  installAndroid2: string
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
}

export const UI_STRINGS: Record<Language, UiStrings> = {
  es: {
    largeText: 'Letra grande',
    normalText: 'Letra normal',
    downloadPhone: 'Descargar en celular',
    installHelpTitle: 'Para guardar Aynuqa en la pantalla de su celular:',
    installIos1: '1. Toque el botón Compartir abajo en su pantalla.',
    installIos2: '2. Elija «Agregar a pantalla de inicio».',
    installAndroid1: '1. Toque los tres puntitos (⋮) arriba a la derecha.',
    installAndroid2:
      '2. Toque «Instalar aplicación» o «Agregar a pantalla de inicio».',
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
    chatOffline: 'Sin señal. La llamita necesita señal para contestar.',
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
  },
  ay: {
    largeText: "Jach'a qillqa",
    normalText: 'Qillqa',
    downloadPhone: 'Celulararu apaqaña',
    installHelpTitle: 'Aynuqa celularaman imañataki:',
    installIos1: '1. Aynachan «Compartir» limt’am.',
    installIos2: '2. «Agregar a pantalla de inicio» ajllim.',
    installAndroid1: '1. Patan kimsa ch’imi (⋮) limt’am.',
    installAndroid2: '2. «Instalar aplicación» ajllim.',
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
    chatOffline: 'Janiw señal utjkiti. Qarwax jaysañatakix señal muni.',
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
  },
  qu: {
    largeText: 'Hatun qillqa',
    normalText: 'Qillqa',
    downloadPhone: 'Celularman uraykachiy',
    installHelpTitle: 'Aynuqa celularniykipi waqaychanapaq:',
    installIos1: '1. Urapi «Compartir» ñit’iy.',
    installIos2: '2. «Agregar a pantalla de inicio» akllay.',
    installAndroid1: '1. Wichaypi kimsa ch’ikuta (⋮) ñit’iy.',
    installAndroid2: '2. «Instalar aplicación» akllay.',
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
    chatOffline: 'Mana señal kanchu. Llamitaqa kutichinanpaq señalta munan.',
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
  },
}

const PHRASE_REPLACEMENTS: Record<
  Exclude<Language, 'es'>,
  ReadonlyArray<[RegExp, string]>
> = {
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
    out = out.replace(pattern, replacement)
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
