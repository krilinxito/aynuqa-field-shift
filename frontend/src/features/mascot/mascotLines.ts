import type { Language } from '../../app/i18n/languageContext'

export type MascotMood =
  | 'idle'
  | 'happy'
  | 'celebrate'
  | 'thinking'
  | 'worried'
  | 'insistent'
  | 'sleeping'

export interface MascotLine {
  /** Identifica la frase para no repetirla en la misma visita. */
  id: string
  mood: MascotMood
  text: string
  /** Botón opcional del globo: abre un sector. */
  sectorId?: string
  actionLabel?: string
}

export interface MascotSector {
  id: string
  /** Solo el número: "4". */
  number: string
  riskLevel: 'low' | 'medium' | 'high'
}

export interface MascotContext {
  lang: Language
  isOnline: boolean
  scenario: 'normal' | 'nino'
  streak: number
  daysAway: number
  firstTime: boolean
  /** Ya saludó en esta visita. */
  greeted: boolean
  justCelebrated: boolean
  advanced: boolean
  sectors: MascotSector[]
  /** Sectores que todavía no tienen una decisión anotada. */
  undecidedSectorIds: string[]
}

type Phrases = Record<Language, string>

/** Elige una variante sin repetir siempre la misma. */
function pick<T>(options: readonly T[], seed: number): T {
  return options[Math.abs(seed) % options.length]
}

const OPEN: Phrases = {
  es: 'Ver el sector',
  ay: 'Suyu uñjaña',
  qu: 'Suyuta qhaway',
}

function offline(lang: Language): string {
  return {
    es: 'Sin señal… zZz. No importa, yo me acuerdo de todo lo guardado.',
    ay: 'Janiw señal utjkiti… zZz. Jan llakisimti, imata yatiyawinakax nayan amtatawa.',
    qu: 'Mana señal kanchu… zZz. Ama llakikuychu, waqaychasqakunata yuyarini.',
  }[lang]
}

const CELEBRATIONS: readonly Phrases[] = [
  {
    es: '¡Anotado! Así se cuida la aynuqa. ¡Yupay!',
    ay: '¡Qillqt’atawa! Ukham aynuqax uñjasi. ¡Jallallawa!',
    qu: '¡Qillqasqañam! Chhaynatam aynuqata qhawanchik. ¡Allinmi!',
  },
  {
    es: '¡Eso! La asamblea decide y yo lo guardo. ¡Salto de alegría!',
    ay: '¡Ukhamawa! Tantachäwiw amti, nayax imta. ¡Kusisiñat thuqt’ta!',
    qu: '¡Chaymi! Huñunakuy yuyaykun, ñuqataq waqaychani. ¡Kusikuymanta p’itani!',
  },
]

function celebrate(lang: Language, seed: number): string {
  return pick(CELEBRATIONS, seed)[lang]
}

