import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Calendar, 
  Clock, 
  Video, 
  Building2, 
  Phone,
  AlertCircle,
  Check,
  X,
  Bell,
  User,
  FileText,
  ChevronDown
} from "lucide-react";
import { format, isToday, isTomorrow, parseISO, isPast } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingPage, LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AppointmentWithDetails } from "@shared/schema";

export default function DoctorAppointments() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data: appointments = [], isLoading, isError } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/doctor/appointments"],
    staleTime: 60 * 1000,
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/appointments/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/appointments"] });
      toast({ title: "Appointment confirmed" });
    },
    onError: () => {
      toast({ title: "Failed to confirm appointment", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => 
      apiRequest("PATCH", `/api/appointments/${id}/complete`, { consultationNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/appointments"] });
      setCompleteDialogOpen(false);
      setConsultationNotes("");
      setSelectedAppointment(null);
      toast({ title: "Appointment marked as completed" });
    },
    onError: () => {
      toast({ title: "Failed to complete appointment", variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      apiRequest("PATCH", `/api/appointments/${id}/cancel`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/appointments"] });
      setCancelDialogOpen(false);
      setCancelReason("");
      setSelectedAppointment(null);
      toast({ title: "Appointment cancelled" });
    },
    onError: () => {
      toast({ title: "Failed to cancel appointment", variant: "destructive" });
    },
  });

  const callMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/doctor/appointments/${id}/call`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/appointments"] });
      toast({ title: "Patient has been notified", description: "They will receive a notification to proceed" });
    },
    onError: () => {
      toast({ title: "Failed to notify patient", variant: "destructive" });
    },
  });

  const noShowMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/doctor/appointments/${id}/no-show`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/appointments"] });
      toast({ title: "Appointment marked as no-show" });
    },
    onError: () => {
      toast({ title: "Failed to mark as no-show", variant: "destructive" });
    },
  });

  const getInitials = (name: string) => {
    if (!name) return "PT";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatAppointmentDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d, yyyy");
  };

  const filterAppointments = (status: string) => {
    let filtered = appointments;
    
    if (status === "today") {
      filtered = appointments.filter(a => isToday(parseISO(a.appointmentDate)));
    } else if (status === "upcoming") {
      filtered = appointments.filter(a => 
        !isPast(parseISO(a.appointmentDate)) &&
        ["pending", "confirmed"].includes(a.status)
      );
    } else if (status === "completed") {
      filtered = appointments.filter(a => a.status === "completed");
    } else if (status === "cancelled") {
      filtered = appointments.filter(a => ["cancelled", "no_show"].includes(a.status));
    }

    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.symptoms?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      if (a.appointmentDate === b.appointmentDate) {
        return a.appointmentTime.localeCompare(b.appointmentTime);
      }
      return a.appointmentDate.localeCompare(b.appointmentDate);
    });
  };

  const todayCount = appointments.filter(a => isToday(parseISO(a.appointmentDate))).length;
  const upcomingCount = appointments.filter(a => 
    !isPast(parseISO(a.appointmentDate)) && 
    ["pending", "confirmed"].includes(a.status)
  ).length;
  const completedCount = appointments.filter(a => a.status === "completed").length;

  if (isLoading) {
    return <LoadingPage message="Loading appointments..." />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Failed to load appointments. Please try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold" data-testid="text-page-title">
            Appointments
          </h1>
          <p className="text-muted-foreground">
            Manage your patient appointments and consultations
          </p>
        </div>
        <Input
          placeholder="Search patients or symptoms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
          data-testid="input-search-appointments"
        />
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList data-testid="tabs-appointments">
          <TabsTrigger value="today" data-testid="tab-today">
            Today ({todayCount})
          </TabsTrigger>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">
            Upcoming ({upcomingCount})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completed ({completedCount})
          </TabsTrigger>
          <TabsTrigger value="cancelled" data-testid="tab-cancelled">
            Cancelled
          </TabsTrigger>
        </TabsList>

        {["today", "upcoming", "completed", "cancelled"].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                {filterAppointments(tab).length > 0 ? (
                  <div className="divide-y">
                    {filterAppointments(tab).map((appointment, index) => (
                      <div 
                        key={appointment.id}
                        className={`p-4 flex flex-col md:flex-row md:items-center gap-4 ${
                          tab === "today" && index === 0 ? "bg-primary/5" : "hover-elevate"
                        }`}
                        data-testid={`row-appointment-${appointment.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {tab === "today" && (
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold shrink-0">
                              {appointment.queueNumber || (index + 1)}
                            </div>
                          )}
                          <Avatar className="h-12 w-12 shrink-0">
                            <AvatarImage src={appointment.patient?.profileImage} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(appointment.patient?.fullName || "")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold truncate">
                                {appointment.patient?.fullName}
                              </p>
                              {tab === "today" && index === 0 && (
                                <Badge className="bg-primary shrink-0">Current</Badge>
                              )}
                              {appointment.isCalled && (
                                <Badge variant="outline" className="shrink-0">
                                  <Bell className="h-3 w-3 mr-1" />
                                  Called
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {appointment.symptoms || "No symptoms specified"}
                            </p>
                            {appointment.patient?.phone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {appointment.patient.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <p className="font-medium">{formatAppointmentDate(appointment.appointmentDate)}</p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground justify-end">
                              <Clock className="h-3 w-3" />
                              {appointment.appointmentTime}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                              {appointment.consultationType === "online" ? (
                                <>
                                  <Video className="h-3 w-3" />
                                  Online
                                </>
                              ) : appointment.consultationType === "home_visit" ? (
                                <>
                                  <User className="h-3 w-3" />
                                  Home Visit
                                </>
                              ) : (
                                <>
                                  <Building2 className="h-3 w-3" />
                                  In Person
                                </>
                              )}
                            </div>
                          </div>

                          <StatusBadge status={appointment.status} type="appointment" />

                          {["pending", "confirmed"].includes(appointment.status) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" data-testid={`button-actions-${appointment.id}`}>
                                  Actions
                                  <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {appointment.status === "pending" && (
                                  <DropdownMenuItem
                                    onClick={() => confirmMutation.mutate(appointment.id)}
                                    disabled={confirmMutation.isPending}
                                    data-testid={`action-confirm-${appointment.id}`}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Confirm
                                  </DropdownMenuItem>
                                )}
                                {appointment.status === "confirmed" && !appointment.isCalled && (
                                  <DropdownMenuItem
                                    onClick={() => callMutation.mutate(appointment.id)}
                                    disabled={callMutation.isPending}
                                    data-testid={`action-call-${appointment.id}`}
                                  >
                                    <Bell className="h-4 w-4 mr-2" />
                                    Call Patient
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setCompleteDialogOpen(true);
                                  }}
                                  data-testid={`action-complete-${appointment.id}`}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => noShowMutation.mutate(appointment.id)}
                                  disabled={noShowMutation.isPending}
                                  data-testid={`action-noshow-${appointment.id}`}
                                >
                                  <User className="h-4 w-4 mr-2" />
                                  Mark No-Show
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setCancelDialogOpen(true);
                                  }}
                                  data-testid={`action-cancel-${appointment.id}`}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          {appointment.status === "completed" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.location.href = `/doctor/prescriptions?appointmentId=${appointment.id}`}
                              data-testid={`button-prescription-${appointment.id}`}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Prescription
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      {searchTerm 
                        ? "No appointments match your search" 
                        : `No ${tab} appointments`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Appointment</DialogTitle>
            <DialogDescription>
              Mark this appointment as completed. You can optionally add consultation notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar>
                <AvatarImage src={selectedAppointment?.patient?.profileImage} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(selectedAppointment?.patient?.fullName || "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedAppointment?.patient?.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAppointment?.appointmentDate} at {selectedAppointment?.appointmentTime}
                </p>
              </div>
            </div>
            <Textarea
              placeholder="Add consultation notes (optional)..."
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              rows={4}
              data-testid="input-consultation-notes"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedAppointment && completeMutation.mutate({ 
                id: selectedAppointment.id, 
                notes: consultationNotes || undefined 
              })}
              disabled={completeMutation.isPending}
              data-testid="button-confirm-complete"
            >
              {completeMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
              Complete Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancellation. The patient will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar>
                <AvatarImage src={selectedAppointment?.patient?.profileImage} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(selectedAppointment?.patient?.fullName || "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedAppointment?.patient?.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAppointment?.appointmentDate} at {selectedAppointment?.appointmentTime}
                </p>
              </div>
            </div>
            <Textarea
              placeholder="Reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              data-testid="input-cancel-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Back
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedAppointment && cancelMutation.mutate({ 
                id: selectedAppointment.id, 
                reason: cancelReason 
              })}
              disabled={cancelMutation.isPending || !cancelReason.trim()}
              data-testid="button-confirm-cancel"
            >
              {cancelMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
