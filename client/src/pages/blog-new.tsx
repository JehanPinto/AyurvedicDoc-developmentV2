import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CloudUpload, FileText, Lock, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
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

  // Email popup state (only for non-logged-in users)
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [popupName, setPopupName] = useState("");
  const [popupEmail, setPopupEmail] = useState("");

  const submitMutation = useMutation({
    mutationFn: async (submitterInfo: { name: string; email: string }) => {
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
        } else {
          throw new Error("Image upload failed. Please try a smaller image (max 10MB).");
        }
      }
      const res = await fetch("/api/blog-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          content,
          featuredImage,
          submittedByName: submitterInfo.name,
          submittedByEmail: submitterInfo.email,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Submitted!", description: "Your blog has been submitted for admin review." });
      setShowEmailPopup(false);
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

    if (user) {
      // Logged in — use their account info directly
      submitMutation.mutate({ name: user.fullName, email: user.email });
    } else {
      // Not logged in — show email popup
      setShowEmailPopup(true);
    }
  };

  const handlePopupSubmit = () => {
    if (!popupName.trim()) { toast({ title: "Required", description: "Please enter your name.", variant: "destructive" }); return; }
    if (!popupEmail.trim() || !popupEmail.includes("@")) { toast({ title: "Required", description: "Please enter a valid email.", variant: "destructive" }); return; }
    submitMutation.mutate({ name: popupName, email: popupEmail });
  };

  return (
    <PublicLayout showFooter={false}>
      <div className="min-h-screen bg-muted/30 py-8 px-4">
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-6">
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

      {/* Email popup — only shown for non-logged-in users */}
      {showEmailPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEmailPopup(false)}>
          <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">One last step</h2>
                <p className="text-sm text-muted-foreground mt-1">We need your contact details so we can notify you when your blog is approved.</p>
              </div>
              <button onClick={() => setShowEmailPopup(false)} className="text-muted-foreground hover:text-foreground ml-4">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Your Name<span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={popupName}
                  autoComplete="off"
                  onChange={(e) => setPopupName(e.target.value)}
                  className="w-full border border-primary/40 rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Your Email<span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={popupEmail}
                  autoComplete="email"
                  onChange={(e) => setPopupEmail(e.target.value)}
                  className="w-full border border-primary/40 rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEmailPopup(false)}
                className="flex-1 border border-primary text-primary text-sm font-medium px-4 py-2.5 rounded-full hover:bg-primary/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePopupSubmit}
                disabled={submitMutation.isPending}
                className="flex-1 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Blog"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
