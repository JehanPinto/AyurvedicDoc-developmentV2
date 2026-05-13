import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Users,
  Search,
  Calendar,
  Clock,
  FileText,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  AlertCircle,
  User,
  History
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { User as UserType, AppointmentWithDetails } from "@shared/schema";

interface PatientData {
  patient: UserType;
  lastVisit: string;
  totalVisits: number;
  appointments: AppointmentWithDetails[];
}

export default function DoctorPatients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);

  const { data: patients = [], isLoading, isError } = useQuery<PatientData[]>({
    queryKey: ["/api/doctor/patients"],
    staleTime: 2 * 60 * 1000,
  });

  const getInitials = (name: string) => {
    if (!name) return "PT";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const filteredPatients = patients.filter(p => 
    p.patient.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient.phone?.includes(searchTerm)
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold" data-testid="text-page-title">
            My Patients
          </h1>
          <p className="text-muted-foreground">
            View and manage your patient roster
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 max-w-xs"
              data-testid="input-search-patients"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patients.length}</p>
                <p className="text-sm text-muted-foreground">Total Patients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <History className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {patients.reduce((sum, p) => sum + p.totalVisits, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Visits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {patients.filter(p => p.totalVisits > 1).length}
                </p>
                <p className="text-sm text-muted-foreground">Returning</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {patients.filter(p => {
                    const lastVisit = parseISO(p.lastVisit);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return lastVisit >= thirtyDaysAgo;
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">Recent (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPatients.length > 0 ? (
            <div className="divide-y">
              {filteredPatients.map((patientData) => (
                <div 
                  key={patientData.patient.id}
                  className="p-4 flex items-center gap-4 hover-elevate cursor-pointer"
                  onClick={() => setSelectedPatient(patientData)}
                  data-testid={`row-patient-${patientData.patient.id}`}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={patientData.patient.profileImage} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(patientData.patient.fullName || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">
                        {patientData.patient.fullName}
                      </p>
                      {patientData.totalVisits > 1 && (
                        <Badge variant="secondary" className="shrink-0">
                          {patientData.totalVisits} visits
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {patientData.patient.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {patientData.patient.phone}
                        </span>
                      )}
                      {patientData.patient.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {patientData.patient.city}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-muted-foreground">Last Visit</p>
                    <p className="font-medium">
                      {format(parseISO(patientData.lastVisit), "MMM d, yyyy")}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchTerm ? "No patients match your search" : "No patients yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedPatient.patient.profileImage} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {getInitials(selectedPatient.patient.fullName || "")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedPatient.patient.fullName}</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    {selectedPatient.patient.email && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {selectedPatient.patient.email}
                      </p>
                    )}
                    {selectedPatient.patient.phone && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {selectedPatient.patient.phone}
                      </p>
                    )}
                    {selectedPatient.patient.city && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {selectedPatient.patient.city}
                      </p>
                    )}
                    {selectedPatient.patient.gender && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        {selectedPatient.patient.gender.charAt(0).toUpperCase() + selectedPatient.patient.gender.slice(1)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {selectedPatient.totalVisits} visits
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Consultation History
                </h4>
                <Accordion type="single" collapsible className="space-y-2">
                  {selectedPatient.appointments.map((apt, index) => (
                    <AccordionItem 
                      key={apt.id} 
                      value={apt.id}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-left">
                            <p className="font-medium">
                              {format(parseISO(apt.appointmentDate), "MMMM d, yyyy")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {apt.appointmentTime} - {apt.consultationType === "online" ? "Online" : "In Person"}
                            </p>
                          </div>
                          <StatusBadge status={apt.status} type="appointment" />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2 pb-4">
                          {apt.symptoms && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Symptoms</p>
                              <p className="text-sm">{apt.symptoms}</p>
                            </div>
                          )}
                          {apt.consultationNotes && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Consultation Notes</p>
                              <p className="text-sm">{apt.consultationNotes}</p>
                            </div>
                          )}
                          {apt.prescription && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                Prescription
                              </p>
                              <div className="text-sm mt-1 p-2 bg-muted rounded">
                                <p><strong>Diagnosis:</strong> {apt.prescription.diagnosis}</p>
                                {apt.prescription.medications && apt.prescription.medications.length > 0 && (
                                  <div className="mt-2">
                                    <strong>Medicines:</strong>
                                    <ul className="list-disc list-inside ml-2">
                                      {apt.prescription.medications.map((med: any, i: number) => (
                                        <li key={i}>{med.name} - {med.dosage}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {apt.status === "completed" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.location.href = `/doctor/prescriptions?appointmentId=${apt.id}`}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              {apt.prescription ? "View Prescription" : "Add Prescription"}
                            </Button>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
