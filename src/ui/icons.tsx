// A small, consistent icon set (flat, rounded, two-tone). Emoji stay for content art; these are the interface.
import type { CSSProperties } from 'react'

export type IconName = 'bolt' | 'heart' | 'book' | 'star' | 'smile' | 'coin' | 'lock' | 'check' | 'chevron' | 'pin' | 'home' | 'scroll' | 'user' | 'gear' | 'trophy' | 'shell' | 'close' | 'play' | 'hourglass' | 'flag' | 'map' | 'bag' | 'people' | 'sun' | 'moon' | 'door' | 'chat' | 'wind' | 'back' | 'menu' | 'plus' | 'clock' | 'dice' | 'rocket' | 'up' | 'down' | 'swap' | 'pencil' | 'info' | 'share' | 'cash'

const P: Record<IconName, JSX.Element> = {
  bolt: <path d="M13.2 2 5 13.4h5.6L9.8 22 19 10.2h-5.8z" />,
  heart: <path d="M12 21.2C5.2 15.6 2.5 12 2.5 8.6A5 5 0 0 1 12 6.5 5 5 0 0 1 21.5 8.6c0 3.4-2.7 7-9.5 12.6z" />,
  book: <><path d="M3.5 4.5h6.2A2.3 2.3 0 0 1 12 6.8v13.4a2.3 2.3 0 0 0-2.3-2.3H3.5z" /><path opacity=".78" d="M20.5 4.5h-6.2A2.3 2.3 0 0 0 12 6.8v13.4a2.3 2.3 0 0 1 2.3-2.3h6.2z" /></>,
  star: <path d="m12 2.4 2.95 6.1 6.65.9-4.85 4.65 1.2 6.6L12 17.4l-5.95 3.25 1.2-6.6L2.4 9.4l6.65-.9z" />,
  smile: <><circle cx="12" cy="12" r="10" /><circle cx="8.6" cy="9.8" r="1.5" fill="#1c1b22" /><circle cx="15.4" cy="9.8" r="1.5" fill="#1c1b22" /><path d="M7.6 14.2c1 2.4 2.7 3.4 4.4 3.4s3.4-1 4.4-3.4" fill="none" stroke="#1c1b22" strokeWidth="1.8" strokeLinecap="round" /></>,
  coin: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="7.4" fill="none" stroke="#9a5a00" strokeOpacity=".55" strokeWidth="1.5" /><path d="M8.6 17V7.4l6.8 9.2V7" fill="none" stroke="#7a4700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M7.4 10.6h9.2M7.4 13.4h9.2" stroke="#7a4700" strokeWidth="1.5" strokeLinecap="round" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10.5" rx="3" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></>,
  check: <path d="m5 12.8 4.6 4.6L19.2 7.6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />,
  chevron: <path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />,
  back: <path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />,
  pin: <><path d="M12 22.2s7.2-6.2 7.2-12a7.2 7.2 0 1 0-14.4 0c0 5.8 7.2 12 7.2 12z" /><circle cx="12" cy="10" r="2.8" fill="#1c1b22" /></>,
  home: <path d="M3 11.2 12 3l9 8.2V21h-6.2v-6h-5.6v6H3z" />,
  scroll: <><rect x="4.2" y="3" width="15.6" height="18" rx="3" /><path d="M8 8h8M8 12h8M8 16h5" stroke="#1c1b22" strokeOpacity=".7" strokeWidth="1.8" strokeLinecap="round" /></>,
  user: <><circle cx="12" cy="7.8" r="4.4" /><path d="M3.8 21c.5-4.6 3.7-6.9 8.2-6.9s7.7 2.3 8.2 6.9z" /></>,
  gear: <><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z" fillOpacity="0" stroke="currentColor" strokeWidth="2.4" /><path d="M10.4 2.5h3.2l.5 2.6 1.7.8 2.2-1.5 2.3 2.3-1.5 2.2.8 1.7 2.6.5v3.2l-2.6.5-.8 1.7 1.5 2.2-2.3 2.3-2.2-1.5-1.7.8-.5 2.6h-3.2l-.5-2.6-1.7-.8-2.2 1.5-2.3-2.3 1.5-2.2-.8-1.7-2.6-.5v-3.2l2.6-.5.8-1.7-1.5-2.2 2.3-2.3 2.2 1.5 1.7-.8z" fillOpacity=".92" /><circle cx="12" cy="12" r="3.2" fill="#1c1b22" fillOpacity=".55" /></>,
  trophy: <><path d="M7 3.5h10v5.2a5 5 0 0 1-10 0z" /><path d="M7 5.5H3.8c0 3.2 1.3 5 3.6 5.4M17 5.5h3.2c0 3.2-1.3 5-3.6 5.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M10.4 13.6h3.2l.6 4H9.8z" /><rect x="7.4" y="17.6" width="9.2" height="3" rx="1.2" /></>,
  shell: <><path d="M12 21.5 3 9.6a9.6 9.6 0 0 1 18 0z" /><path d="M12 21.5 8 8.6M12 21.5 12 6.4M12 21.5 16 8.6" stroke="#1c1b22" strokeOpacity=".45" strokeWidth="1.6" strokeLinecap="round" fill="none" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />,
  play: <path d="M7.5 4.6v14.8l12-7.4z" />,
  hourglass: <><path d="M6 3h12M6 21h12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /><path d="M7.4 3c0 6 4.6 6 4.6 9s-4.6 3-4.6 9h9.2c0-6-4.6-6-4.6-9s4.6-3 4.6-9z" /></>,
  flag: <><path d="M5 21.5V3" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /><path d="M5.6 4.2h12.4l-2.6 4.2 2.6 4.2H5.6z" /></>,
  map: <><path d="m3 6.4 6-2.2 6 2.2 6-2.2v13.4l-6 2.2-6-2.2-6 2.2z" /><path d="M9 4.2v13.4M15 6.4v13.4" stroke="#1c1b22" strokeOpacity=".45" strokeWidth="1.5" fill="none" /></>,
  bag: <><path d="M5.2 8.4h13.6l1 12.6H4.2z" /><path d="M8.8 8.4a3.2 3.2 0 0 1 6.4 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></>,
  people: <><circle cx="8.6" cy="8" r="3.6" /><circle cx="16.4" cy="9" r="3" fillOpacity=".8" /><path d="M2 20.5c.4-4 3-6 6.6-6s6.2 2 6.6 6z" /><path fillOpacity=".8" d="M15.8 14.6c3.2-.2 5.6 1.5 6.2 5.9h-5c-.1-2.5-.6-4.4-1.2-5.9z" /></>,
  sun: <><circle cx="12" cy="12" r="4.6" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></>,
  moon: <path d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8 8.6 8.6 0 1 0 20.2 14.6z" />,
  door: <><path d="M5 21V4.2A1.7 1.7 0 0 1 6.7 2.5h10.6A1.7 1.7 0 0 1 19 4.2V21z" /><circle cx="15.2" cy="12.4" r="1.3" fill="#1c1b22" /></>,
  chat: <path d="M4 4.5h16a1.8 1.8 0 0 1 1.8 1.8v9.4a1.8 1.8 0 0 1-1.8 1.8h-8l-5 4v-4H4a1.8 1.8 0 0 1-1.8-1.8V6.3A1.8 1.8 0 0 1 4 4.5z" />,
  wind: <path d="M3 8.5h10.5a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17.5h7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />,
  plus: <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />,
  dice: <><rect x="3" y="3" width="18" height="18" rx="4.5" /><circle cx="8.2" cy="8.2" r="1.7" fill="#1c1b22" /><circle cx="15.8" cy="8.2" r="1.7" fill="#1c1b22" /><circle cx="12" cy="12" r="1.7" fill="#1c1b22" /><circle cx="8.2" cy="15.8" r="1.7" fill="#1c1b22" /><circle cx="15.8" cy="15.8" r="1.7" fill="#1c1b22" /></>,
  rocket: <><path d="M12 2.5c3.6 2.2 5.4 5.8 5 10.6l-2.4 2.4H9.4L7 13.1C6.6 8.3 8.4 4.7 12 2.5z" /><circle cx="12" cy="9.4" r="2" fill="#1c1b22" fillOpacity=".7" /><path d="M7.4 14.2 4 17l1.2 3.4 3.4-1.4zM16.6 14.2 20 17l-1.2 3.4-3.4-1.4z" fillOpacity=".75" /><path d="M10 17.6h4l-2 4z" fill="#ff7a4d" /></>,
  up: <path d="M12 4 21 15H3z" />,
  down: <path d="M12 20 3 9h18z" />,
  swap: <path d="M4 8h13l-3-3M20 16H7l3 3" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />,
  pencil: <path d="m4 20 1-4.6L16.4 4a2 2 0 0 1 2.8 0l.8.8a2 2 0 0 1 0 2.8L8.6 19z" />,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 11v6" stroke="#1c1b22" strokeWidth="2.6" strokeLinecap="round" /><circle cx="12" cy="7.4" r="1.6" fill="#1c1b22" /></>,
  share: <><circle cx="6" cy="12" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><path d="m8.6 10.6 6.8-3.4M8.6 13.4l6.8 3.4" stroke="currentColor" strokeWidth="2" /></>,
  cash: <><rect x="2.5" y="6" width="19" height="12" rx="2.5" /><circle cx="12" cy="12" r="3" fill="#1c1b22" fillOpacity=".45" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6.4V12l3.8 2.4" fill="none" stroke="#1c1b22" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></>,
}

