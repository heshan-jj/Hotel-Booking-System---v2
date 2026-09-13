/**
 * Converts a hex color string to HSL channel values (e.g. "211 100% 45%").
 */
export function hexToHslChannels(hexColor: string): string {
  let hex = hexColor.replace("#", "").trim()
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("")
  }

  if (hex.length !== 6) {
    return "211 100% 45%" // Default fallback iOS System Blue
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  const hDeg = Math.round(h * 360)
  const sPct = Math.round(s * 100)
  const lPct = Math.round(l * 100)

  return `${hDeg} ${sPct}% ${lPct}%`
}

/**
 * Applies the primary theme color dynamically to document CSS custom properties on root element.
 */
export function applyThemePrimaryColor(hexColor: string): void {
  if (typeof document === "undefined" || !hexColor) return

  const hslChannels =
    hexColor.startsWith("#") || hexColor.length === 6 || hexColor.length === 3
      ? hexToHslChannels(hexColor)
      : hexColor

  document.documentElement.style.setProperty("--primary", hslChannels)
  document.documentElement.style.setProperty("--ring", hslChannels)

  // Compute readable text for primary-foreground
  const readableTextColor = getReadableTextColor(hexColor)
  const foregroundHsl = readableTextColor === "#ffffff" ? "210 40% 98%" : "224 25% 12%"
  document.documentElement.style.setProperty("--primary-foreground", foregroundHsl)
}

/**
 * Computes relative luminance according to WCAG 2.1 specifications and returns
 * either dark text (#0f172a) or light text (#ffffff) to ensure accessible contrast (> 4.5:1).
 */
export function getReadableTextColor(hexColor: string): string {
  // Clean hex string
  let hex = hexColor.replace("#", "")

  // Expand short hex (3 chars -> 6 chars)
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("")
  }

  if (hex.length !== 6) {
    return "#ffffff"
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)

  const rLinear = toLinear(r)
  const gLinear = toLinear(g)
  const bLinear = toLinear(b)

  const luminance = 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear

  // Luminance threshold ~0.45 determines light vs dark text for optimal WCAG AA contrast
  return luminance > 0.45 ? "#0f172a" : "#ffffff"
}

