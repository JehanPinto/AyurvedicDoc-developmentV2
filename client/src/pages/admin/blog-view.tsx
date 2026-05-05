import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, PlusCircle, XCircle, Pin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BlogSubmission {
  id: string;
  title: string;
  content: string;
  category: string;
  featuredImage?: string;
  status: string;
  submittedByName: string;
  submittedByEmail: string;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Consultation: "bg-orange-500",
  Therapy: "bg-blue-500",
  Lifestyle: "bg-green-600",
};

export default function AdminBlogViewPage() {
  const [, params] = useRoute("/admin/blog-view/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data: submission, isLoading } = useQuery<BlogSubmission>({
    queryKey: [`/api/blog-submissions/${params?.id}`],
    enabled: !!params?.id,
  });

  const approveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/blog-submissions/${params?.id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blogs"] });
      toast({ title: "Approved!", description: "Blog has been published." });
      if (submission?.submittedByEmail) {
        const subject = encodeURIComponent("Your Blog Has Been Approved!");
        const body = encodeURIComponent(`Hi ${submission.submittedByName},\n\nYour blog "${submission.title}" is now live!\n\nAyurvedicDoctor Team`);
        window.open(`mailto:${submission.submittedByEmail}?subject=${subject}&body=${body}`);
      }
      setLocation("/admin/blogs");
    },
    onError: () => toast({ title: "Error", description: "Failed to approve.", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/blog-submissions/${params?.id}/reject`, { rejectionReason: rejectReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-submissions"] });
      toast({ title: "Rejected", description: "Blog has been rejected." });
      if (submission?.submittedByEmail) {
        const subject = encodeURIComponent("Your Blog Submission Has Been Rejected");
        const body = encodeURIComponent(`Hi ${submission.submittedByName},\n\nYour blog "${submission.title}" was rejected.\n\nReason: ${rejectReason}\n\nAyurvedicDoctor Team`);
        window.open(`mailto:${submission.submittedByEmail}?subject=${subject}&body=${body}`);
      }
      setShowRejectDialog(false);
      setLocation("/admin/blogs");
    },
    onError: () => toast({ title: "Error", description: "Failed to reject.", variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  }
  if (!submission) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Not found.</p></div>;
  }

  const catColor = CATEGORY_COLORS[submission.category] || "bg-orange-500";

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Outer light green card */}
        <div className="bg-primary/8 border border-primary/20 rounded-2xl p-6">

          {/* Top row: category pill left, logo right */}
          <div className="flex items-center justify-between mb-4">
            <span className={`${catColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
              {submission.category}
            </span>
            <img
              src="/logo.png"
              alt="AyurPath"
              className="h-9 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold font-heading text-foreground mb-1">{submission.title}</h1>
          <p className="text-xs text-muted-foreground mb-5">by {submission.submittedByName}</p>

          {/* Wide banner image */}
          {submission.featuredImage && (
            <img
              src={submission.featuredImage}
              alt="Featured"
              className="w-full rounded-xl object-cover mb-6"
              style={{ maxHeight: "280px" }}
            />
          )}

          {/* Content in white inner card */}
          <div className="bg-background rounded-xl p-5">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {submission.content}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setLocation("/admin/blogs")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Blogs
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRejectDialog(true)}
                className="flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-red-700 transition-colors"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                <PlusCircle className="h-4 w-4" />
                {approveMutation.isPending ? "Publishing..." : "Add to Blogs"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowRejectDialog(false)}>
          <div className="bg-background rounded-2xl shadow-2xl max-w-lg w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-xl font-bold text-foreground">Discard This Blog?</h2>
                <p className="text-sm text-muted-foreground mt-1">Do you want to permanently discard this blog?</p>
              </div>
              <button onClick={() => setShowRejectDialog(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-foreground mt-4 mb-2">Tell Why you reject this blog to the person who add this blog</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter the reason"
              rows={4}
              className="w-full border border-primary/40 rounded-xl px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!rejectReason.trim()) { toast({ title: "Required", description: "Enter a reason.", variant: "destructive" }); return; }
                  rejectMutation.mutate();
                }}
                disabled={rejectMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-red-700 text-white text-sm font-bold px-4 py-3 rounded-full hover:bg-red-800 transition-colors disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" /> {rejectMutation.isPending ? "Sending..." : "Reject"}
              </button>
              <button
                onClick={() => setShowRejectDialog(false)}
                className="flex-1 flex items-center justify-center gap-2 border border-primary text-primary text-sm font-bold px-4 py-3 rounded-full hover:bg-primary/10 transition-colors"
              >
                <Pin className="h-4 w-4" /> Keep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
