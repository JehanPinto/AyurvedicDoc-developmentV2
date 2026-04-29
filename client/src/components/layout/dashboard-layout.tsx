import { type ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  FileText,
  Settings,
  Users,
  Stethoscope,
  DollarSign,
  Star,
  Bell,
  Activity,
  LogOut,
  ChevronDown,
  Menu,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationPanel } from "@/components/notifications/notification-panel";
import { DoctorNotificationPanel } from "@/components/notifications/doctor-notification-panel";
import { AdminNotificationPanel } from "@/components/notifications/admin-notification-panel";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@shared/schema";

interface DashboardLayoutProps {
  children: ReactNode;
}

const patientNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/patient" },
  { icon: Stethoscope, label: "Find Doctors", href: "/patient/doctors" },
  { icon: Calendar, label: "My Appointments", href: "/patient/appointments" },
  { icon: Star, label: "My Reviews", href: "/patient/reviews" },
  { icon: Settings, label: "Settings", href: "/patient/settings" },
];

const doctorNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/doctor" },
  { icon: Calendar, label: "Appointments", href: "/doctor/appointments" },
  { icon: Clock, label: "Schedule", href: "/doctor/schedule" },
  { icon: DollarSign, label: "Earnings", href: "/doctor/earnings" },
  { icon: Star, label: "Reviews", href: "/doctor/reviews" },
  { icon: Settings, label: "Profile", href: "/doctor/profile" },
];

const adminMainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Stethoscope, label: "Doctors", href: "/admin/doctors" },
  { icon: Users, label: "Patients", href: "/admin/patients" },
];

const adminManagementNavItems = [
  { icon: Activity, label: "Specializations", href: "/admin/specializations" },
  { icon: DollarSign, label: "Payments", href: "/admin/payments" },
  { icon: BookOpen, label: "Blogs", href: "/admin/blogs" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifications = [] } = useQuery<{ isRead: boolean }[]>({
    queryKey: ["/api/notifications"],
    staleTime: 30 * 1000,
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Prefetch all pages for the current role so navigation feels instant
  useEffect(() => {
    if (!user) return;
    const prefetch = (key: string) =>
      queryClient.prefetchQuery({ queryKey: [key], staleTime: 2 * 60 * 1000 });

    if (user.role === UserRole.DOCTOR) {
      prefetch("/api/appointments");
      prefetch("/api/doctor/dashboard");
      prefetch("/api/doctor/earnings");
      prefetch("/api/doctor/reviews");
      prefetch("/api/doctor/patients");
      prefetch("/api/doctor/profile");
    } else if (user.role === UserRole.PATIENT) {
      prefetch("/api/patient/dashboard");
      prefetch("/api/appointments");
      prefetch("/api/patient/reviews");
      prefetch("/api/specializations");
    }
  }, [user?.id]);

  const navItems =
    user?.role === UserRole.DOCTOR ? doctorNavItems :
    patientNavItems;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return "Administrator";
      case UserRole.DOCTOR:
        return "Doctor";
      default:
        return "Patient";
    }
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">A</span>
              </div>
              <span className="font-heading font-bold">AyurvedicDoctor</span>
            </div>
          </SidebarHeader>

          <SidebarContent className="scrollbar-thin">
            {user?.role === UserRole.ADMIN ? (
              <>
                <SidebarGroup>
                  <SidebarGroupLabel>Main</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {adminMainNavItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={location === item.href}>
                            <Link href={item.href}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                  <SidebarGroupLabel>Management</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {adminManagementNavItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={location === item.href}>
                            <Link href={item.href}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            ) : (
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={location === item.href}>
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImage} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(user?.fullName || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium truncate">{user?.fullName}</p>
                    <p className="text-xs text-muted-foreground">{getRoleLabel(user?.role || "")}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-4 gap-4 bg-background shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                data-testid="button-notifications"
                onClick={() => setNotifOpen(true)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-2xs">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>
              <ThemeToggle />
            </div>
            {user?.role === UserRole.DOCTOR ? (
              <DoctorNotificationPanel open={notifOpen} onOpenChange={setNotifOpen} />
            ) : user?.role === UserRole.ADMIN ? (
              <AdminNotificationPanel open={notifOpen} onOpenChange={setNotifOpen} />
            ) : (
              <NotificationPanel open={notifOpen} onOpenChange={setNotifOpen} />
            )}
          </header>

          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
