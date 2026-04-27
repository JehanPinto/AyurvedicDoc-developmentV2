import { ArrowUpRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobCardProps {
  id: string;
  title: string;
  subtitle: string;
  department: string;
  location: string;
  type: string;
  onApply: () => void;
}

export function JobCard({ title, subtitle, department, location, type, onApply }: JobCardProps) {
  return (
    <div className="bg-[#E1ECE3] dark:bg-card border border-[#30A66F] hover:bg-[#ddece5] dark:border-primary/20 rounded-xl p-8 flex flex-col h-full hover:shadow-md dark:hover-elevate transition-shadow">
      <div className="flex justify-start items-start gap-6 mb-4 min-h-[100px] max-sm:flex-col max-sm:items-start max-sm:gap-3 max-sm:mb-0">
        {/* Icon */}
        <div className="w-14 h-14 shrink-0 rounded-full border border-[#30A66F] dark:border-primary/30 flex items-center justify-center bg-white/50 dark:bg-primary/10">
            <User className="w-6 h-6 text-[#30A66F] dark:text-primary" />
        </div>

        {/* Titles */}
        <h3 className="text-[32px] font-bold text-gray-900 dark:text-foreground mb-1">{title}</h3>
      </div>
      
      {/* Subtitle */}
      <p className="text-gray-600 dark:text-muted-foreground text-[18px] mb-6">{subtitle}</p>

      {/* Badges / Details */}
      <div className="flex flex-col gap-2 mb-8 flex-grow">
        <div className="bg-[#F4F3F0] dark:bg-background border border-[#30A66F] dark:border-border rounded px-3 py-1.5 text-[13px] text-gray-700 dark:text-muted-foreground w-max max-sm:text-[11px] max-w-[222px]">
          Department: {department}
        </div>
        <div className="bg-[#F4F3F0] dark:bg-background border border-[#30A66F] dark:border-border rounded px-3 py-1.5 text-[13px] text-gray-700 dark:text-muted-foreground w-max max-sm:text-[11px] max-w-[222px]">
          Location: {location}
        </div>
        <div className="bg-[#F4F3F0] dark:bg-background border border-[#30A66F] dark:border-border rounded px-3 py-1.5 text-[13px] text-gray-700 dark:text-muted-foreground w-max max-sm:text-[11px] max-w-[222px]">
          Type: {type}
        </div>
      </div>

      {/* Apply Button */}
      <Button 
        onClick={onApply}
        className="w-full font-bold text-[20px] h-11 flex items-center justify-center gap-2 rounded-lg"
      >
        Apply Now
        <ArrowUpRight className="w-6 h-6" />
      </Button>
    </div>
  );
}