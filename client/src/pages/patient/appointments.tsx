import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import {
  Calendar,
  Clock,
  Video,
  Building2,
  Search,
  Filter,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Phone,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AppointmentWithDetails } from "@shared/schema";
import { AppointmentStatus, ConsultationType } from "@shared/schema";

export default function PatientAppointmentsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { data: appointments = [], isLoading, isError } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
    staleTime: 60 * 1000,
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await apiRequest("PATCH", `/api/appointments/${id}/cancel`, { reason });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patient/dashboard"] });
      setCancelDialogOpen(false);
      setSelectedAppointment(null);
      setCancelReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatFee = (fee: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(fee);
  };

  const getInitials = (name: string) => {
    if (!name) return "DR";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getConsultationIcon = (type: string) => {
    switch (type) {
      case ConsultationType.ONLINE:
        return <Video className="h-4 w-4" />;
      case ConsultationType.HOME_VISIT:
        return <MapPin className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getConsultationLabel = (type: string) => {
    switch (type) {
      case ConsultationType.ONLINE:
        return "Online";
      case ConsultationType.HOME_VISIT:
        return "Home Visit";
      default:
        return "In-Person";
    }
  };

  const canCancel = (appointment: AppointmentWithDetails) => {
    const cancelableStatuses = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];
    if (!cancelableStatuses.includes(appointment.status as any)) return false;
    
    const appointmentDateTime = parseISO(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilAppointment > 2;
  };

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");

  const upcomingAppointments = appointments.filter((apt) => {
    const aptDate = parseISO(apt.appointmentDate);
    return (
      isAfter(aptDate, now) || apt.appointmentDate === today
    ) && !["cancelled", "completed", "no_show"].includes(apt.status);
  });

  const pastAppointments = appointments.filter((apt) => {
    const aptDate = parseISO(apt.appointmentDate);
    return (
      isBefore(aptDate, now) && apt.appointmentDate !== today
    ) || ["completed", "cancelled", "no_show"].includes(apt.status);
  });

  const filterAppointments = (appointmentList: AppointmentWithDetails[]) => {
    return appointmentList.filter((apt) => {
      const matchesSearch =
        searchQuery === "" ||
        apt.doctor?.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.hospital?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
      const matchesType = typeFilter === "all" || apt.consultationType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  };

  const filteredUpcoming = filterAppointments(upcomingAppointments);
  const filteredPast = filterAppointments(pastAppointments);

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

  const AppointmentCard = ({ appointment }: { appointment: AppointmentWithDetails }) => (
    <Card 
      className="hover-elevate cursor-pointer"
      onClick={() => {
        setSelectedAppointment(appointment);
        setDetailsDialogOpen(true);
      }}
      data-testid={`card-appointment-${appointment.id}`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={appointment.doctor?.user?.profileImage || ""} />
            <AvatarFallback>
              {getInitials(appointment.doctor?.user?.fullName || "")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-2">
              <h3 className="font-semibold truncate">
                {appointment.doctor?.user?.fullName || "Doctor"}
              </h3>
              <StatusBadge status={appointment.status} type="appointment" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(parseISO(appointment.appointmentDate), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{appointment.appointmentTime}</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                {getConsultationIcon(appointment.consultationType)}
                <span>{getConsultationLabel(appointment.consultationType)}</span>
              </div>
              {appointment.hospital && (
                <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1 truncate">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{appointment.hospital.name}</span>
                </div>
              )}
            </div>

            {appointment.queueNumber && appointment.status === AppointmentStatus.CONFIRMED && (
              <Badge variant="secondary" className="mb-2">
                Queue #{appointment.queueNumber}
              </Badge>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {appointment.symptoms?.substring(0, 50)}
                {appointment.symptoms && appointment.symptoms.length > 50 ? "..." : ""}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="sm:hidden flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" data-testid={`button-menu-${appointment.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAppointment(appointment);
                  setDetailsDialogOpen(true);
                }}>
                  View Details
                </DropdownMenuItem>
                {canCancel(appointment) && (
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAppointment(appointment);
                      setCancelDialogOpen(true);
                    }}
                  >
                    Cancel Appointment
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden sm:flex flex-col gap-2">
            {canCancel(appointment) && (
              <Button 
                variant="ghost" 
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAppointment(appointment);
                  setCancelDialogOpen(true);
                }}
                data-testid={`button-cancel-${appointment.id}`}
              >
                Cancel
              </Button>
            )}
            {appointment.status === AppointmentStatus.CONFIRMED && 
             appointment.consultationType === ConsultationType.ONLINE && (
              <Button size="sm" data-testid={`button-join-${appointment.id}`}>
                <Video className="h-4 w-4 mr-1" />
                Join Call
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-center">{message}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">My Appointments</h1>
        <p className="text-muted-foreground">View and manage your appointments</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by doctor or hospital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]" data-testid="select-status">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[160px]" data-testid="select-type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="in_person">In-Person</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="home_visit">Home Visit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past" data-testid="tab-past">
            Past ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {filteredUpcoming.length === 0 ? (
            <EmptyState message="No upcoming appointments. Book a new appointment to get started." />
          ) : (
            <div className="space-y-4">
              {filteredUpcoming.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {filteredPast.length === 0 ? (
            <EmptyState message="No past appointments found." />
          ) : (
            <div className="space-y-4">
              {filteredPast.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedAppointment.doctor?.user?.profileImage || ""} />
                  <AvatarFallback>
                    {getInitials(selectedAppointment.doctor?.user?.fullName || "")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedAppointment.doctor?.user?.fullName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.doctor?.qualifications}
                  </p>
                  <StatusBadge status={selectedAppointment.status} type="appointment" className="mt-1" />
                </div>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {format(parseISO(selectedAppointment.appointmentDate), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedAppointment.appointmentTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  {getConsultationIcon(selectedAppointment.consultationType)}
                  <div>
                    <p className="font-medium">
                      {getConsultationLabel(selectedAppointment.consultationType)}
                    </p>
                    {selectedAppointment.hospital && (
                      <p className="text-muted-foreground">{selectedAppointment.hospital.name}</p>
                    )}
                  </div>
                </div>

                {selectedAppointment.queueNumber && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <span className="h-5 w-5 flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground rounded-full">
                      #
                    </span>
                    <div>
                      <p className="font-medium">Queue Number</p>
                      <p className="text-muted-foreground">{selectedAppointment.queueNumber}</p>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium mb-1">Symptoms</p>
                  <p className="text-muted-foreground">{selectedAppointment.symptoms}</p>
                </div>

                {selectedAppointment.consultationNotes && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium mb-1">Doctor's Notes</p>
                    <p className="text-muted-foreground">{selectedAppointment.consultationNotes}</p>
                  </div>
                )}

                {selectedAppointment.cancelReason && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="font-medium mb-1 text-destructive">Cancellation Reason</p>
                    <p className="text-muted-foreground">{selectedAppointment.cancelReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedAppointment && canCancel(selectedAppointment) && (
              <Button
                variant="destructive"
                onClick={() => {
                  setDetailsDialogOpen(false);
                  setCancelDialogOpen(true);
                }}
                data-testid="button-cancel-dialog"
              >
                Cancel Appointment
              </Button>
            )}
            {selectedAppointment?.status === AppointmentStatus.CONFIRMED && 
             selectedAppointment?.consultationType === ConsultationType.ONLINE && (
              <Button data-testid="button-join-dialog">
                <Video className="h-4 w-4 mr-2" />
                Join Video Call
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Please provide a reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              data-testid="input-cancel-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedAppointment) {
                  cancelMutation.mutate({ id: selectedAppointment.id, reason: cancelReason });
                }
              }}
              disabled={cancelMutation.isPending}
              data-testid="button-confirm-cancel"
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
