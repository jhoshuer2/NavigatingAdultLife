import { useId } from 'react'
import type { Appearance, Gender } from '@engine/core/types'
import type { Wear } from '@content/items'

export const SKIN_TONES = ['#f3cfb0', '#e6b48c', '#cf9569', '#b57a50', '#9a6339', '#80502d', '#684023', '#553219', '#42250f', '#2f1a09']
export const HAIR_COLORS = ['#141414', '#2b1a10', '#4a2c17', '#7a4a1e', '#a37a2c', '#6d2a8f', '#8a1c1c']
export const OUTFIT_COLORS = ['#2b3a8c', '#0f7a4a', '#c4562a', '#e6a817', '#8a1c6a', '#1c7ea6', '#222222', '#f2efe6']

interface Props {
  look: Appearance
  gender: Gender
  age?: number
  uniform?: boolean
  size?: number
  className?: string
  title?: string
  wear?: Wear[]
}

export function Avatar({ look, gender, age = 25, uniform = false, size = 160, className, title, wear = [] }: Props) {
  const uid = useId().replace(/:/g, '')
  const skin = SKIN_TONES[look.skinTone] ?? SKIN_TONES[4]
  const skinShade = shade(skin, -0.14)
  const old = age >= 60
  const hair = old ? '#c9c9c9' : look.hairColor
  const child = age < 12
  const teen = age >= 12 && age < 18
  const scale = child ? 0.74 : teen ? 0.9 : 1
  const headR = child ? 40 : 36
  const face = [0, 2, 4, -3][look.faceShape] ?? 0
  const male = gender === 'male'
  const outfit = uniform ? 'uniform' : look.outfitType
  const top = uniform ? '#ffffff' : look.topColor
  const bottom = uniform ? '#1f3a7a' : look.bottomColor
  const hairStyle = look.hairStyle
  const fabric = uniform ? 'plain' : look.fabric

  const pat = `${uid}-pat`
  const fill = fabric === 'plain' ? top : `url(#${pat})`

  return (
    <svg viewBox="0 0 200 240" width={size} height={size * 1.2} className={className} role="img" aria-label={title ?? 'Character portrait'}>
      <defs>
        <pattern id={pat} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
          {fabric === 'ankara' && (<><rect width="22" height="22" fill={top} /><circle cx="6" cy="6" r="4.5" fill="#f5b91c" /><circle cx="6" cy="6" r="2" fill={bottom} /><path d="M12 14 L20 14 L16 21 Z" fill="#fff8ea" opacity=".9" /><rect x="14" y="1" width="6" height="6" rx="1" fill="#c4562a" transform="rotate(20 17 4)" /></>)}
          {fabric === 'adire' && (<><rect width="22" height="22" fill="#1d2f6f" /><circle cx="11" cy="11" r="8" fill="none" stroke="#dfe7ff" strokeWidth="1.6" /><circle cx="11" cy="11" r="4" fill="none" stroke="#9db5ff" strokeWidth="1.4" /><circle cx="11" cy="11" r="1.4" fill="#dfe7ff" /></>)}
          {fabric === 'asoOke' && (<><rect width="22" height="22" fill={top} /><rect y="3" width="22" height="3" fill="#f5b91c" /><rect y="10" width="22" height="2" fill="#fff8ea" opacity=".85" /><rect y="16" width="22" height="3" fill="#c4562a" /></>)}
        </pattern>
      </defs>
      <g transform={`translate(100 ${child ? 40 : 18}) scale(${scale}) translate(-100 0)`}>
        {/* hair back layer */}
        {hairStyle === 'afro' && <circle cx="100" cy="64" r={headR + 28} fill={hair} />}
        {hairStyle === 'braids' && <g stroke={hair} strokeWidth="6" strokeLinecap="round"><path d="M64 56 Q50 120 58 168" fill="none" /><path d="M76 50 Q64 112 70 172" fill="none" /><path d="M136 50 Q148 112 142 172" fill="none" /><path d="M124 52 Q138 120 132 168" fill="none" /></g>}
        {hairStyle === 'locs' && <g stroke={hair} strokeWidth="7" strokeLinecap="round"><path d="M62 54 Q52 110 60 150" fill="none" /><path d="M72 48 Q62 104 68 160" fill="none" /><path d="M138 54 Q148 110 140 150" fill="none" /><path d="M128 48 Q138 104 132 160" fill="none" /><path d="M82 44 Q74 86 80 130" fill="none" /><path d="M118 44 Q126 86 120 130" fill="none" /></g>}
        {hairStyle === 'ponytail' && <path d="M138 44 Q178 60 168 124 Q150 90 134 66 Z" fill={hair} />}
        {/* neck + body */}
        <rect x="88" y="104" width="24" height="30" rx="8" fill={skinShade} />
        {renderBody(outfit, fill, top, bottom, male, skin)}
        {wear.includes('chain') && <g><path d="M78 132 Q100 176 122 132" fill="none" stroke="#f5c518" strokeWidth="5" strokeLinecap="round" /><circle cx="100" cy="168" r="8" fill="#f5c518" stroke="#b8860b" strokeWidth="2" /></g>}
        {wear.includes('badge') && <g><path d="M84 128 L100 172 L116 128" fill="none" stroke="#1c7ea6" strokeWidth="5" /><rect x="88" y="170" width="24" height="30" rx="3" fill="#fff" stroke="#1c7ea6" strokeWidth="2" /><rect x="88" y="170" width="24" height="8" fill="#0f7a4a" /></g>}
        {wear.includes('scarf') && <g><path d="M72 132 Q100 156 128 132 L130 146 Q100 170 70 146 Z" fill="#c4562a" /><path d="M112 150 L128 196 L114 198 L104 160 Z" fill="#e6a817" /></g>}
        {wear.includes('vest') && <g><path d="M60 140 L84 132 L92 232 L40 232 Z" fill="#ff8a1f" /><path d="M140 140 L116 132 L108 232 L160 232 Z" fill="#ff8a1f" /><rect x="44" y="176" width="48" height="8" fill="#eee" opacity=".9" /><rect x="108" y="176" width="48" height="8" fill="#eee" opacity=".9" /></g>}
        {wear.includes('cross') && <g><path d="M78 132 Q100 172 122 132" fill="none" stroke="#ddd" strokeWidth="4" /><rect x="96" y="160" width="8" height="26" rx="2" fill="#f5f5f5" /><rect x="88" y="168" width="24" height="7" rx="2" fill="#f5f5f5" /></g>}
        {wear.includes('keys') && <g><circle cx="150" cy="206" r="9" fill="none" stroke="#cfcfcf" strokeWidth="4" /><path d="M150 215 L150 232" stroke="#f5c518" strokeWidth="5" /></g>}
        {wear.includes('case') && <g><rect x="132" y="190" width="40" height="30" rx="5" fill="#5a3a1c" /><rect x="144" y="186" width="16" height="8" rx="3" fill="none" stroke="#e6a817" strokeWidth="3" /></g>}
        {wear.includes('pouch') && <g><path d="M138 196 Q166 196 168 222 L140 224 Z" fill="#7a4a2a" /><path d="M138 196 Q152 186 166 198" fill="none" stroke="#e6a817" strokeWidth="4" /></g>}
        {wear.includes('backpack') && <g fill="#14587a"><path d="M52 150 Q40 190 48 230 L62 230 L68 140 Z" /><path d="M148 150 Q160 190 152 230 L138 230 L132 140 Z" /></g>}
        {/* head */}
        <ellipse cx="100" cy="68" rx={headR + face} ry={headR + 4} fill={skin} />
        <ellipse cx="64" cy="72" rx="6" ry="9" fill={skin} /><ellipse cx="136" cy="72" rx="6" ry="9" fill={skin} />
        {/* hair front */}
        {hairStyle === 'lowcut' && <path d={`M${64 - face} 56 Q100 ${child ? 22 : 26} ${136 + face} 56 Q ${130 + face} 40 100 38 Q 70 40 ${64 - face} 56 Z`} fill={hair} />}
        {hairStyle === 'afro' && <path d={`M${62 - face} 62 Q100 ${34} ${138 + face} 62 Q 128 40 100 38 Q 72 40 ${62 - face} 62 Z`} fill={hair} />}
        {hairStyle === 'braids' && <path d="M64 58 Q100 24 136 58 Q130 38 100 36 Q70 38 64 58 Z" fill={hair} />}
        {hairStyle === 'locs' && <path d="M64 58 Q100 22 136 58 Q130 36 100 34 Q70 36 64 58 Z" fill={hair} />}
        {hairStyle === 'cornrows' && <g><path d="M66 58 Q100 24 134 58 Q128 38 100 36 Q72 38 66 58 Z" fill={hair} /><g stroke={skin} strokeWidth="1.4" opacity=".55" fill="none"><path d="M78 52 Q100 34 122 52" /><path d="M72 56 Q100 40 128 56" /><path d="M100 36 L100 54" /></g></g>}
        {hairStyle === 'bun' && <g><path d="M64 58 Q100 24 136 58 Q130 38 100 36 Q70 38 64 58 Z" fill={hair} /><circle cx="100" cy="24" r="14" fill={hair} /></g>}
        {hairStyle === 'ponytail' && <path d="M64 58 Q100 22 136 58 Q130 36 100 34 Q70 36 64 58 Z" fill={hair} />}
        {hairStyle === 'gele' && <g><path d="M60 62 Q56 30 100 24 Q146 30 140 62 Q130 46 100 44 Q70 46 60 62 Z" fill={top === '#f2efe6' ? '#c4562a' : top} /><path d="M70 40 Q100 4 134 36 Q118 26 100 28 Q84 28 70 40 Z" fill={shade(top, 0.2)} /><circle cx="128" cy="30" r="9" fill={shade(top, -0.2)} /></g>}
        {/* face */}
        <ellipse cx="86" cy="68" rx="3.6" ry="4.4" fill="#1a0f08" /><ellipse cx="114" cy="68" rx="3.6" ry="4.4" fill="#1a0f08" />
        <circle cx="87.2" cy="66.6" r="1.1" fill="#fff" /><circle cx="115.2" cy="66.6" r="1.1" fill="#fff" />
        <path d="M78 58 Q86 54 94 58" stroke={hair === '#c9c9c9' ? '#999' : '#1a0f08'} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M106 58 Q114 54 122 58" stroke={hair === '#c9c9c9' ? '#999' : '#1a0f08'} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M100 70 Q96 82 101 83" stroke={skinShade} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M89 92 Q100 100 111 92" stroke="#7a2a22" strokeWidth="3" fill="none" strokeLinecap="round" />
        {male && look.facialHair === 'beard' && <path d="M72 84 Q100 124 128 84 Q122 100 100 104 Q78 100 72 84 Z" fill={hair} opacity=".92" />}
        {male && look.facialHair === 'stubble' && <path d="M74 84 Q100 112 126 84 Q120 98 100 100 Q80 98 74 84 Z" fill={hair} opacity=".35" />}
        {!male && <><circle cx="64" cy="80" r="3" fill="#f5b91c" /><circle cx="136" cy="80" r="3" fill="#f5b91c" /></>}
        {(outfit === 'traditional' && male) && <path d="M70 46 Q100 26 130 46 L130 54 Q100 44 70 54 Z" fill={top} stroke={shade(top, -0.3)} strokeWidth="1.5" />}
        {wear.includes('cap') && <g><path d="M62 56 Q100 8 138 56 Q100 44 62 56 Z" fill="#c4262e" /><path d="M120 54 Q160 52 164 62 Q140 66 118 60 Z" fill="#8f1b21" /><circle cx="100" cy="18" r="4" fill="#8f1b21" /></g>}
        {wear.includes('fila') && <g><path d="M66 56 Q100 22 134 56 L134 50 Q100 18 66 50 Z" fill="#1c7ea6" /><rect x="64" y="46" width="72" height="12" rx="4" fill="#1c7ea6" stroke="#0e4a63" strokeWidth="2" /></g>}
        {wear.includes('gradcap') && <g><path d="M52 38 L100 20 L148 38 L100 54 Z" fill="#14121f" /><rect x="76" y="40" width="48" height="14" rx="3" fill="#14121f" /><path d="M140 40 L140 62" stroke="#f5b91c" strokeWidth="3" /><circle cx="140" cy="64" r="4" fill="#f5b91c" /></g>}
        {wear.includes('headphones') && <g><path d="M60 72 Q60 26 100 26 Q140 26 140 72" fill="none" stroke="#222" strokeWidth="6" /><rect x="52" y="64" width="14" height="26" rx="6" fill="#e07a1f" /><rect x="134" y="64" width="14" height="26" rx="6" fill="#e07a1f" /></g>}
        {wear.includes('glasses') && <g fill="none" stroke="#111" strokeWidth="3"><circle cx="86" cy="68" r="11" /><circle cx="114" cy="68" r="11" /><path d="M97 68 L103 68" /><path d="M75 66 L64 62" /><path d="M125 66 L136 62" /></g>}
        {old && <g stroke={skinShade} strokeWidth="1.2" fill="none" opacity=".7"><path d="M80 52 Q86 49 92 52" /><path d="M108 52 Q114 49 120 52" /><path d="M88 96 Q86 100 87 104" /><path d="M112 96 Q114 100 113 104" /></g>}
      </g>
    </svg>
  )
}

