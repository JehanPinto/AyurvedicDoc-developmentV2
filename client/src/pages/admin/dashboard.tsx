import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  UserPlus,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { useAuth } from "@/lib/auth-context";
import type { AdminDashboardStats, DoctorWithDetails } from "@shared/schema";

interface DashboardData {
  stats: AdminDashboardStats;
  pendingDoctors: DoctorWithDetails[];
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["/api/admin/dashboard"],
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
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

  const stats = dashboardData?.stats || {
    totalPatients: 0,
    totalDoctors: 0,
    verifiedDoctors: 0,
    pendingDoctors: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    totalRevenue: 0,
    platformEarnings: 0,
  };

  const pendingDoctors = dashboardData?.pendingDoctors || [];

  const verificationRate = stats.totalDoctors > 0
    ? Math.round((stats.verifiedDoctors / stats.totalDoctors) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/doctors/pending">
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Pending: {stats.pendingDoctors}
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button>
              <TrendingUp className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold">{stats.totalPatients.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Registered users
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Doctors</p>
                <p className="text-2xl font-bold">{stats.totalDoctors}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.verifiedDoctors} verified
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <Stethoscope className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Appointments</p>
                <p className="text-2xl font-bold">{stats.todayAppointments}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalAppointments.toLocaleString()} total
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Platform Revenue</p>
                <p className="text-2xl font-bold">{formatFee(stats.platformEarnings)}</p>
                <p className="text-xs text-muted-foreground">
                  Total: {formatFee(stats.totalRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Doctor Verifications
            </CardTitle>
            <Badge variant="secondary">{stats.pendingDoctors} pending</Badge>
          </CardHeader>
          <CardContent>
            {pendingDoctors.length > 0 ? (
              <div className="space-y-4">
                {pendingDoctors.slice(0, 3).map((doctor) => (
                  <div 
                    key={doctor.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover-elevate transition-all"
                    data-testid={`card-pending-doctor-${doctor.id}`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={doctor.user?.profileImage} />
                      <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {getInitials(doctor.user?.fullName || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{doctor.user?.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {doctor.specializations?.map(s => s.name).join(", ") || "General"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {doctor.registrationNumber}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Applied: {format(new Date(doctor.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="text-destructive">
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button size="sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                    </div>
                  </div>
                ))}
                {stats.pendingDoctors > 3 && (
                  <Link href="/admin/doctors/pending">
                    <Button variant="outline" className="w-full">
                      View All Pending ({stats.pendingDoctors})
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <p className="text-muted-foreground">All doctors have been verified</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Doctor Verification Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">{verificationRate}%</p>
                  <p className="text-sm text-muted-foreground">doctors verified</p>
                </div>
                <Progress value={verificationRate} className="h-3" />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <p className="text-xl font-bold text-green-600">{stats.verifiedDoctors}</p>
                    <p className="text-xs text-green-600">Verified</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <p className="text-xl font-bold text-amber-600">{stats.pendingDoctors}</p>
                    <p className="text-xs text-amber-600">Pending</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-sm">Verified Doctors</span>
                  </div>
                  <span className="font-medium">{stats.verifiedDoctors}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Users className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-sm">Total Patients</span>
                  </div>
                  <span className="font-medium">{stats.totalPatients}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <Calendar className="h-3 w-3 text-purple-600" />
                    </div>
                    <span className="text-sm">Appointments Today</span>
                  </div>
                  <span className="font-medium">{stats.todayAppointments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <DollarSign className="h-3 w-3 text-amber-600" />
                    </div>
                    <span className="text-sm">Total Bookings</span>
                  </div>
                  <span className="font-medium">{stats.totalAppointments}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/doctors">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                <Stethoscope className="h-6 w-6" />
                <span>Manage Doctors</span>
              </Button>
            </Link>
            <Link href="/admin/patients">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>Manage Patients</span>
              </Button>
            </Link>
            <Link href="/admin/specializations">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                <Activity className="h-6 w-6" />
                <span>Specializations</span>
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                <AlertCircle className="h-6 w-6" />
                <span>System Settings</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
