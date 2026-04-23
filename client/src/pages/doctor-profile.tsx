import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Award,
  Languages,
  Phone,
  Calendar,
  ChevronLeft,
  Video,
  Building2,
  ArrowUp,
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
import { ConsultationTypeBadges } from "@/components/ui/status-badge";
import { LoadingPage, LoadingSpinner } from "@/components/ui/loading-spinner";
import type { DoctorWithDetails, AppointmentSlot } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function DoctorProfilePage() {
  const { id } = useParams();
  const [userRating, setUserRating] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [selectedConsultationType, setSelectedConsultationType] = useState<"all" | AppointmentSlot["consultationType"]>("all");

  const selectedDateString = format(selectedDate, "yyyy-MM-dd");

  const { data: doctor, isLoading: doctorLoading } = useQuery<DoctorWithDetails>({
    queryKey: [`/api/doctors/${id}`],
    enabled: Boolean(id),
  });

  const { data: slots = [], isLoading: slotsLoading, isError: slotsError } = useQuery<AppointmentSlot[]>({
    queryKey: ["/api/doctors", id, "slots", selectedDateString],
    queryFn: () => apiRequest("GET", `/api/doctors/${id}/slots?date=${selectedDateString}`),
    enabled: Boolean(id),
    staleTime: 60_000,
  });

  const maxAdvanceDays = Math.max(Math.min(doctor?.maxAdvanceBookingDays ?? 14, 30), 1);
  const dates = Array.from({ length: maxAdvanceDays }, (_, i) => addDays(startOfToday(), i));

  const filteredSlots = slots.filter(slot => 
    selectedConsultationType === "all" || slot.consultationType === selectedConsultationType
  );

  const slotTypesForDate = Array.from(new Set(slots.map((slot) => slot.consultationType)));
  const availableConsultationTypes = Array.from(
    new Set([
      ...(doctor?.consultationTypes || []),
      ...slotTypesForDate,
    ]),
  ).filter((t): t is "in_person" | "online" => t === "in_person" || t === "online");

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate, selectedConsultationType]);

  useEffect(() => {
    if (selectedSlot && !filteredSlots.some(slot => slot.id === selectedSlot.id)) {
      setSelectedSlot(null);
    }
  }, [filteredSlots, selectedSlot]);

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

  if (doctorLoading) {
    return (
      <PublicLayout showHeader={false}>
        <LoadingPage message="Loading doctor profile..." />
      </PublicLayout>
    );
  }

  if (!doctor) {
    return (
      <PublicLayout showHeader={false}>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Doctor not found</h1>
          <Link href="/patient/doctors">
            <Button>Back to Doctors</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout showHeader={false}>
      <div className="bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-4">
          <Link href="/patient/doctors">
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
                            {doctor.user.fullName.startsWith("Dr") ? doctor.user.fullName : `Dr. ${doctor.user.fullName}`}
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
                          rating={userRating || doctor.averageRating}
                          showValue
                          size="md"
                          interactive
                          onRatingChange={(val) => setUserRating(val)}
                        />
                        {userRating > 0 && (
                          <span className="text-xs text-muted-foreground">Your rating: {userRating}.0</span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-primary">{doctor.totalAppointments}+</p>
                          <p className="text-xs text-muted-foreground">Patients</p>
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
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
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
                      {doctor.user.gender && (
                        <div>
                          <h3 className="font-semibold mb-2">Gender</h3>
                          <p className="text-muted-foreground capitalize">{doctor.user.gender}</p>
                        </div>
                      )}
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
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-3">Your Review</h3>
                      {userRating > 0 ? (
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                          <p className="font-medium text-sm">
                            You rated {userRating === 5 ? "Excellent" : userRating === 4 ? "Very Good" : userRating === 3 ? "Good" : userRating === 2 ? "Fair" : "Poor"} — {userRating} out of 5
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            You can update your rating using the stars at the top of the page
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-muted/50 border border-dashed">
                          <p className="text-sm text-muted-foreground">
                            You haven't rated this doctor yet — use the stars at the top of the page to rate
                          </p>
                        </div>
                      )}
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
                      {availableConsultationTypes.includes("in_person") && (
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
                      {availableConsultationTypes.includes("online") && (
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
                    {slotsLoading ? (
                      <div className="flex justify-center py-4">
                        <LoadingSpinner />
                      </div>
                    ) : slotsError ? (
                      <p className="text-sm text-destructive text-center py-4">
                        Unable to load slots. Please try another date.
                      </p>
                    ) : filteredSlots.length > 0 ? (
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
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl hover:brightness-110 ${
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </PublicLayout>
  );
}
