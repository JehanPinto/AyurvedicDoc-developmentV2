import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
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
  CheckCircle,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  PaymentMethod,
  Gender,
  type DoctorWithDetails,
  type AppointmentSlot,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

// ─── Schema ───────────────────────────────────────────────────────────────────
const bookingSchema = z.object({
  symptoms: z.string().min(10, "Please describe your symptoms in detail (at least 10 characters)"),
  paymentMethod: z.literal(PaymentMethod.ONLINE).default(PaymentMethod.ONLINE),
  isForDependent: z.boolean().default(false),
  dependentName: z.string().optional(),
  dependentAge: z.string().optional(),
  dependentGender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]).optional(),
  dependentContact: z.string().optional(),
  agreeTerms: z.boolean().refine((v) => v === true, "You must agree to the terms"),
}).superRefine((data, ctx) => {
  if (data.isForDependent) {
    if (!data.dependentName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Dependent name is required", path: ["dependentName"] });
    }
    if (!data.dependentAge?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Age is required", path: ["dependentAge"] });
    }
    if (!data.dependentGender) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Gender is required", path: ["dependentGender"] });
    }
    if (!data.dependentContact?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Contact number is required", path: ["dependentContact"] });
    } else if (!/^07[0-9]{8}$/.test(data.dependentContact)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid Sri Lankan number (07XXXXXXXX)", path: ["dependentContact"] });
    }
  }
});
type BookingInput = z.infer<typeof bookingSchema>;

interface BookingSettings {
  platformCommissionRate: number;
  bookingCharges: number;
  taxRate: number;
}

