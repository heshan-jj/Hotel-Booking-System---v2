import React, { useState, useEffect } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { useHotelSettings } from "@/hooks/useHotelSettings"
import { supabase } from "@/lib/supabase"
import { useQueryClient } from "@tanstack/react-query"
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
  BedDouble,
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  CheckCircle2,
  X,
  Layers,
} from "lucide-react"

// Curated theme color presets
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

interface TempRoom {
  id: string
  name: string
  capacity: number
  base_rate: number
}

export function OnboardingPage() {
  const { settings, isLoading: isSettingsLoading, updateSettings } = useHotelSettings()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Step 1: Hotel Name & Logo
  const [hotelName, setHotelName] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null)

  // Step 2: Theme Color
  const [themeColor, setThemeColor] = useState("#0f172a")

  // Step 3: Rooms List
  const [roomsList, setRoomsList] = useState<TempRoom[]>([])
  const [roomNameInput, setRoomNameInput] = useState("")
  const [roomCapacityInput, setRoomCapacityInput] = useState<number>(2)
  const [roomRateInput, setRoomRateInput] = useState<number>(120)

  // Final submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Initialize values from settings if available
  useEffect(() => {
    if (settings) {
      if (settings.name) setHotelName(settings.name)
      if (settings.logo_url) setLogoUrl(settings.logo_url)
      if (settings.theme_primary_color) setThemeColor(settings.theme_primary_color)
    }
  }, [settings])

  if (isSettingsLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">Checking hotel status...</p>
        </div>
      </div>
    )
  }

  // If onboarding is already completed, redirect to the dashboard
  if (settings?.onboarding_completed) {
    return <Navigate to="/" replace />
  }

  // --- Step 1: Logo Upload Handler ---
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoUploadError(null)
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
      console.error("Logo upload failed:", err)
      setLogoUploadError((err as Error).message || "Failed to upload logo image.")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  // --- Step 3: Room Handlers ---
  const handleAddRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!roomNameInput.trim()) return

    const newRoom: TempRoom = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: roomNameInput.trim(),
      capacity: Math.max(1, Number(roomCapacityInput) || 1),
      base_rate: Math.max(0, Number(roomRateInput) || 0),
    }

    setRoomsList((prev) => [...prev, newRoom])
    setRoomNameInput("")
    setRoomCapacityInput(2)
    setRoomRateInput(120)
  }

  const handleRemoveRoom = (roomId: string) => {
    setRoomsList((prev) => prev.filter((r) => r.id !== roomId))
  }

  // --- Final Step: Finish Setup ---
  const handleFinishOnboarding = async () => {
    setIsSubmitting(true)
    setGlobalError(null)

    try {
      const finalHotelName = hotelName.trim() || "My Hotel"

      // 1. Ensure a Property record exists with this hotel name
      let propertyId: string
      const { data: existingProps, error: propCheckErr } = await supabase
        .from("properties")
        .select("id")
        .limit(1)

      if (propCheckErr) throw propCheckErr

      if (existingProps && existingProps.length > 0) {
        propertyId = existingProps[0].id
        await supabase
          .from("properties")
          .update({ name: finalHotelName })
          .eq("id", propertyId)
      } else {
        const { data: newProp, error: createPropErr } = await supabase
          .from("properties")
          .insert({ name: finalHotelName })
          .select("id")
          .single()

        if (createPropErr) throw createPropErr
        propertyId = newProp.id
      }

      // 2. Insert any configured rooms from Step 3
      if (roomsList.length > 0) {
        const roomsToInsert = roomsList.map((r) => ({
          property_id: propertyId,
          name: r.name,
          capacity: r.capacity,
          base_rate: r.base_rate,
        }))

        const { error: roomsInsertErr } = await supabase
          .from("rooms")
          .insert(roomsToInsert)

        if (roomsInsertErr) throw roomsInsertErr
      }

      // 3. Update hotel_settings to mark onboarding complete
      await updateSettings({
        name: finalHotelName,
        logo_url: logoUrl,
        theme_primary_color: themeColor,
        onboarding_completed: true,
      })

      // 4. Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["hotel_settings"] })
      queryClient.invalidateQueries({ queryKey: ["rooms"] })
      queryClient.invalidateQueries({ queryKey: ["properties"] })

      // 5. Navigate to dashboard
      navigate("/", { replace: true })
    } catch (err) {
      console.error("Onboarding completion error:", err)
      setGlobalError((err as Error).message || "Failed to complete setup. Please retry.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Wizard Header & Stepper */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Hotel className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Hotel Setup & Configuration
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Complete the 3-step setup to customize your PMS dashboard
          </p>

          {/* Stepper Indicator */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {[
              { num: 1, label: "Profile" },
              { num: 2, label: "Theme" },
              { num: 3, label: "Rooms" },
            ].map((step, idx) => {
              const isActive = currentStep === step.num
              const isPast = currentStep > step.num
              return (
                <React.Fragment key={step.num}>
                  {idx > 0 && (
                    <div
                      className={`h-0.5 w-10 sm:w-16 transition-colors ${
                        isPast ? "bg-blue-500" : "bg-slate-700"
                      }`}
                    />
                  )}
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        isPast
                          ? "bg-blue-600 text-white"
                          : isActive
                          ? "bg-blue-500 text-white ring-4 ring-blue-500/20"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {isPast ? <Check className="h-3.5 w-3.5" /> : step.num}
                    </div>
                    <span
                      className={`hidden text-xs font-medium sm:inline ${
                        isActive ? "text-white" : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Global Error Banner */}
        {globalError && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {globalError}
          </div>
        )}

        {/* Wizard Card Body */}
        <Card className="border-slate-700/60 bg-slate-900/85 shadow-2xl backdrop-blur-xl text-white">
          {/* STEP 1: Hotel Name & Logo */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Hotel className="h-5 w-5 text-blue-400" />
                  Step 1: Hotel Identity
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Enter your property name and upload your branding logo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="hotelName" className="text-slate-200">
                    Hotel / Property Name <span className="text-blue-400">*</span>
                  </Label>
                  <Input
                    id="hotelName"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    placeholder="e.g. Grand Haven Resort & Spa"
                    className="mt-2 border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    This name will appear on all reports, calendar headings, and guest communications.
                  </p>
                </div>

                <div>
                  <Label className="text-slate-200">Hotel Logo (Optional)</Label>
                  {logoUrl ? (
                    <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-white/10 p-1 border border-slate-600">
                          <img
                            src={logoUrl}
                            alt="Hotel Logo"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Logo uploaded</p>
                          <p className="truncate max-w-xs text-xs text-slate-400">{logoUrl}</p>
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
                    <div className="mt-2 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/40 p-6 text-center hover:bg-slate-800/60 transition-colors">
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                        {isUploadingLogo ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Upload className="h-5 w-5" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-300">
                        {isUploadingLogo ? "Uploading logo..." : "Upload hotel logo image"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        PNG, JPG, WEBP, or SVG up to 5MB
                      </p>
                      <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-500">
                        <span>Browse File</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp, image/svg+xml"
                          onChange={handleLogoFileChange}
                          disabled={isUploadingLogo}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  )}

                  {logoUploadError && (
                    <p className="mt-2 text-xs text-red-400">{logoUploadError}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t border-slate-800/80 pt-4">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!hotelName.trim() || isUploadingLogo}
                  className="gap-2 bg-blue-600 hover:bg-blue-500 text-white"
                >
                  <span>Continue to Theme</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </>
          )}

          {/* STEP 2: Theme Color Picker & Live Preview */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Palette className="h-5 w-5 text-indigo-400" />
                  Step 2: Brand & Theme Styling
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Select your primary hotel brand color or specify a custom hex code.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Presets Grid */}
                <div>
                  <Label className="text-slate-200">Preset Color Palettes</Label>
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
                              ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30"
                              : "border-slate-800 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg shadow-xs"
                            style={{ backgroundColor: preset.hex }}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                          </span>
                          <span className="truncate text-xs font-medium text-slate-200">
                            {preset.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Custom Color Input */}
                <div>
                  <Label className="text-slate-200">Custom Brand Hex Color</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="h-10 w-14 cursor-pointer rounded-lg border border-slate-700 bg-slate-800 p-1"
                      />
                    </div>
                    <Input
                      type="text"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      placeholder="#0f172a"
                      className="max-w-[160px] font-mono uppercase border-slate-700 bg-slate-800/80 text-white focus-visible:ring-blue-500"
                    />
                    <Badge variant="outline" className="border-slate-700 text-slate-300">
                      Live Color: {themeColor}
                    </Badge>
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="rounded-xl border border-slate-700/80 bg-slate-950 p-4 shadow-inner">
                  <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <span>Live Theme Preview</span>
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-[10px]">
                      Real-time
                    </Badge>
                  </div>

                  {/* Sample Mock Header */}
                  <div
                    className="flex items-center justify-between rounded-lg p-3 shadow-md transition-colors"
                    style={{ backgroundColor: themeColor }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-white">
                        <Hotel className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold text-white">
                        {hotelName || "My Hotel"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white">
                        Dashboard
                      </span>
                    </div>
                  </div>

                  {/* Sample Action Button and Tag */}
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors"
                      style={{ backgroundColor: themeColor }}
                    >
                      Sample Action Button
                    </button>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${themeColor}25`,
                        color: themeColor,
                        border: `1px solid ${themeColor}40`,
                      }}
                    >
                      Active Pill Badge
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-slate-800/80 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="gap-2 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  className="gap-2 bg-blue-600 hover:bg-blue-500 text-white"
                >
                  <span>Continue to Rooms</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </>
          )}

          {/* STEP 3: Add First Room(s) or Skip */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <BedDouble className="h-5 w-5 text-emerald-400" />
                  Step 3: Setup Hotel Rooms
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Add your room inventory now, or skip this step and add rooms later in Settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Room Form */}
                <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-300">
                    Add Room Details
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-3">
                      <Label htmlFor="roomName" className="text-slate-200">
                        Room Name / Unit
                      </Label>
                      <Input
                        id="roomName"
                        value={roomNameInput}
                        onChange={(e) => setRoomNameInput(e.target.value)}
                        placeholder="e.g. Deluxe Ocean Suite 101"
                        className="mt-1 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="roomCapacity" className="text-slate-200">
                        Guest Capacity
                      </Label>
                      <Input
                        id="roomCapacity"
                        type="number"
                        min="1"
                        value={roomCapacityInput}
                        onChange={(e) => setRoomCapacityInput(Number(e.target.value))}
                        className="mt-1 border-slate-700 bg-slate-800 text-white focus-visible:ring-blue-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="roomRate" className="text-slate-200">
                        Base Rate ($ / Night)
                      </Label>
                      <Input
                        id="roomRate"
                        type="number"
                        min="0"
                        step="0.01"
                        value={roomRateInput}
                        onChange={(e) => setRoomRateInput(Number(e.target.value))}
                        className="mt-1 border-slate-700 bg-slate-800 text-white focus-visible:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={handleAddRoom}
                        disabled={!roomNameInput.trim()}
                        className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Room</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Added Rooms List */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-slate-200">Configured Rooms ({roomsList.length})</Label>
                    {roomsList.length === 0 && (
                      <span className="text-xs text-slate-500">No rooms added yet (optional)</span>
                    )}
                  </div>

                  {roomsList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-800/30 p-6 text-center text-xs text-slate-400">
                      <Layers className="mx-auto mb-2 h-6 w-6 text-slate-600" />
                      You can add one or more rooms above, or skip to finish setup.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {roomsList.map((room) => (
                        <div
                          key={room.id}
                          className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/70 p-3 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/20 text-blue-400">
                              <BedDouble className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-white">{room.name}</p>
                              <p className="text-xs text-slate-400">
                                Max {room.capacity} guests • ${room.base_rate.toFixed(2)}/night
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRoom(room.id)}
                            className="text-slate-400 hover:text-red-400 hover:bg-slate-700/50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between border-t border-slate-800/80 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSubmitting}
                  className="gap-2 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>

                <div className="flex items-center gap-2">
                  {roomsList.length === 0 && (
                    <Button
                      variant="ghost"
                      disabled={isSubmitting}
                      onClick={handleFinishOnboarding}
                      className="text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      Skip room setup
                    </Button>
                  )}
                  <Button
                    onClick={handleFinishOnboarding}
                    disabled={isSubmitting}
                    className="gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>Finish Setup & Enter Dashboard</span>
                  </Button>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
