import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  Save,
  AlertCircle,
  Check,
  Lock,
  Camera,
  Briefcase,
  Award,
  DollarSign,
  Clock,
  Video,
  Home,
  Building2,
  Plus,
  X,
  Stethoscope
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingPage, LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType, DoctorWithDetails, Specialization } from "@shared/schema";
import { ConsultationType, Language } from "@shared/schema";

// Profile form schema (basic user info)
const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
});

// Doctor profile schema (professional info)
const doctorProfileSchema = z.object({
  biography: z.string().optional(),
  qualifications: z.string().min(10, "Qualifications required"),
  experienceYears: z.number().min(0, "Experience years must be positive"),
  specializationIds: z.array(z.string()).min(1, "At least one specialization required"),
  languagesSpoken: z.array(z.string()).min(1, "At least one language required"),
  consultationTypes: z.array(z.string()).min(1, "At least one consultation type required"),
  consultationFee: z.number().min(0, "Fee must be positive"),
  onlineConsultationFee: z.number().min(0).optional(),
  homeVisitFee: z.number().min(0).optional(),
  isAvailable: z.boolean().default(true),
  maxAdvanceBookingDays: z.number().min(1).max(90).default(30),
  minBookingNoticeHours: z.number().min(1).max(72).default(2),
  slotDurationMinutes: z.number().min(15).max(120).default(30),
  bufferTimeMinutes: z.number().min(0).max(60).default(10),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type DoctorProfileFormData = z.infer<typeof doctorProfileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function DoctorSettings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch doctor profile with details
  const { data: doctorProfile, isLoading: isLoadingProfile } = useQuery<DoctorWithDetails>({
    queryKey: ["/api/doctor/profile"],
    staleTime: 2 * 60 * 1000,
  });

  // Fetch all specializations
  const { data: allSpecializations = [] } = useQuery<Specialization[]>({
    queryKey: ["/api/specializations"],
    staleTime: 10 * 60 * 1000,
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      gender: user?.gender || "",
      dateOfBirth: user?.dateOfBirth || "",
      address: user?.address || "",
      city: user?.city || "",
    },
  });

  const doctorProfileForm = useForm<DoctorProfileFormData>({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: {
      biography: "",
      qualifications: "",
      experienceYears: 0,
      specializationIds: [],
      languagesSpoken: ["english"],
      consultationTypes: ["in_person"],
      consultationFee: 0,
      onlineConsultationFee: 0,
      homeVisitFee: 0,
      isAvailable: true,
      maxAdvanceBookingDays: 30,
      minBookingNoticeHours: 2,
      slotDurationMinutes: 30,
      bufferTimeMinutes: 10,
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form when doctor profile loads
  useEffect(() => {
    if (doctorProfile) {
      doctorProfileForm.reset({
        biography: doctorProfile.biography || "",
        qualifications: doctorProfile.qualifications || "",
        experienceYears: doctorProfile.experienceYears || 0,
        specializationIds: doctorProfile.specializationIds || [],
        languagesSpoken: doctorProfile.languagesSpoken || ["english"],
        consultationTypes: doctorProfile.consultationTypes || ["in_person"],
        consultationFee: doctorProfile.consultationFee || 0,
        onlineConsultationFee: doctorProfile.onlineConsultationFee || 0,
        homeVisitFee: doctorProfile.homeVisitFee || 0,
        isAvailable: doctorProfile.isAvailable ?? true,
        maxAdvanceBookingDays: doctorProfile.maxAdvanceBookingDays || 30,
        minBookingNoticeHours: doctorProfile.minBookingNoticeHours || 2,
        slotDurationMinutes: doctorProfile.slotDurationMinutes || 30,
        bufferTimeMinutes: doctorProfile.bufferTimeMinutes || 10,
      });
    }
  }, [doctorProfile, doctorProfileForm]);

  // Update user profile form when user changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.fullName || "",
        phone: user.phone || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        address: user.address || "",
        city: user.city || "",
      });
    }
  }, [user, profileForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const result = await apiRequest("PUT", "/api/users/profile", data);
      return result as UserType;
    },
    onSuccess: (updatedUser: UserType) => {
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const updateDoctorProfileMutation = useMutation({
    mutationFn: async (data: DoctorProfileFormData) => {
      const result = await apiRequest("PUT", "/api/doctor/profile", data);
      return result as DoctorWithDetails;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/profile"] });
      toast({ title: "Professional profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update professional profile", variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordFormData) =>
      apiRequest("PUT", "/api/users/password", { 
        currentPassword: data.currentPassword, 
        newPassword: data.newPassword 
      }),
    onSuccess: () => {
      passwordForm.reset();
      toast({ title: "Password changed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to change password. Please check your current password.", variant: "destructive" });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: "Invalid file type", 
        description: "Please upload a JPEG, PNG, GIF, or WebP image.",
        variant: "destructive" 
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: "File too large", 
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive" 
      });
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    const token = localStorage.getItem("token");
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch("/api/users/profile-image", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/profile"] });
      toast({ title: "Profile picture updated successfully" });
    } catch (error) {
      toast({ 
        title: "Failed to upload image", 
        description: "Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "DR";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onDoctorProfileSubmit = (data: DoctorProfileFormData) => {
    updateDoctorProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  const formatFee = (fee: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(fee);
  };

  if (!user || isLoadingProfile) {
    return <LoadingPage message="Loading settings..." />;
  }

  const consultationTypeOptions = [
    { value: "in_person", label: "In-Person", icon: Building2 },
    { value: "online", label: "Online Video", icon: Video },
    { value: "home_visit", label: "Home Visit", icon: Home },
  ];

  const languageOptions = [
    { value: "english", label: "English" },
    { value: "sinhala", label: "Sinhala" },
    { value: "tamil", label: "Tamil" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">
          Profile Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your personal and professional information
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="professional">
            <Stethoscope className="h-4 w-4 mr-2" />
            Professional
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Personal Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.profileImage} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploadingImage ? (
                      <LoadingSpinner className="h-6 w-6 text-white" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Dr. {user.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    {doctorProfile?.status === "verified" ? (
                      <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="h-3 w-3" />
                        Verified Doctor
                      </Badge>
                    ) : doctorProfile?.status === "pending" ? (
                      <Badge variant="outline" className="gap-1 text-amber-600">
                        <Clock className="h-3 w-3" />
                        Verification Pending
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click on the avatar to change your profile picture
                  </p>
                </div>
              </div>

              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} className="pl-10" placeholder="+94 77 123 4567" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} type="date" className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Textarea {...field} className="pl-10 min-h-[80px]" placeholder="Your address" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select city" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="colombo">Colombo</SelectItem>
                              <SelectItem value="kandy">Kandy</SelectItem>
                              <SelectItem value="galle">Galle</SelectItem>
                              <SelectItem value="jaffna">Jaffna</SelectItem>
                              <SelectItem value="negombo">Negombo</SelectItem>
                              <SelectItem value="anuradhapura">Anuradhapura</SelectItem>
                              <SelectItem value="matara">Matara</SelectItem>
                              <SelectItem value="kurunegala">Kurunegala</SelectItem>
                              <SelectItem value="batticaloa">Batticaloa</SelectItem>
                              <SelectItem value="trincomalee">Trincomalee</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? (
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Profile Tab */}
        <TabsContent value="professional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>
                Update your professional details, specializations, and consultation settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...doctorProfileForm}>
                <form onSubmit={doctorProfileForm.handleSubmit(onDoctorProfileSubmit)} className="space-y-6">
                  {/* Biography */}
                  <FormField
                    control={doctorProfileForm.control}
                    name="biography"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biography / About Me</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="min-h-[120px]" 
                            placeholder="Tell patients about yourself, your experience, and your approach to treatment..."
                          />
                        </FormControl>
                        <FormDescription>
                          This will be displayed on your public profile
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Qualifications */}
                  <FormField
                    control={doctorProfileForm.control}
                    name="qualifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualifications</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Award className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Textarea 
                              {...field} 
                              className="pl-10 min-h-[80px]" 
                              placeholder="BAMS, MD (Ayurveda), PhD..."
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          List your degrees, certifications, and other qualifications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Experience Years */}
                    <FormField
                      control={doctorProfileForm.control}
                      name="experienceYears"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                type="number" 
                                min="0"
                                className="pl-10"
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Availability Toggle */}
                    <FormField
                      control={doctorProfileForm.control}
                      name="isAvailable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Available for Appointments</FormLabel>
                            <FormDescription>
                              Toggle off when you're unavailable
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Specializations */}
                  <FormField
                    control={doctorProfileForm.control}
                    name="specializationIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specializations</FormLabel>
                        <FormDescription>
                          Select your areas of expertise
                        </FormDescription>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {allSpecializations.map((spec) => {
                            const isSelected = field.value?.includes(spec.id);
                            return (
                              <Badge
                                key={spec.id}
                                variant={isSelected ? "default" : "outline"}
                                className={`cursor-pointer transition-all ${
                                  isSelected 
                                    ? "bg-primary text-primary-foreground" 
                                    : "hover:bg-primary/10"
                                }`}
                                onClick={() => {
                                  if (isSelected) {
                                    field.onChange(field.value.filter((id: string) => id !== spec.id));
                                  } else {
                                    field.onChange([...field.value, spec.id]);
                                  }
                                }}
                              >
                                {isSelected && <Check className="h-3 w-3 mr-1" />}
                                {spec.name}
                              </Badge>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Languages */}
                  <FormField
                    control={doctorProfileForm.control}
                    name="languagesSpoken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Languages Spoken</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {languageOptions.map((lang) => {
                            const isSelected = field.value?.includes(lang.value);
                            return (
                              <Badge
                                key={lang.value}
                                variant={isSelected ? "default" : "outline"}
                                className={`cursor-pointer transition-all ${
                                  isSelected 
                                    ? "bg-primary text-primary-foreground" 
                                    : "hover:bg-primary/10"
                                }`}
                                onClick={() => {
                                  if (isSelected && field.value.length > 1) {
                                    field.onChange(field.value.filter((l: string) => l !== lang.value));
                                  } else if (!isSelected) {
                                    field.onChange([...field.value, lang.value]);
                                  }
                                }}
                              >
                                <Globe className="h-3 w-3 mr-1" />
                                {lang.label}
                              </Badge>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Consultation Types */}
                  <FormField
                    control={doctorProfileForm.control}
                    name="consultationTypes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consultation Types</FormLabel>
                        <FormDescription>
                          Select the types of consultations you offer
                        </FormDescription>
                        <div className="grid sm:grid-cols-3 gap-3 mt-2">
                          {consultationTypeOptions.map((type) => {
                            const isSelected = field.value?.includes(type.value);
                            return (
                              <div
                                key={type.value}
                                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                                  isSelected 
                                    ? "border-primary bg-primary/5" 
                                    : "hover:border-primary/50"
                                }`}
                                onClick={() => {
                                  if (isSelected && field.value.length > 1) {
                                    field.onChange(field.value.filter((t: string) => t !== type.value));
                                  } else if (!isSelected) {
                                    field.onChange([...field.value, type.value]);
                                  }
                                }}
                              >
                                <type.icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                <span className="font-medium">{type.label}</span>
                                {isSelected && <Check className="h-4 w-4 text-primary ml-auto" />}
                              </div>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Consultation Fees */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Consultation Fees (LKR)
                    </h4>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <FormField
                        control={doctorProfileForm.control}
                        name="consultationFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>In-Person Fee</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rs.</span>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0"
                                  className="pl-10"
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={doctorProfileForm.control}
                        name="onlineConsultationFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Online Fee</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rs.</span>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0"
                                  className="pl-10"
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={doctorProfileForm.control}
                        name="homeVisitFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Home Visit Fee</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rs.</span>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0"
                                  className="pl-10"
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Booking Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Booking Settings
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={doctorProfileForm.control}
                        name="slotDurationMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Appointment Duration (minutes)</FormLabel>
                            <Select 
                              onValueChange={(val) => field.onChange(parseInt(val))} 
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="20">20 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="45">45 minutes</SelectItem>
                                <SelectItem value="60">60 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={doctorProfileForm.control}
                        name="bufferTimeMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Buffer Time Between Slots (minutes)</FormLabel>
                            <Select 
                              onValueChange={(val) => field.onChange(parseInt(val))} 
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select buffer" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">No buffer</SelectItem>
                                <SelectItem value="5">5 minutes</SelectItem>
                                <SelectItem value="10">10 minutes</SelectItem>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={doctorProfileForm.control}
                        name="maxAdvanceBookingDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Advance Booking (days)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="1"
                                max="90"
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                              />
                            </FormControl>
                            <FormDescription>
                              How far in advance patients can book
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={doctorProfileForm.control}
                        name="minBookingNoticeHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Notice (hours)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="1"
                                max="72"
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum hours before appointment for booking
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={updateDoctorProfileMutation.isPending}>
                      {updateDoctorProfileMutation.isPending ? (
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Professional Profile
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} type="password" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} type="password" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Password must be at least 8 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} type="password" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? (
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    Change Password
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>
                Additional security settings for your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Email Verification</h4>
                  <p className="text-sm text-muted-foreground">
                    {user.isEmailVerified 
                      ? "Your email is verified" 
                      : "Verify your email to secure your account"}
                  </p>
                </div>
                {user.isEmailVerified ? (
                  <Badge variant="secondary" className="gap-1">
                    <Check className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm">
                    Verify Email
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Phone Verification</h4>
                  <p className="text-sm text-muted-foreground">
                    {user.isPhoneVerified 
                      ? "Your phone is verified" 
                      : "Verify your phone for SMS notifications"}
                  </p>
                </div>
                {user.isPhoneVerified ? (
                  <Badge variant="secondary" className="gap-1">
                    <Check className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm">
                    Verify Phone
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
