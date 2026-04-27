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
import AboutPage from "@/pages/about";
import SpecializationsPage from "@/pages/specializations";
import ContactPage from "@/pages/contact";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import AuthCallbackPage from "@/pages/auth-callback";
import DoctorsPage from "@/pages/doctors";
import DoctorProfilePage from "@/pages/doctor-profile";
import BookAppointmentPage from "@/pages/book-appointment";
import PatientDashboard from "@/pages/patient/dashboard";
import PatientAppointmentsPage from "@/pages/patient/appointments";
import PatientReviewsPage from "@/pages/patient/reviews";
import PatientSettingsPage from "@/pages/patient/settings";
import VerifyPhonePage from "@/pages/patient/verify-phone";
import DoctorDashboard from "@/pages/doctor/dashboard";
import DoctorRegisterPage from "@/pages/doctor/register";
import DoctorAppointmentsPage from "@/pages/doctor/appointments";
import DoctorSchedulePage from "@/pages/doctor/schedule";
import DoctorReviewsPage from "@/pages/doctor/reviews";
import DoctorEarningsPage from "@/pages/doctor/earnings";
import DoctorSettingsPage from "@/pages/doctor/settings";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminDoctorsPage from "@/pages/admin/doctors";
import AdminPatientsPage from "@/pages/admin/patients";
import AdminAppointmentsPage from "@/pages/admin/appointments";
import AdminSpecializationsPage from "@/pages/admin/specializations";
import AdminPaymentsPage from "@/pages/admin/payments";
import AdminSettingsPage from "@/pages/admin/settings";
import NotFound from "@/pages/not-found";
import EmailVerificationPage from "./pages/email-verification";


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
      <Route path="/about" component={AboutPage} />
      <Route path="/specializations" component={SpecializationsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />
      <Route path="/doctor/register" component={DoctorRegisterPage} />
      <Route path="/doctors" component={DoctorsPage} />
      <Route path="/doctors/:id" component={DoctorProfilePage} />
      <Route path="/email-verification" component={EmailVerificationPage} />
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
              <Route path="/patient/doctors" component={DoctorsPage} />
              <Route path="/patient/appointments" component={PatientAppointmentsPage} />
              <Route path="/patient/records" component={PatientDashboard} />
              <Route path="/patient/reviews" component={PatientReviewsPage} />
              <Route path="/patient/settings" component={PatientSettingsPage} />
              <Route path="/patient/verify-phone" component={VerifyPhonePage} />
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
              <Route path="/doctor/appointments" component={DoctorAppointmentsPage} />
              <Route path="/doctor/schedule" component={DoctorSchedulePage} />
              <Route path="/doctor/earnings" component={DoctorEarningsPage} />
              <Route path="/doctor/reviews" component={DoctorReviewsPage} />
              <Route path="/doctor/profile" component={DoctorSettingsPage} />
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
              <Route path="/admin/doctors" component={AdminDoctorsPage} />
              <Route path="/admin/patients" component={AdminPatientsPage} />
              <Route path="/admin/appointments" component={AdminAppointmentsPage} />
              <Route path="/admin/specializations" component={AdminSpecializationsPage} />
              <Route path="/admin/payments" component={AdminPaymentsPage} />
              <Route path="/admin/settings" component={AdminSettingsPage} />
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
