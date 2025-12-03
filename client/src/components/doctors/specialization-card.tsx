import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Leaf, 
  Baby, 
  Stethoscope, 
  Heart, 
  Users,
  Sparkles,
  Activity,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SpecializationCardProps {
  id: string;
  name: string;
  description?: string;
  doctorCount?: number;
  icon?: string;
  variant?: "default" | "compact";
}

const iconMap: Record<string, React.ElementType> = {
  panchakarma: Leaf,
  pediatrics: Baby,
  general: Stethoscope,
  womens_health: Heart,
  geriatrics: Users,
  wellness: Sparkles,
  chronic: Activity,
  mental: Brain,
  default: Stethoscope,
};

const colorMap: Record<string, string> = {
  panchakarma: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pediatrics: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  general: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  womens_health: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  geriatrics: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  wellness: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  chronic: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  mental: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  default: "bg-primary/10 text-primary",
};

export function SpecializationCard({
  id,
  name,
  description,
  doctorCount,
  icon,
  variant = "default",
}: SpecializationCardProps) {
  const iconKey = icon || name.toLowerCase().replace(/[^a-z]/g, "_");
  const Icon = iconMap[iconKey] || iconMap.default;
  const colorClass = colorMap[iconKey] || colorMap.default;

  if (variant === "compact") {
    return (
      <Link href={`/doctors?specialization=${id}`}>
        <Card 
          className="hover-elevate cursor-pointer transition-all duration-200"
          data-testid={`card-specialization-${id}`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", colorClass)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{name}</p>
              {doctorCount !== undefined && (
                <p className="text-xs text-muted-foreground">{doctorCount} doctors</p>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/doctors?specialization=${id}`}>
      <Card 
        className="h-full hover-elevate cursor-pointer transition-all duration-200 group"
        data-testid={`card-specialization-${id}`}
      >
        <CardContent className="p-6 flex flex-col items-center text-center">
          <div className={cn(
            "p-4 rounded-2xl mb-4 transition-transform group-hover:scale-110",
            colorClass
          )}>
            <Icon className="h-8 w-8" />
          </div>
          <h3 className="font-semibold mb-1">{name}</h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {description}
            </p>
          )}
          {doctorCount !== undefined && (
            <p className="text-xs text-muted-foreground mt-auto">
              {doctorCount} {doctorCount === 1 ? "doctor" : "doctors"} available
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
