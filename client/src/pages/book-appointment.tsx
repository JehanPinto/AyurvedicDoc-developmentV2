import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  Video, 
  Building2,
  CreditCard,
  User,
  Loader2,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { PaymentMethod, Gender, ConsultationType, type DoctorWithDetails, type AppointmentSlot } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

const bookingSchema = z.object({
  symptoms: z.string().min(10, "Please describe your symptoms in detail (at least 10 characters)"),
  paymentMethod: z.literal(PaymentMethod.ONLINE).default(PaymentMethod.ONLINE),
  isForDependent: z.boolean().default(false),
  dependentName: z.string().optional(),
  dependentAge: z.string().optional(),
  dependentGender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]).optional(),
  dependentContact: z.string().optional(),
  agreeTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

type BookingInput = z.infer<typeof bookingSchema>;

const mockDoctor: DoctorWithDetails = {
  id: "1",
  userId: "u1",
  registrationNumber: "AYU-2010-001",
  qualifications: "BAMS, MD (Ayu)",
  biography: "Specialized in Panchakarma therapy.",
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
  specializations: [{ id: "1", name: "Panchakarma", description: "Traditional detox therapy" }],
  hospitals: [{ id: "h1", name: "Ayurveda Wellness Center", address: "123 Galle Road", city: "Colombo", contactNumber: "+94112345678" }],
};

const mockSlot: AppointmentSlot = {
  id: "s1",
  doctorId: "1",
  date: "2024-12-05",
  startTime: "10:00",
  endTime: "10:30",
  consultationType: "in_person",
  isBooked: false,
  isBlocked: false,
};

interface BookingSettings {
  platformCommissionRate: number;
  bookingCharges: number;
  taxRate: number;
}

