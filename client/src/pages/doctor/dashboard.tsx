import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Star,
  ArrowRight,
  Users,
  CheckCircle,
  DollarSign,
  AlertCircle,
  Video,
  Building2,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { useAuth } from "@/lib/auth-context";
import type { DoctorDashboardStats, AppointmentWithDetails } from "@shared/schema";

interface DashboardData {
  stats: DoctorDashboardStats;
  todayAppointments: AppointmentWithDetails[];
  upcomingAppointments: AppointmentWithDetails[];
}

export default function DoctorDashboard() {
  useAuth();

  const { data: dashboardData, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["/api/doctor/dashboard"],
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const formatLKR = (amount: number) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 0 }).format(amount);

  const formatTime = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const getInitials = (name: string) => {
    if (!name) return "PT";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) return <LoadingPage message="Loading dashboard..." />;

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
    currentQueueNumber: 0,
  };
  const todayAppointments = dashboardData?.todayAppointments || [];

  const awaitingCheckIn = todayAppointments.filter((a) => a.status === "confirmed").length;
  const monthlyGoal = 500000;
  const monthlyGoalPercent = Math.min(100, Math.round((stats.totalEarnings / monthlyGoal) * 100));
  const remaining = Math.max(0, monthlyGoal - stats.totalEarnings);
  const avgPerSession = stats.completedAppointments > 0
    ? Math.round(stats.totalEarnings / stats.completedAppointments)
    : 0;

  const statCards = [
    {
      icon: Calendar,
      label: "Today's Appointments",
      value: stats.todayAppointments,
      unit: "scheduled",
      sub: awaitingCheckIn > 0 ? `${awaitingCheckIn} awaiting check-in` : "No pending check-ins",
    },
    {
      icon: CheckCircle,
      label: "Total Completed",
      value: stats.completedAppointments,
      unit: "sessions",
      sub: `${stats.upcomingAppointments} upcoming`,
    },
    {
      icon: Star,
      label: "Average Rating",
      value: stats.averageRating.toFixed(1),
      unit: "/ 5.0",
      sub: `Based on ${stats.totalReviews} reviews`,
    },
    {
      icon: DollarSign,
      label: "Total Earnings",
      value: formatLKR(stats.totalEarnings),
      unit: "",
      sub: `${formatLKR(stats.pendingEarnings)} pending payout`,
    },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Doctor Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/doctor/schedule">
            <Button variant="outline" className="gap-2 rounded-full border-border">
              <Clock className="h-4 w-4" />
              Manage Schedule
            </Button>
          </Link>
          <Link href="/doctor/appointments">
            <Button className="gap-2 rounded-full bg-primary text-white hover:bg-primary/90">
              <Users className="h-4 w-4" />
              View Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-primary/30 bg-[#e8f3ef] dark:bg-[#1e2e29] p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white dark:bg-background flex items-center justify-center shrink-0">
                <card.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground leading-tight">{card.label}</p>
            </div>
            <div>
              <p className="text-2xl font-bold leading-tight">
                {card.value}
                {card.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{card.unit}</span>}
              </p>
              <p className="text-xs text-primary mt-1">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Today's Appointments */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-base">Today's Appointments</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Live queue · auto-refreshes every minute</p>
            </div>
            <Link href="/doctor/appointments">
              <button className="text-sm text-primary flex items-center gap-1 hover:underline">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>

          {todayAppointments.length > 0 ? (
            <div className="space-y-3">
              {todayAppointments.map((appt) => {
                const startTime = formatTime(appt.slot?.startTime || appt.appointmentTime);
                const endTime = formatTime(appt.slot?.endTime || "");
                const timeStr = endTime ? `${startTime} - ${endTime}` : startTime;
                const isInPerson = appt.consultationType === "in_person";

                return (
                  <div key={appt.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={appt.patient?.profileImage} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {getInitials(appt.patient?.fullName || "")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{appt.patient?.fullName}</p>
                        <span className="text-xs text-muted-foreground">{timeStr}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
                          isInPerson
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        }`}>
                          {isInPerson ? <Building2 className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                          {isInPerson ? "In Person" : "Online"}
                        </span>
                        {appt.symptoms && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <FileText className="h-3 w-3 shrink-0" />
                            Reason: {appt.symptoms}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {appt.status === "confirmed" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-primary text-primary bg-transparent">
                          Confirmed
                        </span>
                      )}
                      {appt.status === "pending" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-amber-500 text-amber-600 bg-transparent">
                          Pending
                        </span>
                      )}
                      {appt.status === "completed" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-green-500 text-green-600 bg-transparent">
                          Completed
                        </span>
                      )}
                      {appt.status === "cancelled" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-destructive text-destructive bg-transparent">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No appointments scheduled for today</p>
            </div>
          )}
        </div>

        {/* Earnings Overview */}
        <div className="rounded-2xl border border-primary/30 bg-[#e8f3ef] dark:bg-[#1e2e29] p-5 space-y-4 h-fit">
          <div>
            <h2 className="font-bold text-base">Earnings Overview</h2>
            <p className="text-sm text-muted-foreground">{format(new Date(), "MMMM yyyy")}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Monthly Goal</span>
              <span className="text-muted-foreground">{formatLKR(monthlyGoal)}</span>
            </div>
            <p className="text-2xl font-bold">
              {formatLKR(stats.totalEarnings)}
              <span className="text-sm font-normal text-muted-foreground ml-2">{monthlyGoalPercent}%</span>
            </p>
            <Progress value={monthlyGoalPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">{formatLKR(remaining)} to reach this month's goal</p>
          </div>

          <hr className="border-border" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Pending payout</p>
              <p className="font-bold text-sm mt-0.5">{formatLKR(stats.pendingEarnings)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg / session</p>
              <p className="font-bold text-sm mt-0.5">{formatLKR(avgPerSession)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sessions paid</p>
              <p className="font-bold text-sm mt-0.5">{stats.completedAppointments}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Refunds</p>
              <p className="font-bold text-sm mt-0.5">0</p>
            </div>
          </div>

          <Link href="/doctor/earnings">
            <Button variant="outline" className="w-full rounded-xl border-primary text-primary hover:bg-primary/5">
              View earning details
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
