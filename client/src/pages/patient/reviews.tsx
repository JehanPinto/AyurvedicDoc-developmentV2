import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Star,
  MessageSquare,
  AlertCircle,
  Calendar,
  Edit2,
  Trash2,
  Plus,
  User,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ReviewWithDoctor } from "@shared/schema";

interface ReviewWithResponse extends ReviewWithDoctor {
  doctorResponse?: string;
  doctorRespondedAt?: string;
}

export default function PatientReviews() {
  const { toast } = useToast();
  const [filterRating, setFilterRating] = useState<string>("all");
  const [editingReview, setEditingReview] = useState<ReviewWithResponse | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  const { data: reviews = [], isLoading, isError } = useQuery<ReviewWithResponse[]>({
    queryKey: ["/api/patient/reviews"],
    staleTime: 2 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, rating, comment }: { id: string; rating: number; comment: string }) =>
      apiRequest("PATCH", `/api/reviews/${id}`, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient/reviews"] });
      setEditingReview(null);
      toast({ title: "Review updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update review", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient/reviews"] });
      toast({ title: "Review deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete review", variant: "destructive" });
    },
  });

  const getInitials = (name: string) => {
    if (!name) return "DR";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star}
            className={`h-5 w-5 ${
              star <= rating 
                ? "fill-amber-400 text-amber-400" 
                : "text-muted-foreground"
            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onClick={() => interactive && onSelect && onSelect(star)}
          />
        ))}
      </div>
    );
  };

  const renderSmallStars = (rating: number) => {
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
    return true;
  });

  const withResponseCount = reviews.filter(r => r.doctorResponse).length;

  const handleEditClick = (review: ReviewWithResponse) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
  };

  const handleUpdateReview = () => {
    if (!editingReview) return;
    updateMutation.mutate({
      id: editingReview.id,
      rating: editRating,
      comment: editComment,
    });
  };

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
            My Reviews
          </h1>
          <p className="text-muted-foreground">
            Manage reviews you've written for doctors
          </p>
        </div>
        {withResponseCount > 0 && (
          <Badge variant="secondary" className="gap-1" data-testid="badge-response-count">
            <MessageSquare className="h-3 w-3" />
            {withResponseCount} with doctor response
          </Badge>
        )}
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              After completing an appointment, you can leave a review for your doctor to help other patients.
            </p>
            <Link href="/patient/appointments">
              <Button data-testid="button-view-appointments">
                View My Appointments
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Your Rating Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-5xl font-bold text-amber-500" data-testid="text-avg-rating">
                  {averageRating.toFixed(1)}
                </p>
                <div className="flex justify-center mt-2">
                  {renderSmallStars(Math.round(averageRating))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Average across {reviews.length} reviews
                </p>
              </div>
              
              <div className="space-y-2">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center gap-2" data-testid={`rating-dist-${rating}`}>
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
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>All Reviews</CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger className="w-[150px]" data-testid="select-rating-filter">
                      <SelectValue placeholder="Filter by rating" />
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredReviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No reviews match your filter criteria
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <Card key={review.id} data-testid={`review-card-${review.id}`}>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                              <AvatarImage src={review.doctor.user.profileImage} />
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {getInitials(review.doctor.user.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium" data-testid={`text-doctor-name-${review.id}`}>
                                Dr. {review.doctor.user.fullName}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {review.doctor.specializations?.[0]?.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {renderSmallStars(review.rating)}
                                <span className="text-sm text-muted-foreground">
                                  {format(parseISO(review.createdAt), "MMM d, yyyy")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEditClick(review)}
                                  data-testid={`button-edit-${review.id}`}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>Edit Review</DialogTitle>
                                  <DialogDescription>
                                    Update your review for Dr. {review.doctor.user.fullName}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Rating</Label>
                                    <div className="flex justify-center py-2">
                                      {renderStars(editRating, true, setEditRating)}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="comment">Comment</Label>
                                    <Textarea
                                      id="comment"
                                      value={editComment}
                                      onChange={(e) => setEditComment(e.target.value)}
                                      placeholder="Share your experience..."
                                      rows={4}
                                      data-testid="textarea-edit-comment"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={handleUpdateReview}
                                    disabled={updateMutation.isPending}
                                    data-testid="button-save-edit"
                                  >
                                    {updateMutation.isPending && (
                                      <LoadingSpinner className="mr-2 h-4 w-4" />
                                    )}
                                    Save Changes
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  data-testid={`button-delete-${review.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Review</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this review? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(review.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    data-testid={`button-confirm-delete-${review.id}`}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        <p className="text-sm" data-testid={`text-review-comment-${review.id}`}>
                          {review.comment}
                        </p>

                        {review.doctorResponse && (
                          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <ThumbsUp className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Doctor's Response</span>
                              {review.doctorRespondedAt && (
                                <span className="text-xs text-muted-foreground">
                                  {format(parseISO(review.doctorRespondedAt), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground" data-testid={`text-doctor-response-${review.id}`}>
                              {review.doctorResponse}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
