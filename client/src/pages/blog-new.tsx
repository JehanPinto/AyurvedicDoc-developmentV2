import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CloudUpload, FileText, Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { PublicLayout } from "@/components/layout/public-layout";

const CATEGORIES = ["Consultation", "Therapy", "Lifestyle"];

export default function BlogNewPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      let featuredImage: string | undefined;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const token = localStorage.getItem("token");
        const uploadRes = await fetch("/api/blog-image-upload", {
          method: "POST",
          body: formData,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          featuredImage = data.url;
        }
      }
      return apiRequest("POST", "/api/blog-submissions", { title, category, content, featuredImage });
    },
    onSuccess: () => {
      toast({ title: "Submitted!", description: "Your blog has been submitted for admin review." });
      setLocation("/blog");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit blog. Please try again.", variant: "destructive" });
    },
  });

  const handleFile = (file: File) => {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast({ title: "Invalid file", description: "Only JPG and PNG files are supported.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 10MB.", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = () => {
    if (!title.trim()) { toast({ title: "Required", description: "Please enter a blog title.", variant: "destructive" }); return; }
    if (!category) { toast({ title: "Required", description: "Please select a category.", variant: "destructive" }); return; }
    if (!content.trim()) { toast({ title: "Required", description: "Please enter content.", variant: "destructive" }); return; }
    submitMutation.mutate();
  };

  return (
    <PublicLayout showFooter={false}>
      <div className="min-h-screen bg-muted/30 py-8 px-4">
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-heading text-foreground">Create a New Blog Post</h1>
        </div>

        {/* Main card */}
        <div className="max-w-2xl mx-auto bg-primary/5 border border-primary/20 rounded-2xl p-6">
          <div className="bg-background rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-foreground mb-6">Add your blog post details for blog</p>

            {/* Title */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Blog Post Title<span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Title ( e.g., 'The Ayurvedic Consultation Process')"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-primary/40 rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Category */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Post Category<span className="text-destructive">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-primary/40 rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select type</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Content */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Content<span className="text-destructive">*</span>
              </label>
              <textarea
                placeholder="Enter content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full border border-primary/40 rounded-lg px-3 py-2.5 text-sm bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            {/* Featured Image */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Blog featured image</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/10" : "border-primary/40 bg-primary/5"}`}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="max-h-40 object-contain rounded-lg mb-2" />
                ) : (
                  <>
                    <p className="text-sm font-semibold text-foreground text-center">Drag & Drop your blog featured image<br />or Click to Upload</p>
                    <p className="text-xs text-muted-foreground mt-2 mb-4">Supported Files: JPG, PNG (Max 10MB)</p>
                    <CloudUpload className="h-8 w-8 text-muted-foreground" />
                  </>
                )}
                {imageFile && <p className="text-xs text-primary mt-2">{imageFile.name}</p>}
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setLocation("/blog")}
              className="flex items-center gap-2 border border-primary text-primary text-sm font-medium px-4 py-2 rounded-full hover:bg-primary/5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
              <FileText className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="max-w-2xl mx-auto mt-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3">
          <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <span className="font-semibold">Admin Review:</span> Once submitted, your blog will be reviewed by our admin team. You'll be notified by email within 2–3 business days.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
