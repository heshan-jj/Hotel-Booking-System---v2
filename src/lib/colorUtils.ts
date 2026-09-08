/**
 * Converts a hex color string (e.g. "#0f172a" or "0f172a")
 * to the HSL format expected by shadcn/ui's Tailwind configuration:
 * "H S% L%" (e.g. "222.2 47.4% 11.2%").
 */
export function hexToHsl(hex: string): string {
  let cleanHex = hex.replace("#", "").trim()

  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("")
  }

  if (cleanHex.length !== 6) {
    return "221.2 83.2% 53.3%" // Fallback blue
  }

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) * 60
        break
      case g:
        h = ((b - r) / delta + 2) * 60
        break
      case b:
        h = ((r - g) / delta + 4) * 60
        break
    }
  }

  const hDeg = Math.round(h * 10) / 10
  const sPct = Math.round(s * 1000) / 10
  const lPct = Math.round(l * 1000) / 10

  return `${hDeg} ${sPct}% ${lPct}%`
}

/**
 * Returns true if the color is light (requiring dark text foreground).
 */
export function isLightColor(hex: string): boolean {
  let cleanHex = hex.replace("#", "").trim()
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("")
  }
  if (cleanHex.length !== 6) return false

  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  // Standard YIQ brightness calculation
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 145
}

/**
 * Applies the primary theme color to the document root as CSS variables.
 */
export function applyThemePrimaryColor(hexColor: string) {
  if (!hexColor || typeof document === "undefined") return

  const hsl = hexToHsl(hexColor)
  const isLight = isLightColor(hexColor)

  const root = document.documentElement
  root.style.setProperty("--primary", hsl)
  root.style.setProperty("--ring", hsl)
  root.style.setProperty(
    "--primary-foreground",
    isLight ? "222.2 84% 4.9%" : "210 40% 98%"
  )
}
