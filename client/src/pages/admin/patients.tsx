import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search, 
  AlertCircle,
  Eye,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Ban,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface PatientWithStats extends Omit<User, 'password'> {
  totalAppointments?: number;
  totalSpent?: number;
}

export default function AdminPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientWithStats | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [patientToSuspend, setPatientToSuspend] = useState<PatientWithStats | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: patients = [], isLoading, isError } = useQuery<PatientWithStats[]>({
    queryKey: ["/api/admin/users?role=patient"],
  });

  const suspendMutation = useMutation({
    mutationFn: async (patientId: string) =>
      apiRequest("PATCH", `/api/admin/users/${patientId}/suspend`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users?role=patient"] });
      toast({
        title: "Patient Suspended",
        description: "The patient account has been suspended successfully.",
      });
      setShowSuspendDialog(false);
      setPatientToSuspend(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to suspend patient. Please try again.",
        variant: "destructive",
      });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (patientId: string) =>
      apiRequest("PATCH", `/api/admin/users/${patientId}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users?role=patient"] });
      toast({
        title: "Patient Reactivated",
        description: "The patient account has been reactivated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reactivate patient. Please try again.",
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
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const filteredPatients = patients.filter(patient => {
    return (
      patient.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (isLoading) {
    return <LoadingPage message="Loading patients..." />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Failed to load patients. Please try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Patients Management</h1>
          <p className="text-muted-foreground">View and manage registered patients</p>
        </div>
        <Card className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{patients.length}</p>
              <p className="text-xs text-muted-foreground">Total Patients</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <Card 
              key={patient.id} 
              className={`hover-elevate ${patient.isActive === false ? 'opacity-60' : ''}`}
              data-testid={`card-patient-${patient.id}`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Avatar className="h-14 w-14 shrink-0">
                    <AvatarImage src={patient.profileImage} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(patient.fullName || "")}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{patient.fullName}</h3>
                        {patient.isActive === false && (
                          <Badge variant="destructive" className="text-xs">
                            Suspended
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {patient.isEmailVerified && (
                          <Badge variant="secondary" className="text-xs">
                            Email Verified
                          </Badge>
                        )}
                        {patient.isPhoneVerified && (
                          <Badge variant="secondary" className="text-xs">
                            Phone Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{patient.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{patient.city || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Joined {format(new Date(patient.createdAt), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowDetailsDialog(true);
                      }}
                      data-testid={`button-view-${patient.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {patient.isActive !== false ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setPatientToSuspend(patient);
                          setShowSuspendDialog(true);
                        }}
                        data-testid={`button-suspend-${patient.id}`}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Suspend
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => reactivateMutation.mutate(patient.id)}
                        disabled={reactivateMutation.isPending}
                        data-testid={`button-reactivate-${patient.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Reactivate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">No patients found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery ? "Try adjusting your search" : "No patients registered yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>
              Complete information about the patient
            </DialogDescription>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedPatient.profileImage} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {getInitials(selectedPatient.fullName || "")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedPatient.fullName}</h3>
                  <p className="text-muted-foreground">{selectedPatient.email}</p>
                  <div className="flex gap-2 mt-1">
                    {selectedPatient.isEmailVerified && (
                      <Badge variant="secondary" className="text-xs">Email Verified</Badge>
                    )}
                    {selectedPatient.isPhoneVerified && (
                      <Badge variant="secondary" className="text-xs">Phone Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedPatient.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{selectedPatient.gender || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">City</p>
                    <p className="font-medium">{selectedPatient.city || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{selectedPatient.dateOfBirth || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">NIC</p>
                    <p className="font-medium">{selectedPatient.nic || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registered On</p>
                    <p className="font-medium">{format(new Date(selectedPatient.createdAt), "PPP")}</p>
                  </div>
                </div>

                {selectedPatient.address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{selectedPatient.address}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Preferred Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.preferredLanguages?.map((lang) => (
                      <Badge key={lang} variant="outline" className="capitalize">{lang}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                {selectedPatient.isActive !== false ? (
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setPatientToSuspend(selectedPatient);
                      setShowDetailsDialog(false);
                      setShowSuspendDialog(true);
                    }}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend Account
                  </Button>
                ) : (
                  <Button 
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      reactivateMutation.mutate(selectedPatient.id);
                      setShowDetailsDialog(false);
                    }}
                    disabled={reactivateMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Reactivate Account
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Patient Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend the account for{" "}
              <span className="font-semibold">{patientToSuspend?.fullName}</span>?
              This will prevent them from logging in and booking appointments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPatientToSuspend(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => patientToSuspend && suspendMutation.mutate(patientToSuspend.id)}
              disabled={suspendMutation.isPending}
            >
              {suspendMutation.isPending ? "Suspending..." : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