export default function BookAppointmentPage() {
  const { doctorId } = useParams();
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const slotId = params.get("slot");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"details" | "payment" | "confirmation">("details");
  const [bookingComplete, setBookingComplete] = useState(false);

  const { data: bookingSettings, isLoading: settingsLoading } = useQuery<BookingSettings>({
    queryKey: ["/api/booking-settings"],
    queryFn: async () => {
      const res = await fetch("/api/booking-settings");
      if (!res.ok) throw new Error("Failed to fetch booking settings");
      const data = await res.json();
      return data;
    },
    staleTime: 0, // Always fetch fresh settings
    refetchOnMount: "always", // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  const { data: doctor, isLoading: doctorLoading } = useQuery<DoctorWithDetails>({
    queryKey: ["/api/doctors", doctorId],
    queryFn: async () => mockDoctor,
  });

  const { data: slot, isLoading: slotLoading } = useQuery<AppointmentSlot>({
    queryKey: ["/api/slots", slotId],
    queryFn: async () => mockSlot,
  });

  const form = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      symptoms: "",
      paymentMethod: PaymentMethod.ONLINE,
      isForDependent: false,
      agreeTerms: false,
    },
  });

  const isForDependent = form.watch("isForDependent");

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingInput) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { id: "booking-" + Date.now(), ...data };
    },
    onSuccess: () => {
      setBookingComplete(true);
      setStep("confirmation");
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been successfully booked.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Unable to complete your booking. Please try again.",
        variant: "destructive",
      });
    },
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

  const onSubmit = (data: BookingInput) => {
    if (step === "details") {
      // Always go to payment step since only online payments are available
      setStep("payment");
    } else if (step === "payment") {
      bookingMutation.mutate(data);
    }
  };

  const consultationFee = slot?.consultationType === "online" && doctor?.onlineConsultationFee 
    ? doctor.onlineConsultationFee 
    : doctor?.consultationFee || 0;

  // Use platform settings for booking charges and tax
  // Default to sensible values if settings not loaded yet
  const bookingCharges = bookingSettings?.bookingCharges ?? 100;
  const taxRate = bookingSettings?.taxRate ?? 4;
  const tax = Math.round(consultationFee * (taxRate / 100));
  const totalAmount = consultationFee + bookingCharges + tax;

  if (doctorLoading || slotLoading || settingsLoading) {
    return (
      <PublicLayout showHeader={false}>
        <LoadingPage message="Loading booking details..." />
      </PublicLayout>
    );
  }

  if (!doctor || !slot) {
    return (
      <PublicLayout showHeader={false}>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Booking not found</h1>
          <Link href="/patient/doctors">
            <Button>Find Doctors</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  if (bookingComplete) {
    return (
      <PublicLayout showHeader={false} showFooter={false}>
        <div className="container mx-auto px-4 py-16 max-w-lg">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-heading font-bold mb-2">Booking Confirmed!</h1>
              <p className="text-muted-foreground mb-6">
                Your appointment has been successfully booked. You will receive a confirmation via SMS and email.
              </p>

              <div className="bg-muted rounded-lg p-4 mb-6 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(doctor.user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Dr. {doctor.user.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {doctor.specializations[0]?.name}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{format(new Date(slot.date), "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{slot.startTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium flex items-center gap-1">
                      {slot.consultationType === "online" ? (
                        <><Video className="h-3.5 w-3.5" /> Online</>
                      ) : (
                        <><Building2 className="h-3.5 w-3.5" /> In Person</>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/patient/appointments">
                  <Button className="w-full">View My Appointments</Button>
                </Link>
                <Link href="/doctors">
                  <Button variant="outline" className="w-full">Find More Doctors</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout showHeader={false} showFooter={false}>
      <div className="bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/doctors/${doctorId}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to Doctor Profile
            </Button>
          </Link>
        </div>

        <div className="container mx-auto px-4 pb-12">
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-8">
            Book Appointment
          </h1>

          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                step === "details" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                1
              </div>
              <div className={`flex-1 h-1 rounded ${
                step !== "details" ? "bg-primary" : "bg-muted"
              }`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                step === "payment" ? "bg-primary text-primary-foreground" : 
                step === "confirmation" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                2
              </div>
              <div className={`flex-1 h-1 rounded ${
                step === "confirmation" ? "bg-primary" : "bg-muted"
              }`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                step === "confirmation" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                3
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Details</span>
              <span>Payment</span>
              <span>Confirmation</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {step === "details" && (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Patient Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {user && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              <p className="text-sm text-muted-foreground">{user.phone}</p>
                            </div>
                          )}

                          <FormField
                            control={form.control}
                            name="isForDependent"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  Booking for a dependent (family member)
                                </FormLabel>
                              </FormItem>
                            )}
                          />

                          {isForDependent && (
                            <div className="grid md:grid-cols-2 gap-4 p-4 border rounded-lg">
                              <FormField
                                control={form.control}
                                name="dependentName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Dependent Name *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Full name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="dependentAge"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Age *</FormLabel>
                                    <FormControl>
                                      <Input type="number" placeholder="Age" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="dependentGender"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Gender *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value={Gender.MALE}>Male</SelectItem>
                                        <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                                        <SelectItem value={Gender.OTHER}>Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="dependentContact"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Contact Number</FormLabel>
                                    <FormControl>
                                      <Input placeholder="+94..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Chief Complaint / Symptoms</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <FormField
                            control={form.control}
                            name="symptoms"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    placeholder="Please describe your symptoms or reason for visit in detail..."
                                    className="min-h-[120px]"
                                    data-testid="textarea-symptoms"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Payment Method
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/50">
                            <CreditCard className="h-5 w-5 text-primary" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">Pay Online</p>
                                  <p className="text-sm text-muted-foreground">
                                    Secure payment via credit/debit card
                                  </p>
                                </div>
                                <Badge variant="secondary">Only Option</Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <FormField
                            control={form.control}
                            name="agreeTerms"
                            render={({ field }) => (
                              <FormItem className="flex items-start gap-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-terms"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-normal cursor-pointer">
                                    I agree to the{" "}
                                    <Link href="/terms" className="text-primary underline">
                                      Terms of Service
                                    </Link>
                                    ,{" "}
                                    <Link href="/privacy" className="text-primary underline">
                                      Privacy Policy
                                    </Link>
                                    , and{" "}
                                    <Link href="/cancellation" className="text-primary underline">
                                      Cancellation Policy
                                    </Link>
                                  </FormLabel>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {step === "payment" && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Complete Payment</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-6 border-2 border-dashed rounded-lg text-center">
                          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">
                            Payment gateway integration will be configured here.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            For now, click "Complete Booking" to proceed.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex gap-4">
                    {step === "payment" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep("details")}
                      >
                        Back
                      </Button>
                    )}
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={bookingMutation.isPending}
                      data-testid="button-book"
                    >
                      {bookingMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : step === "details" ? (
                        "Continue to Payment"
                      ) : (
                        `Pay ${formatFee(totalAmount)}`
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(doctor.user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Dr. {doctor.user.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {doctor.specializations[0]?.name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(slot.date), "EEEE, MMMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{slot.startTime} - {slot.endTime}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {slot.consultationType === "online" ? (
                        <>
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Online Consultation</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">In Person - {doctor.hospitals[0]?.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Consultation Fee</span>
                      <span>{formatFee(consultationFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Booking Charges</span>
                      <span>{formatFee(bookingCharges)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                      <span>{formatFee(tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">{formatFee(totalAmount)}</span>
                    </div>
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
