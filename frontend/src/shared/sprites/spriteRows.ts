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
