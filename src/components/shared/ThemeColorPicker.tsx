import { Check, Hotel } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export const COLOR_PRESETS = [
  { name: "Slate Midnight", hex: "#0f172a" },
  { name: "Royal Indigo", hex: "#4f46e5" },
  { name: "Ocean Blue", hex: "#0284c7" },
  { name: "Emerald Forest", hex: "#059669" },
  { name: "Burgundy Wine", hex: "#be123c" },
  { name: "Warm Amber", hex: "#d97706" },
  { name: "Imperial Violet", hex: "#7c3aed" },
  { name: "Earthy Bronze", hex: "#78350f" },
]

export interface ThemeColorPickerProps {
  value: string
  onChange: (hex: string) => void
  hotelName?: string
  /** Set true when rendering inside a dark, non-token-driven shell (e.g. Onboarding). */
  forceDark?: boolean
}

export function ThemeColorPicker({
  value,
  onChange,
  hotelName = "Hotel Name",
  forceDark = false,
}: ThemeColorPickerProps) {
  const themeColor = value || "#0f172a"

  const labelClass = forceDark
    ? "text-slate-200"
    : "text-slate-800 dark:text-zinc-200"

  const buttonSelectedClass = forceDark
    ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30"
    : "border-primary bg-primary/10 ring-2 ring-primary/20 dark:border-blue-500 dark:bg-blue-500/20"

  const buttonUnselectedClass = forceDark
    ? "border-slate-800 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-700 text-slate-200"
    : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-zinc-800/60 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200"

  const nativeColorPickerClass = forceDark
    ? "border-slate-700 bg-slate-800"
    : "border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"

  const hexInputClass = forceDark
    ? "border-slate-700 bg-slate-800/80 text-white focus-visible:ring-blue-500"
    : "dark:bg-zinc-800/80 dark:border-zinc-700 dark:text-zinc-100"

  const badgeClass = forceDark
    ? "border-slate-700 text-slate-300 bg-slate-800"
    : "border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800"

  const previewBoxClass = forceDark
    ? "border-slate-700/80 bg-slate-950"
    : "border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-950/80"

  const previewTitleClass = forceDark
    ? "text-slate-400"
    : "text-slate-500 dark:text-zinc-400"

  return (
    <div className="space-y-6">
      {/* Presets Grid */}
      <div>
        <Label className={labelClass}>Preset Color Palettes</Label>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {COLOR_PRESETS.map((preset) => {
            const isSelected = themeColor.toLowerCase() === preset.hex.toLowerCase()
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => onChange(preset.hex)}
                className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                  isSelected ? buttonSelectedClass : buttonUnselectedClass
                }`}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg shadow-xs"
                  style={{ backgroundColor: preset.hex }}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                </span>
                <span className="truncate text-xs font-semibold">
                  {preset.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Color Input */}
      <div>
        <Label className={labelClass}>Custom Brand Hex Color</Label>
        <div className="mt-2 flex items-center gap-3">
          <div className="relative">
            <input
              type="color"
              value={themeColor}
              onChange={(e) => onChange(e.target.value)}
              className={`h-10 w-14 cursor-pointer rounded-lg border p-1 ${nativeColorPickerClass}`}
            />
          </div>
          <Input
            type="text"
            value={themeColor}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#0f172a"
            className={`max-w-[160px] font-mono uppercase ${hexInputClass}`}
          />
          <Badge variant="outline" className={badgeClass}>
            Live: {themeColor}
          </Badge>
        </div>
      </div>

      {/* Live Preview Card */}
      <div className={`rounded-xl border p-4 shadow-xs ${previewBoxClass}`}>
        <div className="mb-3 flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-wider ${previewTitleClass}`}>
            Live Theme Preview
          </span>
          <Badge variant="secondary" className="text-[10px]">
            Real-time
          </Badge>
        </div>

        {/* Sample Mock Header */}
        <div
          className="flex items-center justify-between rounded-lg p-3 text-white shadow-md transition-colors"
          style={{ backgroundColor: themeColor }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-white">
              <Hotel className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-white">
              {hotelName || "Hotel Name"}
            </span>
          </div>
          <span className="rounded bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white">
            Active Theme
          </span>
        </div>
      </div>
    </div>
  )
}