function renderBody(outfit: string, fill: string, top: string, bottom: string, male: boolean, skin: string) {
  const shoulders = 'M26 232 Q30 150 70 132 Q100 148 130 132 Q170 150 174 232 Z'
  switch (outfit) {
    case 'hoodie':
      return <g><path d={shoulders} fill={fill} /><path d="M70 132 Q100 170 130 132 Q112 122 100 124 Q88 122 70 132 Z" fill={shade(top, -0.25)} /><rect x="86" y="170" width="28" height="30" rx="8" fill={shade(top, -0.15)} opacity=".6" /></g>
    case 'office':
      return <g><path d={shoulders} fill={male ? '#25283a' : '#25283a'} /><path d="M82 130 L100 176 L118 130 L100 124 Z" fill="#fff" /><path d="M100 130 L94 142 L100 176 L106 142 Z" fill={male ? '#c4562a' : '#f5b91c'} /><path d="M82 130 L90 124 L100 140 L74 150 Z" fill="#fff" opacity=".001" /></g>
    case 'owambe':
      return <g><path d="M22 232 Q24 148 68 130 Q100 150 132 130 Q176 148 178 232 Z" fill={fill} /><path d="M66 132 Q100 156 134 132" stroke="#f5b91c" strokeWidth="5" fill="none" /><path d="M34 190 Q100 214 166 190" stroke="#f5b91c" strokeWidth="3" fill="none" opacity=".8" /></g>
    case 'siteWork':
      return <g><path d={shoulders} fill="#e6a817" /><path d="M72 134 L84 232 M128 134 L116 232" stroke="#444" strokeWidth="6" /><rect x="70" y="170" width="60" height="9" fill="#d8d8d8" opacity=".85" /><path d="M70 132 Q100 150 130 132" stroke="#444" strokeWidth="4" fill="none" /></g>
    case 'chill':
      return <g><path d={shoulders} fill={top} /><path d="M76 134 Q100 156 124 134" fill={skin} /><text x="100" y="206" textAnchor="middle" fontSize="22" fontWeight="800" fill={bottom} opacity=".9">NAIJA</text></g>
    case 'traditional':
      return male
        ? <g><path d="M10 232 Q14 140 64 128 Q100 150 136 128 Q186 140 190 232 Z" fill={fill} /><path d="M64 128 Q100 152 136 128" stroke="#f5b91c" strokeWidth="5" fill="none" /><path d="M100 150 L100 232" stroke="#f5b91c" strokeWidth="3" opacity=".8" /></g>
        : <g><path d="M22 232 Q26 148 66 130 Q100 150 134 130 Q174 148 178 232 Z" fill={fill} /><path d="M66 130 Q100 152 134 130" stroke="#f5b91c" strokeWidth="5" fill="none" /></g>
    case 'uniform':
      return <g><path d={shoulders} fill="#ffffff" /><path d="M80 130 L100 150 L120 130 Z" fill="#1f3a7a" /><path d="M26 232 Q32 190 56 186 L144 186 Q168 190 174 232 Z" fill={bottom} /><path d="M92 152 L108 152 L106 186 L94 186 Z" fill="#c4562a" opacity=".9" /></g>
    default:
      return <g><path d={shoulders} fill={fill} /><path d="M76 134 Q100 156 124 134 Q100 146 76 134 Z" fill={shade(top, -0.2)} /></g>
  }
}

export function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const n = parseInt(h, 16)
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))))
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}