function greeting(ctx: MascotContext, seed: number): MascotLine {
  const { lang } = ctx
  if (ctx.firstTime) {
    return {
      id: 'saludo-primera-vez',
      mood: 'happy',
      text: {
        es: '¡Kamisaki! Soy la llamita de la aynuqa. Te aviso qué sector conviene mirar. Tócame cuando quieras.',
        ay: '¡Kamisaki! Nayax aynuqa qarwätwa. Kawkïr suyus uñjañax wakisi uk yatiyäma. Kunapachas limt’ita.',
        qu: '¡Imaynalla! Ñuqaqa aynuqaq llamitanmi kani. Mayqin suyuta qhawana kasqanta willasqayki. Munasqaykipi ñit’iway.',
      }[lang],
    }
  }
  if (ctx.daysAway >= 3) {
    return {
      id: 'te-extrane',
      mood: 'insistent',
      text: {
        es: `Hace ${ctx.daysAway} días que no me visitas… Las nubes no esperan, ¿eh? Mira cómo está tu aynuqa.`,
        ay: `${ctx.daysAway} urunakaw jan visitistati… Qinayanakax janiw suyapkiti, ¿janicha? Aynuqam uñjam.`,
        qu: `${ctx.daysAway} p’unchawñam mana watukuwankichu… Phuyukunaqa manam suyankuchu, ¿aw? Aynuqaykita qhaway.`,
      }[lang],
    }
  }
  if (ctx.streak >= 2) {
    return {
      id: 'racha',
      mood: 'happy',
      text: pick(
        [
          {
            es: `¡${ctx.streak} días seguidos mirando tu aynuqa! Así se cuida la tierra.`,
            ay: `¡${ctx.streak} uru arkatat aynuqam uñjta! Ukham uraqix uñjasi.`,
            qu: `¡${ctx.streak} p’unchaw qatinakuspa aynuqaykita qhawanki! Chhaynatam allpata qhawanchik.`,
          },
          {
            es: `¡Racha de ${ctx.streak} días! Yo ya estoy saltando de gusto.`,
            ay: `¡${ctx.streak} uru arkatata! Nayax kusisitaw thuqtʼtxa.`,
            qu: `¡${ctx.streak} p’unchaw qatinakuspa! Ñuqaqa kusisqam p’itachkani.`,
          },
        ],
        seed,
      )[lang],
    }
  }
  return {
    id: 'saludo',
    mood: 'happy',
    text: pick(
      [
        {
          es: '¡Kamisaki! Volviste. Vamos a ver cómo está la tierra hoy.',
          ay: '¡Kamisaki! Kutt’anitawa. Jichhürux uraqi kunjamas uñjañäni.',
          qu: '¡Imaynalla! Kutimunki. Kunan allpa imaynas kachkan qhawasun.',
        },
        {
          es: '¡Hola de nuevo! Te estaba esperando con las orejas paradas.',
          ay: '¡Wasitat kamisaki! Jinchunakax sayt’atanakaw suyt’askayäsma.',
          qu: '¡Wakmanta imaynalla! Ninriykuna sayasqa suyachkarqayki.',
        },
      ],
      seed,
    )[lang],
  }
}

function worried(ctx: MascotContext, sector: MascotSector): MascotLine {
  const n = sector.number
  return {
    id: `riesgo-${sector.id}`,
    mood: 'worried',
    sectorId: sector.id,
    actionLabel: OPEN[ctx.lang],
    text:
      ctx.scenario === 'nino'
        ? {
            es: `Ay… con El Niño aumenta la probabilidad de sequía en el sector ${n}. ¿Lo miramos juntos?`,
            ay: `Ay… El Niño pachampix ${n} suyun waña pachax juk’amp utjaspawa. ¿Mayacht’asis uñjañäni?`,
            qu: `Ay… El Niño pachawanqa ${n} suyupi ch’aki pacha kanman astawan. ¿Kuska qhawasunchu?`,
          }[ctx.lang]
        : {
            es: `En un año normal el sector ${n} tendría riesgo alto de sequía. ¿Lo miramos?`,
            ay: `Waliki maranx ${n} suyux jach’a waña pachaniwa. ¿Uñjañänicha?`,
            qu: `Allin watapi ${n} suyuqa hatun ch’aki pachayuq kanman. ¿Qhawasunchu?`,
          }[ctx.lang],
  }
}

function undecided(ctx: MascotContext, sector: MascotSector, seed: number): MascotLine {
  const n = sector.number
  return {
    id: `pendiente-${sector.id}`,
    mood: 'insistent',
    sectorId: sector.id,
    actionLabel: OPEN[ctx.lang],
    text: pick(
      [
        {
          es: `Psst… la asamblea todavía no anotó qué hará con el sector ${n}. No es obligatorio, pero yo me olvido fácil.`,
          ay: `Psst… tantachäwix janiw ${n} suyut kuns qillqt’kiti. Janiw wakiskiti, ukampis nayax jank’akiw armt’asta.`,
          qu: `Psst… huñunakuyqa manaraq ${n} suyuwan imata ruwananta qillqanchu. Mana kamachikuychu, ichaqa ñuqaqa usqhayllam qunqani.`,
        },
        {
          es: `¿Y el sector ${n}? Te miro con mi ceja de llama hasta que lo anoten.`,
          ay: `¿Ukat ${n} suyusti? Qillqt’apkañapkama qarwa ch’ipixampiw uñch’ukisma.`,
          qu: `¿Hinaspa ${n} suyuqa? Qillqanakama llama qhawayniywan qhawachkayki.`,
        },
      ],
      seed,
    )[ctx.lang],
  }
}

