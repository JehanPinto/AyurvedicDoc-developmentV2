import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Calendar,
  Clock,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Video,
  Building2,
  Lock,
  Unlock
} from "lucide-react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingPage, LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AppointmentSlot, DoctorProfile } from "@shared/schema";

export default function DoctorSchedule() {
  const { toast } = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [addSlotDialogOpen, setAddSlotDialogOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    startTime: "09:00",
    endTime: "09:30",
    consultationType: "in_person" as "in_person" | "online",
  });

  const { data: profile } = useQuery<DoctorProfile>({
    queryKey: ["/api/doctor/profile"],
  });

  const startDate = format(currentWeekStart, "yyyy-MM-dd");
  const endDate = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");
  const consultationBadgeStyles: Record<string, { label: string; className: string }> = {
    online: {
      label: "Online",
      className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800",
    },
    in_person: {
      label: "In Person",
      className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800",
    },
  };

  const { data: slots = [], isLoading, isError } = useQuery<AppointmentSlot[]>({
    queryKey: ["/api/doctor/slots", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/doctor/slots?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load slots");
      return res.json();
    },
    enabled: !!profile,
  });

  const createSlotMutation = useMutation({
    mutationFn: (data: { date: string; startTime: string; endTime: string; consultationType: string }) =>
      apiRequest("POST", "/api/doctor/slots", {
        ...data,
        doctorId: profile?.id,
        hospitalId: profile?.hospitalIds?.[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/slots"] });
      setAddSlotDialogOpen(false);
      toast({ title: "Slot created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create slot", variant: "destructive" });
    },
  });

  const blockSlotMutation = useMutation({
    mutationFn: (slotId: string) => apiRequest("PATCH", `/api/doctor/slots/${slotId}/block`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/slots"] });
      toast({ title: "Slot blocked" });
    },
    onError: () => {
      toast({ title: "Failed to block slot", variant: "destructive" });
    },
  });

  const unblockSlotMutation = useMutation({
    mutationFn: (slotId: string) => apiRequest("PATCH", `/api/doctor/slots/${slotId}/unblock`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/slots"] });
      toast({ title: "Slot unblocked" });
    },
    onError: () => {
      toast({ title: "Failed to unblock slot", variant: "destructive" });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: string) => apiRequest("DELETE", `/api/doctor/slots/${slotId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/slots"] });
      toast({ title: "Slot deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete slot", variant: "destructive" });
    },
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getSlotsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return slots.filter(s => s.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const handleAddSlot = () => {
    if (!selectedDate) return;
    createSlotMutation.mutate({
      date: format(selectedDate, "yyyy-MM-dd"),
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      consultationType: newSlot.consultationType,
    });
  };

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00"
  ];

  if (isLoading) {
    return <LoadingPage message="Loading schedule..." />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Failed to load schedule. Please try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold" data-testid="text-page-title">
            Schedule Management
          </h1>
          <p className="text-muted-foreground">
            Manage your appointment slots and availability
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
              data-testid="button-prev-week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[180px] text-center">
              {format(currentWeekStart, "MMM d")} - {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
              data-testid="button-next-week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const daySlots = getSlotsForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isPastDay = day < new Date() && !isToday(day);

              return (
                <div 
                  key={day.toISOString()}
                  className={`border rounded-lg p-3 min-h-[200px] ${
                    isToday(day) ? "border-primary bg-primary/5" : ""
                  } ${isSelected ? "ring-2 ring-primary" : ""} ${
                    isPastDay ? "opacity-50" : ""
                  }`}
                  data-testid={`day-${format(day, "yyyy-MM-dd")}`}
                >
                  <div className="text-center mb-2">
                    <p className="text-xs text-muted-foreground uppercase">
                      {format(day, "EEE")}
                    </p>
                    <p className={`text-lg font-semibold ${
                      isToday(day) ? "text-primary" : ""
                    }`}>
                      {format(day, "d")}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    {daySlots.slice(0, 4).map((slot) => {
                      const badge = consultationBadgeStyles[slot.consultationType] || consultationBadgeStyles.in_person;
                      return (
                        <div
                          key={slot.id}
                          className={`text-xs p-1.5 rounded flex items-center justify-between gap-2 ${
                            slot.isBlocked 
                              ? "bg-muted text-muted-foreground line-through" 
                              : slot.isBooked
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          }`}
                          data-testid={`slot-${slot.id}`}
                        >
                          <div className="flex items-center gap-2 flex-1 flex-wrap">
                            <span className="flex items-center gap-1 font-medium">
                              {slot.consultationType === "online" ? (
                                <Video className="h-3 w-3" />
                              ) : (
                                <Building2 className="h-3 w-3" />
                              )}
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold px-2 py-[2px] rounded-full ${badge.className}`}
                            >
                              {badge.label}
                            </Badge>
                          </div>
                          {!slot.isBooked && !isPastDay && (
                            <div className="flex items-center gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 p-0"
                                onClick={() => slot.isBlocked 
                                  ? unblockSlotMutation.mutate(slot.id)
                                  : blockSlotMutation.mutate(slot.id)
                                }
                              >
                                {slot.isBlocked ? (
                                  <Unlock className="h-3 w-3" />
                                ) : (
                                  <Lock className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 p-0 text-destructive hover:text-destructive"
                                onClick={() => deleteSlotMutation.mutate(slot.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {daySlots.length > 4 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{daySlots.length - 4} more
                      </p>
                    )}
                    {daySlots.length === 0 && !isPastDay && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No slots
                      </p>
                    )}
                  </div>
                  
                  {!isPastDay && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-xs"
                      onClick={() => {
                        setSelectedDate(day);
                        setAddSlotDialogOpen(true);
                      }}
                      data-testid={`button-add-slot-${format(day, "yyyy-MM-dd")}`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Slot Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-300" />
              <span className="text-sm">Available slot</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300" />
              <span className="text-sm">Booked slot</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-muted border" />
              <span className="text-sm">Blocked slot</span>
            </div>
            <div className="flex items-center gap-3">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Online consultation</span>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">In-person consultation</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Slots This Week</span>
              <Badge variant="secondary">{slots.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available</span>
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                {slots.filter(s => !s.isBooked && !s.isBlocked).length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Booked</span>
              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {slots.filter(s => s.isBooked).length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Blocked</span>
              <Badge variant="outline">
                {slots.filter(s => s.isBlocked).length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={addSlotDialogOpen} onOpenChange={setAddSlotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Slot</DialogTitle>
            <DialogDescription>
              Create a new appointment slot for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "selected date"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select
                  value={newSlot.startTime}
                  onValueChange={(value) => setNewSlot(prev => ({ ...prev, startTime: value }))}
                >
                  <SelectTrigger data-testid="select-start-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Select
                  value={newSlot.endTime}
                  onValueChange={(value) => setNewSlot(prev => ({ ...prev, endTime: value }))}
                >
                  <SelectTrigger data-testid="select-end-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Consultation Type</Label>
              <Select
                value={newSlot.consultationType}
                onValueChange={(value: "in_person" | "online") => 
                  setNewSlot(prev => ({ ...prev, consultationType: value }))
                }
              >
                <SelectTrigger data-testid="select-consultation-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      In Person
                    </span>
                  </SelectItem>
                  <SelectItem value="online">
                    <span className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Online
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSlotDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSlot}
              disabled={createSlotMutation.isPending}
              data-testid="button-create-slot"
            >
              {createSlotMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
              Create Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
