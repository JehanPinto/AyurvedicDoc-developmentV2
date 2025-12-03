import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Star,
  ArrowRight,
  Users,
  TrendingUp,
  AlertCircle,
  Video,
  Building2,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/lib/auth-context";
import type { DoctorDashboardStats, AppointmentWithDetails } from "@shared/schema";

interface DashboardData {
  stats: DoctorDashboardStats;
  todayAppointments: AppointmentWithDetails[];
  upcomingAppointments: AppointmentWithDetails[];
}

export default function DoctorDashboard() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["/api/doctor/dashboard"],
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
    if (!name) return "PT";
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

  const stats = dashboardData?.stats || { 
    todayAppointments: 0, 
    upcomingAppointments: 0, 
    completedAppointments: 0, 
    totalEarnings: 0, 
    pendingEarnings: 0, 
    averageRating: 0, 
    totalReviews: 0, 
    currentQueueNumber: 0 
  };
  const todayAppointments = dashboardData?.todayAppointments || [];

  const monthlyGoalPercent = stats.totalEarnings > 0 ? Math.min(100, Math.round((stats.totalEarnings / 500000) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            Good morning, Dr. {user?.fullName?.split(" ").slice(-1)[0]}!
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/doctor/schedule">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Manage Schedule
            </Button>
          </Link>
          <Link href="/doctor/appointments">
            <Button>
              <Users className="h-4 w-4 mr-2" />
              View Queue
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Today</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {stats.todayAppointments}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">appointments</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Completed</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {stats.completedAppointments}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">total</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400">Rating</p>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                  {stats.averageRating.toFixed(1)}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ({stats.totalReviews} reviews)
                </p>
              </div>
              <Star className="h-10 w-10 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Earnings</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {formatFee(stats.totalEarnings)}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">total</p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Today's Appointments</CardTitle>
            <Link href="/doctor/appointments">
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((appointment, index) => (
                  <div 
                    key={appointment.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      index === 0 
                        ? "bg-primary/5 border-primary" 
                        : "hover-elevate"
                    }`}
                    data-testid={`card-appointment-${appointment.id}`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">
                      {appointment.queueNumber || (index + 1)}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={appointment.patient?.profileImage} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(appointment.patient?.fullName || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">
                          {appointment.patient?.fullName}
                        </p>
                        {index === 0 && (
                          <Badge className="bg-primary">Current</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {appointment.symptoms}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-medium">{appointment.appointmentTime}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {appointment.consultationType === "online" ? (
                            <>
                              <Video className="h-3 w-3" />
                              Online
                            </>
                          ) : (
                            <>
                              <Building2 className="h-3 w-3" />
                              In Person
                            </>
                          )}
                        </div>
                      </div>
                      {index === 0 ? (
                        <Button size="sm">
                          {appointment.consultationType === "online" ? "Start Call" : "Mark Called"}
                        </Button>
                      ) : (
                        <StatusBadge status={appointment.status} type="appointment" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No appointments scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Earnings Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Monthly Goal (LKR 500,000)</span>
                  <span className="text-sm font-medium">{monthlyGoalPercent}%</span>
                </div>
                <Progress value={monthlyGoalPercent} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Earnings</span>
                  <span className="font-medium">{formatFee(stats.totalEarnings)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending Payout</span>
                  <span className="font-medium text-amber-600">
                    {formatFee(stats.pendingEarnings)}
                  </span>
                </div>
              </div>
              <Link href="/doctor/earnings">
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/doctor/schedule">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Calendar className="h-4 w-4" />
                  Manage Schedule
                </Button>
              </Link>
              <Link href="/doctor/prescriptions">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" />
                  Prescriptions
                </Button>
              </Link>
              <Link href="/doctor/profile">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Star className="h-4 w-4" />
                  Update Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {stats.upcomingAppointments > 0 && (
            <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Clock className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      Upcoming Appointments
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                      You have {stats.upcomingAppointments} upcoming appointments to manage.
                    </p>
                    <Link href="/doctor/appointments">
                      <Button variant="link" size="sm" className="h-auto p-0 mt-2 text-blue-700">
                        View Appointments
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
