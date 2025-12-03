import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { UserRole } from "@shared/schema";

import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DoctorsPage from "@/pages/doctors";
import DoctorProfilePage from "@/pages/doctor-profile";
import BookAppointmentPage from "@/pages/book-appointment";
import PatientDashboard from "@/pages/patient/dashboard";
import PatientAppointmentsPage from "@/pages/patient/appointments";
import DoctorDashboard from "@/pages/doctor/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: string[];
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/doctors" component={DoctorsPage} />
      <Route path="/doctors/:id" component={DoctorProfilePage} />
      <Route path="/book/:doctorId">
        <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
          <BookAppointmentPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/patient">
        <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
          <DashboardLayout>
            <PatientDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/patient/:rest*">
        <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
          <DashboardLayout>
            <Switch>
              <Route path="/patient/appointments" component={PatientAppointmentsPage} />
              <Route path="/patient/records" component={PatientDashboard} />
              <Route path="/patient/reviews" component={PatientDashboard} />
              <Route path="/patient/settings" component={PatientDashboard} />
              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/doctor">
        <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
          <DashboardLayout>
            <DoctorDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/doctor/:rest*">
        <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
          <DashboardLayout>
            <Switch>
              <Route path="/doctor/appointments" component={DoctorDashboard} />
              <Route path="/doctor/schedule" component={DoctorDashboard} />
              <Route path="/doctor/patients" component={DoctorDashboard} />
              <Route path="/doctor/earnings" component={DoctorDashboard} />
              <Route path="/doctor/reviews" component={DoctorDashboard} />
              <Route path="/doctor/profile" component={DoctorDashboard} />
              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin">
        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
          <DashboardLayout>
            <AdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/:rest*">
        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
          <DashboardLayout>
            <Switch>
              <Route path="/admin/doctors" component={AdminDashboard} />
              <Route path="/admin/patients" component={AdminDashboard} />
              <Route path="/admin/appointments" component={AdminDashboard} />
              <Route path="/admin/specializations" component={AdminDashboard} />
              <Route path="/admin/payments" component={AdminDashboard} />
              <Route path="/admin/settings" component={AdminDashboard} />
              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
