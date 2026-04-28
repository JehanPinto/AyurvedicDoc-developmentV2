import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  HeartPulse, 
  Leaf, 
  ShieldCheck, 
  Globe2, 
  UploadCloud, 
  CheckSquare,
  Telescope,
  TrendingUp,
  X,
  FileText,
  Loader2,
  Stethoscope,
  Activity,
  Syringe,
  Pill
} from "lucide-react";

import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { JobCard } from "@/components/ui/job-card";
import { ValueCard } from "@/components/ui/value-card";
import { useToast } from "@/hooks/use-toast";
import careerImage from "@/assets/image/career image.png";

// --- DUMMY DATA ---
const jobsData = [
  // {
  //   id: "1",
  //   title: "Doctor",
  //   subtitle: "Senior Ayurvedic Physician",
  //   department: "Clinical / Wellness",
  //   location: "Hospital Premises",
  //   type: "Full-time",
  //   icon: Stethoscope, 
  // },
  // {
  //   id: "2",
  //   title: "Medical Officer",
  //   subtitle: "Resident Medical Officer",
  //   department: "In-patient Department (IPD)",
  //   location: "Hospital Premises",
  //   type: "Full-time",
  //   icon: Activity,
  // },
  // {
  //   id: "3",
  //   title: "Specialist",
  //   subtitle: "Senior Panchakarma Specialist",
  //   department: "Therapy & Rehabilitation",
  //   location: "Hospital Premises",
  //   type: "Full-time",
  //   icon: Leaf,
  // },
  // {
  //   id: "4",
  //   title: "Nurse",
  //   subtitle: "Senior Nurse",
  //   department: "Clinical / Wellness",
  //   location: "Hospital Premises",
  //   type: "Full-time",
  //   icon: Syringe,
  // },
  // {
  //   id: "5",
  //   title: "Medicine Pharmacist",
  //   subtitle: "Resident Pharmacist",
  //   department: "In-patient Department (IPD)",
  //   location: "Hospital Premises",
  //   type: "Full-time",
  //   icon: Pill,
  // },
  // {
  //   id: "6",
  //   title: "Specialist",
  //   subtitle: "Senior Panchakarma Specialist",
  //   department: "Therapy & Rehabilitation",
  //   location: "Hospital Premises",
  //   type: "Full-time",
  //   icon: Leaf,
  // },
];

const valuesData = [
  {
    icon: HeartPulse,
    title: "Patient-Centered Care",
    description: "We prioritize the well-being of every patient, ensuring personalized treatment plans that address individual health needs."
  },
  {
    icon: Leaf,
    title: "Holistic Approach",
    description: "We preserve and promote the ancient knowledge of Ayurveda, passed down through generations of Sri Lankan healers."
  },
  {
    icon: ShieldCheck,
    title: "Verified Professionals", 
    description: "All doctors on our platform are verified professionals with proper certifications and credentials."
  },
  {
    icon: Globe2,
    title: "Preventive Focus",
    description: "Making quality Ayurvedic healthcare accessible to everyone, anywhere in Sri Lanka through online consultations."
  }
];

const applySchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
});

type ApplyInput = z.infer<typeof applySchema>;

