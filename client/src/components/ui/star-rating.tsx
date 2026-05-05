import { useState } from "react";
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
  const [hoverRating, setHoverRating] = useState(0);
  const [savedRating, setSavedRating] = useState(rating);

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
    if (!interactive) return;
    setSavedRating(value);
    onRatingChange?.(value);
  };

  const displayRating = interactive ? (hoverRating || savedRating) : rating;

  const renderStar = (index: number) => {
    const value = index + 1;
    const fillValue = displayRating - index;
    const isFull = fillValue >= 1;
    const isHalf = !interactive && fillValue >= 0.5 && fillValue < 1;
    const isGolden = interactive ? value <= displayRating : isFull;

    return (
      <button
        key={index}
        type="button"
        disabled={!interactive}
        onClick={() => handleClick(value)}
        onMouseEnter={() => interactive && setHoverRating(value)}
        onMouseLeave={() => interactive && setHoverRating(0)}
        className={cn(
          "relative transition-all duration-150",
          interactive && "cursor-pointer hover:scale-110"
        )}
      >
        <Star
          className={cn(
            sizeClasses[size],
            "transition-colors duration-150",
            isGolden
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted-foreground/30"
          )}
        />
        {isHalf && (
          <StarHalf
            className={cn(
              sizeClasses[size],
              "absolute top-0 left-0 fill-yellow-400 text-yellow-400"
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
          {(interactive ? savedRating : rating).toFixed(1)}
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
