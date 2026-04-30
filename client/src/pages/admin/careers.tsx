import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    AlertCircle,
    Ban,
    CheckCircle,
    Clock,
    PlusCircle,
    ArrowLeft,
    Briefcase,
    ExternalLink,
    FileText,
    Download,
    ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ApplicationCard } from "@/components/ui/application-card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CareerCard } from "@/components/ui/career-card";

interface JobApplication {
    id: string;
    jobId: string;
    jobTitle: string;
    fullName: string;
    email: string;
    cvUrl: string;
    status: string;
    createdAt: string;
}

interface Career {
    id: string;
    careerTitle: string;
    location: string;
    employmentType: string;
    salaryRange?: string;
    description?: string;
    keyResponsibilities?: string;
    requiredQualifications?: string;
    benefits?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// --- Form Validation Schema ---
const careerFormSchema = z.object({
    careerTitle: z.string().min(1, "Career Title is required"),
    location: z.string().min(1, "Location is required"),
    employmentType: z.string().min(1, "Employment Type is required"),
    salaryRange: z.string().optional(),
    description: z.string().min(1, "Career Description is required"),
    keyResponsibilities: z.string().optional(),
    requiredQualifications: z.string().optional(),
    benefits: z.string().optional(),
    isActive: z.boolean().default(true),
});

type CareerFormValues = z.infer<typeof careerFormSchema>;

export default function AdminCareersPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
    const [viewingJob, setViewingJob] = useState<Career | null>(null);
    const [selectedJob, setSelectedJob] = useState<Career | null>(null);

    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        type: "ACCEPTED" | "REJECTED" | null;
        appId: string | null;
    }>({ isOpen: false, type: null, appId: null });
    const [actionMessage, setActionMessage] = useState("");

    const { data: applications = [], isLoading: isLoadingApps } = useQuery<JobApplication[]>({
        queryKey: ["/api/admin/applications"],
    });


    const { data: careers = [], isLoading: isLoadingCareers } = useQuery<Career[]>({
        queryKey: ["/api/admin/careers"],
    });

    const form = useForm<CareerFormValues>({
        resolver: zodResolver(careerFormSchema),
        defaultValues: {
            careerTitle: "",
            location: "",
            employmentType: "",
            salaryRange: "",
            description: "",
            keyResponsibilities: "",
            requiredQualifications: "",
            benefits: "",
            isActive: true,
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, message }: { id: string; status: "ACCEPTED" | "REJECTED", message: string }) => {
            const res = await apiRequest("PATCH", `/api/admin/applications/${id}/status`, { status, message });
            return res;
        },
        onSuccess: (data, variables) => {
            toast({
                title: variables.status === "ACCEPTED" ? "Application Accepted" : "Application Rejected",
                description: `Applicant has been notified via email.`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
            
            // Close all modals related to applications
            setActionModal({ isOpen: false, type: null, appId: null });
            setIsAppModalOpen(false);
            setActionMessage("");
            setTimeout(() => setSelectedApp(null), 300);
        },
        onError: () => {
            toast({ title: "Update Failed", description: "Could not change the application status or send email.", variant: "destructive" });
        }
    });

    const handleActionClick = (id: string, type: "ACCEPTED" | "REJECTED") => {
        setActionModal({ isOpen: true, type, appId: id });
        setActionMessage("");
    };

    const confirmAction = () => {
        if (actionModal.appId && actionModal.type) {
             updateStatusMutation.mutate({ 
                 id: actionModal.appId, 
                 status: actionModal.type,
                 message: actionMessage 
             });
        }
    };

    const createCareerMutation = useMutation({
        mutationFn: async (data: CareerFormValues) => {
            const res = await apiRequest("POST", "/api/admin/careers", {
                careerTitle: data.careerTitle,
                location: data.location,
                employmentType: data.employmentType,
                salaryRange: data.salaryRange,
                description: data.description,
                keyResponsibilities: data.keyResponsibilities,
                requiredQualifications: data.requiredQualifications,
                benefits: data.benefits,
                isActive: data.isActive
            });
            return res;
        },
        onSuccess: () => {
            toast({ title: "Success", description: "New career added successfully!" });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/careers"] });
            handleCloseModal();
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to add new career.", variant: "destructive" });
        }
    });

    const updateCareerMutation = useMutation({
        mutationFn: async (data: { id: string; values: CareerFormValues }) => {
            const res = await apiRequest("PUT", `/api/admin/careers/${data.id}`, {
                careerTitle: data.values.careerTitle,
                location: data.values.location,
                employmentType: data.values.employmentType,
                salaryRange: data.values.salaryRange,
                description: data.values.description,
                keyResponsibilities: data.values.keyResponsibilities,
                requiredQualifications: data.values.requiredQualifications,
                benifits: data.values.benefits, // DB එකේ spelling එක benifits නම් මෙහෙම තියන්න
                isActive: data.values.isActive
            });
            return res;
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Career updated successfully!" });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/careers"] });
            handleCloseModal();
        },
        onError: () => {
            toast({ title: "Update Failed", description: "Failed to update career.", variant: "destructive" });
        }
    });

    const deleteCareerMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("PATCH", `/api/admin/careers/${id}/deactivate`);
        },
        onSuccess: () => {
            toast({ title: "Deactivated", description: "Career has been deactivated successfully." });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/careers"] });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to deactivate career.", variant: "destructive" });
        }
    });

    const onSubmit = (data: CareerFormValues) => {
        if (selectedCareerId) {
            updateCareerMutation.mutate({ id: selectedCareerId, values: data });
        } else {
            createCareerMutation.mutate(data);
        }
    };

    const handleOpenAdd = () => {
        setSelectedCareerId(null);
        form.reset({
            careerTitle: "", location: "", employmentType: "", salaryRange: "",
            description: "", keyResponsibilities: "", requiredQualifications: "", benefits: "", isActive: true
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (career: Career) => {
        setSelectedCareerId(career.id);
        form.reset({
            careerTitle: career.careerTitle,
            location: career.location,
            employmentType: career.employmentType,
            salaryRange: career.salaryRange || "",
            description: career.description || "",
            keyResponsibilities: career.keyResponsibilities || "",
            requiredQualifications: career.requiredQualifications || "",
            benefits: career.benefits || "",
            isActive: career.isActive ?? true,
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => { form.reset(); setSelectedCareerId(null); }, 300);
    };

    const handleViewApp = (app: JobApplication) => {
        setSelectedApp(app);
        setIsAppModalOpen(true);
    };

    // const handleAppStatusUpdate = (id: string, status: "ACCEPTED" | "REJECTED") => {
    //     updateStatusMutation.mutate({ id, status });
    //     setIsAppModalOpen(false);
    //     setTimeout(() => setSelectedApp(null), 300);
    // };

    const pendingApps = applications.filter(app => app.status.toLowerCase() === "pending");
    const isPending = createCareerMutation.isPending || updateCareerMutation.isPending;

    if (isLoadingApps || isLoadingCareers) return <LoadingPage message="Loading careers data..." />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="lg:text-[20px] md:text-[18px] text-[16px] font-heading font-bold">Manage Careers</h3>
                    <Button onClick={handleOpenAdd} className="bg-[#2a9d5c] hover:bg-[#2a9d5c]/90 text-white rounded-[15px] px-6 border-none font-semibold">
                        Add New Career <PlusCircle className="ml-2 w-5 h-5" />
                    </Button>
                </div>

                <div className="border rounded-[15px] p-4 border-primary flex flex-col gap-5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Clock className="text-secondary w-[14px] h-[14px]" />
                            <h4 className="lg:text-[18px] md:text-[16px] text-[14px] font-bold">Pending Career Applications</h4>
                        </div>
                        <Badge className="bg-[#d97706] hover:bg-[#d97706] text-white px-3 py-1 text-xs">
                            {pendingApps.length} pending
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        {pendingApps.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground flex flex-col items-center">
                                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                                <p>No pending applications.</p>
                            </div>
                        ) : (
                            pendingApps.map((app) => (
                                <ApplicationCard
                                    key={app.id}
                                    jobTitle={app.jobTitle}
                                    applicantName={app.fullName}
                                    appliedDate={format(new Date(app.createdAt), "MMM dd, yyyy")}
                                    isLoading={updateStatusMutation.isPending && actionModal.appId === app.id}
                                    onView={() => handleViewApp(app)}
                                    onReject={() => handleActionClick(app.id, "REJECTED")}
                                    onAccept={() => handleActionClick(app.id, "ACCEPTED")}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* --- CURRENT CAREERS GRID --- */}
            <div>
                <h2 className="text-[18px] md:text-xl font-bold text-foreground mb-4">Current Careers</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {careers.map((career) => (
                        <CareerCard
                            key={career.id}
                            careerTitle={career.careerTitle}
                            location={career.location}
                            employmentType={career.employmentType}
                            onEdit={() => handleOpenEdit(career)}
                            onDelete={() => deleteCareerMutation.mutate(career.id)}
                            onView={() => {
                                setViewingJob(career);
                            }}
                        />
                    ))}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={selectedCareerId ? "Edit Career" : "Add New Career"}
                description={selectedCareerId ? "Update the details of the selected career." : "Fill out the form below to post a new job."}
                icon={<Briefcase className="w-5 h-5 text-primary" />}
                className="max-w-3xl"
                footer={
                    <>
                        <Button variant="outline" onClick={handleCloseModal} className="rounded-full px-6 text-primary border-primary hover:bg-primary/10">
                            <ArrowLeft className="mr-2 w-4 h-4" /> Cancel
                        </Button>
                        <Button type="submit" form="career-form" disabled={isPending} className="bg-[#2a9d5c] hover:bg-[#2a9d5c]/90 text-white rounded-full px-6 shadow-sm">
                            {isPending ? "Saving..." : (selectedCareerId ? "Update Career" : "Add Career")}
                            <PlusCircle className="ml-2 w-4 h-4" />
                        </Button>
                    </>
                }
            >
                <Form {...form}>
                    <form id="career-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField control={form.control} name="careerTitle" render={({ field }) => (
                                <FormItem><FormLabel className="font-semibold text-sm">Career Title*</FormLabel><FormControl><Input placeholder="Enter Title ( e.g., ‘Senior Ayurvedic Physician’)" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="location" render={({ field }) => (
                                <FormItem><FormLabel className="font-semibold text-sm">Location*</FormLabel><FormControl><Input placeholder="Enter Location ( e.g., ‘Hospital Premises or Remote’)" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="employmentType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-sm">Employment Type*</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-11 rounded-xl shadow-sm"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Full-time">Full-time</SelectItem>
                                            <SelectItem value="Part-time">Part-time</SelectItem>
                                            <SelectItem value="Contract">Contract</SelectItem>
                                            <SelectItem value="Internship">Internship</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="salaryRange" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-sm">Salary Range</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter Salary Range ( e.g., ‘LKR 30,000-50,000’)" className="h-11 rounded-xl shadow-sm" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="space-y-4 pt-2">
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-sm">Description*</FormLabel>
                                    <FormControl>
                                        <Textarea className="min-h-[100px] rounded-xl shadow-sm resize-none" {...field} placeholder="Describe the role..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="keyResponsibilities" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-sm">Key Responsibilities</FormLabel>
                                    <FormControl>
                                        <Textarea className="min-h-[80px] rounded-xl shadow-sm resize-none" {...field} placeholder="List the required Key Responsibilities..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="requiredQualifications" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-sm">Required Qualifications</FormLabel>
                                    <FormControl>
                                        <Textarea className="min-h-[80px] rounded-xl shadow-sm resize-none" {...field} placeholder="List the required qualifications..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="benefits" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-sm">Benefits</FormLabel>
                                    <FormControl>
                                        <Textarea className="min-h-[80px] rounded-xl shadow-sm resize-none" {...field} placeholder="List the benefits..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </form>
                </Form>
            </Modal>

            <Modal
                isOpen={isAppModalOpen}
                onClose={() => setIsAppModalOpen(false)}
                title={selectedApp?.jobTitle || "Job Application"}
                description={`Applied on: ${selectedApp ? format(new Date(selectedApp.createdAt), "PPP") : ""}`}
                icon={<FileText className="w-5 h-5 text-primary" />}
                className="max-w-4xl"
                footer={
                    <div className="flex w-full justify-between items-center">
                        <Button variant="outline" onClick={() => setIsAppModalOpen(false)} className="rounded-full px-5 text-primary border-primary hover:bg-primary/10 bg-transparent">
                            <ArrowLeft className="mr-2 w-4 h-4" /> Back to Career
                        </Button>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => handleActionClick(selectedApp!.id, "REJECTED")}
                                disabled={updateStatusMutation.isPending}
                                className="rounded-full px-6 text-destructive border-destructive hover:bg-destructive hover:text-white bg-transparent"
                            >
                                Reject <Ban className="ml-2 w-4 h-4" />
                            </Button>
                            <Button
                                onClick={() => handleActionClick(selectedApp!.id, "ACCEPTED")}
                                disabled={updateStatusMutation.isPending}
                                className="rounded-full px-6 bg-[#2a9d5c] hover:bg-[#2a9d5c]/90 text-white shadow-sm"
                            >
                                Accept <CheckCircle className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                }
            >
                {selectedApp && (
                    <div className="flex flex-col gap-6 px-1 pb-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {/* Applicant Details */}
                        <div className="flex flex-col gap-2 text-[15px]">
                            <p><span className="font-bold text-foreground">Full Name :</span> {selectedApp.fullName}</p>
                            <p><span className="font-bold text-foreground">Email Address :</span> {selectedApp.email}</p>
                        </div>

                        {/* CV Preview Area */}
                        <div className="flex flex-col gap-3">
                            <span className="font-bold text-foreground text-[15px]">CV/ Resume Uploaded:</span>

                            <div className="relative w-full h-[600px] rounded-2xl overflow-hidden bg-white shadow-sm group">
                                {/* Preview Logic */}
                                {(() => {
                                    const url = selectedApp.cvUrl.toLowerCase();
                                    const isPdf = url.includes('.pdf');
                                    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/) != null;

                                    if (isPdf) {
                                        return (
                                            <iframe
                                                src={`${selectedApp.cvUrl}#toolbar=0`}
                                                className="w-full h-full border-0"
                                                title="CV Preview"
                                                onError={(e) => console.error("Error loading iframe", e)}
                                            />
                                        );
                                    } else if (isImage) {
                                        return (
                                            <div className="w-full h-full flex items-center justify-center p-4 bg-muted/10">
                                                <img
                                                    src={selectedApp.cvUrl}
                                                    alt="CV Preview"
                                                    className="max-w-full max-h-full object-contain rounded-md"
                                                />
                                            </div>
                                        );
                                    } else {
                                        // Fallback for .doc, .docx, and other types, or if PDF fails due to CORS/Auth
                                        return (
                                            <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground bg-gray-50 p-6 text-center">
                                                <FileText className="w-16 h-16 mb-4 text-[#2a9d5c]/50" />
                                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Document Preview</h3>
                                                <p className="text-sm mb-6 max-w-md">
                                                    This document type may not preview directly in the browser, or access is restricted. Please use the buttons below to open or download the file.
                                                </p>
                                            </div>
                                        );
                                    }
                                })()}

                                {/* Action Buttons Overlay */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-90 hover:opacity-100 transition-opacity z-10">
                                    {/* Download Button */}
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        title="Download File"
                                        className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full shadow-sm border border-gray-200 h-10 w-10"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            // Cloudinary download trick: change /upload/ to /upload/fl_attachment/
                                            let downloadUrl = selectedApp.cvUrl;
                                            if (downloadUrl.includes('/upload/')) {
                                                downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
                                            }
                                            // Create an invisible link to trigger download
                                            const a = document.createElement('a');
                                            a.href = downloadUrl;
                                            a.download = 'Applicant_CV'; // Fallback name
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                        }}
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>

                                    {/* Open in New Tab Button */}
                                    <Button
                                        size="icon"
                                        title="Open in New Tab"
                                        className="bg-[#2a9d5c]/90 hover:bg-[#2a9d5c] text-white rounded-full shadow-sm h-10 w-10"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.open(selectedApp.cvUrl, "_blank", "noopener,noreferrer");
                                        }}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={!!viewingJob}
                onClose={() => setViewingJob(null)}
                title={viewingJob?.careerTitle || "Career Details"}
                description={`${viewingJob?.location} • ${viewingJob?.employmentType} ${viewingJob?.salaryRange ? `• ${viewingJob.salaryRange}` : ''}`}
                icon={<Briefcase className="w-5 h-5 text-[#30A66F]" />}
                className="max-w-3xl"
                footer={
                    <div className="flex w-full justify-between items-center">
                        <Button variant="outline" onClick={() => setViewingJob(null)} className="rounded-full px-6">
                            Close
                        </Button>
                    </div>
                }
            >
                {viewingJob && (
                    <div className="flex flex-col gap-6 text-foreground text-[15px] sm:text-base px-2 pb-4 max-h-[60vh] overflow-y-auto custom-scrollbar">

                        {/* Description */}
                        {viewingJob.description && (
                            <div>
                                <h4 className="font-bold text-[17px] mb-2 text-[#2a9d5c]">Job Description</h4>
                                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed ms-3 md:ms-5">
                                    {viewingJob.description}
                                </p>
                            </div>
                        )}

                        {/* Key Responsibilities */}
                        {viewingJob.keyResponsibilities && (
                            <div>
                                <h4 className="font-bold text-[17px] mb-2 text-[#2a9d5c]">Key Responsibilities</h4>
                                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed ms-3 md:ms-5">
                                    {viewingJob.keyResponsibilities}
                                </p>
                            </div>
                        )}

                        {/* Qualifications */}
                        {viewingJob.requiredQualifications && (
                            <div>
                                <h4 className="font-bold text-[17px] mb-2 text-[#2a9d5c]">Required Qualifications</h4>
                                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed ms-3 md:ms-5">
                                    {viewingJob.requiredQualifications}
                                </p>
                            </div>
                        )}

                        {/* Benefits */}
                        {viewingJob.benefits && (
                            <div>
                                <h4 className="font-bold text-[17px] mb-2 text-[#2a9d5c]">Benefits</h4>
                                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed ms-3 md:ms-5">
                                    {viewingJob.benefits}
                                </p>
                            </div>
                        )}

                    </div>
                )}
            </Modal>

            <Modal
                isOpen={actionModal.isOpen}
                onClose={() => setActionModal({ isOpen: false, type: null, appId: null })}
                title={actionModal.type === "ACCEPTED" ? "Accept This Application?" : "Reject This Application?"}
                description={actionModal.type === "ACCEPTED" ? "Do you want to accept this application?" : "Do you want to permanently reject this application?"}
                className="max-w-2xl"
                icon={actionModal.type === "ACCEPTED" ? <CheckCircle className="w-5 h-5 text-[#2a9d5c]" /> : <Ban className="w-5 h-5 text-[#d32f2f]" />}
                footer={
                    <div className="flex w-full justify-center gap-4 mt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => setActionModal({ isOpen: false, type: null, appId: null })} 
                            className="rounded-full px-6 text-[#2a9d5c] border-[#2a9d5c] hover:bg-[#2a9d5c]/10"
                        >
                            <ArrowLeft className="mr-2 w-4 h-4" /> Back to Application
                        </Button>
                        <Button 
                            onClick={confirmAction}
                            disabled={updateStatusMutation.isPending || (actionModal.type === "REJECTED" && actionMessage.trim() === "")}
                            className={`rounded-full px-8 text-white ${
                                actionModal.type === "ACCEPTED" 
                                    ? "bg-[#2a9d5c] hover:bg-[#2a9d5c]/90" 
                                    : "bg-[#d32f2f] hover:bg-[#b71c1c]"
                            }`}
                        >
                            {updateStatusMutation.isPending ? "Processing..." : (actionModal.type === "ACCEPTED" ? "Accept" : "Reject")}
                            {actionModal.type === "REJECTED" && <Ban className="ml-2 w-4 h-4" />}
                            {actionModal.type === "ACCEPTED" && <CheckCircle className="ml-2 w-4 h-4" />}
                        </Button>
                    </div>
                }
            >
                <div className="flex flex-col gap-2 p-2">
                    <label className="text-sm font-medium text-gray-700">
                        {actionModal.type === "ACCEPTED" 
                            ? "Give a brief explanation of the next steps:" 
                            : "Tell why you reject this application to the person who applied:"}
                        {actionModal.type === "REJECTED" && <span className="text-red-500">*</span>}
                    </label>
                    <Textarea 
                        placeholder={actionModal.type === "ACCEPTED" ? "Enter the explanation..." : "Enter the reason..."}
                        value={actionMessage}
                        onChange={(e) => setActionMessage(e.target.value)}
                        className="min-h-[250px] rounded-xl border-gray-300 focus-visible:ring-[#2a9d5c]"
                    />
                </div>
            </Modal>
        </div>
    );
}