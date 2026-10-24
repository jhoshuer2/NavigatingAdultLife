// Small postcard for the city picker: the street, the sky and the vehicle that belongs to each city.
import type { CityId } from '@content/cities'

export function CityArt({ city, height = 128 }: { city: CityId; height?: number }) {
  const lagos = city === 'lagos'
  return (
    <svg viewBox="0 0 400 128" width="100%" height={height} preserveAspectRatio="xMidYMax slice" aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`ca-sky-${city}`} x1="0" y1="0" x2="0" y2="1">
          {lagos ? <><stop offset="0" stopColor="#f7e2b5" /><stop offset=".6" stopColor="#f2a65a" /><stop offset="1" stopColor="#ffb347" /></> : <><stop offset="0" stopColor="#1f6fb0" /><stop offset=".65" stopColor="#7fd0e6" /><stop offset="1" stopColor="#ffe9b0" /></>}
        </linearGradient>
      </defs>
      <rect width="400" height="128" fill={`url(#ca-sky-${city})`} />
      <circle cx={lagos ? 320 : 90} cy="60" r="34" fill="#fff3b0" opacity=".85" />
      {lagos ? (
        <g fill="#6b3a1e">{[[0, 52, 36, 80], [40, 30, 28, 100], [74, 62, 40, 70], [118, 22, 26, 110], [150, 48, 44, 84], [200, 16, 30, 116], [236, 58, 36, 74], [278, 34, 40, 98], [326, 54, 30, 78], [362, 40, 38, 92]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} />)}
          {[[12, 66], [48, 46], [84, 76], [126, 40], [160, 62], [208, 34], [246, 72], [290, 52], [372, 58]].map(([x, y], i) => <rect key={i} x={x} y={y} width="5" height="7" fill="#ffd23f" />)}</g>
      ) : (
        <g>
          <path d="M0 96 Q60 40 120 70 Q150 36 210 62 Q260 30 330 74 Q370 60 400 80 L400 128 L0 128 Z" fill="#8c7d6c" />
          <path d="M0 104 Q80 80 160 98 Q250 78 400 100 L400 128 L0 128 Z" fill="#5fae4f" />
          <g fill="#e9e3d2">{[[20, 84, 30, 24], [58, 90, 24, 18], [300, 86, 34, 24], [346, 92, 26, 18]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx="2" />)}</g>
        </g>
      )}
      <rect y="100" width="400" height="28" fill="#2a2a38" />
      <rect y="100" width="400" height="3" fill={lagos ? '#e07a1f' : '#6fd08c'} opacity=".7" />
      <g fill="#ffe27a" opacity=".85">{Array.from({ length: 9 }, (_, i) => <rect key={i} x={i * 48 + 6} y="118" width="26" height="4" rx="2" />)}</g>
      {lagos ? (
        <g transform="translate(110 56)">
          <rect x="0" y="6" width="170" height="52" rx="12" fill="#ffc72c" stroke="#1c1b22" strokeWidth="3" />
          <rect x="0" y="34" width="170" height="9" fill="#1c1b22" />
          {[10, 44, 78, 112].map((x) => <rect key={x} x={x} y="14" width="26" height="18" rx="4" fill="#9fe3ff" stroke="#1c1b22" strokeWidth="2.5" />)}
          <rect x="144" y="14" width="22" height="22" rx="4" fill="#9fe3ff" stroke="#1c1b22" strokeWidth="2.5" />
          {[34, 134].map((x) => <circle key={x} cx={x} cy="58" r="11" fill="#1c1b22" />)}
        </g>
      ) : (
        <g transform="translate(120 66)">
          <path d="M6 40 L10 26 Q14 14 30 14 L110 14 Q130 16 140 30 L156 34 Q164 36 164 46 L164 50 L6 50 Z" fill="#1f9d55" stroke="#0c4a28" strokeWidth="3" strokeLinejoin="round" />
          <path d="M34 16 L40 4 L104 4 L120 16 Z" fill="#fff" stroke="#0c4a28" strokeWidth="3" strokeLinejoin="round" />
          <path d="M46 14 L50 7 L72 7 L72 14 Z M78 14 L78 7 L100 7 L110 14 Z" fill="#9fe3ff" />
          <rect x="58" y="-2" width="34" height="7" rx="2" fill="#ffd23f" stroke="#0c4a28" strokeWidth="2" />
          <rect x="6" y="36" width="158" height="6" fill="#fff" />
          {[38, 132].map((x) => <circle key={x} cx={x} cy="50" r="11" fill="#1a1a22" />)}
        </g>
      )}
    </svg>
  )
}
