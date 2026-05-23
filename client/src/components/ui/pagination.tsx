// src/components/ui/pagination.tsx
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null; // පිටු 1යි නම් pagination පෙන්වන්න අවශ්‍ය නැත.

  // පිටු ගණන ගොඩක් වැඩි නම් Dots (...) පෙන්වීමේ ලොජික් එක
  const getPageNumbers = () => {
    const pages: (number | "dots")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "dots", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "dots", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "dots", currentPage - 1, currentPage, currentPage + 1, "dots", totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className={cn("flex items-center justify-center gap-1 md:gap-2 mt-8", className)}>
      
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex items-center justify-center h-10 px-3 md:px-4 rounded-full border border-border bg-card text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50 disabled:pointer-events-none group shadow-sm"
      >
        <ChevronLeft className="w-4 h-4 md:mr-1.5 transition-transform group-hover:-translate-x-1" />
        <span className="hidden sm:inline font-bold text-sm">Prev</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1 md:gap-1.5 mx-1 md:mx-4">
        {pages.map((page, index) => {
          if (page === "dots") {
            return (
              <span key={`dots-${index}`} className="flex items-center justify-center w-8 h-10 text-muted-foreground">
                <MoreHorizontal className="w-4 h-4" />
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "flex items-center justify-center h-10 min-w-[40px] px-2 rounded-full text-sm font-bold transition-all duration-300",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-105"
                  : "bg-transparent text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center h-10 px-3 md:px-4 rounded-full border border-border bg-card text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50 disabled:pointer-events-none group shadow-sm"
      >
        <span className="hidden sm:inline font-bold text-sm">Next</span>
        <ChevronRight className="w-4 h-4 md:ml-1.5 transition-transform group-hover:translate-x-1" />
      </button>

    </div>
  );
}