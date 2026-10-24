// Drawn headshots of the V2 cast with the sheet's 15 expressions, for dialogue bubbles, results and profiles.
import type { Expression, ToonSpec } from '../world/toon'

interface FaceSpec { brow: [number, number]; browY: number; eye: number; look: [number, number]; mouth: 'smile' | 'grin' | 'open' | 'flat' | 'frown' | 'smirk' | 'o'; blush?: boolean; tear?: boolean; sweat?: boolean }
const F: Record<Expression, FaceSpec> = {
  neutral: { brow: [0, 0], browY: 0, eye: 1, look: [0, 0], mouth: 'flat' },
  happy: { brow: [4, -4], browY: -1, eye: 1, look: [0, 0], mouth: 'smile' },
  laughing: { brow: [8, -8], browY: -2, eye: 0.35, look: [0, 0], mouth: 'grin' },
  confident: { brow: [0, -10], browY: -1, eye: 0.8, look: [0, 0], mouth: 'smirk' },
  thinking: { brow: [0, 12], browY: -2, eye: 0.9, look: [2, -2], mouth: 'flat' },
  curious: { brow: [4, -4], browY: -3, eye: 1.1, look: [2, -1], mouth: 'o' },
  suspicious: { brow: [-12, 12], browY: 1, eye: 0.5, look: [3, 0], mouth: 'flat' },
  angry: { brow: [-22, 22], browY: 2, eye: 0.75, look: [0, 0], mouth: 'frown' },
  surprised: { brow: [0, 0], browY: -5, eye: 1.3, look: [0, 0], mouth: 'o' },
  tired: { brow: [6, -6], browY: 2, eye: 0.35, look: [0, 2], mouth: 'flat' },
  worried: { brow: [16, -16], browY: -2, eye: 1, look: [0, 1], mouth: 'frown', sweat: true },
  disappointed: { brow: [12, -12], browY: 0, eye: 0.65, look: [0, 2], mouth: 'frown' },
  cheeky: { brow: [4, -14], browY: -1, eye: 0.85, look: [2, 0], mouth: 'smirk', blush: true },
  proud: { brow: [2, -8], browY: -2, eye: 0.7, look: [0, -2], mouth: 'smile' },
  calm: { brow: [2, -2], browY: 0, eye: 0.4, look: [0, 0], mouth: 'smile' },
}

