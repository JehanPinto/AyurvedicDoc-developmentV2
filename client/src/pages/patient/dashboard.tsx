import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  Clock, 
  FileText, 
  Star,
  ArrowRight,
  Video,
  Building2,
  Plus,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/lib/auth-context";
import type { PatientDashboardStats, AppointmentWithDetails } from "@shared/schema";

interface DashboardData {
  stats: PatientDashboardStats;
  upcomingAppointments: AppointmentWithDetails[];
  recentAppointments: AppointmentWithDetails[];
}

export default function PatientDashboard() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["/api/patient/dashboard"],
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const formatFee = (fee: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(fee);
  };

  const getInitials = (name: string) => {
    if (!name) return "DR";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return <LoadingPage message="Loading dashboard..." />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Failed to load dashboard. Please try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const stats = dashboardData?.stats || { upcomingAppointments: 0, completedAppointments: 0, totalSpent: 0, prescriptionsCount: 0 };
  const upcomingAppointments = dashboardData?.upcomingAppointments || [];
  const recentAppointments = dashboardData?.recentAppointments || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            Welcome back, {user?.fullName?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">
            Manage your appointments and health records
          </p>
        </div>
        <Link href="/doctors">
          <Button data-testid="button-book-new">
            <Plus className="h-4 w-4 mr-2" />
            Book New Appointment
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.upcomingAppointments}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedAppointments}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.prescriptionsCount}</p>
                <p className="text-xs text-muted-foreground">Prescriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatFee(stats.totalSpent || 0)}</p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Upcoming Appointments</CardTitle>
            <Link href="/patient/appointments">
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.slice(0, 3).map((appointment) => (
                  <div 
                    key={appointment.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover-elevate transition-all"
                    data-testid={`card-upcoming-appointment-${appointment.id}`}
                  >
                    <Avatar className="h-12 w-12 rounded-lg">
                      <AvatarImage src={appointment.doctor?.user?.profileImage} />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                        {getInitials(appointment.doctor?.user?.fullName || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        Dr. {appointment.doctor?.user?.fullName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.doctor?.specializations?.[0]?.name || "Specialist"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(appointment.appointmentDate), "MMM d")} at {appointment.appointmentTime}
                        </Badge>
                        {appointment.consultationType === "online" ? (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Video className="h-3 w-3" />
                            Online
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Building2 className="h-3 w-3" />
                            In Person
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={appointment.status} type="appointment" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                <Link href="/doctors">
                  <Button variant="outline" size="sm">
                    Book an Appointment
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/patient/appointments">
              <Button variant="ghost" size="sm" className="gap-1">
                View Records
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentAppointments.length > 0 ? (
              <div className="space-y-4">
                {recentAppointments.slice(0, 3).map((appointment) => (
                  <div 
                    key={appointment.id}
                    className="flex items-center gap-4 p-4 rounded-lg border"
                  >
                    <Avatar className="h-12 w-12 rounded-lg">
                      <AvatarImage src={appointment.doctor?.user?.profileImage} />
                      <AvatarFallback className="rounded-lg bg-muted">
                        {getInitials(appointment.doctor?.user?.fullName || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        Dr. {appointment.doctor?.user?.fullName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.doctor?.specializations?.[0]?.name || "Specialist"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(appointment.appointmentDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} type="appointment" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/doctors">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span>Find Doctors</span>
              </Button>
            </Link>
            <Link href="/patient/appointments">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                <Clock className="h-6 w-6" />
                <span>My Appointments</span>
              </Button>
            </Link>
            <Link href="/patient/prescriptions">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span>Prescriptions</span>
              </Button>
            </Link>
            <Link href="/patient/reviews">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                <Star className="h-6 w-6" />
                <span>My Reviews</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
