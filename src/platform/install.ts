// "Add to home screen". Chrome/Edge/Samsung fire `beforeinstallprompt`, which we hold until the player taps Install.
// iPhone Safari has no such event, so we show the Share → Add to Home Screen steps instead.
interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let deferred: InstallEvent | null = null
let installed = false
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())
const KEY = 'nal.install.dismissed'

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallEvent; emit() })
  window.addEventListener('appinstalled', () => { installed = true; deferred = null; emit() })
}

export const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true)

export const isIOS = () => typeof navigator !== 'undefined' && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

export type InstallMode = 'installed' | 'prompt' | 'ios' | 'manual'
/** What we can offer on this device: a one-tap install, iPhone steps, or generic menu steps. */
export function installMode(): InstallMode {
  if (installed || isStandalone()) return 'installed'
  if (deferred) return 'prompt'
  if (isIOS()) return 'ios'
  return 'manual'
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable'
  const e = deferred; deferred = null; emit()
  try { await e.prompt(); return (await e.userChoice).outcome } catch { return 'unavailable' }
}

export const subscribeInstall = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }
export const installDismissed = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }
export const dismissInstall = () => { try { localStorage.setItem(KEY, '1') } catch { /* ignore */ } emit() }
