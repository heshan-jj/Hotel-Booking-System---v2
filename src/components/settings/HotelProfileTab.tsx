import React, { useState, useEffect } from "react"
import { useHotelSettings } from "@/hooks/useHotelSettings"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Loader2,
  CheckCircle2,
  AlertCircle,
  Coins,
} from "lucide-react"
import { SUPPORTED_CURRENCIES } from "@/constants/currencies"
import { ThemeColorPicker } from "@/components/shared/ThemeColorPicker"

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
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Hotel settings and theme color updated successfully!</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 p-4 text-xs font-semibold text-red-800 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 1. Identity Card */}
      <Card className="dark:bg-zinc-900/90 dark:border-white/[0.08]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-zinc-100">
            <Hotel className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Hotel Brand Identity
          </CardTitle>
          <CardDescription className="dark:text-zinc-400">
            Configure your official hotel name and branding logo displayed throughout the PMS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="profileName" className="text-slate-800 dark:text-zinc-200">
              Hotel Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="profileName"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grand Haven Hotel"
              className="mt-2 max-w-lg dark:bg-zinc-800/60 dark:border-white/[0.1] dark:text-zinc-100"
            />
          </div>

          <div>
            <Label htmlFor="profileCurrency" className="text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Base Currency <span className="text-red-500">*</span>
            </Label>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              Selected currency symbol will be used across room rates, bookings, and billing.
            </p>
            <select
              id="profileCurrency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-2 flex h-10 w-full max-w-lg rounded-md border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-zinc-800/60 px-3 py-2 text-sm text-slate-900 dark:text-zinc-100 shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {SUPPORTED_CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-slate-800 dark:text-zinc-200">Hotel Logo</Label>
            {logoUrl ? (
              <div className="mt-2 flex max-w-lg items-center justify-between rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-800/40 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-zinc-800 p-1 border border-slate-200 dark:border-white/[0.1] shadow-xs">
                    <img
                      src={logoUrl}
                      alt="Hotel Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Current Logo</p>
                    <p className="truncate max-w-xs text-xs text-slate-500 dark:text-zinc-400">{logoUrl}</p>
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
              <div className="mt-2 flex max-w-lg flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20 p-6 text-center hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  {isUploadingLogo ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                  {isUploadingLogo ? "Uploading logo image..." : "Upload hotel logo image"}
                </p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500">PNG, JPG, WEBP, or SVG</p>
                <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-lg bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-700">
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                    aria-label="Upload hotel logo"
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
      <Card className="dark:bg-zinc-900/90 dark:border-white/[0.08]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-zinc-100">
            <Palette className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Theme & Primary Color
          </CardTitle>
          <CardDescription className="dark:text-zinc-400">
            Choose your signature primary theme color. It automatically customizes buttons, active
            navigation tabs, and badges in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeColorPicker
            value={themeColor}
            onChange={setThemeColor}
            hotelName={name}
          />
        </CardContent>
        <CardFooter className="flex justify-end border-t border-slate-100 dark:border-white/[0.08] pt-4">
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
