// Procedural illustrated scene cards (M1). Placeholder art: swap by id via the asset manifest later.
interface Props { scene: string; night?: boolean; className?: string }

const SKY: Record<string, [string, string]> = {
  home: ['#ffd9a0', '#ffb36b'], compound: ['#9ed8ff', '#ffe9b5'], school: ['#a6dcff', '#e9f7ff'], market: ['#ffd27a', '#ff9d5c'],
  mamaput: ['#ffcf8a', '#e8793b'], office: ['#b8c9ff', '#e8efff'], event: ['#8a5a36', '#c4562a'], danfo: ['#ffb26b', '#ff7a4d'],
}

export function SceneArt({ scene, night, className }: Props) {
  const [a, b] = SKY[scene] ?? SKY.compound
  const id = `sky-${scene}`
  return (
    <svg viewBox="0 0 400 220" className={className} preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${scene} scene`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={night ? '#6b3a1e' : a} /><stop offset="1" stopColor={night ? '#a87a50' : b} /></linearGradient>
      </defs>
      <rect width="400" height="220" fill={`url(#${id})`} />
      <circle cx="320" cy="48" r="22" fill={night ? '#fff3c8' : '#fff7d6'} opacity=".9" />
      {scene === 'home' && Home()}
      {scene === 'compound' && Compound()}
      {scene === 'school' && School()}
      {scene === 'market' && Market()}
      {scene === 'mamaput' && MamaPut()}
      {scene === 'office' && Office()}
      {scene === 'event' && EventHall()}
      {scene === 'danfo' && Danfo()}
    </svg>
  )
}

const Ground = ({ y = 176, c = '#3b2a1c' }: { y?: number; c?: string }) => <rect y={y} width="400" height={220 - y} fill={c} />
const Window = ({ x, y, w = 18, h = 22, lit = true }: { x: number; y: number; w?: number; h?: number; lit?: boolean }) => <rect x={x} y={y} width={w} height={h} rx="2" fill={lit ? '#ffe9a6' : '#6d8fb3'} stroke="#2a2a2a" strokeWidth="1.5" />
const Umbrella = ({ x, y, c }: { x: number; y: number; c: string }) => (<g><path d={`M${x - 26} ${y} Q${x} ${y - 28} ${x + 26} ${y} Z`} fill={c} /><rect x={x - 1.5} y={y} width="3" height="30" fill="#4a3320" /></g>)

function Home() {
  return (<g>
    <rect x="0" y="120" width="400" height="100" fill="#c58a52" />
    <rect x="40" y="70" width="320" height="110" fill="#e8c9a0" stroke="#7a5430" strokeWidth="3" />
    <path d="M30 72 L200 22 L370 72 Z" fill="#a8452a" />
    <rect x="170" y="116" width="60" height="64" fill="#7a4a2a" /><circle cx="222" cy="150" r="3" fill="#ffd23f" />
    <Window x={70} y={96} w={28} h={30} /><Window x={300} y={96} w={28} h={30} />
    <rect x="240" y="120" width="60" height="10" fill="#6a3b1d" /><rect x="0" y="176" width="400" height="44" fill="#6c8a3c" />
    <rect x="0" y="190" width="400" height="30" fill="#8aa84a" opacity=".5" />
    <text x="60" y="64" fontSize="26">🏠</text>
  </g>)
}
function Compound() {
  return (<g>
    <rect y="130" width="400" height="90" fill="#caa66a" />
    <rect x="10" y="60" width="120" height="90" fill="#f0d9b0" stroke="#7a5430" strokeWidth="2.5" /><rect x="10" y="50" width="120" height="14" fill="#c4562a" />
    <rect x="150" y="76" width="120" height="74" fill="#d9e8c2" stroke="#7a5430" strokeWidth="2.5" /><rect x="150" y="66" width="120" height="14" fill="#2b3a8c" />
    <rect x="290" y="64" width="100" height="86" fill="#f4c8b0" stroke="#7a5430" strokeWidth="2.5" /><rect x="290" y="54" width="100" height="14" fill="#0f7a4a" />
    <Window x={30} y={80} /><Window x={80} y={80} /><Window x={176} y={96} /><Window x={226} y={96} lit={false} /><Window x={316} y={84} /><Window x={356} y={84} lit={false} />
    <circle cx="200" cy="168" r="14" fill="#fff" stroke="#222" strokeWidth="2" /><text x="188" y="174" fontSize="18">⚽</text>
    <path d="M0 178 Q200 158 400 178 L400 220 L0 220 Z" fill="#7a6a54" opacity=".5" />
  </g>)
}
function School() {
  return (<g>
    <rect y="150" width="400" height="70" fill="#8fbf5a" />
    <rect x="50" y="62" width="300" height="100" fill="#f7efe0" stroke="#2b3a8c" strokeWidth="3" />
    <rect x="50" y="52" width="300" height="14" fill="#2b3a8c" />
    {[70, 120, 170, 220, 270, 320].map((x) => <Window key={x} x={x - 8} y={86} w={22} h={26} />)}
    <rect x="178" y="126" width="44" height="36" fill="#7a4a2a" /><rect x="170" y="44" width="60" height="14" rx="3" fill="#f5b91c" /><text x="200" y="55" fontSize="10" fontWeight="800" textAnchor="middle" fill="#2b3a8c">SCHOOL</text>
    <rect x="12" y="110" width="4" height="64" fill="#fff" /><path d="M16 110 L52 118 L16 126 Z" fill="#0f7a4a" />
  </g>)
}
function Market() {
  const cols = ['#e6a817', '#c4562a', '#0f7a4a', '#2b3a8c', '#8a1c6a']
  return (<g>
    <Ground y={150} c="#9a6a3a" />
    {[50, 130, 210, 290, 360].map((x, i) => <Umbrella key={x} x={x} y={96 + (i % 2) * 8} c={cols[i % cols.length]} />)}
    {[50, 130, 210, 290, 360].map((x, i) => <g key={x}><rect x={x - 28} y={138 + (i % 2) * 8} width="56" height="16" fill="#6a3b1d" /><text x={x - 12} y={140 + (i % 2) * 8} fontSize="16">{['🍅', '🧅', '🐟', '👗', '🍌'][i]}</text></g>)}
    <rect x="0" y="60" width="400" height="30" fill="#e8c9a0" opacity=".85" />
  </g>)
}
function MamaPut() {
  return (<g>
    <rect y="130" width="400" height="90" fill="#8a5a33" />
    <rect x="40" y="60" width="320" height="80" fill="#f7e2b0" stroke="#5a3a1a" strokeWidth="3" /><path d="M32 62 L200 20 L368 62 Z" fill="#c4562a" />
    <text x="200" y="90" fontSize="20" fontWeight="800" textAnchor="middle" fill="#7a2a22">MAMA PUT</text>
    <rect x="70" y="106" width="260" height="26" fill="#6a3b1d" />
    {['🍲', '🍚', '🍗', '🥘'].map((e, i) => <text key={e} x={92 + i * 62} y={128} fontSize="22">{e}</text>)}
    <circle cx="332" cy="160" r="10" fill="#222" /><rect x="324" y="150" width="16" height="6" fill="#444" />
  </g>)
}
function Office() {
  return (<g>
    <rect y="170" width="400" height="50" fill="#5b6a8a" />
    <rect x="120" y="20" width="160" height="170" fill="#cfd8f2" stroke="#2b3a8c" strokeWidth="3" />
    {[0, 1, 2, 3, 4, 5].map((r) => [0, 1, 2].map((c) => <Window key={`${r}-${c}`} x={134 + c * 46} y={34 + r * 26} w={30} h={16} lit={(r + c) % 3 !== 0} />))}
    <rect x="20" y="90" width="90" height="100" fill="#aab6d9" stroke="#2b3a8c" strokeWidth="2" /><rect x="290" y="70" width="90" height="120" fill="#b9c4e6" stroke="#2b3a8c" strokeWidth="2" />
    {[0, 1, 2, 3].map((r) => <Window key={r} x={34} y={102 + r * 22} w={24} h={12} />)}{[0, 1, 2, 3, 4].map((r) => <Window key={r} x={304} y={82 + r * 22} w={24} h={12} />)}
  </g>)
}
function EventHall() {
  return (<g>
    <rect y="140" width="400" height="80" fill="#3a2a20" />
    <path d="M0 60 L400 60 L400 40 L0 40 Z" fill="#c4562a" />
    {[40, 100, 160, 220, 280, 340].map((x, i) => <g key={x}><circle cx={x} cy={80 + (i % 2) * 14} r="10" fill={['#f5b91c', '#e0457b', '#2bb3a6'][i % 3]} /><line x1={x} y1={60} x2={x} y2={70 + (i % 2) * 14} stroke="#fff" strokeWidth="1" /></g>)}
    <rect x="140" y="100" width="120" height="50" fill="#f5b91c" stroke="#7a3b00" strokeWidth="3" /><text x="200" y="132" fontSize="22" fontWeight="800" textAnchor="middle" fill="#7a2a22">OWAMBE</text>
    {[60, 320, 90, 290].map((x, i) => <text key={i} x={x} y={190 - (i % 2) * 14} fontSize="28">{['💃', '🕺', '🥁', '🍾'][i]}</text>)}
  </g>)
}
function Danfo() {
  return (<g>
    <rect y="150" width="400" height="70" fill="#3b3b44" /><rect y="150" width="400" height="6" fill="#ffd23f" /><rect y="186" width="400" height="3" fill="#fff" opacity=".7" strokeDasharray="20 14" />
    <g transform="translate(110 78)"><rect width="200" height="70" rx="10" fill="#ffd23f" stroke="#1c1b22" strokeWidth="3" /><rect x="0" y="30" width="200" height="12" fill="#1c1b22" /><rect x="14" y="10" width="40" height="22" rx="3" fill="#a7d7ff" /><rect x="64" y="10" width="40" height="22" rx="3" fill="#a7d7ff" /><rect x="114" y="10" width="40" height="22" rx="3" fill="#a7d7ff" /><rect x="164" y="10" width="26" height="30" rx="3" fill="#a7d7ff" /><circle cx="40" cy="70" r="14" fill="#1c1b22" /><circle cx="160" cy="70" r="14" fill="#1c1b22" /><circle cx="40" cy="70" r="6" fill="#999" /><circle cx="160" cy="70" r="6" fill="#999" /><text x="100" y="58" fontSize="9" fontWeight="800" textAnchor="middle" fill="#ffd23f">GOD IS ABLE</text></g>
    <rect x="0" y="40" width="80" height="110" fill="#9a6a3a" opacity=".6" /><rect x="320" y="30" width="80" height="120" fill="#b27e47" opacity=".6" />
  </g>)
}
