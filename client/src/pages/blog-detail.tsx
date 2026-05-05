import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

interface BlogDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  content?: string;
  featuredImage?: string;
  submittedByName?: string;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Consultation: "bg-orange-500",
  Therapy: "bg-blue-500",
  Lifestyle: "bg-green-600",
};

export default function BlogDetailPage() {
  const [, params] = useRoute("/blog/:id");
  const [, setLocation] = useLocation();

  const { data: blog, isLoading } = useQuery<BlogDetail>({
    queryKey: [`/api/blogs/${params?.id}`],
    enabled: !!params?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Blog not found.</p>
      </div>
    );
  }

  const catColor = CATEGORY_COLORS[blog.category] || "bg-orange-500";
  const bodyText = blog.content || blog.description;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Outer light green card */}
        <div className="bg-primary/8 border border-primary/20 rounded-2xl p-6">

          {/* Top row: category pill left, logo right */}
          <div className="flex items-center justify-between mb-4">
            <span className={`${catColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
              {blog.category}
            </span>
            <img
              src="/logo.png"
              alt="AyurPath"
              className="h-9 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold font-heading text-foreground mb-1">{blog.title}</h1>
          {blog.submittedByName && (
            <p className="text-xs text-muted-foreground mb-5">by {blog.submittedByName}</p>
          )}

          {/* Wide banner image */}
          {blog.featuredImage && (
            <img
              src={blog.featuredImage}
              alt="Featured"
              className="w-full rounded-xl object-cover mb-6"
              style={{ maxHeight: "280px" }}
            />
          )}

          {/* Content in white inner card */}
          <div className="bg-background rounded-xl p-5">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {bodyText}
            </p>
          </div>

          {/* Back button */}
          <div className="mt-6">
            <button
              onClick={() => setLocation("/blog")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
