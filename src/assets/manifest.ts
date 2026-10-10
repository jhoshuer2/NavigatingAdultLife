// Asset manifest: map an asset id to a URL to replace the built-in placeholder (see ADR 002).
// Example: music: { play: '/audio/play.mp3' }. Leave empty to use the synthesised placeholders.
export const ASSET_MANIFEST: { music: Record<string, string>; sfx: Record<string, string> } = { music: {}, sfx: {} }
