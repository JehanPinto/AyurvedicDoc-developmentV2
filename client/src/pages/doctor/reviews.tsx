import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Star,
  MessageSquare,
  Send,
  AlertCircle,
  User,
  Calendar,
  ThumbsUp,
  Filter
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { LoadingPage, LoadingSpinner } from "@/components/ui/loading-spinner";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      toast({ title: "Response submitted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to submit response", variant: "destructive" });
    },
  });

  const getInitials = (name: string) => {
    if (!name) return "PT";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? "fill-amber-400 text-amber-400" 
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 
      : 0,
  }));

  const filteredReviews = reviews.filter(review => {
    if (filterRating !== "all" && review.rating !== parseInt(filterRating)) {
      return false;
    }
    if (filterResponse === "responded" && !review.doctorResponse) {
      return false;
    }
    if (filterResponse === "pending" && review.doctorResponse) {
      return false;
    }
    return true;
  });

  const unrepliedCount = reviews.filter(r => !r.doctorResponse).length;

  if (isLoading) {
    return <LoadingPage message="Loading reviews..." />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Failed to load reviews. Please try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold" data-testid="text-page-title">
            Patient Reviews
          </h1>
          <p className="text-muted-foreground">
            View and respond to patient feedback
          </p>
        </div>
        {unrepliedCount > 0 && (
          <Badge variant="secondary" className="gap-1">
            <MessageSquare className="h-3 w-3" />
            {unrepliedCount} awaiting response
          </Badge>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Rating Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-5xl font-bold text-amber-500">
                {averageRating.toFixed(1)}
              </p>
              <div className="flex justify-center mt-2">
                {renderStars(Math.round(averageRating))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Based on {reviews.length} reviews
              </p>
            </div>
            
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-3">{rating}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <Progress value={percentage} className="h-2 flex-1" />
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>All Reviews</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-[120px]" data-testid="filter-rating">
                  <Star className="h-4 w-4 mr-1" />
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterResponse} onValueChange={setFilterResponse}>
                <SelectTrigger className="w-[140px]" data-testid="filter-response">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue placeholder="Response" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Awaiting Reply</SelectItem>
                  <SelectItem value="responded">Replied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredReviews.length > 0 ? (
              <div className="divide-y">
                {filteredReviews.map((review) => (
                  <div 
                    key={review.id}
                    className="p-4 space-y-3"
                    data-testid={`review-${review.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.patient?.profileImage} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(review.patient?.fullName || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-semibold">{review.patient?.fullName}</p>
                          <div className="flex items-center gap-2">
                            {renderStars(review.rating)}
                            <span className="text-sm text-muted-foreground">
                              {format(parseISO(review.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm mt-2">{review.comment}</p>
                        )}
                      </div>
                    </div>

                    {review.doctorResponse ? (
                      <div className="ml-13 pl-4 border-l-2 border-primary/20">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <ThumbsUp className="h-3 w-3" />
                          Your response - {format(parseISO(review.doctorRespondedAt!), "MMM d, yyyy")}
                        </div>
                        <p className="text-sm">{review.doctorResponse}</p>
                      </div>
                    ) : respondingTo === review.id ? (
                      <div className="ml-13 space-y-2">
                        <Textarea
                          placeholder="Write your response..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          rows={3}
                          data-testid="input-response"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRespondingTo(null);
                              setResponseText("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => respondMutation.mutate({ 
                              id: review.id, 
                              response: responseText 
                            })}
                            disabled={respondMutation.isPending || !responseText.trim()}
                            data-testid="button-submit-response"
                          >
                            {respondMutation.isPending ? (
                              <LoadingSpinner size="sm" className="mr-2" />
                            ) : (
                              <Send className="h-4 w-4 mr-1" />
                            )}
                            Send
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="ml-13">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRespondingTo(review.id)}
                          data-testid={`button-respond-${review.id}`}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Respond
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {filterRating !== "all" || filterResponse !== "all"
                    ? "No reviews match your filters"
                    : "No reviews yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
