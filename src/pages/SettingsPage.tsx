import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChannelManagerTab } from "@/components/settings/ChannelManagerTab"
import { RoomsManagementTab } from "@/components/settings/RoomsManagementTab"
import { HotelProfileTab } from "@/components/settings/HotelProfileTab"
import { Settings as SettingsIcon, Radio, BedDouble, Hotel } from "lucide-react"

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("channel-manager")

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-ios-sm">
          <SettingsIcon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            System & Property Settings
          </h1>
          <p className="text-xs text-slate-400 font-normal">
            Manage your OTA channel synchronization, room inventory, and hotel branding
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-200/70 p-1">
          <TabsTrigger value="channel-manager" className="gap-2 text-xs">
            <Radio className="h-3.5 w-3.5" />
            <span>Channel Manager (iCal)</span>
          </TabsTrigger>
          <TabsTrigger value="rooms" className="gap-2 text-xs">
            <BedDouble className="h-3.5 w-3.5" />
            <span>Rooms Inventory</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 text-xs">
            <Hotel className="h-3.5 w-3.5" />
            <span>Hotel Profile & Theme</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="channel-manager">
            <ChannelManagerTab />
          </TabsContent>

          <TabsContent value="rooms">
            <RoomsManagementTab />
          </TabsContent>

          <TabsContent value="profile">
            <HotelProfileTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
