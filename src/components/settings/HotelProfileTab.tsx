import React, { useState, useEffect } from "react"
import { useHotelSettings } from "@/hooks/useHotelSettings"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Hotel,
  Upload,
  Trash2,
  Palette,
  Check,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Coins,
} from "lucide-react"
import { SUPPORTED_CURRENCIES } from "@/constants/currencies"

const COLOR_PRESETS = [
  { name: "Slate Midnight", hex: "#0f172a" },
  { name: "Royal Indigo", hex: "#4f46e5" },
  { name: "Ocean Blue", hex: "#0284c7" },
  { name: "Emerald Forest", hex: "#059669" },
  { name: "Burgundy Wine", hex: "#be123c" },
  { name: "Warm Amber", hex: "#d97706" },
  { name: "Imperial Violet", hex: "#7c3aed" },
  { name: "Earthy Bronze", hex: "#78350f" },
]

export function HotelProfileTab() {
  const { settings, updateSettings, isUpdating } = useHotelSettings()

  const [name, setName] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [themeColor, setThemeColor] = useState("#0f172a")
  const [currency, setCurrency] = useState("USD")

  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      if (settings.name) setName(settings.name)
      if (settings.logo_url !== undefined) setLogoUrl(settings.logo_url)
      if (settings.theme_primary_color) setThemeColor(settings.theme_primary_color)
      if (settings.currency) setCurrency(settings.currency)
    }
  }, [settings])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setIsUploadingLogo(true)

    try {
      const fileExt = file.name.split(".").pop() || "png"
      const fileName = `hotel-logo-${Date.now()}.${fileExt}`

      const { error: uploadErr } = await supabase.storage
        .from("hotel-assets")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadErr) throw uploadErr

      const { data: publicUrlData } = supabase.storage
        .from("hotel-assets")
        .getPublicUrl(fileName)

      setLogoUrl(publicUrlData.publicUrl)
    } catch (err) {
      console.error("Logo upload error:", err)
      setUploadError((err as Error).message || "Failed to upload logo.")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    setSaveSuccess(false)

    if (!name.trim()) {
      setSaveError("Hotel name cannot be empty.")
      return
    }

    try {
      await updateSettings({
        name: name.trim(),
        logo_url: logoUrl,
        theme_primary_color: themeColor,
        currency,
      })

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err) {
      console.error("Failed to update settings:", err)
      setSaveError((err as Error).message || "Failed to update hotel profile.")
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Hotel settings and theme color updated successfully!</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 text-red-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 1. Identity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-slate-900">
            <Hotel className="h-5 w-5 text-blue-600" />
            Hotel Brand Identity
          </CardTitle>
          <CardDescription>
            Configure your official hotel name and branding logo displayed throughout the PMS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="profileName" className="text-slate-800">
              Hotel Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="profileName"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grand Haven Hotel"
              className="mt-2 max-w-lg"
            />
          </div>

          <div>
            <Label htmlFor="profileCurrency" className="text-slate-800 flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-emerald-600" />
              Base Currency <span className="text-red-500">*</span>
            </Label>
            <p className="mt-0.5 text-xs text-slate-500">
              Selected currency symbol will be used across room rates, bookings, and billing.
            </p>
            <select
              id="profileCurrency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-2 flex h-10 w-full max-w-lg rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {SUPPORTED_CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-slate-800">Hotel Logo</Label>
            {logoUrl ? (
              <div className="mt-2 flex max-w-lg items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-white p-1 border border-slate-200 shadow-xs">
                    <img
                      src={logoUrl}
                      alt="Hotel Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Current Logo</p>
                    <p className="truncate max-w-xs text-xs text-slate-500">{logoUrl}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setLogoUrl(null)}
                  className="gap-1 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="mt-2 flex max-w-lg flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:bg-slate-50 transition-colors">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  {isUploadingLogo ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {isUploadingLogo ? "Uploading logo image..." : "Upload hotel logo image"}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">PNG, JPG, WEBP, or SVG</p>
                <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50">
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                    className="sr-only"
                  />
                </label>
              </div>
            )}
            {uploadError && <p className="mt-2 text-xs text-red-500">{uploadError}</p>}
          </div>
        </CardContent>
      </Card>

      {/* 2. Theme & Styling Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-slate-900">
            <Palette className="h-5 w-5 text-indigo-600" />
            Theme & Primary Color
          </CardTitle>
          <CardDescription>
            Choose your signature primary theme color. It automatically customizes buttons, active
            navigation tabs, and badges in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-slate-800">Color Palette Presets</Label>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = themeColor.toLowerCase() === preset.hex.toLowerCase()
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setThemeColor(preset.hex)}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg shadow-xs"
                      style={{ backgroundColor: preset.hex }}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                    </span>
                    <span className="truncate text-xs font-semibold text-slate-800">
                      {preset.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Label className="text-slate-800">Custom Brand Hex</Label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
              />
              <Input
                type="text"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                placeholder="#0f172a"
                className="max-w-[160px] font-mono uppercase"
              />
              <Badge variant="outline" className="text-slate-700 bg-slate-50">
                Current: {themeColor}
              </Badge>
            </div>
          </div>

          {/* Live Preview Bar */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-xs">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Live Theme Preview
            </div>
            <div
              className="flex items-center justify-between rounded-lg p-3 text-white shadow-xs transition-colors"
              style={{ backgroundColor: themeColor }}
            >
              <div className="flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                <span className="font-bold text-sm">{name || "Hotel Name"}</span>
              </div>
              <span className="rounded bg-white/20 px-2 py-0.5 text-xs font-semibold">
                Active Header
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
          <Button
            type="submit"
            disabled={isUpdating || isUploadingLogo}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            <span>Save Profile & Theme</span>
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
