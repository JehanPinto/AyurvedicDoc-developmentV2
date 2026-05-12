import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Star, MessageSquare, Send, AlertCircle,
  Filter, TrendingUp, Users, CheckCircle2
} from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { LoadingPage, LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ReviewWithPatient } from "@shared/schema";

interface ReviewWithResponse extends ReviewWithPatient {
  doctorResponse?: string;
  doctorRespondedAt?: string;
}

export default function DoctorReviews() {
  const { toast } = useToast();
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterResponse, setFilterResponse] = useState<string>("all");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const { data: reviews = [], isLoading, isError } = useQuery<ReviewWithResponse[]>({
    queryKey: ["/api/doctor/reviews"],
    staleTime: 2 * 60 * 1000,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      apiRequest("PATCH", `/api/doctor/reviews/${id}/respond`, { response }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/reviews"] });
      setRespondingTo(null);
      setResponseText("");
      toast({ title: "Response submitted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to submit response", variant: "destructive" });
    },
  });

  const getInitials = (name: string) => {
    if (!name) return "PT";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const renderStars = (rating: number, sizeClass = "h-4 w-4") => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${star <= rating
                ? "fill-amber-500 text-amber-500"
                : "text-slate-200 dark:text-zinc-700"
              }`}
          />
        ))}
      </div>
    );
  };

  // Stats Calculations (Matches Screenshot Logic)
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
  const fiveStarCount = reviews.filter(r => r.rating === 5).length;
  const fiveStarPercent = totalReviews > 0 ? Math.round((fiveStarCount / totalReviews) * 100) : 0;
  const respondedCount = reviews.filter(r => r.doctorResponse).length;
  const responseRate = totalReviews > 0 ? Math.round((respondedCount / totalReviews) * 100) : 0;

  const filteredReviews = reviews.filter(review => {
    if (filterRating !== "all" && review.rating !== parseInt(filterRating)) return false;
    if (filterResponse === "responded" && !review.doctorResponse) return false;
    if (filterResponse === "pending" && review.doctorResponse) return false;
    return true;
  });

  if (isLoading) return <LoadingPage message="Loading patient feedback..." />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground font-medium">Failed to load reviews. Please try again.</p>
        <Button onClick={() => window.location.reload()} className="bg-primary/60 hover:bg-primary/70 rounded-xl">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            Patients Reviews
          </h1>
          <p className="text-muted-foreground">
            Access your private patient feedback.
          </p>
        </div>
      </div>

      {/* 4 Stats Cards (Matches Screenshot) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-sm:grid-cols-1">

        <Card className="border-primary/30 dark:border-primary/50 shadow-sm rounded-[2rem] bg-card dark:bg-zinc-900/50 text-center flex flex-col items-center justify-center p-6 sm:p-8">
          <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Overall Rating</h4>
          <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">{averageRating.toFixed(1)}</span>
          <div className="mt-2 mb-4">{renderStars(Math.round(averageRating), "w-5 h-5")}</div>
          <Badge className="bg-primary text-primary-foreground hover:bg-emerald-100 border-0 shadow-none text-xs px-3 font-bold rounded-full">
            <TrendingUp className="w-3 h-3 mr-1" /> +0.2 this month
          </Badge>
        </Card>

        <Card className="border-primary/30 dark:border-primary/50 shadow-sm rounded-[2rem] bg-card dark:bg-zinc-900/50 text-center flex flex-col items-center justify-center p-6 sm:p-8">
          <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Total Reviews</h4>
          <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">{totalReviews}</span>
          <span className="text-sm font-bold text-slate-400 mt-2 mb-4">
            {totalReviews > 0 ? `Last review ${formatDistanceToNow(new Date(reviews[0].createdAt))} ago` : 'No reviews yet'}
          </span>
          <Badge className="bg-primary text-primary-foreground hover:bg-emerald-100 border-0 shadow-none text-xs px-3 font-bold rounded-full">
            <Users className="w-3 h-3 mr-1" /> Based on all visits
          </Badge>
        </Card>

        <Card className="border-primary/30 dark:border-primary/50 shadow-sm rounded-[2rem] bg-card dark:bg-zinc-900/50 text-center flex flex-col items-center justify-center p-6 sm:p-8">
          <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">5-Star Reviews</h4>
          <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">{fiveStarCount}</span>
          <span className="text-sm font-bold text-slate-400 mt-2 mb-4">{fiveStarPercent}% of all reviews</span>
          <Badge className="bg-primary text-primary-foreground hover:bg-emerald-100 border-0 shadow-none text-xs px-3 font-bold rounded-full">
            <Star className="w-3 h-3 mr-1 fill-emerald-700" /> Top Rated
          </Badge>
        </Card>

        <Card className="border-primary/30 dark:border-primary/50 shadow-sm rounded-[2rem] bg-card dark:bg-zinc-900/50 text-center flex flex-col items-center justify-center p-6 sm:p-8">
          <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Avg. Response</h4>
          <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">{responseRate}%</span>
          <span className="text-sm font-bold text-slate-400 mt-2 mb-4">of eligible patients</span>
          <Badge className="bg-primary text-primary-foreground hover:bg-emerald-100 border-0 shadow-none text-xs px-3 font-bold rounded-full">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Steady
          </Badge>
        </Card>

      </div>

      {/* Recent Patient Feedback Section */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:flex-col lg:flex-row">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Recent patient feedback</h3>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-[130px] rounded-xl border-primary/50 font-bold text-muted-foreground">
                <Star className="h-4 w-4 mr-1 text-secondary" />
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterResponse} onValueChange={setFilterResponse}>
              <SelectTrigger className="w-[140px] rounded-xl border-primary/50 font-bold text-muted-foreground">
                <Filter className="h-4 w-4 mr-1 text-secondary" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Awaiting Reply</SelectItem>
                <SelectItem value="responded">Replied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reviews List (Matches Screenshot Styling) */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-[2rem]">
              <MessageSquare className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold">No feedback matches your current filters.</p>
            </div>
          ) : (
            filteredReviews.map((review, index) => (
              <div
                key={review.id}
                className={`bg-[#f6fbf8] dark:bg-emerald-950/10 p-6 sm:p-8 rounded-[2rem] transition-all relative
                    ${index === 0 && !review.doctorResponse ? 'border-2 border-emerald-500 shadow-sm' : 'border border-emerald-100 dark:border-emerald-800/30'}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-emerald-200 bg-white">
                      <AvatarImage 
                        src={review.patient?.profileImage} 
                        alt={review.patient?.fullName} 
                        className="object-cover" 
                      />
                      
                      <AvatarFallback className="text-primary/70 font-bold bg-primer-foreground/10">
                        {getInitials(review.patient?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">{review.patient?.fullName}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{format(parseISO(review.createdAt), "MMMM dd, yyyy")}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 mb-2">
                  {renderStars(review.rating, "w-4 h-4")}
                </div>

                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4 mb-2">Detailed review</p>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium mb-4">
                  {review.comment || "No detailed comment provided by the patient."}
                </p>

                {/* Reply Section */}
                {review.doctorResponse ? (
                  <div className="mt-6 pl-4 border-l-2 border-primary bg-white/50 dark:bg-zinc-900/30 py-3 pr-4 rounded-r-xl">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-primary dark:text-primary uppercase tracking-wider mb-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Your Response — {format(parseISO(review.doctorRespondedAt!), "MMM dd, yyyy")}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium italic">{review.doctorResponse}</p>
                  </div>
                ) : respondingTo === review.id ? (
                  <div className="mt-6 space-y-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-emerald-100 dark:border-zinc-800 shadow-sm">
                    <Textarea
                      placeholder="Write a professional response to this patient..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={3}
                      className="rounded-xl border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 focus-visible:ring-emerald-500 text-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="rounded-xl font-bold" onClick={() => { setRespondingTo(null); setResponseText(""); }}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary/60 hover:bg-primary/70 rounded-xl font-bold px-6 text-white"
                        onClick={() => respondMutation.mutate({ id: review.id, response: responseText })}
                        disabled={respondMutation.isPending || !responseText.trim()}
                      >
                        {respondMutation.isPending ? <LoadingSpinner size="sm" className="mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Submit Reply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-emerald-100/50 dark:border-zinc-800/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80 hover:bg-primary/10 dark:text-primary/70 font-bold rounded-xl"
                      onClick={() => setRespondingTo(review.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" /> Reply to feedback
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}