// ─── Shared progress bar (same component as doctor-profile) ───────────────────
const STEP_ICONS = [
  <svg key="s" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4l7 18 3-7 7-3L4 4z"/></svg>,
  <svg key="p" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  <svg key="pay" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="6" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>,
  <svg key="c" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>,
];
const STEPS = ["Select", "Patient Information", "Payment", "Confirmed"];

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="flex items-start w-full">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
              i === current
                ? "bg-primary border-primary text-primary-foreground"
                : i < current
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-background border-border text-muted-foreground"
            }`}>
              {i < current
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>
                : STEP_ICONS[i]}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap ${i <= current ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-px mt-[-18px] mx-1 ${i < current ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BookAppointmentPage() {
  const { doctorId } = useParams();
  const [,] = useLocation();
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  const slotId = params.get("slot");
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<"details" | "payment" | "confirmation">("details");
  const [bookingComplete, setBookingComplete] = useState(false);

  // Payment form state (managed separately to avoid polluting booking schema)
  const [cardType, setCardType] = useState<"visa" | "mastercard" | "">("");
  const [cardNumber, setCardNumber] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [cvn, setCvn] = useState("");
  const [payErr, setPayErr] = useState<Record<string, string>>({});

  const { data: bookingSettings } = useQuery<BookingSettings>({
    queryKey: ["/api/booking-settings"],
    queryFn: async () => {
      const res = await fetch("/api/booking-settings");
      if (!res.ok) throw new Error("Failed to fetch booking settings");
      return res.json();
    },
    staleTime: 0,
  });

  const { data: doctor, isLoading: doctorLoading } = useQuery<DoctorWithDetails>({
    queryKey: [`/api/doctors/${doctorId}`],
    queryFn: () => apiRequest("GET", `/api/doctors/${doctorId}`),
    enabled: Boolean(doctorId),
  });

  const { data: slot, isLoading: slotLoading, isError: slotError } = useQuery<AppointmentSlot>({
    queryKey: ["/api/slots", slotId],
    queryFn: () => apiRequest("GET", `/api/slots/${slotId}`),
    enabled: Boolean(slotId),
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
      if (!doctor || !slot || !doctorId) throw new Error("Missing booking information");
      return apiRequest("POST", "/api/appointments", {
        doctorId,
        slotId: slot.id,
        hospitalId: slot.hospitalId ?? undefined,
        consultationType: slot.consultationType,
        symptoms: data.symptoms,
        paymentMethod: data.paymentMethod,
        isForDependent: data.isForDependent,
        dependentName: data.dependentName,
        dependentAge: data.dependentAge ? Number(data.dependentAge) : undefined,
        dependentGender: data.dependentGender,
        dependentContact: data.dependentContact,
      });
    },
    onSuccess: () => {
      setBookingComplete(true);
      setStep("confirmation");
      toast({ title: "Booking Confirmed!", description: "Your appointment has been successfully booked." });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patient/dashboard"] });
      // Invalidate the doctor's slot cache so the profile page shows the booked slot as gray
      queryClient.invalidateQueries({ queryKey: ["/api/doctors", doctorId, "slots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors", doctorId, "all-slots"] });
    },
    onError: (error: Error) => {
      toast({ title: "Booking Failed", description: error.message || "Unable to complete booking.", variant: "destructive" });
    },
  });

  const formatFee = (fee: number) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 0 }).format(fee);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  // Card number formatter: digits only, groups of 4 separated by spaces
  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const validatePayment = () => {
    const errors: Record<string, string> = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const rawDigits = cardNumber.replace(/\s/g, "");

    if (!cardType) errors.cardType = "Please select a card type";
    if (!rawDigits) {
      errors.cardNumber = "Card number is required";
    } else if (rawDigits.length < 15 || rawDigits.length > 16) {
      errors.cardNumber = "Card number must be 15–16 digits";
    }
    if (!expirationMonth) {
      errors.expirationMonth = "Select a month";
    }
    if (!expirationYear) {
      errors.expirationYear = "Select a year";
    } else if (expirationMonth) {
      const yr = parseInt(expirationYear, 10);
      const mo = parseInt(expirationMonth, 10);
      if (yr < currentYear || (yr === currentYear && mo < currentMonth)) {
        errors.expirationYear = "Card has expired";
      }
    }
    if (!cvn) {
      errors.cvn = "CVN is required";
    } else if (!/^\d{3}$/.test(cvn)) {
      errors.cvn = "CVN must be exactly 3 digits";
    }
    setPayErr(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = (data: BookingInput) => {
    if (step === "details") setStep("payment");
    else if (step === "payment") {
      if (!validatePayment()) return;
      bookingMutation.mutate(data);
    }
  };

  const consultationFee = slot?.consultationType === "online" && doctor?.onlineConsultationFee
    ? doctor.onlineConsultationFee
    : doctor?.consultationFee || 0;

  const bookingCharges = bookingSettings?.bookingCharges ?? 100;
  const taxRate = bookingSettings?.taxRate ?? 4;
  const tax = Math.round(consultationFee * (taxRate / 100));
  const totalAmount = consultationFee + bookingCharges + tax;

  const stepIndex = step === "details" ? 1 : step === "payment" ? 2 : 3;

  if (doctorLoading || slotLoading) {
    return (
      <PublicLayout showHeader={false}>
        <LoadingPage message="Loading booking details..." />
      </PublicLayout>
    );
  }

  if (!doctor || !slot || slotError) {
    return (
      <PublicLayout showHeader={false}>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Booking not found</h1>
          <Link href="/patient/doctors"><Button>Find Doctors</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  // ── Confirmation screen ──────────────────────────────────────────────────
  if (bookingComplete) {
    const drName = doctor.user.fullName.startsWith("Dr") ? doctor.user.fullName : `Dr. ${doctor.user.fullName}`;
    return (
      <PublicLayout showHeader={false} showFooter={false}>
        <div className="min-h-screen bg-background">
          <div className="max-w-5xl mx-auto px-4 py-6">

            {/* Top bar */}
            <div className="flex items-center justify-between mb-8">
              <Link href={`/doctors/${doctorId}`}>
                <button className="flex items-center gap-1.5 text-sm font-medium border border-border bg-background text-foreground rounded-lg px-3 py-1.5 hover:bg-muted transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                  Back to Doctors
                </button>
              </Link>
              <img src="/logo-light.png" alt="AyurPath" className="h-8 w-auto dark:hidden" />
              <img src="/logo-dark.png" alt="AyurPath" className="h-8 w-auto hidden dark:block" />
            </div>

            {/* Progress bar — all 4 steps complete */}
            <div className="bg-card border border-border rounded-2xl px-8 py-5 mb-8">
              <ProgressBar current={3} />
            </div>

            {/* Confirmation card — centered */}
            <div className="flex justify-center">
              <div className="w-full max-w-xl bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">

                {/* Big checkmark */}
                <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-12 w-12 text-primary" />
                </div>

                <h1 className="text-2xl font-bold mb-2 text-foreground">Booking Confirmed!</h1>
                <p className="text-muted-foreground mb-6 text-sm">
                  your appointment has been successfully booked.<br />
                  You will receive a confirmation via SMS and email.
                </p>

                {/* Appointment details card */}
                <div className="bg-background rounded-xl border border-border p-5 mb-6 text-left">
                  {/* Doctor row */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={doctor.user.profileImage} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {getInitials(doctor.user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{drName}</p>
                          <p className="text-xs text-muted-foreground">{doctor.specializations[0]?.name}</p>
                        </div>
                        {doctor.status === "verified" && (
                          <span className="flex items-center gap-1 text-xs text-primary font-medium">
                            <User className="h-3 w-3" />
                            Verified Doctor
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{format(new Date(slot.date), "EEEE, MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{slot.startTime} - {slot.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {slot.consultationType === "online"
                        ? <><Video className="h-4 w-4 text-muted-foreground shrink-0" /><span>Online Consultation</span></>
                        : <><Building2 className="h-4 w-4 text-muted-foreground shrink-0" /><span>In-Person Consultation</span></>}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-3">
                  <Link href="/patient/appointments">
                    <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-colors">
                      View My Appointments
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                    </button>
                  </Link>
                  <Link href="/patient/doctors">
                    <button className="w-full flex items-center justify-center gap-2 border border-border bg-background text-foreground font-semibold py-3 rounded-xl hover:bg-muted transition-colors">
                      Find More Doctors
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                    </button>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </PublicLayout>
    );
  }

  // ── Booking summary sidebar (shared between steps) ───────────────────────
  const BookingSummary = () => (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 h-fit">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>
        </svg>
        <h2 className="font-bold text-foreground">Booking Summary</h2>
      </div>

      {/* Doctor info */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={doctor.user.profileImage} />
          <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
            {getInitials(doctor.user.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-sm text-foreground">
                {doctor.user.fullName.startsWith("Dr") ? doctor.user.fullName : `Dr. ${doctor.user.fullName}`}
              </p>
              <p className="text-xs text-muted-foreground">{doctor.specializations[0]?.name}</p>
            </div>
            {doctor.status === "verified" && (
              <span className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                <User className="h-3 w-3" />
                Verified Doctor
              </span>
            )}
          </div>
          {/* Stars */}
          <div className="flex items-center gap-1 mt-1">
            {[1,2,3,4,5].map((star) => (
              <svg key={star} width="12" height="12" viewBox="0 0 24 24"
                fill={star <= Math.round(doctor.averageRating) ? "currentColor" : "none"}
                stroke="currentColor" strokeWidth="2"
                className={star <= Math.round(doctor.averageRating) ? "text-amber-400" : "text-amber-300"}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ))}
            <span className="text-xs font-semibold ml-1">{doctor.averageRating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Date / Time / Type */}
      <div className="space-y-2 py-4 border-t border-primary/20 border-b">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{format(new Date(slot.date), "EEEE, MMMM d, yyyy")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{slot.startTime} - {slot.endTime}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {slot.consultationType === "online"
            ? <><Video className="h-4 w-4 text-muted-foreground shrink-0" /><span>Online Consultation</span></>
            : <><Building2 className="h-4 w-4 text-muted-foreground shrink-0" /><span>In-Person Consultation</span></>}
        </div>
      </div>

      {/* Fees */}
      <div className="space-y-2 py-4 border-b border-primary/20">
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
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-4">
        <span className="font-bold text-lg text-foreground">Total</span>
        <span className="font-bold text-lg text-primary">{formatFee(totalAmount)}</span>
      </div>
    </div>
  );

  return (
    <PublicLayout showHeader={false} showFooter={false}>
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">

          {/* ── Top bar ── */}
          <div className="flex items-center justify-between mb-8">
            <Link href={`/doctors/${doctorId}`}>
              <button className="flex items-center gap-1.5 text-sm font-medium border border-border bg-background text-foreground rounded-lg px-3 py-1.5 hover:bg-muted transition-colors">
                <ChevronLeft className="h-4 w-4" />
                Back to Doctors
              </button>
            </Link>
            <img src="/logo-light.png" alt="AyurPath" className="h-8 w-auto dark:hidden" />
            <img src="/logo-dark.png" alt="AyurPath" className="h-8 w-auto hidden dark:block" />
          </div>

          {/* ── Progress bar ── */}
          <div className="bg-card border border-border rounded-2xl px-8 py-5 mb-6">
            <ProgressBar current={stepIndex} />
          </div>

          {/* ── Form ── */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>

              {step === "details" && (
                <div className="grid md:grid-cols-2 gap-5">

                  {/* LEFT — Patient Information */}
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <User className="h-5 w-5 text-foreground" />
                      <h2 className="font-bold text-foreground">Patient Information</h2>
                    </div>

                    {/* Patient details */}
                    {user && (
                      <div className="mb-5">
                        <p className="font-semibold text-foreground">{user.fullName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                      </div>
                    )}

                    {/* Dependent checkbox */}
                    <FormField
                      control={form.control}
                      name="isForDependent"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0 mb-5">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-primary data-[state=checked]:bg-primary"
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer text-sm">
                            Booking for a dependent (family member)
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    {/* Dependent fields — single column */}
                    {isForDependent && (
                      <div className="flex flex-col gap-3 mb-5 p-4 bg-background/60 rounded-xl border border-border">
                        <FormField control={form.control} name="dependentName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Dependent Name *</FormLabel>
                            <FormControl><Input placeholder="Full Name" className="text-sm" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="dependentAge" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Age *</FormLabel>
                            <FormControl><Input type="number" placeholder="Age" className="text-sm" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="dependentGender" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Gender *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={Gender.MALE}>Male</SelectItem>
                                <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                                <SelectItem value={Gender.OTHER}>Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="dependentContact" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Contact Number</FormLabel>
                            <FormControl><Input placeholder="07XXXXXXXX" className="text-sm" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    )}

                    {/* Symptoms */}
                    <div className="mb-5">
                      <h3 className="font-bold text-foreground mb-3">Chief Complaint / Symptoms</h3>
                      <FormField
                        control={form.control}
                        name="symptoms"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Please describe your symptoms or reason for visit in detail..."
                                className="min-h-[140px] bg-background/60 border-primary/30 focus:border-primary rounded-xl resize-none text-sm"
                                data-testid="textarea-symptoms"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Terms */}
                    <FormField
                      control={form.control}
                      name="agreeTerms"
                      render={({ field }) => (
                        <FormItem className="flex items-start gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-primary data-[state=checked]:bg-primary mt-0.5"
                              data-testid="checkbox-terms"
                            />
                          </FormControl>
                          <div className="space-y-1">
                            <label className="font-normal cursor-pointer text-sm leading-relaxed text-foreground">
                              I agree to the{" "}
                              <Link href="/terms" className="text-primary underline">Terms of Service</Link>
                              ,{" "}
                              <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>
                              , and{" "}
                              <Link href="/cancellation" className="text-primary underline">Cancellation Policy</Link>
                            </label>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* RIGHT — Booking Summary */}
                  <BookingSummary />
                </div>
              )}

              {step === "payment" && (() => {
                const now = new Date();
                const currentYear = now.getFullYear();
                const months = [
                  { value: "1", label: "01 - January" }, { value: "2", label: "02 - February" },
                  { value: "3", label: "03 - March" }, { value: "4", label: "04 - April" },
                  { value: "5", label: "05 - May" }, { value: "6", label: "06 - June" },
                  { value: "7", label: "07 - July" }, { value: "8", label: "08 - August" },
                  { value: "9", label: "09 - September" }, { value: "10", label: "10 - October" },
                  { value: "11", label: "11 - November" }, { value: "12", label: "12 - December" },
                ];
                const years = Array.from({ length: 12 }, (_, i) => currentYear + i);

                return (
                  <div className="grid md:grid-cols-2 gap-5">
                    {/* LEFT — Payment Details */}
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <CreditCard className="h-5 w-5 text-foreground" />
                        <h2 className="font-bold text-foreground">Payment Details</h2>
                      </div>

                      {/* Card Type */}
                      <div className="mb-4">
                        <label className="text-sm font-medium text-foreground">Card Type*</label>
                        <div className="flex items-center gap-6 mt-2">
                          {/* Visa */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="cardType" value="visa"
                              checked={cardType === "visa"}
                              onChange={() => { setCardType("visa"); setPayErr(e => ({ ...e, cardType: "" })); }}
                              className="accent-primary"
                            />
                            <span className="border border-border rounded px-2 py-0.5 text-xs font-bold text-blue-800 bg-white tracking-widest">VISA</span>
                          </label>
                          {/* Mastercard */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="cardType" value="mastercard"
                              checked={cardType === "mastercard"}
                              onChange={() => { setCardType("mastercard"); setPayErr(e => ({ ...e, cardType: "" })); }}
                              className="accent-primary"
                            />
                            <span className="flex items-center gap-0.5">
                              <span className="w-5 h-5 rounded-full bg-red-500 opacity-90 -mr-2.5 inline-block" />
                              <span className="w-5 h-5 rounded-full bg-amber-400 opacity-90 inline-block" />
                            </span>
                          </label>
                        </div>
                        {payErr.cardType && <p className="text-destructive text-xs mt-1">{payErr.cardType}</p>}
                      </div>

                      {/* Card Number */}
                      <div className="mb-4">
                        <label className="text-sm font-medium text-foreground">Card Number*</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          maxLength={19}
                          onChange={(e) => {
                            setCardNumber(formatCardNumber(e.target.value));
                            setPayErr(er => ({ ...er, cardNumber: "" }));
                          }}
                          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {payErr.cardNumber && <p className="text-destructive text-xs mt-1">{payErr.cardNumber}</p>}
                      </div>

                      {/* Expiration Month + Year */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Expiration Month*</label>
                          <select
                            value={expirationMonth}
                            onChange={(e) => { setExpirationMonth(e.target.value); setPayErr(er => ({ ...er, expirationMonth: "", expirationYear: "" })); }}
                            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Month</option>
                            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                          </select>
                          {payErr.expirationMonth && <p className="text-destructive text-xs mt-1">{payErr.expirationMonth}</p>}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Expiration Year*</label>
                          <select
                            value={expirationYear}
                            onChange={(e) => { setExpirationYear(e.target.value); setPayErr(er => ({ ...er, expirationYear: "" })); }}
                            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Year</option>
                            {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                          </select>
                          {payErr.expirationYear && <p className="text-destructive text-xs mt-1">{payErr.expirationYear}</p>}
                        </div>
                      </div>

                      {/* CVN */}
                      <div className="mb-6">
                        <label className="text-sm font-medium text-foreground">CVN*</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="123"
                          value={cvn}
                          maxLength={3}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                            setCvn(v);
                            setPayErr(er => ({ ...er, cvn: "" }));
                          }}
                          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {payErr.cvn && <p className="text-destructive text-xs mt-1">{payErr.cvn}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          This code is a three digit number printed on the back of credit cards.
                        </p>
                      </div>

                      {/* Buttons inside the card */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setStep("details")}
                          className="flex items-center gap-1.5 border border-border bg-background text-foreground text-sm font-medium px-4 py-2 rounded-xl hover:bg-muted transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Back to Information
                        </button>
                        <button
                          type="submit"
                          disabled={bookingMutation.isPending}
                          data-testid="button-book"
                          className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm py-2 rounded-xl transition-colors disabled:opacity-60"
                        >
                          {bookingMutation.isPending
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                            : <><span>Pay {formatFee(totalAmount)}</span><CreditCard className="h-4 w-4" /></>}
                        </button>
                      </div>
                    </div>

                    {/* RIGHT — Booking Summary */}
                    <BookingSummary />
                  </div>
                );
              })()}

              {/* ── Bottom CTA — only for details step ── */}
              {step === "details" && (
                <div className="mt-5">
                  <button
                    type="submit"
                    disabled={bookingMutation.isPending}
                    data-testid="button-book"
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base py-4 rounded-xl transition-colors disabled:opacity-60"
                  >
                    <span>Continue to Payment</span>
                    <BookOpen className="h-5 w-5" />
                  </button>
                </div>
              )}

            </form>
          </Form>
        </div>
      </div>
    </PublicLayout>
  );
}
