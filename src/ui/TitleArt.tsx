// Animated key art for the title screen: a Lagos skyline at golden hour, a danfo rolling in, the conductor leaning out.
import { Conductor } from './components'

const WIN = Array.from({ length: 46 }, (_, i) => i)
const B1 = [[0, 70, 46, 110], [48, 40, 40, 140], [92, 84, 56, 96], [150, 30, 36, 150], [188, 64, 60, 116], [250, 24, 44, 156], [296, 76, 50, 104], [348, 44, 52, 136]]
const B2 = [[10, 110, 70, 70], [84, 96, 50, 84], [140, 120, 80, 60], [224, 100, 60, 80], [288, 116, 70, 64], [362, 104, 40, 76]]

export function TitleArt({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <svg viewBox="0 0 400 420" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="t-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b0f66" /><stop offset=".45" stopColor="#7a2fb8" /><stop offset=".75" stopColor="#ff4f8a" /><stop offset="1" stopColor="#ffb347" /></linearGradient>
          <radialGradient id="t-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff3b0" /><stop offset=".55" stopColor="#ffd23f" /><stop offset="1" stopColor="#ffd23f" stopOpacity="0" /></radialGradient>
          <linearGradient id="t-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a1a5e" /><stop offset="1" stopColor="#120a35" /></linearGradient>
          <linearGradient id="t-bus" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe27a" /><stop offset="1" stopColor="#ffb300" /></linearGradient>
        </defs>
        <rect width="400" height="420" fill="url(#t-sky)" />
        <circle cx="270" cy="250" r="120" fill="url(#t-sun)" opacity=".9" />
        {[[40, 40], [90, 74], [150, 30], [330, 54], [370, 100], [220, 62], [20, 120]].map(([x, y], i) => <circle key={i} className="twinkle" style={{ animationDelay: `${i * 0.4}s` }} cx={x} cy={y} r={i % 2 ? 1.2 : 1.8} fill="#fff" />)}
        <g className="cloud" style={{ animationDuration: '70s' }}><ellipse cx="60" cy="150" rx="46" ry="12" fill="#fff" opacity=".16" /><ellipse cx="90" cy="142" rx="30" ry="10" fill="#fff" opacity=".16" /></g>
        <g className="cloud" style={{ animationDuration: '95s', animationDelay: '-30s' }}><ellipse cx="120" cy="196" rx="54" ry="13" fill="#ffd9a8" opacity=".25" /></g>
        <g transform="translate(0,150)" fill="#3a1d86" opacity=".85">{B2.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h + 200} />)}</g>
        <g transform="translate(0,170)" fill="#1d0f5c">
          {B1.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h + 200} />)}
          {WIN.map((i) => { const b = B1[i % B1.length]; const col = i % 3, row = Math.floor(i / B1.length); return <rect key={i} className="twinkle" style={{ animationDelay: `${(i * 0.37) % 3}s` }} x={b[0] + 7 + col * 12} y={b[1] + 10 + row * 18} width="6" height="9" rx="1" fill={i % 4 ? '#ffd23f' : '#ff9ccf'} /> })}
        </g>
        <rect y="330" width="400" height="90" fill="url(#t-road)" />
        <rect y="330" width="400" height="4" fill="#ff3d8b" opacity=".6" />
        <g className="road-roll"><g fill="#ffe27a" opacity=".85">{Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 48 - 24} y="384" width="26" height="5" rx="2" />)}</g></g>
      </svg>
      {/* the danfo, rolling in then idling */}
      <div className="absolute left-0 right-0 bottom-[14%] flex justify-center bus-in">
        <div className="bus-bob relative" style={{ width: '82%', maxWidth: 360 }}>
          <svg viewBox="0 0 330 150" className="w-full">
            <ellipse cx="165" cy="140" rx="150" ry="9" fill="#000" opacity=".4" />
            <rect x="8" y="22" width="314" height="102" rx="20" fill="url(#t-bus)" stroke="#1a0f55" strokeWidth="5" />
            <rect x="8" y="78" width="314" height="16" fill="#1a0f55" />
            {[24, 82, 140, 198].map((x) => <rect key={x} x={x} y="34" width="48" height="36" rx="7" fill="#9fe3ff" stroke="#1a0f55" strokeWidth="4" />)}
            <rect x="256" y="34" width="52" height="40" rx="8" fill="#9fe3ff" stroke="#1a0f55" strokeWidth="4" />
            <text x="22" y="112" fontFamily="'Lilita One', sans-serif" fontSize="17" fill="#1a0f55" letterSpacing="1">OYA ENTER! · CMS · OBALENDE</text>
            <rect x="300" y="96" width="18" height="12" rx="4" fill="#fff3b0" />
            {[70, 250].map((cx) => <g key={cx}><circle cx={cx} cy="124" r="19" fill="#1a0f55" /><g className="wheel"><circle cx={cx} cy="124" r="9" fill="#ccc" /><path d={`M${cx - 9} 124h18M${cx} 115v18`} stroke="#555" strokeWidth="2.5" /></g></g>)}
            <circle className="puff" cx="6" cy="112" r="7" fill="#fff" opacity=".7" />
          </svg>
          <div className="absolute" style={{ left: '73%', top: '-6%' }}><Conductor size={74} mood="hype" /></div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(transparent, #0f0a30)' }} />
    </div>
  )
}