/** Default colours so an icon looks right without styling. */
export const ICON_COLOR: Partial<Record<IconName, string>> = {
  bolt: '#e07a1f', heart: '#c4262e', book: '#2a6a9a', star: '#e0a010', smile: '#e0a010', coin: '#d99a0a', pin: '#c4562a', trophy: '#d99a0a', shell: '#c4562a', home: '#c4562a',
  scroll: '#8a5a36', user: '#2f5a3a', map: '#2f5a3a', flag: '#c4562a', bag: '#c4630f', people: '#c4562a', sun: '#e0a010', moon: '#4a4a6a', door: '#8a5a36', chat: '#2a6a9a', hourglass: '#c4630f', clock: '#c4630f', dice: '#1c1b22', rocket: '#1c1b22', up: '#2f5a3a', down: '#c4562a', info: '#2a6a9a', cash: '#2f5a3a', share: '#2a6a9a', pencil: '#c4630f', gear: '#5b5346', lock: '#5b5346',
}

export function Icon({ name, size = 24, color, className, style }: { name: IconName; size?: number; color?: string; className?: string; style?: CSSProperties }) {
  const c = color ?? ICON_COLOR[name] ?? 'currentColor'
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} style={{ color: c, fill: c, flex: 'none', filter: 'drop-shadow(0 1px 0 rgba(0,0,0,.18))', ...style }} aria-hidden="true">
      {P[name]}
    </svg>
  )
}
