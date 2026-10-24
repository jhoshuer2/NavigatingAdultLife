// The cast from the character sheets, as data. Four named characters, plus neighbours in the same style (new skin tones, hair, outfits).
import type { ToonSpec } from './toon'

export const PALETTE = { cream: '#f3e7cf', olive: '#3a4a2a', black: '#1c1b22', orange: '#e07a1f', yellow: '#f5b91c', rust: '#c4562a', forest: '#2f5a3a', sage: '#8aa58a', tan: '#a89078', blue: '#6a8ab8', white: '#fbf8f0' }
export const SKINS = ['#8a5a36', '#7a4a2a', '#6a3e22', '#5c341c', '#9a6a44', '#4a2a16', '#a87a50']

export const BABA_TUNDE: ToonSpec = {
  id: 'tunde', name: 'Baba Tunde', body: 'man', skin: '#6a3e22', hair: 'curlyTop', hairColor: '#2a2420', beard: 'grey',
  top: 'overshirt', topColor: PALETTE.cream, innerColor: '#f6f0e4', bottom: 'cargo', bottomColor: PALETTE.olive, shoes: 'sneaker',
  accessories: ['crossbag', 'towel', 'watch'],
}
export const ZURI: ToonSpec = {
  id: 'zuri', name: 'Zuri', body: 'girl', skin: '#7a4a2a', hair: 'bun', hairColor: '#17110e',
  top: 'tee', topColor: PALETTE.cream, bottom: 'cargo', bottomColor: PALETTE.black, shoes: 'sneaker',
  accessories: ['backpack', 'smileyKey', 'earrings'],
}
export const NAVI: ToonSpec = {
  id: 'navi', name: 'Navi', body: 'boy', skin: '#6a3e22', hair: 'twists', hairColor: '#14100d',
  top: 'tee', topColor: PALETTE.cream, bottom: 'cargo', bottomColor: PALETTE.black, shoes: 'sneaker',
  accessories: ['backpack', 'smileyChain'],
}
export const MAMA_FOLAKE: ToonSpec = {
  id: 'folake', name: 'Mama Folake', body: 'woman', skin: '#7a4a2a', hair: 'headwrap', hairColor: '#17110e',
  top: 'apron', topColor: PALETTE.black, innerColor: PALETTE.cream, bottom: 'wrap', bottomColor: PALETTE.orange, shoes: 'sandal',
  printA: PALETTE.orange, printB: PALETTE.yellow, accessories: ['towel', 'bag', 'earrings'],
}

/** The two playable characters. */
export const PLAYABLE = [ZURI, NAVI]
export const NAMED = [BABA_TUNDE, ZURI, NAVI, MAMA_FOLAKE]

const OUTFITS: Pick<ToonSpec, 'top' | 'topColor' | 'bottom' | 'bottomColor'>[] = [
  { top: 'tee', topColor: PALETTE.rust, bottom: 'jeans', bottomColor: PALETTE.blue },
  { top: 'hoodie', topColor: PALETTE.sage, bottom: 'cargo', bottomColor: PALETTE.tan },
  { top: 'polo', topColor: PALETTE.black, bottom: 'shorts', bottomColor: PALETTE.tan },
  { top: 'tee', topColor: PALETTE.yellow, bottom: 'cargo', bottomColor: PALETTE.black },
  { top: 'blouse', topColor: PALETTE.orange, bottom: 'trousers', bottomColor: PALETTE.black },
  { top: 'tunic', topColor: '#b7c9e6', bottom: 'trousers', bottomColor: '#b7c9e6' },
]
const HAIR: Record<ToonSpec['body'], ToonSpec['hair'][]> = {
  boy: ['twists', 'curlyTop', 'lowcut'], man: ['lowcut', 'curlyTop', 'bald', 'afro'], girl: ['bun', 'braids', 'afro', 'twists'], woman: ['headwrap', 'braids', 'bun', 'afro'],
}

/** A neighbour in the same style: pass any number, you get the same person for the same number. */
export function neighbour(n: number, body: ToonSpec['body'] = (['man', 'woman', 'boy', 'girl'] as const)[n % 4]): ToonSpec {
  const o = OUTFITS[(n * 3 + 1) % OUTFITS.length]
  const female = body === 'girl' || body === 'woman'
  const wrap = body === 'woman' && n % 2 === 0
  return {
    id: `n${n}`, name: `Neighbour ${n}`, body, skin: SKINS[n % SKINS.length], hair: HAIR[body][n % HAIR[body].length], hairColor: n % 5 === 0 ? '#3a2a20' : '#17110e',
    beard: body === 'man' && n % 3 === 0 ? 'full' : undefined, ...o,
    bottom: wrap ? 'wrap' : o.bottom, shoes: n % 4 === 0 ? 'sandal' : 'sneaker', printA: n % 2 ? PALETTE.rust : PALETTE.orange, printB: PALETTE.yellow,
    accessories: [n % 2 ? 'crossbag' : 'backpack', ...(female ? (['earrings'] as const) : []), ...(n % 3 === 1 ? (['cap'] as const) : []), ...(n % 4 === 2 ? (['glasses'] as const) : [])],
  }
}
