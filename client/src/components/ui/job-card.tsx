import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobCardProps {
  id: string;
  title: string;
  subtitle: string;
  department: string;
  location: string;
  type: string;
  salaryRange: string;
  icon: any;
  onSeeMore: () => void;
}

export function JobCard({ title, subtitle, department, location, type, salaryRange, icon: IconComponent, onSeeMore }: JobCardProps) {
  return (
    <div className="bg-[#E1ECE3] dark:bg-card border border-[#30A66F] hover:bg-[#ddece5] dark:border-primary/20 rounded-xl p-5 sm:p-6 md:p-7 flex flex-col h-full hover:shadow-md dark:hover-elevate transition-shadow overflow-hidden w-full">

      {/* --- HEADER (Icon + Title) --- */}
      <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4 sm:gap-5 mb-4 w-full">
        <div className="w-12 h-12 lg:w-14 lg:h-14 shrink-0 rounded-full border border-[#30A66F] dark:border-primary/30 flex items-center justify-center bg-white/50 dark:bg-primary/10">
          {IconComponent && <IconComponent className="w-5 h-5 lg:w-6 lg:h-6 text-[#30A66F] dark:text-primary" />}
        </div>

        <div className="flex-1 min-w-0 w-full">
          <h3
            className="text-[20px] sm:text-[22px] md:text-[24px] lg:text-[26px] font-bold text-gray-900 dark:text-foreground leading-tight line-clamp-2 break-words"
            title={title}
          >
            {title}
          </h3>
        </div>
      </div>

      <p
        className="text-gray-600 dark:text-muted-foreground text-[13px] sm:text-[14px] md:text-[15px] mb-6 truncate"
        title={subtitle}
      >
        {subtitle}
      </p>

      <div className="flex flex-col gap-2.5 mb-5 flex-grow w-full">
        <div
          className="bg-[#F4F3F0] dark:bg-background border border-[#30A66F] dark:border-border rounded-md px-3 py-1 text-[12px] sm:text-[13px] text-gray-700 dark:text-muted-foreground max-w-full truncate"
          title={location}
        >
          <span className="font-semibold text-gray-900 dark:text-foreground mr-1">Location:</span> {location}
        </div>
        <div
          className="bg-[#F4F3F0] dark:bg-background border border-[#30A66F] dark:border-border rounded-md px-3 py-1 text-[12px] sm:text-[13px] text-gray-700 dark:text-muted-foreground max-w-full truncate"
          title={salaryRange}
        >
          <span className="font-semibold text-gray-900 dark:text-foreground mr-1">Salary:</span> {salaryRange}
        </div>
        <div
          className="bg-[#F4F3F0] dark:bg-background border border-[#30A66F] dark:border-border rounded-md px-3 py-1 text-[12px] sm:text-[13px] text-gray-700 dark:text-muted-foreground max-w-full truncate"
          title={type}
        >
          <span className="font-semibold text-gray-900 dark:text-foreground mr-1">Type:</span> {type}
        </div>
      </div>

      {/* --- SEE MORE BUTTON --- */}
      <Button
        onClick={onSeeMore}
        className="font-bold bg-primary border-none mx-5 text-[15px] sm:text-[16px] md:text-[18px] h-12 flex items-center justify-center gap-2 rounded-lg mt-auto shrink-0"
      >
        See More
        <ArrowUpRight className="shrink-0 w-5 h-5 md:w-6 md:h-6" />
      </Button>
    </div>
  );
}