import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Activity,
  FileText,
  Mail,
  Phone,
  MapPin,
  Languages,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { LoadingPage } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import type { AdminDashboardStats, DoctorWithDetails } from "@shared/schema";
import { DoctorStatus } from "@shared/schema";

interface DashboardData {
  stats: AdminDashboardStats;
  pendingDoctors: DoctorWithDetails[];
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorWithDetails | null>(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const { data: dashboardData, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["/api/admin/dashboard"],
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const verifyMutation = useMutation({
    mutationFn: (doctorId: string) => 
      apiRequest("PATCH", `/api/admin/doctors/${doctorId}/verify`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/doctors"] });
      toast({
        title: "Doctor verified",
        description: "The doctor has been moved to the verified list.",
      });
      setShowVerificationDialog(false);
      setSelectedDoctor(null);
    },
    onError: () => {
      toast({
        title: "Verification failed",
        description: "Could not verify the doctor. Please try again.",
        variant: "destructive",
      });
    },
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

  const handleOpenDoctor = (doctor: DoctorWithDetails) => {
    setSelectedDoctor(doctor);
    setShowVerificationDialog(true);
  };

  const handleCloseDialog = () => {
    setShowVerificationDialog(false);
    setSelectedDoctor(null);
  };

  const getDocumentLink = (doc: string) => {
    const filename = doc.split("/").pop() || "";
    return doc.startsWith("http") ? doc : `/api/documents/${filename}`;
  };

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
                      <Button 
                        size="sm"
                        onClick={() => handleOpenDoctor(doctor)}
                        data-testid={`button-review-doctor-${doctor.id}`}
                      >
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

      <Dialog 
        open={showVerificationDialog} 
        onOpenChange={(open) => open ? setShowVerificationDialog(true) : handleCloseDialog()}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Doctor Application</DialogTitle>
            <DialogDescription>
              Verify the doctor's submitted details and documents before approving.
            </DialogDescription>
          </DialogHeader>

          {selectedDoctor && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedDoctor.user?.profileImage} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(selectedDoctor.user?.fullName || "")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold">{selectedDoctor.user?.fullName}</h3>
                    <StatusBadge status={selectedDoctor.status || DoctorStatus.PENDING} type="doctor" />
                    <Badge variant="outline" className="text-xs">
                      {selectedDoctor.registrationNumber}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{selectedDoctor.qualifications}</p>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span>Applied {format(new Date(selectedDoctor.createdAt), "PPP")}</span>
                    <span>| {selectedDoctor.experienceYears} yrs experience</span>
                    <span>| {selectedDoctor.totalAppointments} appointments completed</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDoctor.specializations?.map((spec) => (
                      <Badge key={spec.id} variant="secondary" className="text-xs">
                        {spec.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border space-y-3">
                  <p className="text-sm font-medium">Identity & Contact</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{selectedDoctor.user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{selectedDoctor.user?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedDoctor.user?.city || "City not provided"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      <div className="flex flex-wrap gap-1">
                        {(selectedDoctor.languagesSpoken || []).map((lang) => (
                          <Badge key={lang} variant="outline" className="text-2xs capitalize">
                            {lang.replace("_", " ")}
                          </Badge>
                        ))}
                        {(selectedDoctor.languagesSpoken || []).length === 0 && (
                          <span className="text-muted-foreground">No languages provided</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border space-y-3">
                  <p className="text-sm font-medium">Professional Profile</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      <span>{selectedDoctor.consultationTypes?.map(t => t.replace("_", " ")).join(", ") || "Consultation types not provided"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        In-person: {formatFee(selectedDoctor.consultationFee)}
                        {selectedDoctor.onlineConsultationFee ? ` | Online: ${formatFee(selectedDoctor.onlineConsultationFee)}` : ""}
                        {selectedDoctor.homeVisitFee ? ` | Home visit: ${formatFee(selectedDoctor.homeVisitFee)}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Max advance booking: {selectedDoctor.maxAdvanceBookingDays} days</span>
                    </div>
                    {selectedDoctor.biography && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedDoctor.biography}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <p className="text-sm font-medium">Hospital Affiliations</p>
                </div>
                {selectedDoctor.hospitals?.length ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    {selectedDoctor.hospitals.map((hospital) => (
                      <div key={hospital.id} className="p-3 rounded-lg bg-muted">
                        <p className="font-medium">{hospital.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {hospital.address}, {hospital.city}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hospitals provided</p>
                )}
              </div>

              <div className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <p className="text-sm font-medium">Verification Documents</p>
                </div>
                {selectedDoctor.verificationDocuments && selectedDoctor.verificationDocuments.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedDoctor.verificationDocuments.map((doc: string, index: number) => (
                      <a
                        key={index}
                        href={getDocumentLink(doc)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border hover-elevate transition-colors"
                      >
                        <FileText className="h-5 w-5 text-primary" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">Document {index + 1}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.split("/").pop() || doc}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                )}
              </div>

              {(selectedDoctor.bankName || selectedDoctor.bankAccountNumber || selectedDoctor.bankBranch) && (
                <div className="p-4 rounded-lg border space-y-2">
                  <p className="text-sm font-medium">Banking Details</p>
                  <div className="grid gap-2 sm:grid-cols-3 text-sm text-muted-foreground">
                    <div>
                      <p className="text-xs uppercase tracking-wide">Bank</p>
                      <p className="font-medium text-foreground">{selectedDoctor.bankName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Account No</p>
                      <p className="font-medium text-foreground">{selectedDoctor.bankAccountNumber || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Branch</p>
                      <p className="font-medium text-foreground">{selectedDoctor.bankBranch || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Close
                </Button>
                <Button 
                  onClick={() => selectedDoctor && verifyMutation.mutate(selectedDoctor.id)}
                  disabled={verifyMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {verifyMutation.isPending ? "Verifying..." : "Approve & Verify"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
