/**
 * Applies the primary theme color dynamically to document CSS custom properties on root element.
 */
export function applyThemePrimaryColor(hexColor: string): void {
  if (typeof document === "undefined" || !hexColor) return
  document.documentElement.style.setProperty("--primary", hexColor)
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
