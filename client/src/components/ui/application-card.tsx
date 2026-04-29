import { User, Eye, XCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApplicationCardProps {
  jobTitle: string;
  jobRole?: string;
  applicantName: string;
  appliedDate: string;
  onView?: () => void;
  onReject?: () => void;
  onAccept?: () => void;
  isLoading?: boolean;
}

export function ApplicationCard({
  jobTitle,
  jobRole = "Job Application",
  applicantName,
  appliedDate,
  onView,
  onReject,
  onAccept,
  isLoading
}: ApplicationCardProps) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-4 rounded-[15px] bg-primary/10 gap-4 transition-all">
      {/* Left Section */}
      <div className="flex items-center gap-4 max-sm:flex-col max-sm:items-start">
        <div className="w-12 h-12 rounded-full border border-primary flex items-center justify-center bg-transparent shrink-0">
          <User className="w-6 h-6 text-primary" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col">
          <h3 className="text-[20px] font-extrabold text-foreground leading-tight mb-0.5">
            {jobTitle}
          </h3>
          <p className="text-[14px] text-muted-foreground leading-tight mb-1.5">
            {jobRole}
          </p>
          <p className="text-[16px] font-medium text-foreground">
            Applied by: <span className="font-normal">{applicantName}</span>
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex flex-col items-start lg:items-end gap-3 w-full lg:w-auto mt-2 lg:mt-0">
        <p className="text-[14px] text-muted-foreground hidden lg:block">
          Applied: {appliedDate}
        </p>

        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <Button
            variant="outline" size="sm"
            className="text-primary border-primary/50 hover:bg-primary/10 bg-transparent h-8"
            onClick={onView}
            disabled={isLoading}
          >
            <Eye className="w-3.5 h-3.5 mr-1.5 hidden sm:block" /> View
          </Button>
          <Button
            variant="outline" size="sm"
            className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive bg-transparent h-8"
            onClick={onReject}
            disabled={isLoading}
          >
            <XCircle className="w-3.5 h-3.5 mr-1.5 hidden sm:block" /> Reject
          </Button>
          <Button
            size="sm"
            className="bg-primary/80 hover:bg-primary border-0 h-8"
            onClick={onAccept}
            disabled={isLoading}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 hidden sm:block" /> Accept
          </Button>
        </div>
      </div>
    </div>
  );
}