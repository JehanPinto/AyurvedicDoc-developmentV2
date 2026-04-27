import { useState } from "react";
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
  TrendingUp
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

// --- DUMMY DATA ---
const jobsData = [
  {
    id: "1",
    title: "Doctor",
    subtitle: "Senior Ayurvedic Physician",
    department: "Clinical / Wellness",
    location: "Hospital Premises",
    type: "Full-time",
  },
  {
    id: "2",
    title: "Medical Officer",
    subtitle: "Resident Medical Officer",
    department: "In-patient Department (IPD)",
    location: "Hospital Premises",
    type: "Full-time",
  },
  {
    id: "3",
    title: "Specialist",
    subtitle: "Senior Panchakarma Specialist",
    department: "Therapy & Rehabilitation",
    location: "Hospital Premises",
    type: "Full-time",
  },
  {
    id: "4",
    title: "Nurse",
    subtitle: "Senior Ayurvedic Physician",
    department: "Clinical / Wellness",
    location: "Hospital Premises",
    type: "Full-time",
  },
  {
    id: "5",
    title: "Medicine Pharmacist",
    subtitle: "Resident Medical Officer",
    department: "In-patient Department (IPD)",
    location: "Hospital Premises",
    type: "Full-time",
  },
  {
    id: "6",
    title: "Specialist",
    subtitle: "Senior Panchakarma Specialist",
    department: "Therapy & Rehabilitation",
    location: "Hospital Premises",
    type: "Full-time",
  },
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

  const form = useForm<ApplyInput>({
    resolver: zodResolver(applySchema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = (data: ApplyInput) => {
    console.log("Application Submitted:", data);
    alert("Application Submitted Successfully!");
    setSelectedJob(null);
    form.reset();
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        
        {/* =========================================
            SCREEN 3: EMPTY STATE (No Vacancies)
            ========================================= */}
        {jobs.length === 0 && !selectedJob && (
          <div className="max-w-4xl mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
            <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
                <Globe2 className="w-40 h-40 text-primary/10 absolute" strokeWidth={1} />
                <TrendingUp className="w-48 h-48 text-primary absolute -top-4" strokeWidth={2} />
                <Telescope className="w-24 h-24 text-foreground z-10 relative left-[-30px] bottom-[-20px]" />
                <div className="absolute top-4 right-8 bg-amber-500 w-8 h-8 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">★</span>
                </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              No Open Positions Right Now.
            </h1>
            <p className="text-lg text-muted-foreground">
              We're not hiring at the moment, but we're always looking for talent.
            </p>
          </div>
        )}

        {/* =========================================
            SCREEN 2: APPLY FORM
            ========================================= */}
        {selectedJob && (
          <div className="max-w-3xl mx-auto px-4 py-16">
            <div className="bg-card border border-primary/20 shadow-sm rounded-[24px] p-8 md:p-12">
              <div className="text-center mb-10">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Applications for {selectedJob.title}
                </h1>
                <p className="text-muted-foreground">Complete your details and submit your Cv</p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-semibold">Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Full Name" className="h-12 bg-background focus-visible:ring-primary" {...field} />
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
                        <FormLabel className="text-foreground font-semibold">Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" className="h-12 bg-background focus-visible:ring-primary" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <FormLabel className="text-foreground font-semibold">CV/ Resume Upload</FormLabel>
                    <div className="border-2 border-dashed border-border rounded-xl p-10 text-center bg-background cursor-pointer hover:border-primary transition-colors">
                      <h3 className="text-xl font-bold text-foreground mb-2">Drag & Drop your CV<br/>or Click to Upload</h3>
                      <p className="text-sm text-muted-foreground mb-4">Supported Files: PDF, DOCX (Max 10MB)</p>
                      <UploadCloud className="w-8 h-8 text-muted-foreground mx-auto" />
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6">
                    <button 
                      type="button" 
                      onClick={() => { setSelectedJob(null); form.reset(); }}
                      className="text-primary font-semibold hover:underline"
                    >
                      Clear
                    </button>
                    <Button type="submit" className="h-12 px-8 font-semibold rounded-lg flex items-center gap-2">
                      Submit Application
                      <CheckSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        )}

        {/* =========================================
            SCREEN 1: JOB LISTINGS & VALUES
            ========================================= */}
        {jobs.length > 0 && !selectedJob && (
          <>
            {/* Hero & Jobs Section */}
            <div className="max-w-7xl mx-auto px-4 pt-4">
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-1">Join Our Team</h1>
                <p className="text-lg text-muted-foreground">
                  Ready to take the next step in your career? Join a team that values innovation, collaboration, and growth. Explore our open positions and find where you fit best in our mission to shape the future.
                </p>
                <h2 className="text-xl font-bold text-foreground mt-7">Open Roles</h2>
              </div>

              {/* Grid: 1 col on mobile, 2 on tab, 3 on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {jobs.map((job) => (
                  <JobCard 
                    key={job.id} 
                    {...job} 
                    onApply={() => setSelectedJob(job)} 
                  />
                ))}
              </div>
            </div>

            {/* Our Values Section */}
            <div className="bg-[#E1ECE3] mt-14 pt-14 pb-14 dark:bg-card">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-0">Our Values</h2>
                      <p className="text-muted-foreground">The principles that guide everything we do</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            </div>
          </>
        )}

      </div>
    </PublicLayout>
  );
}