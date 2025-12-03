import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  MapPin, 
  Clock, 
  Award, 
  Languages, 
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Video,
  Building2,
  Home,
  Star
} from "lucide-react";
import { format, addDays, isSameDay, startOfToday } from "date-fns";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { StarRating } from "@/components/ui/star-rating";
import { ConsultationTypeBadges, StatusBadge } from "@/components/ui/status-badge";
import { LoadingPage } from "@/components/ui/loading-spinner";
import type { DoctorWithDetails, AppointmentSlot, ReviewWithPatient } from "@shared/schema";
import { ConsultationType } from "@shared/schema";

const mockDoctor: DoctorWithDetails = {
  id: "1",
  userId: "u1",
  registrationNumber: "AYU-2010-001",
  qualifications: "BAMS (Bachelor of Ayurvedic Medicine and Surgery), MD (Ayu) - Panchakarma Specialist",
  biography: "Dr. Ananda Perera is a highly experienced Ayurvedic physician with over 15 years of dedicated practice in Panchakarma therapy. He has successfully treated thousands of patients with chronic conditions using traditional Ayurvedic methods combined with modern approaches. His expertise includes detoxification therapies, stress management, and holistic wellness programs. Dr. Perera is passionate about bringing the wisdom of ancient Ayurveda to modern healthcare.",
  experienceYears: 15,
  specializationIds: ["1"],
  languagesSpoken: ["english", "sinhala"],
  consultationTypes: ["in_person", "online"],
  hospitalIds: ["h1"],
  consultationFee: 2500,
  onlineConsultationFee: 2000,
  status: "verified",
  verificationDocuments: [],
  isAvailable: true,
  maxAdvanceBookingDays: 30,
  minBookingNoticeHours: 2,
  slotDurationMinutes: 30,
  bufferTimeMinutes: 10,
  averageRating: 4.9,
  totalReviews: 156,
  totalAppointments: 500,
  currentQueueNumber: 0,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  user: {
    id: "u1",
    email: "ananda@example.com",
    password: "",
    fullName: "Ananda Perera",
    phone: "+94771234567",
    role: "doctor",
    preferredLanguages: ["english"],
    isEmailVerified: true,
    isPhoneVerified: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  specializations: [{ id: "1", name: "Panchakarma", description: "Traditional detoxification and rejuvenation therapy" }],
  hospitals: [{ 
    id: "h1", 
    name: "Ayurveda Wellness Center", 
    address: "123 Galle Road, Colombo 03", 
    city: "Colombo", 
    contactNumber: "+94112345678",
    parkingAvailable: true,
    directions: "Near Kollupitiya Junction, opposite Ceylon Continental Hotel"
  }],
};

const mockSlots: AppointmentSlot[] = [
  { id: "s1", doctorId: "1", date: format(addDays(startOfToday(), 1), "yyyy-MM-dd"), startTime: "09:00", endTime: "09:30", consultationType: "in_person", isBooked: false, isBlocked: false },
  { id: "s2", doctorId: "1", date: format(addDays(startOfToday(), 1), "yyyy-MM-dd"), startTime: "09:30", endTime: "10:00", consultationType: "in_person", isBooked: true, isBlocked: false },
  { id: "s3", doctorId: "1", date: format(addDays(startOfToday(), 1), "yyyy-MM-dd"), startTime: "10:00", endTime: "10:30", consultationType: "in_person", isBooked: false, isBlocked: false },
  { id: "s4", doctorId: "1", date: format(addDays(startOfToday(), 1), "yyyy-MM-dd"), startTime: "10:30", endTime: "11:00", consultationType: "online", isBooked: false, isBlocked: false },
  { id: "s5", doctorId: "1", date: format(addDays(startOfToday(), 1), "yyyy-MM-dd"), startTime: "11:00", endTime: "11:30", consultationType: "online", isBooked: false, isBlocked: false },
  { id: "s6", doctorId: "1", date: format(addDays(startOfToday(), 2), "yyyy-MM-dd"), startTime: "09:00", endTime: "09:30", consultationType: "in_person", isBooked: false, isBlocked: false },
  { id: "s7", doctorId: "1", date: format(addDays(startOfToday(), 2), "yyyy-MM-dd"), startTime: "14:00", endTime: "14:30", consultationType: "online", isBooked: false, isBlocked: false },
  { id: "s8", doctorId: "1", date: format(addDays(startOfToday(), 3), "yyyy-MM-dd"), startTime: "09:00", endTime: "09:30", consultationType: "in_person", isBooked: false, isBlocked: false },
];

const mockReviews: ReviewWithPatient[] = [
  {
    id: "r1",
    appointmentId: "a1",
    patientId: "p1",
    doctorId: "1",
    rating: 5,
    comment: "Dr. Perera is an excellent doctor. He took the time to understand my condition and provided a comprehensive treatment plan. The Panchakarma therapy has significantly improved my health.",
    isHidden: false,
    createdAt: "2024-10-15",
    updatedAt: "2024-10-15",
    patient: {
      id: "p1",
      email: "patient1@example.com",
      password: "",
      fullName: "Sanduni W.",
      phone: "+94771111111",
      role: "patient",
      preferredLanguages: ["english"],
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
  },
  {
    id: "r2",
    appointmentId: "a2",
    patientId: "p2",
    doctorId: "1",
    rating: 5,
    comment: "Very professional and knowledgeable. The online consultation was smooth and he explained everything clearly.",
    isHidden: false,
    createdAt: "2024-10-10",
    updatedAt: "2024-10-10",
    patient: {
      id: "p2",
      email: "patient2@example.com",
      password: "",
      fullName: "Mahesh J.",
      phone: "+94772222222",
      role: "patient",
      preferredLanguages: ["english"],
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
  },
  {
    id: "r3",
    appointmentId: "a3",
    patientId: "p3",
    doctorId: "1",
    rating: 4,
    comment: "Good experience overall. The clinic was clean and well-organized. Would recommend.",
    isHidden: false,
    createdAt: "2024-10-05",
    updatedAt: "2024-10-05",
    patient: {
      id: "p3",
      email: "patient3@example.com",
      password: "",
      fullName: "Priya N.",
      phone: "+94773333333",
      role: "patient",
      preferredLanguages: ["sinhala"],
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
  },
];

export default function DoctorProfilePage() {
  const { id } = useParams();
  const [selectedDate, setSelectedDate] = useState(addDays(startOfToday(), 1));
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [selectedConsultationType, setSelectedConsultationType] = useState<string>("all");

  const { data: doctor, isLoading } = useQuery<DoctorWithDetails>({
    queryKey: ["/api/doctors", id],
    queryFn: async () => mockDoctor,
  });

  const dates = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i + 1));

  const filteredSlots = mockSlots.filter(slot => {
    const slotDate = new Date(slot.date);
    if (!isSameDay(slotDate, selectedDate)) return false;
    if (selectedConsultationType !== "all" && slot.consultationType !== selectedConsultationType) return false;
    return true;
  });

  const formatFee = (fee: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(fee);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <LoadingPage message="Loading doctor profile..." />
      </PublicLayout>
    );
  }

  if (!doctor) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Doctor not found</h1>
          <Link href="/doctors">
            <Button>Back to Doctors</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-4">
          <Link href="/doctors">
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to Doctors
            </Button>
          </Link>
        </div>

        <div className="container mx-auto px-4 pb-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Avatar className="h-32 w-32 rounded-xl border-4 border-primary/10 shrink-0">
                      <AvatarImage src={doctor.user.profileImage} alt={doctor.user.fullName} />
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-3xl font-bold">
                        {getInitials(doctor.user.fullName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h1 className="text-2xl md:text-3xl font-heading font-bold">
                            Dr. {doctor.user.fullName}
                          </h1>
                          <p className="text-lg text-primary font-medium mt-1">
                            {doctor.specializations.map(s => s.name).join(", ")}
                          </p>
                        </div>
                        {doctor.status === "verified" && (
                          <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <Award className="h-3.5 w-3.5" />
                            Verified Doctor
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <StarRating 
                          rating={doctor.averageRating} 
                          showValue 
                          reviewCount={doctor.totalReviews}
                          size="md"
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-primary">{doctor.experienceYears}</p>
                          <p className="text-xs text-muted-foreground">Years Exp.</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-primary">{doctor.totalReviews}</p>
                          <p className="text-xs text-muted-foreground">Reviews</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-primary">{doctor.totalAppointments}+</p>
                          <p className="text-xs text-muted-foreground">Patients</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-primary">{doctor.averageRating}</p>
                          <p className="text-xs text-muted-foreground">Rating</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Languages className="h-4 w-4" />
                        <span>{doctor.languagesSpoken.map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(", ")}</span>
                      </div>
                      <ConsultationTypeBadges types={doctor.consultationTypes} size="md" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="locations">Locations</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews ({doctor.totalReviews})</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="mt-4">
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      <div>
                        <h3 className="font-semibold mb-2">Biography</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {doctor.biography}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Qualifications</h3>
                        <p className="text-muted-foreground">{doctor.qualifications}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Registration</h3>
                        <p className="text-muted-foreground">{doctor.registrationNumber}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="locations" className="mt-4">
                  <div className="space-y-4">
                    {doctor.hospitals.map((hospital) => (
                      <Card key={hospital.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-primary/10">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{hospital.name}</h3>
                              <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                  <span>{hospital.address}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 shrink-0" />
                                  <span>{hospital.contactNumber}</span>
                                </div>
                                {hospital.directions && (
                                  <p className="text-xs italic">{hospital.directions}</p>
                                )}
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <Badge variant="outline">
                                  {formatFee(doctor.consultationFee)} / visit
                                </Badge>
                                {hospital.parkingAvailable && (
                                  <Badge variant="secondary">Parking Available</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Patient Reviews</CardTitle>
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 fill-secondary text-secondary" />
                          <span className="text-2xl font-bold">{doctor.averageRating}</span>
                          <span className="text-muted-foreground">/ 5</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {mockReviews.map((review) => (
                        <div key={review.id} className="pb-6 border-b last:border-0 last:pb-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(review.patient.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{review.patient.fullName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(review.createdAt), "MMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                          {review.comment && (
                            <p className="mt-3 text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Book Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Date</label>
                    <ScrollArea className="w-full whitespace-nowrap">
                      <div className="flex gap-2 pb-2">
                        {dates.map((date) => (
                          <Button
                            key={date.toISOString()}
                            variant={isSameDay(date, selectedDate) ? "default" : "outline"}
                            className="flex flex-col h-auto py-2 px-3 min-w-[60px]"
                            onClick={() => setSelectedDate(date)}
                          >
                            <span className="text-xs">{format(date, "EEE")}</span>
                            <span className="text-lg font-bold">{format(date, "d")}</span>
                            <span className="text-xs">{format(date, "MMM")}</span>
                          </Button>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Consultation Type</label>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedConsultationType === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedConsultationType("all")}
                      >
                        All
                      </Button>
                      {doctor.consultationTypes.includes("in_person" as any) && (
                        <Button
                          variant={selectedConsultationType === "in_person" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedConsultationType("in_person")}
                          className="gap-1"
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          In Person
                        </Button>
                      )}
                      {doctor.consultationTypes.includes("online" as any) && (
                        <Button
                          variant={selectedConsultationType === "online" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedConsultationType("online")}
                          className="gap-1"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Online
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Available Slots for {format(selectedDate, "EEEE, MMM d")}
                    </label>
                    {filteredSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {filteredSlots.map((slot) => (
                          <Button
                            key={slot.id}
                            variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                            size="sm"
                            disabled={slot.isBooked || slot.isBlocked}
                            onClick={() => setSelectedSlot(slot)}
                            className="text-xs"
                          >
                            {slot.startTime}
                            {slot.consultationType === "online" && (
                              <Video className="h-3 w-3 ml-1" />
                            )}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No available slots for this date
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Consultation Fee</span>
                      <span className="font-semibold">
                        {selectedSlot?.consultationType === "online" && doctor.onlineConsultationFee
                          ? formatFee(doctor.onlineConsultationFee)
                          : formatFee(doctor.consultationFee)}
                      </span>
                    </div>
                    <Link href={selectedSlot ? `/book/${doctor.id}?slot=${selectedSlot.id}` : "#"}>
                      <Button 
                        className="w-full" 
                        size="lg"
                        disabled={!selectedSlot}
                        data-testid="button-book-now"
                      >
                        {selectedSlot ? "Continue to Book" : "Select a Time Slot"}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
