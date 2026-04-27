import { LucideIcon } from "lucide-react";

interface ValueCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ValueCard({ icon: Icon, title, description }: ValueCardProps) {
  return (
    <div className="dark:bg-card border hover:bg-black/5 dark:hover:bg-primary/5 border-[#111815] dark:border-white/40 p-6 rounded-xl text-center flex flex-col items-center hover:shadow-sm transition-all duration-300">
      <div className="flex justify-start items-center gap-4 mb-4 max-h-[80px]">
        <div className="w-12 h-12 shrink-0 rounded-full border border-[#30A66F] dark:border-primary flex items-center justify-center mb-4 bg-[#30A66F33] dark:bg-primary/10">
            <Icon className="w-6 h-6 text-[#30A66F] dark:text-primary" />
        </div>
        <h3 className="font-bold text-start text-gray-900 dark:text-foreground mb-3 text-[20px]">{title}</h3>
      </div>
      <p className="text-[18px] text-[#111815] dark:text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}