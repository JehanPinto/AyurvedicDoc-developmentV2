import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Eye, CheckCircle, XCircle, Clock, BookOpen, ArrowUpRight, Trash2, Pin, PlusCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BlogSubmission {
  id: string;
  title: string;
  content: string;
  category: string;
  featuredImage?: string;
  status: "pending" | "approved" | "rejected";
  submittedByName: string;
  submittedByEmail: string;
  createdAt: string;
}

interface Blog {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
}

const categoryIcon = (category: string) =>
  category === "Therapy" ? "/therapy-icon.png" : "/consultation-icon.png";

const formatDateTime = (d: string) => {
  const date = new Date(d);
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
};

export default function AdminBlogsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [discardTarget, setDiscardTarget] = useState<{
    id: string; type: "submission" | "blog"; email?: string; name?: string; title?: string;
  } | null>(null);
  const [discardReason, setDiscardReason] = useState("");

  const { data: submissions = [], isLoading: subLoading } = useQuery<BlogSubmission[]>({
    queryKey: ["/api/blog-submissions"],
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: blogs = [], isLoading: blogLoading } = useQuery<Blog[]>({
    queryKey: ["/api/blogs"],
    staleTime: 0,
    refetchOnMount: true,
  });

  const pendingSubmissions = submissions.filter((s) => s.status === "pending");

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/blog-submissions/${id}/approve`),
    onSuccess: (_, id) => {
      const sub = submissions.find((s) => s.id === id);
      queryClient.invalidateQueries({ queryKey: ["/api/blog-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blogs"] });
      toast({ title: "Approved!", description: "Blog has been published." });
      if (sub?.submittedByEmail) {
        const subject = encodeURIComponent("Your Blog Has Been Approved!");
        const body = encodeURIComponent(`Hi ${sub.submittedByName},\n\nYour blog post "${sub.title}" has been approved and is now live!\n\nThank you!\n\nAyurvedicDoctor Team`);
        window.open(`mailto:${sub.submittedByEmail}?subject=${subject}&body=${body}`);
      }
    },
    onError: () => toast({ title: "Error", description: "Failed to approve blog.", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      apiRequest("POST", `/api/blog-submissions/${id}/reject`, { rejectionReason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-submissions"] });
      toast({ title: "Rejected", description: "Blog submission rejected." });
      if (discardTarget?.email) {
        const subject = encodeURIComponent("Your Blog Submission Has Been Rejected");
        const body = encodeURIComponent(`Hi ${discardTarget.name},\n\nYour blog "${discardTarget.title}" was rejected.\n\nReason: ${variables.rejectionReason}\n\nAyurvedicDoctor Team`);
        window.open(`mailto:${discardTarget.email}?subject=${subject}&body=${body}`);
      }
      setDiscardTarget(null);
      setDiscardReason("");
    },
    onError: () => toast({ title: "Error", description: "Failed to reject.", variant: "destructive" }),
  });

  const deleteBlogMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/blogs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blogs"] });
      toast({ title: "Deleted", description: "Blog removed." });
      setDiscardTarget(null);
      setDiscardReason("");
    },
    onError: () => toast({ title: "Error", description: "Failed to delete.", variant: "destructive" }),
  });

  const openDiscard = (target: typeof discardTarget) => {
    setDiscardTarget(target);
    setDiscardReason("");
  };

  const confirmDiscard = () => {
    if (!discardReason.trim()) {
      toast({ title: "Required", description: "Please enter a reason.", variant: "destructive" });
      return;
    }
    if (!discardTarget) return;
    if (discardTarget.type === "submission") {
      rejectMutation.mutate({ id: discardTarget.id, rejectionReason: discardReason });
    } else {
      deleteBlogMutation.mutate(discardTarget.id);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold font-heading text-foreground">Manage Blogs</h1>

      {/* Pending Submissions — green bordered card */}
      <div className="border border-primary/30 bg-primary/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Pending Blog Acceptations
          </h2>
          {pendingSubmissions.length > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {pendingSubmissions.length} pending
            </span>
          )}
        </div>

        {subLoading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
        ) : pendingSubmissions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No pending submissions</p>
        ) : (
          <div className="space-y-3">
            {pendingSubmissions.map((sub) => (
              <div key={sub.id} className="bg-background border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <img src={categoryIcon(sub.category)} alt={sub.category} className="w-5 h-5 object-contain" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{sub.title}</p>
                  <p className="text-xs text-muted-foreground mb-0.5">{sub.category}</p>
                  <p className="text-xs text-muted-foreground truncate">{sub.content.slice(0, 90)}...</p>
                </div>

                {/* Right: date + buttons */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">Submitted: {formatDateTime(sub.createdAt)}</p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setLocation(`/admin/blog-view/${sub.id}`)}
                      className="flex items-center gap-1 text-xs text-primary border border-primary px-2.5 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <Eye className="h-3 w-3" /> View
                    </button>
                    <button
                      onClick={() => openDiscard({ id: sub.id, type: "submission", email: sub.submittedByEmail, name: sub.submittedByName, title: sub.title })}
                      className="flex items-center gap-1 text-xs text-red-600 border border-red-400 px-2.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <XCircle className="h-3 w-3" /> Reject
                    </button>
                    <button
                      onClick={() => approveMutation.mutate(sub.id)}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-1 text-xs text-white bg-primary px-2.5 py-1 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
                    >
                      <CheckCircle className="h-3 w-3" /> Accept
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Blogs */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Current Blogs
        </h2>

        {blogLoading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
        ) : blogs.length === 0 ? (
          <div className="bg-muted/40 rounded-xl px-5 py-8 text-center text-sm text-muted-foreground">No published blogs yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogs.map((blog) => (
              <div key={blog.id} className="bg-primary/10 border border-primary/40 rounded-2xl p-5 flex flex-col min-h-[200px]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <img src={categoryIcon(blog.category)} alt={blog.category} className="w-4 h-4 object-contain" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{blog.category}</span>
                </div>
                <p className="text-sm font-bold text-foreground mb-1 line-clamp-2">{blog.title}</p>
                <p className="text-xs text-muted-foreground flex-1 line-clamp-3">{blog.description}</p>

                <div className="flex items-center justify-end gap-2 mt-4">
                  <button
                    onClick={() => setLocation(`/blog/${blog.id}`)}
                    title="View blog"
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openDiscard({ id: blog.id, type: "blog", title: blog.title })}
                    title="Delete blog"
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add New Blog */}
      <div className="flex justify-end">
        <button
          onClick={() => setLocation("/blog/new")}
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-primary/90 transition-colors"
        >
          Add New Blog <PlusCircle className="h-4 w-4" />
        </button>
      </div>

      {/* Discard Dialog */}
      {discardTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDiscardTarget(null)}>
          <div className="bg-background rounded-2xl shadow-2xl max-w-lg w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-xl font-bold text-foreground">Discard This Blog?</h2>
                <p className="text-sm text-muted-foreground mt-1">Do you want to permanently discard this blog?</p>
              </div>
              <button onClick={() => setDiscardTarget(null)} className="text-muted-foreground hover:text-foreground p-1">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-foreground mt-4 mb-2">
              {discardTarget.type === "submission"
                ? "Tell Why you reject this blog to the person who add this blog"
                : "Reason for removing this blog"}
            </p>
            <textarea
              value={discardReason}
              onChange={(e) => setDiscardReason(e.target.value)}
              placeholder="Enter the reason"
              rows={4}
              className="w-full border border-primary/40 rounded-xl px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={confirmDiscard}
                disabled={rejectMutation.isPending || deleteBlogMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-red-700 text-white text-sm font-bold px-4 py-3 rounded-full hover:bg-red-800 transition-colors disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                {rejectMutation.isPending || deleteBlogMutation.isPending ? "Processing..." : "Reject"}
              </button>
              <button
                onClick={() => setDiscardTarget(null)}
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
