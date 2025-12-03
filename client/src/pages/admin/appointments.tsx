import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  AlertCircle,
  Eye,
  Calendar,
  Clock,
  MapPin,
  User,
  Stethoscope,
  Video,
  Building2,
  Home,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AppointmentWithDetails } from "@shared/schema";
import { AppointmentStatus, ConsultationType } from "@shared/schema";

export default function AdminAppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { data: appointments = [], isLoading, isError } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/admin/appointments"],
  });

  const formatFee = (fee: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(fee);
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getConsultationIcon = (type: string) => {
    switch (type) {
      case ConsultationType.ONLINE:
        return <Video className="h-4 w-4 text-green-600" />;
      case ConsultationType.HOME_VISIT:
        return <Home className="h-4 w-4 text-purple-600" />;
      default:
        return <Building2 className="h-4 w-4 text-blue-600" />;
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.patient?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.doctor?.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    const matchesType = typeFilter === "all" || apt.consultationType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusCounts = () => {
    return {
      all: appointments.length,
      pending: appointments.filter(a => a.status === AppointmentStatus.PENDING).length,
      confirmed: appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length,
      completed: appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length,
      cancelled: appointments.filter(a => a.status === AppointmentStatus.CANCELLED).length,
    };
  };

  const statusCounts = getStatusCounts();

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Appointments Management</h1>
          <p className="text-muted-foreground">View and manage all appointments</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card 
          className={`cursor-pointer hover-elevate ${statusFilter === "all" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setStatusFilter("all")}
          data-testid="filter-all"
        >
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{statusCounts.all}</p>
            <p className="text-xs text-muted-foreground">All</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover-elevate ${statusFilter === "pending" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setStatusFilter("pending")}
          data-testid="filter-pending"
        >
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{statusCounts.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover-elevate ${statusFilter === "confirmed" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setStatusFilter("confirmed")}
          data-testid="filter-confirmed"
        >
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{statusCounts.confirmed}</p>
            <p className="text-xs text-muted-foreground">Confirmed</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover-elevate ${statusFilter === "completed" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setStatusFilter("completed")}
          data-testid="filter-completed"
        >
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{statusCounts.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover-elevate ${statusFilter === "cancelled" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setStatusFilter("cancelled")}
          data-testid="filter-cancelled"
        >
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{statusCounts.cancelled}</p>
            <p className="text-xs text-muted-foreground">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient, doctor, or appointment ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-type">
            <SelectValue placeholder="Consultation Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="in_person">In Person</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="home_visit">Home Visit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <Card 
              key={appointment.id} 
              className="hover-elevate"
              data-testid={`card-appointment-${appointment.id}`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex items-center gap-3 lg:w-1/4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={appointment.patient?.profileImage} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        {getInitials(appointment.patient?.fullName || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{appointment.patient?.fullName}</p>
                      <p className="text-xs text-muted-foreground">Patient</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 lg:w-1/4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={appointment.doctor?.user?.profileImage} />
                      <AvatarFallback className="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                        {getInitials(appointment.doctor?.user?.fullName || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{appointment.doctor?.user?.fullName}</p>
                      <p className="text-xs text-muted-foreground">Doctor</p>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(new Date(appointment.appointmentDate), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{appointment.appointmentTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {getConsultationIcon(appointment.consultationType)}
                      <span className="capitalize text-muted-foreground">
                        {appointment.consultationType?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={appointment.status} type="appointment" />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowDetailsDialog(true);
                      }}
                      data-testid={`button-view-${appointment.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">No appointments found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery || statusFilter !== "all" ? "Try adjusting your search or filters" : "No appointments yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              Complete information about the appointment
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {selectedAppointment.id.slice(0, 8)}
                  </Badge>
                  <StatusBadge status={selectedAppointment.status} type="appointment" />
                </div>
                {selectedAppointment.queueNumber && (
                  <Badge variant="secondary">Queue #{selectedAppointment.queueNumber}</Badge>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Patient Information
                  </h4>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedAppointment.patient?.profileImage} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(selectedAppointment.patient?.fullName || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedAppointment.patient?.fullName}</p>
                      <p className="text-sm text-muted-foreground">{selectedAppointment.patient?.email}</p>
                      <p className="text-sm text-muted-foreground">{selectedAppointment.patient?.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Doctor Information
                  </h4>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedAppointment.doctor?.user?.profileImage} />
                      <AvatarFallback className="bg-green-100 text-green-600">
                        {getInitials(selectedAppointment.doctor?.user?.fullName || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedAppointment.doctor?.user?.fullName}</p>
                      <p className="text-sm text-muted-foreground">{selectedAppointment.doctor?.qualifications}</p>
                      <p className="text-sm text-muted-foreground">{selectedAppointment.doctor?.user?.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(selectedAppointment.appointmentDate), "PPP")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{selectedAppointment.appointmentTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{selectedAppointment.consultationType?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{format(new Date(selectedAppointment.createdAt), "PPp")}</p>
                  </div>
                </div>

                {selectedAppointment.hospital && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="font-medium">{selectedAppointment.hospital.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedAppointment.hospital.address}, {selectedAppointment.hospital.city}</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Symptoms</p>
                  <p className="p-3 bg-muted rounded-md text-sm">{selectedAppointment.symptoms}</p>
                </div>

                {selectedAppointment.payment && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-3">Payment Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Consultation Fee</span>
                        <span>{formatFee(selectedAppointment.payment.consultationFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Booking Charges</span>
                        <span>{formatFee(selectedAppointment.payment.bookingCharges || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span>{formatFee(selectedAppointment.payment.tax || 0)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>{formatFee(selectedAppointment.payment.totalAmount)}</span>
                      </div>
                      <div className="col-span-2 flex justify-between items-center pt-2 border-t">
                        <span className="text-muted-foreground">Status</span>
                        <StatusBadge status={selectedAppointment.payment.status} type="payment" />
                      </div>
                    </div>
                  </div>
                )}

                {selectedAppointment.status === AppointmentStatus.CANCELLED && selectedAppointment.cancelReason && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">Cancellation Details</h4>
                    <p className="text-sm">{selectedAppointment.cancelReason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cancelled by: {selectedAppointment.cancelledBy}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
