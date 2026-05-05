import { Edit, Trash2, UserCircle2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CareerCardProps {
  careerTitle: string;
  department?: string;
  location?: string;
  employmentType: string;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

export function CareerCard({
  careerTitle,
  department = "General",
  location,
  employmentType,
  onEdit,
  onDelete,
  onView
}: CareerCardProps) {
  return (
    <div className="border border-primary bg-primary/10 dark:bg-primary/5 rounded-xl p-5 relative flex flex-col group hover:shadow-md transition-shadow">
      <button
        onClick={onView}
        className="absolute top-0 right-0 h-8 w-8 text-primary rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        title="View Details"
      >
        <ArrowUpRight className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full border border-primary flex items-center justify-center shrink-0">
          <UserCircle2 className="w-6 h-6 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-[18px] md:text-[20px] font-extrabold leading-tight">
            {careerTitle}
          </h3>
          <p className="text-[13px] text-muted-foreground">AyurPath Hospital</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <span className="border border-primary bg-background text-[12px] px-2.5 py-1 rounded-md w-fit font-medium">
          Department: {department}
        </span>
        {location && (
          <span className="border border-primary bg-background text-[12px] px-2.5 py-1 rounded-md w-fit font-medium">
            Location: {location}
          </span>
        )}
        <span className="border border-primary bg-background text-[12px] px-2.5 py-1 rounded-md w-fit font-medium">
          Type: {employmentType}
        </span>
      </div>

      <div className="absolute bottom-4 right-4 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <Button
          onClick={onEdit}
          variant="outline"
          size="icon"
          className="h-8 w-8 text-primary border-primary hover:bg-primary hover:text-white"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          onClick={onDelete}
          variant="outline"
          size="icon"
          className="h-8 w-8 text-destructive border-destructive hover:bg-destructive hover:text-white"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}