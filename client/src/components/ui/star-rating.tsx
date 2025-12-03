import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  reviewCount,
  interactive = false,
  onRatingChange,
  className,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const renderStar = (index: number) => {
    const fillValue = rating - index;
    const isFull = fillValue >= 1;
    const isHalf = fillValue >= 0.5 && fillValue < 1;

    return (
      <button
        key={index}
        type="button"
        disabled={!interactive}
        onClick={() => handleClick(index + 1)}
        className={cn(
          "relative",
          interactive && "cursor-pointer hover:scale-110 transition-transform"
        )}
      >
        <Star
          className={cn(
            sizeClasses[size],
            isFull
              ? "fill-secondary text-secondary"
              : "fill-muted text-muted-foreground/30"
          )}
        />
        {isHalf && (
          <StarHalf
            className={cn(
              sizeClasses[size],
              "absolute top-0 left-0 fill-secondary text-secondary"
            )}
          />
        )}
      </button>
    );
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => renderStar(i))}
      </div>
      {showValue && (
        <span className={cn("font-medium", textSizeClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={cn("text-muted-foreground", textSizeClasses[size])}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