const TIPS: readonly Phrases[] = [
  {
    es: 'Toca «Escuchar» y te leo el consejo en voz alta.',
    ay: '«Ist’aña» limt’am, iwxt’äwi jach’at liyt’äma.',
    qu: '«Uyariy» ñit’iy, yuyaychayta kunkaywan ñawirisqayki.',
  },
  {
    es: 'El consejo es una ayuda: la decisión final es de la asamblea.',
    ay: 'Iwxt’äwix mä yanapawa: tantachäwiw qhipa amtäwi lurañapa.',
    qu: 'Yuyaychayqa yanapallam: huñunakuymi qhipa simita nin.',
  },
  {
    es: 'Sin señal también funciono: guardo los últimos datos en tu celular.',
    ay: 'Jan señal utjkipansa irnaqtwa: qhipa yatiyawinakax celularamaw imata.',
    qu: 'Mana señal kaptinpas llamk’ani: qhipa willakuykunata celularniykipi waqaychani.',
  },
  {
    es: 'En Ajustes puedes cambiar el idioma, agrandar la letra o callarme un rato.',
    ay: 'Wakicht’añan aru turkasma, qillqa jach’achasma jan ukax amukt’ayitasma.',
    qu: 'Allichaypi simita t’ikrayta, qillqata hatunyachiyta utaq upallachiwayta atinki.',
  },
  {
    es: 'Mis números salen de satélites de la NASA. Los límites de los sectores son simulados.',
    ay: 'Jakhunakajax NASA satélitenakat juti. Suyunakan thiyanakapax uñacht’äwiwa.',
    qu: 'Yupayniykunaqa NASA satélitekunamanta hamun. Suyukunaq patanqa rikch’anachisqam.',
  },
]

function advanced(lang: Language): string {
  return {
    es: 'Uy, ¿números? Te muestro todo, pero no te asustes: la confianza siempre va al lado.',
    ay: 'Uy, ¿jakhunakacha? Taqi uñacht’ayäma, jan axsaramti: atinisiñax jak’apankiwa.',
    qu: 'Uy, ¿yupaykunachu? Llapanta rikuchisqayki, ama mancharikuychu: atienekuyqa kuskanpim.',
  }[lang]
}

/**
 * Frases que la llamita podría decir ahora, de la más importante a la menos.
 * Los números (sectores, días) salen solo de los datos guardados.
 */
export function candidateLines(ctx: MascotContext, seed = 0): MascotLine[] {
  const lines: MascotLine[] = []

  if (!ctx.isOnline) {
    lines.push({ id: 'sin-senal', mood: 'sleeping', text: offline(ctx.lang) })
  }
  if (ctx.justCelebrated) {
    lines.push({
      id: `celebrar-${seed}`,
      mood: 'celebrate',
      text: celebrate(ctx.lang, seed),
    })
  }
  if (!ctx.greeted) {
    lines.push(greeting(ctx, seed))
  }

  const highRisk = ctx.sectors.filter((s) => s.riskLevel === 'high')
  if (highRisk.length > 0) {
    lines.push(worried(ctx, highRisk[seed % highRisk.length]))
  }

  const pending = ctx.sectors.filter((s) => ctx.undecidedSectorIds.includes(s.id))
  if (pending.length > 0) {
    // Primero los de más riesgo.
    const order = { high: 0, medium: 1, low: 2 }
    const sorted = [...pending].sort((a, b) => order[a.riskLevel] - order[b.riskLevel])
    lines.push(undecided(ctx, sorted[0], seed))
  }

  if (ctx.advanced) {
    lines.push({ id: 'modo-avanzado', mood: 'happy', text: advanced(ctx.lang) })
  }

  TIPS.forEach((tip, index) => {
    lines.push({ id: `consejo-${index}`, mood: 'idle', text: tip[ctx.lang] })
  })

  return lines
}

/** La siguiente frase que todavía no dijo en esta visita. */
export function nextLine(
  ctx: MascotContext,
  said: ReadonlySet<string>,
  seed = 0,
): MascotLine | null {
  const lines = candidateLines(ctx, seed)
  return lines.find((line) => !said.has(line.id)) ?? null
}
