// Tiny user-agent classifier. Only the parsed classes are stored; the raw string is never persisted.
export interface UaInfo { device_type: 'mobile' | 'tablet' | 'desktop' | 'bot'; os: string; browser: string; browser_version: string; bot: boolean }

export function parseUa(ua: string | null | undefined): UaInfo {
  const s = ua ?? ''
  const bot = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|monitor|curl|wget|python-requests|playwright|puppeteer/i.test(s) || s === ''
  const os = /Windows/.test(s) ? 'Windows' : /Android/.test(s) ? 'Android' : /iPhone|iPad|iPod/.test(s) ? 'iOS' : /Mac OS X|Macintosh/.test(s) ? 'macOS' : /CrOS/.test(s) ? 'ChromeOS' : /Linux/.test(s) ? 'Linux' : 'Other'
  const tablet = /iPad|Tablet/i.test(s) || (/Android/.test(s) && !/Mobile/.test(s))
  const mobile = /Mobi|iPhone|iPod|Android/.test(s)
  const m = (re: RegExp) => s.match(re)?.[1]?.split('.')[0] ?? ''
  let browser = 'Other', v = ''
  if (/Edg(e|A|iOS)?\//.test(s)) { browser = 'Edge'; v = m(/Edg(?:e|A|iOS)?\/([\d.]+)/) }
  else if (/OPR\/|Opera/.test(s)) { browser = 'Opera'; v = m(/OPR\/([\d.]+)/) }
  else if (/SamsungBrowser/.test(s)) { browser = 'Samsung Internet'; v = m(/SamsungBrowser\/([\d.]+)/) }
  else if (/Firefox|FxiOS/.test(s)) { browser = 'Firefox'; v = m(/(?:Firefox|FxiOS)\/([\d.]+)/) }
  else if (/Chrome|CriOS/.test(s)) { browser = 'Chrome'; v = m(/(?:Chrome|CriOS)\/([\d.]+)/) }
  else if (/Safari/.test(s)) { browser = 'Safari'; v = m(/Version\/([\d.]+)/) }
  return { device_type: bot ? 'bot' : tablet ? 'tablet' : mobile ? 'mobile' : 'desktop', os, browser, browser_version: v, bot }
}