export default function CareersPage() {
  const [jobs] = useState(jobsData); 
  const [selectedJob, setSelectedJob] = useState<typeof jobsData[0] | null>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<ApplyInput>({
    resolver: zodResolver(applySchema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = async (data: ApplyInput) => {
    if (!uploadedFile) {
      toast({ title: "CV Required", description: "Please upload your CV before submitting.", variant: "destructive" });
      return;
    }
    if (!selectedJob) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("jobId", selectedJob.id);
      formData.append("jobTitle", selectedJob.title);
      formData.append("fullName", data.name);
      formData.append("email", data.email);
      formData.append("cv", uploadedFile);

      const response = await fetch("/api/careers/apply", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Submission failed");

      toast({ 
        title: "Application Submitted! 🎉", 
        description: "We have received your application. Our talent team will contact you soon." 
      });

      setSelectedJob(null);
      removeFile();
      form.reset();
    } catch (error) {
      toast({ 
        title: "Submission Failed", 
        description: "Something went wrong while submitting your application. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle File Selection & Create Preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle File Selection & Create Preview
  const removeFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUploadedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Cleanup preview URL on unmount or when a new file is selected
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

        <div className="container mx-auto px-3 pt-4 relative">
          
          {/* =========================================
              SCREEN 3: EMPTY STATE (No Vacancies)
              ========================================= */}
          {jobs.length === 0 && !selectedJob && (
            <div className="max-w-4xl mx-auto mt-8 mb-20 flex flex-col items-center justify-center text-center">
              <img 
                src={careerImage} 
                alt="No jobs available" 
                className="mb-8 object-contain dark:block dark:brightness-0 dark:invert-[0.9] dark:sepia dark:saturate-[500%] dark:hue-rotate-[110deg] dark:drop-shadow-[0_0_2px_rgba(48,166,111,0.5)] light:block"              />
              <h1 className="lg:text-[56px] md:text-[48px] sm:text-[40px] text-[32px] font-bold text-foreground mb-8 tracking-tight">
                No Open Positions Right Now.
              </h1>
              <p className="lg:text-[20px] md:text-[18px] sm:text-[16px] text-[14px] text-black dark:text-muted-foreground">
                We're not hiring at the moment, but we're always looking for talent.
              </p>
            </div>
          )}

          {/* =========================================
              SCREEN 2: APPLY FORM
              ========================================= */}
          {selectedJob && (
            <div className="max-w-3xl mx-auto md:px-4 md:py-16 mb-3">
              <div className="bg-primary/10 shadow-sm rounded-[24px] p-3 lg:p-8 md:p-12">
                <div className="text-center mb-10">
                  <h1 className="lg:text-[32px] md:text-[28px] sm:text-[24px] text-[20px] text-foreground mb-2 font-semibold">
                    Applications for {selectedJob.title}
                  </h1>
                  <p className="text-muted-foreground lg:text-[18px] md:text-[16px] sm:text-[14px] text-[12px]">
                    Complete your details and submit your Cv
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground lg:text-[18px] md:text-[16px] sm:text-[14px] text-[12px]">
                            Full Name *
                          </FormLabel>
                          <FormControl>
                            <Input disabled={isSubmitting} placeholder="Your Full Name" className="h-12 bg-background focus-visible:ring-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground lg:text-[18px] md:text-[16px] sm:text-[14px] text-[12px]">
                            Email Address *
                          </FormLabel>
                          <FormControl>
                            <Input disabled={isSubmitting} type="email" placeholder="your@email.com" className="h-12 bg-background focus-visible:ring-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <FormLabel className="text-foreground lg:text-[18px] md:text-[16px] sm:text-[14px] text-[12px]">
                        CV/ Resume Upload *
                      </FormLabel>

                      {!uploadedFile ? (
                        // UPLOAD BOX
                        <div 
                          className="border-2 border-dashed border-border rounded-xl p-10 text-center bg-background cursor-pointer hover:border-primary transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <h3 className="text-xl font-bold text-foreground mb-2">Drag & Drop your CV<br/>or Click to Upload</h3>
                          <p className="text-sm text-muted-foreground mb-4">Supported Files: PDF, DOCX, JPG, PNG (Max 10MB)</p>
                          <UploadCloud className="w-8 h-8 text-muted-foreground mx-auto" />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                            ref={fileInputRef}
                            disabled={isSubmitting}
                            onChange={handleFileChange}
                          />
                        </div>
                      ) : (
                        // PREVIEW BOX (Name + Image/PDF Preview)
                        <div className="border border-border rounded-xl p-4 bg-background">
                          {/* Header with Name, Size and Remove Button */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-foreground font-semibold text-sm truncate">
                                  {uploadedFile.name}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={removeFile}
                              className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors shrink-0"
                              title="Remove file"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Visual Preview */}
                          <div className="w-full h-[200px] bg-muted/30 rounded-lg overflow-hidden border border-border/50 flex items-center justify-center relative">
                            {uploadedFile.type.includes('pdf') ? (
                              <iframe 
                                src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                                className="w-full h-full object-cover pointer-events-none" 
                                title="CV Preview" 
                              />
                            ) : uploadedFile.type.includes('image') ? (
                              <img 
                                src={previewUrl!} 
                                alt="CV Preview" 
                                className="w-full h-full object-contain" 
                              />
                            ) : (
                              <div className="flex flex-col items-center text-muted-foreground">
                                <FileText className="w-10 h-10 mb-2 opacity-30" />
                                <span className="text-xs">Visual preview not available for DOCX</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-6">
                      <button 
                        type="button" 
                        onClick={() => { setSelectedJob(null); form.reset(); }}
                        className="text-primary font-semibold hover:underline"
                      >
                        Clear
                      </button>
                      <Button disabled={isSubmitting} type="submit" className="h-12 md:px-8 font-semibold rounded-lg flex items-center gap-2">
                        {isSubmitting ? (
                          <>Submitting... <Loader2 className="w-4 h-4 animate-spin" /></>
                        ) : (
                          <>Submit Application <CheckSquare className="w-4 h-4" /></>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          )}

          {/* =========================================
              SCREEN 1: JOB LISTINGS (Grid)
              ========================================= */}
          {jobs.length > 0 && !selectedJob && (
            <>
              {/* Hero & Jobs Section */}
              <div className="max-w-7xl mx-auto pt-4">
                <div className="text-center max-w-3xl mx-auto">
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-1">Join Our Team</h1>
                  <p className="text-lg text-[#111815] dark:text-muted-foreground">
                    Ready to take the next step in your career? Join a team that values innovation, collaboration, and growth. Explore our open positions and find where you fit best in our mission to shape the future.
                  </p>
                  <h2 className="text-xl font-bold text-foreground mt-7">Open Roles</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {jobs.map((job) => (
                    <JobCard 
                      key={job.id} 
                      {...job} 
                      icon={job.icon}
                      onApply={() => setSelectedJob(job)} 
                    />
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </section>

      {/* =========================================
          OUR VALUES SECTION
          ========================================= */}
      {jobs.length > 0 && !selectedJob && (
        <section className="bg-[#E1ECE3] mt-14 pt-14 pb-14 dark:bg-card">
          <div className="container mx-auto px-4">
            
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-0">Our Values</h2>
              <p className="text-[#111815] dark:text-muted-foreground">The principles that guide everything we do</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {valuesData.map((value, index) => (
                <ValueCard 
                  key={index}
                  icon={value.icon}
                  title={value.title}
                  description={value.description}
                />
              ))}
            </div>

          </div>
        </section>
      )}

    </PublicLayout>
  );
}