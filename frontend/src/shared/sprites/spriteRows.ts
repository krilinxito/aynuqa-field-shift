/*
 * Sprites dibujados a mano para este proyecto. Cada cadena es una fila
 * y cada letra un color de `spritePalette`.
 */

/** Llama de pie con su aguayo, mirando a la derecha. */
export const llamaStandingRows = [
  '...........o..o..',
  '..........owo.owo',
  '..........owooowo',
  '..........owwwwwo',
  '..........owwkwwo.',
  '..........owwwwwwo',
  '..........owwwwooo',
  '..........owwwo...',
  '..........owwwo...',
  '..........owwwo...',
  '.oooooooooowwwo...',
  'owwwwwwwwwwwwwo...',
  'owwpppppppwwwwo...',
  'owwyyyyyyywwwwo...',
  'owwsssssssswwwo...',
  'owwpppppppwwwco...',
  'owwwwwwwwwwwcco...',
  '.owwcoooooowwco...',
  '.owwo......owwo...',
  '.owwo......owwo...',
  '.owwo......owwo...',
  '.oooo......oooo...',
] as const

/** El mismo dibujo con las patas cambiadas: segundo paso al caminar. */
export const llamaWalkingRows = [
  ...llamaStandingRows.slice(0, 17),
  '.owwcoooooowwco...',
  '..owwo....owwo....',
  '..owwo....owwo....',
  '...owwo..owwo.....',
  '...oooo..oooo.....',
] as const

/** Llama echada, descansando: para los sectores en descanso. */
export const llamaRestingRows = [
  '...............o..o..',
  '..............owo.owo',
  '..............owooowo',
  '..............owwwwwo',
  '..............owwkwwo.',
  '..............owwwwwwo',
  '..............owwwwooo',
  '..............owwwo...',
  '..ooooooooooooowwwo...',
  '.owwwwwwwwwwwwwwwwo...',
  'owwwpppppppppwwwwwo...',
  'owwwyyyyyyyyywwwwwo...',
  'owwwssssssssswwwwco...',
  'owwwpppppppppwwwcco...',
  'owwwwwwwwwwwwwwcccoo..',
  '.oowwccooooowwwcccwwo.',
  '...ooooo...oooooooooo.',
] as const

/** Planta que brota: para los sectores en cultivo. */
export const plantRows = [
  '......l.......',
  '.....lgl......',
  '..l..lgl..l...',
  '.lgl.lgl.lgl..',
  '.lgl..g..lgl..',
  '..lg..g..gl...',
  '...gg.g.gg....',
  '....ggggg.....',
  '......g.......',
  '......g.......',
  '.dddddgddddd..',
  'dddrdddddrdddd',
  '.dddddddddddd.',
] as const

/** Sol del altiplano. */
export const sunRows = [
  '.....f.....',
  '.f...f...f.',
  '..f.....f..',
  '...fffff...',
  '..fffffff..',
  'f.fffffff.f',
  '..fffffff..',
  '...fffff...',
  '..f.....f..',
  '.f...f...f.',
  '.....f.....',
] as const

/** Nube. */
export const cloudRows = [
  '.....nnnn.......',
  '...nnnnnnnn.....',
  '..nnnnnnnnnnnn..',
  '.nnnnnnnnnnnnnn.',
  'nnnnnnnnnnnnnnnn',
  '.nnnnnnnnnnnnnn.',
] as const

/** Chakana (cruz andina), como marca de la app. */
export const chakanaRows = [
  '....rrrr....',
  '....ryyr....',
  '..rrryyrrr..',
  '..ryyyyyyr..',
  'rrryyssyyrrr',
  'ryyysnnsyyyr',
  'ryyysnnsyyyr',
  'rrryyssyyrrr',
  '..ryyyyyyr..',
  '..rrryyrrr..',
  '....ryyr....',
  '....rrrr....',
] as const

/*
 * Caras de la llamita mascota. Mismo cuerpo que `llamaStandingRows`; solo
 * cambia la cabeza (filas 0 a 9).
 */
const llamaBody = llamaStandingRows.slice(10)
const llamaHead = llamaStandingRows.slice(0, 10)

function withHead(changes: Record<number, string>): readonly string[] {
  return [...llamaHead.map((row, i) => changes[i] ?? row), ...llamaBody]
}

/** Boca abierta: segundo cuadro al hablar. */
export const llamaTalkingRows = withHead({
  6: '..........owwwworo',
  7: '..........owwwoo..',
})

/** Ojo cerrado de alegría y cachete rosado. */
export const llamaHappyRows = withHead({
  4: '..........owkkkwo.',
  5: '..........owwwwpwo',
})

/** Mira hacia arriba, pensando. */
export const llamaThinkingRows = withHead({
  3: '..........owwwkwo',
  4: '..........owwwwwo.',
})

/** Ceja caída y gotita de preocupación. */
export const llamaWorriedRows = withHead({
  2: '..........owooowos',
  3: '..........owkwwwo.',
})

/** Ceja levantada: "¿y entonces?". */
export const llamaInsistentRows = withHead({
  3: '..........owwkkwo',
})

/** Ojo cerrado: dormida. */
export const llamaSleepingRows = withHead({
  4: '..........owkkwwo.',
})
