import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Stethoscope, 
  Upload, 
  X, 
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  User,
  GraduationCap,
  FileText,
  Building2
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Language, ConsultationType, Gender } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Specialization } from "@shared/schema";

const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  gender: z.enum([Gender.MALE, Gender.FEMALE]).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const professionalInfoSchema = z.object({
  registrationNumber: z.string().min(5, "Registration number is required"),
  qualifications: z.string().min(10, "Please provide your qualifications"),
  biography: z.string().optional(),
  specializationIds: z.array(z.string()).min(1, "Select at least one specialization"),
  languagesSpoken: z.array(z.string()).min(1, "Select at least one language"),
  consultationTypes: z.array(z.string()).min(1, "Select at least one consultation type"),
  consultationFee: z.string().min(1, "Consultation fee is required"),
  onlineConsultationFee: z.string().optional(),
  homeVisitFee: z.string().optional(),
});

const bankInfoSchema = z.object({
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankBranch: z.string().optional(),
  agreeTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

type PersonalInfo = z.infer<typeof personalInfoSchema>;
type ProfessionalInfo = z.infer<typeof professionalInfoSchema>;
type BankInfo = z.infer<typeof bankInfoSchema>;

const STEPS = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Professional", icon: GraduationCap },
  { id: 3, title: "Documents", icon: FileText },
  { id: 4, title: "Bank Details", icon: Building2 },
];

export default function DoctorRegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [professionalInfo, setProfessionalInfo] = useState<ProfessionalInfo | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  
  const { data: specializations = [] } = useQuery<Specialization[]>({
    queryKey: ["/api/specializations"],
  });

  const personalForm = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      address: "",
      city: "",
    },
  });

  const professionalForm = useForm<ProfessionalInfo>({
    resolver: zodResolver(professionalInfoSchema),
    defaultValues: {
      registrationNumber: "",
      qualifications: "",
      biography: "",
      specializationIds: [],
      languagesSpoken: [Language.ENGLISH],
      consultationTypes: [ConsultationType.IN_PERSON],
      consultationFee: "",
      onlineConsultationFee: "",
      homeVisitFee: "",
    },
  });

  const bankForm = useForm<BankInfo>({
    resolver: zodResolver(bankInfoSchema),
    defaultValues: {
      bankName: "",
      bankAccountNumber: "",
      bankBranch: "",
      agreeTerms: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/auth/register-doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(registrationToken ? { "X-Registration-Token": registrationToken } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }
      return response.json();
    },
    onSuccess: (data: { user: any; token: string }) => {
      toast({
        title: "Registration Submitted!",
        description: "Your application is pending verification. We'll notify you once approved.",
      });
      setLocation("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please check your details and try again",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    if (!registrationToken || !personalInfo?.email) {
      toast({
        title: "Session expired",
        description: "Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "X-Registration-Token": registrationToken,
            "X-Registration-Email": personalInfo.email,
          },
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }
        
        const result = await response.json();
        setUploadedFiles(prev => [...prev, result.url]);
      }
      
      toast({
        title: "Files uploaded",
        description: "Your documents have been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: "Failed to upload documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePersonalSubmit = async (data: PersonalInfo) => {
    try {
      const response = await fetch("/api/registration/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Registration Error",
          description: error.error || "Failed to start registration",
          variant: "destructive",
        });
        return;
      }
      
      const result = await response.json();
      setRegistrationToken(result.token);
      setPersonalInfo(data);
      setCurrentStep(2);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start registration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfessionalSubmit = (data: ProfessionalInfo) => {
    setProfessionalInfo(data);
    setCurrentStep(3);
  };

  const handleDocumentsNext = () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Documents required",
        description: "Please upload at least one verification document.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(4);
  };

  const handleFinalSubmit = (bankData: BankInfo) => {
    if (!personalInfo || !professionalInfo) return;

    const registrationData = {
      ...personalInfo,
      registrationNumber: professionalInfo.registrationNumber,
      qualifications: professionalInfo.qualifications,
      biography: professionalInfo.biography,
      specializationIds: professionalInfo.specializationIds,
      languagesSpoken: professionalInfo.languagesSpoken,
      consultationTypes: professionalInfo.consultationTypes,
      consultationFee: parseInt(professionalInfo.consultationFee) || 0,
      onlineConsultationFee: professionalInfo.onlineConsultationFee ? parseInt(professionalInfo.onlineConsultationFee) : undefined,
      homeVisitFee: professionalInfo.homeVisitFee ? parseInt(professionalInfo.homeVisitFee) : undefined,
      verificationDocuments: uploadedFiles,
      bankName: bankData.bankName,
      bankAccountNumber: bankData.bankAccountNumber,
      bankBranch: bankData.bankBranch,
    };

    registerMutation.mutate(registrationData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">A</span>
              </div>
              <span className="font-heading font-bold text-2xl">AyurvedicDoctor</span>
            </div>
          </Link>
        </div>

        <div className="flex justify-between items-center mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex flex-col items-center ${index > 0 ? "ml-4" : ""}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= step.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${
                  currentStep >= step.id ? "text-primary font-medium" : "text-muted-foreground"
                }`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-8 sm:w-16 h-0.5 ml-4 ${
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Doctor Registration - Step {currentStep} of 4
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Enter your personal information"}
              {currentStep === 2 && "Enter your professional credentials"}
              {currentStep === 3 && "Upload verification documents"}
              {currentStep === 4 && "Bank details for payouts (optional)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <Form {...personalForm}>
                <form onSubmit={personalForm.handleSubmit(handlePersonalSubmit)} className="space-y-4">
                  <FormField
                    control={personalForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. John Doe" data-testid="input-fullname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={personalForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="doctor@example.com" data-testid="input-email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={personalForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="+94 77 123 4567" data-testid="input-phone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={personalForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Create password"
                                data-testid="input-password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={personalForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm password"
                                data-testid="input-confirm-password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={personalForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Your address" data-testid="input-address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Colombo" data-testid="input-city" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={Gender.MALE}>Male</SelectItem>
                            <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-4">
                    <Link href="/register">
                      <Button variant="ghost" type="button">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                    </Link>
                    <Button type="submit" data-testid="button-next-step1">
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {currentStep === 2 && (
              <Form {...professionalForm}>
                <form onSubmit={professionalForm.handleSubmit(handleProfessionalSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={professionalForm.control}
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SLAMC Registration Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="AY/12345" data-testid="input-registration" {...field} />
                          </FormControl>
                          <FormDescription>Your Ayurvedic Medical Council registration</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={professionalForm.control}
                    name="qualifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualifications *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="BAMS, MD (Ayurveda), PhD..."
                            data-testid="input-qualifications"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>List your educational degrees and certifications</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={professionalForm.control}
                    name="biography"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Biography</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of your practice and expertise..."
                            data-testid="input-biography"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={professionalForm.control}
                    name="specializationIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specializations *</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {specializations.map((spec) => (
                            <div key={spec.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={spec.id}
                                checked={field.value.includes(spec.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, spec.id]);
                                  } else {
                                    field.onChange(field.value.filter(id => id !== spec.id));
                                  }
                                }}
                                data-testid={`checkbox-spec-${spec.id}`}
                              />
                              <label htmlFor={spec.id} className="text-sm cursor-pointer">
                                {spec.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={professionalForm.control}
                    name="languagesSpoken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Languages *</FormLabel>
                        <div className="flex gap-4">
                          {[
                            { value: Language.ENGLISH, label: "English" },
                            { value: Language.SINHALA, label: "Sinhala" },
                            { value: Language.TAMIL, label: "Tamil" },
                          ].map((lang) => (
                            <div key={lang.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={lang.value}
                                checked={field.value.includes(lang.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, lang.value]);
                                  } else {
                                    field.onChange(field.value.filter(l => l !== lang.value));
                                  }
                                }}
                              />
                              <label htmlFor={lang.value} className="text-sm cursor-pointer">
                                {lang.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={professionalForm.control}
                    name="consultationTypes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consultation Types *</FormLabel>
                        <div className="flex gap-4">
                          {[
                            { value: ConsultationType.IN_PERSON, label: "In-Person" },
                            { value: ConsultationType.ONLINE, label: "Online" },
                            { value: ConsultationType.HOME_VISIT, label: "Home Visit" },
                          ].map((type) => (
                            <div key={type.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={type.value}
                                checked={field.value.includes(type.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, type.value]);
                                  } else {
                                    field.onChange(field.value.filter(t => t !== type.value));
                                  }
                                }}
                              />
                              <label htmlFor={type.value} className="text-sm cursor-pointer">
                                {type.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={professionalForm.control}
                      name="consultationFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>In-Person Fee (LKR) *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="2000" data-testid="input-fee" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={professionalForm.control}
                      name="onlineConsultationFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Online Fee (LKR)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="1500" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={professionalForm.control}
                      name="homeVisitFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Home Visit Fee (LKR)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="5000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" type="button" onClick={() => setCurrentStep(1)}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" data-testid="button-next-step2">
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Upload Verification Documents</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your medical council registration certificate, degree certificates, and any other relevant documents.
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    data-testid="input-file-upload"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById("file-upload")?.click()}
                    disabled={isUploading}
                    data-testid="button-upload-files"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Select Files
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported formats: PDF, JPG, PNG (max 5MB each)
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Uploaded Documents</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm truncate max-w-[200px]">
                            Document {index + 1}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          data-testid={`button-remove-file-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setCurrentStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleDocumentsNext} data-testid="button-next-step3">
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <Form {...bankForm}>
                <form onSubmit={bankForm.handleSubmit(handleFinalSubmit)} className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Bank details are optional but required for receiving payments from online consultations.
                  </p>

                  <FormField
                    control={bankForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Bank of Ceylon" data-testid="input-bank-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={bankForm.control}
                      name="bankAccountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890" data-testid="input-account-number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bankForm.control}
                      name="bankBranch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch</FormLabel>
                          <FormControl>
                            <Input placeholder="Colombo Main" data-testid="input-bank-branch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={bankForm.control}
                    name="agreeTerms"
                    render={({ field }) => (
                      <FormItem className="flex items-start gap-2 space-y-0 pt-4">
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
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="text-primary underline">
                              Privacy Policy
                            </Link>
                            . I confirm that all information provided is accurate and my credentials are valid.
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" type="button" onClick={() => setCurrentStep(3)}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={registerMutation.isPending}
                      data-testid="button-submit-registration"
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Submit Application
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login">
                <Button variant="link" className="px-0 h-auto">
                  Sign in
                </Button>
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