export function Portrait({ spec, expression = 'neutral', size = 96, label }: { spec: ToonSpec; expression?: Expression; size?: number; label?: string }) {
  const f = F[expression]
  const skin = spec.skin, shade = '#00000022'
  const hair = spec.hairColor
  const wrapA = spec.printA ?? '#e07a1f', wrapB = spec.printB ?? '#f5b91c'
  const ex = [34, 66]
  const brows = ex.map((x, i) => <rect key={i} x={x - 8} y={36 + f.browY} width={16} height={3.6} rx={1.8} fill={spec.hair === 'headwrap' ? '#2a1a12' : '#20150f'} transform={`rotate(${f.brow[i]} ${x} ${37.8 + f.browY})`} />)
  const eyes = ex.map((x, i) => (
    <g key={i}>
      <ellipse cx={x} cy={48} rx={8.2} ry={9.6 * f.eye} fill="#fff" />
      <ellipse cx={x + f.look[0]} cy={48 + f.look[1]} rx={4.2} ry={Math.min(5, 5.4 * f.eye + 0.8)} fill="#17100c" />
      <circle cx={x + f.look[0] - 1.4} cy={46 + f.look[1]} r={1.3} fill="#fff" />
      {f.eye < 0.5 && <path d={`M${x - 8} 48 Q${x} ${f.eye < 0.4 ? 54 : 44} ${x + 8} 48`} fill="none" stroke="#17100c" strokeWidth={2.2} strokeLinecap="round" />}
    </g>
  ))
  const mouth =
    f.mouth === 'smile' ? <path d="M38 66 Q50 78 62 66" fill="none" stroke="#3a0f0c" strokeWidth={3} strokeLinecap="round" />
      : f.mouth === 'smirk' ? <path d="M42 68 Q56 76 64 64" fill="none" stroke="#3a0f0c" strokeWidth={3} strokeLinecap="round" />
        : f.mouth === 'grin' ? <g><path d="M36 64 Q50 84 64 64 Z" fill="#2a0806" /><path d="M42 74 Q50 70 58 74 Q50 80 42 74" fill="#e0607a" /></g>
          : f.mouth === 'frown' ? <path d="M39 72 Q50 62 61 72" fill="none" stroke="#3a0f0c" strokeWidth={3} strokeLinecap="round" />
            : f.mouth === 'o' ? <ellipse cx={50} cy={69} rx={4.5} ry={5.5} fill="#2a0806" />
              : <rect x={41} y={67} width={18} height={3} rx={1.5} fill="#3a0f0c" />
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={label ?? `${spec.name}, ${expression}`}>
      {/* back hair and wraps */}
      {spec.hair === 'afro' && <circle cx={50} cy={36} r={36} fill={hair} />}
      {spec.hair === 'bun' && <><circle cx={50} cy={10} r={13} fill={hair} /><circle cx={40} cy={13} r={8} fill={hair} /><circle cx={61} cy={14} r={8} fill={hair} /></>}
      {spec.hair === 'braids' && [18, 30, 70, 82].map((x) => <rect key={x} x={x - 3} y={34} width={6} height={52} rx={3} fill={hair} />)}
      {/* ears and head */}
      <ellipse cx={19} cy={54} rx={5} ry={8} fill={skin} /><ellipse cx={81} cy={54} rx={5} ry={8} fill={skin} />
      <ellipse cx={50} cy={54} rx={32} ry={34} fill={skin} />
      <ellipse cx={50} cy={86} rx={14} ry={9} fill={skin} />
      {/* beard */}
      {spec.beard && <><path d="M19 56 Q20 90 50 90 Q80 90 81 56 Q78 72 50 74 Q22 72 19 56Z" fill={spec.beard === 'grey' ? '#2a2a2a' : hair} />{spec.beard === 'grey' && [34, 42, 50, 58, 66].map((x, i) => <circle key={i} cx={x} cy={82 + (i % 2) * 2} r={1.6} fill="#bdbdbd" />)}<rect x={38} y={61} width={24} height={4} rx={2} fill={spec.beard === 'grey' ? '#2a2a2a' : hair} /></>}
      {/* hair on top */}
      {spec.hair === 'curlyTop' && [26, 36, 46, 56, 66, 74].map((x, i) => <circle key={i} cx={x} cy={26 + (i % 2) * 3 + Math.abs(x - 50) * 0.2} r={10} fill={hair} />)}
      {spec.hair === 'twists' && <>{[24, 34, 44, 54, 64, 74].map((x, i) => <circle key={i} cx={x} cy={24 + Math.abs(x - 50) * 0.22} r={9} fill={hair} />)}{[28, 40, 52, 64, 74].map((x) => <rect key={x} x={x - 2.5} y={8} width={5} height={12} rx={2.5} fill={hair} />)}</>}
      {spec.hair === 'lowcut' && <path d="M19 44 Q22 14 50 14 Q78 14 81 44 Q70 30 50 30 Q30 30 19 44Z" fill={hair} />}
      {spec.hair === 'bun' && <path d="M20 46 Q22 16 50 16 Q78 16 80 46 Q68 30 50 30 Q32 30 20 46Z" fill={hair} />}
      {spec.hair === 'braids' && <path d="M19 46 Q22 14 50 14 Q78 14 81 46 Q68 30 50 30 Q32 30 19 46Z" fill={hair} />}
      {spec.hair === 'headwrap' && <><ellipse cx={50} cy={26} rx={37} ry={21} fill={wrapA} /><circle cx={30} cy={22} r={8} fill={wrapB} /><circle cx={60} cy={16} r={7} fill="#1f2a22" /><circle cx={72} cy={26} r={6} fill={wrapB} /><circle cx={44} cy={30} r={5} fill="#1f2a22" /><circle cx={22} cy={32} r={5} fill={wrapA} /><path d="M70 6 Q86 0 84 18 Q74 14 70 6Z" fill={wrapA} /></>}
      {spec.accessories.includes('cap') && <><path d="M17 40 Q20 12 50 12 Q80 12 83 40 Z" fill="#1c1b22" /><rect x={14} y={38} width={72} height={6} rx={3} fill="#1c1b22" /><rect x={44} y={22} width={12} height={8} rx={1} fill="#f5b91c" /></>}
      {spec.accessories.includes('headphones') && <><path d="M18 52 Q18 12 50 12 Q82 12 82 52" fill="none" stroke="#1c1b22" strokeWidth={5} /><rect x={11} y={46} width={9} height={20} rx={4} fill="#1c1b22" /><rect x={80} y={46} width={9} height={20} rx={4} fill="#1c1b22" /></>}
      {/* earrings */}
      {(spec.accessories.includes('earrings') || spec.body === 'girl' || spec.body === 'woman') && <><circle cx={17} cy={66} r={4} fill="none" stroke="#f5b91c" strokeWidth={1.8} /><circle cx={83} cy={66} r={4} fill="none" stroke="#f5b91c" strokeWidth={1.8} /></>}
      {brows}{eyes}
      <ellipse cx={50} cy={58} rx={3.6} ry={4.4} fill={shade} />
      {mouth}
      {f.blush && <><ellipse cx={26} cy={62} rx={6} ry={3.4} fill="#e0705a" opacity={0.7} /><ellipse cx={74} cy={62} rx={6} ry={3.4} fill="#e0705a" opacity={0.7} /></>}
      {f.sweat && <path d="M82 30 Q86 38 82 42 Q78 38 82 30Z" fill="#7ec8f0" />}
      {spec.accessories.includes('glasses') && <g fill="none" stroke="#14110e" strokeWidth={2.6}><circle cx={34} cy={48} r={11} /><circle cx={66} cy={48} r={11} /><path d="M45 48 H55" /></g>}
    </svg>
  )
}
