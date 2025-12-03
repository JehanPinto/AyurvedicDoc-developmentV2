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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { useAuth } from "@/lib/auth-context";
import type { AdminDashboardStats } from "@shared/schema";

const mockStats: AdminDashboardStats = {
  totalPatients: 5420,
  totalDoctors: 156,
  verifiedDoctors: 142,
  pendingDoctors: 14,
  totalAppointments: 18750,
  todayAppointments: 245,
  totalRevenue: 4250000,
  platformEarnings: 425000,
};

const mockPendingDoctors = [
  {
    id: "d1",
    fullName: "Dr. Nimal Jayasuriya",
    email: "nimal@example.com",
    specialization: "Panchakarma",
    registrationNumber: "AYU-2024-001",
    submittedAt: "2024-12-01",
  },
  {
    id: "d2",
    fullName: "Dr. Kamini Wijesekara",
    email: "kamini@example.com",
    specialization: "Women's Health",
    registrationNumber: "AYU-2024-002",
    submittedAt: "2024-11-30",
  },
  {
    id: "d3",
    fullName: "Dr. Suresh Kumar",
    email: "suresh@example.com",
    specialization: "General Medicine",
    registrationNumber: "AYU-2024-003",
    submittedAt: "2024-11-29",
  },
];

const mockRecentActivity = [
  {
    id: "1",
    type: "doctor_verified",
    message: "Dr. Ananda Perera was verified",
    time: "2 hours ago",
  },
  {
    id: "2",
    type: "appointment_completed",
    message: "45 appointments completed today",
    time: "3 hours ago",
  },
  {
    id: "3",
    type: "new_doctor",
    message: "New doctor registration from Kandy",
    time: "5 hours ago",
  },
  {
    id: "4",
    type: "refund",
    message: "Refund processed for appointment #12456",
    time: "1 day ago",
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => mockStats,
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
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return <LoadingPage message="Loading dashboard..." />;
  }

  const verificationRate = stats 
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
        <div className="flex gap-2">
          <Link href="/admin/doctors/pending">
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Pending: {stats?.pendingDoctors}
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
                <p className="text-2xl font-bold">{stats?.totalPatients.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% this month
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
                <p className="text-2xl font-bold">{stats?.totalDoctors}</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.verifiedDoctors} verified
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
                <p className="text-2xl font-bold">{stats?.todayAppointments}</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalAppointments.toLocaleString()} total
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
                <p className="text-2xl font-bold">{formatFee(stats?.platformEarnings || 0)}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +8% this month
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
            <Badge variant="secondary">{stats?.pendingDoctors} pending</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPendingDoctors.map((doctor) => (
                <div 
                  key={doctor.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover-elevate transition-all"
                  data-testid={`card-pending-doctor-${doctor.id}`}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {getInitials(doctor.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{doctor.fullName}</p>
                    <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {doctor.registrationNumber}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Submitted: {format(new Date(doctor.submittedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
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
              {stats?.pendingDoctors && stats.pendingDoctors > 3 && (
                <Link href="/admin/doctors/pending">
                  <Button variant="outline" className="w-full">
                    View All Pending ({stats.pendingDoctors})
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
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
                    <p className="text-xl font-bold text-green-600">{stats?.verifiedDoctors}</p>
                    <p className="text-xs text-green-600">Verified</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <p className="text-xl font-bold text-amber-600">{stats?.pendingDoctors}</p>
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
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full shrink-0 ${
                      activity.type === "doctor_verified" ? "bg-green-100 dark:bg-green-900/30" :
                      activity.type === "new_doctor" ? "bg-blue-100 dark:bg-blue-900/30" :
                      activity.type === "refund" ? "bg-amber-100 dark:bg-amber-900/30" :
                      "bg-purple-100 dark:bg-purple-900/30"
                    }`}>
                      {activity.type === "doctor_verified" && <CheckCircle className="h-3 w-3 text-green-600" />}
                      {activity.type === "new_doctor" && <UserPlus className="h-3 w-3 text-blue-600" />}
                      {activity.type === "refund" && <DollarSign className="h-3 w-3 text-amber-600" />}
                      {activity.type === "appointment_completed" && <Calendar className="h-3 w-3 text-purple-600" />}
                    </div>
                    <div>
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
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
