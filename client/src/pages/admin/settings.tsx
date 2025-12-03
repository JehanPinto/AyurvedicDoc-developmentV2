import { useState } from "react";
import { 
  Settings, 
  DollarSign,
  Percent,
  Calendar,
  Clock,
  Bell,
  Shield,
  Globe,
  Mail,
  Save
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    platformCommissionRate: "10",
    bookingCharges: "100",
    taxRate: "5",
    maxAdvanceBookingDays: "30",
    minBookingNoticeHours: "2",
    defaultSlotDuration: "30",
    defaultBufferTime: "10",
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    autoConfirmAppointments: false,
    requireDoctorVerification: true,
    allowOnlinePayments: true,
    allowClinicPayments: true,
    defaultLanguage: "english",
    maintenanceMode: false,
  });

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Platform settings have been updated successfully.",
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">Configure platform-wide settings and preferences</p>
        </div>
        <Button onClick={handleSave} data-testid="button-save">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment & Commission Settings
            </CardTitle>
            <CardDescription>
              Configure payment methods and commission rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="commissionRate">Platform Commission (%)</Label>
                <div className="relative">
                  <Input
                    id="commissionRate"
                    type="number"
                    value={settings.platformCommissionRate}
                    onChange={(e) => updateSetting("platformCommissionRate", e.target.value)}
                    className="pr-8"
                    data-testid="input-commission"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage charged on each consultation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookingCharges">Booking Charges (LKR)</Label>
                <Input
                  id="bookingCharges"
                  type="number"
                  value={settings.bookingCharges}
                  onChange={(e) => updateSetting("bookingCharges", e.target.value)}
                  data-testid="input-booking-charges"
                />
                <p className="text-xs text-muted-foreground">
                  Fixed fee per appointment booking
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <div className="relative">
                  <Input
                    id="taxRate"
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => updateSetting("taxRate", e.target.value)}
                    className="pr-8"
                    data-testid="input-tax"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Tax percentage on consultation fees
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Allow Online Payments</Label>
                <p className="text-sm text-muted-foreground">
                  Enable online payment processing
                </p>
              </div>
              <Switch
                checked={settings.allowOnlinePayments}
                onCheckedChange={(checked) => updateSetting("allowOnlinePayments", checked)}
                data-testid="switch-online-payments"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Allow Pay at Clinic</Label>
                <p className="text-sm text-muted-foreground">
                  Allow patients to pay at the clinic
                </p>
              </div>
              <Switch
                checked={settings.allowClinicPayments}
                onCheckedChange={(checked) => updateSetting("allowClinicPayments", checked)}
                data-testid="switch-clinic-payments"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Settings
            </CardTitle>
            <CardDescription>
              Configure default booking parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="maxAdvanceDays">Max Advance Booking (Days)</Label>
                <Input
                  id="maxAdvanceDays"
                  type="number"
                  value={settings.maxAdvanceBookingDays}
                  onChange={(e) => updateSetting("maxAdvanceBookingDays", e.target.value)}
                  data-testid="input-max-days"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minNoticeHours">Min Notice (Hours)</Label>
                <Input
                  id="minNoticeHours"
                  type="number"
                  value={settings.minBookingNoticeHours}
                  onChange={(e) => updateSetting("minBookingNoticeHours", e.target.value)}
                  data-testid="input-min-notice"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slotDuration">Slot Duration (Minutes)</Label>
                <Select 
                  value={settings.defaultSlotDuration}
                  onValueChange={(value) => updateSetting("defaultSlotDuration", value)}
                >
                  <SelectTrigger data-testid="select-slot-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bufferTime">Buffer Time (Minutes)</Label>
                <Select 
                  value={settings.defaultBufferTime}
                  onValueChange={(value) => updateSetting("defaultBufferTime", value)}
                >
                  <SelectTrigger data-testid="select-buffer-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Auto-confirm Appointments</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically confirm appointments when booked
                </p>
              </div>
              <Switch
                checked={settings.autoConfirmAppointments}
                onCheckedChange={(checked) => updateSetting("autoConfirmAppointments", checked)}
                data-testid="switch-auto-confirm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications for appointments and updates
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                data-testid="switch-email"
              />
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send SMS reminders for appointments
                </p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => updateSetting("smsNotifications", checked)}
                data-testid="switch-sms"
              />
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send push notifications to mobile app users
                </p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
                data-testid="switch-push"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Verification
            </CardTitle>
            <CardDescription>
              Configure security and verification settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Require Doctor Verification</Label>
                <p className="text-sm text-muted-foreground">
                  New doctors must be verified by admin before accepting appointments
                </p>
              </div>
              <Switch
                checked={settings.requireDoctorVerification}
                onCheckedChange={(checked) => updateSetting("requireDoctorVerification", checked)}
                data-testid="switch-doctor-verification"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Localization
            </CardTitle>
            <CardDescription>
              Configure language and regional settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Default Language</Label>
                <Select 
                  value={settings.defaultLanguage}
                  onValueChange={(value) => updateSetting("defaultLanguage", value)}
                >
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="sinhala">Sinhala</SelectItem>
                    <SelectItem value="tamil">Tamil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Settings className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              These settings can affect platform availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable the platform for maintenance
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => updateSetting("maintenanceMode", checked)}
                data-testid="switch-maintenance"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
