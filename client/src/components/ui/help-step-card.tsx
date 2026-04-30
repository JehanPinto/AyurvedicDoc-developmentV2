import { LucideIcon } from "lucide-react";

interface HelpStepCardProps {
    id: number;
    title: string;
    desc: string;
    Icon: LucideIcon;
}

export function HelpStepCard({ id, title, desc, Icon }: HelpStepCardProps) {
    return (
        <div className="relative z-10 flex flex-col h-full">

            {/* Step Badge with Masking for the Line Gap */}
            <div className="flex justify-center mb-6">
                <div className="bg-background px-3">
                    <span className="bg-secondary text-secondary-foreground font-semibold px-6 py-1.5 rounded-md text-[14px] md:text-[16px] lg:text-[20px] shadow-sm inline-block">
                        Step {id}
                    </span>
                </div>
            </div>

            {/* Card Body */}
            <div className="group bg-card border border-primary/60 rounded-xl p-5 flex flex-col flex-grow cursor-default transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg hover:shadow-primary/20 hover:border-primary">

                {/* Card Header (Icon & Title side-by-side) */}
                <div className="flex items-center gap-3 mb-3">
                    {/*  */}
                    <div className="w-12 h-12 rounded-full border border-primary bg-primary/10 flex items-center justify-center shrink-0 transition-colors duration-300 group-hover:bg-primary">
                        <Icon className="w-5 h-5 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-foreground text-[16px] md:text-[18px] lg:text-[20px] leading-tight transition-colors duration-300 group-hover:text-primary">
                        {title}
                    </h3>
                </div>

                {/* Card Description */}
                <p className="text-[14px] md:text-[16px] lg:text-[18px] text-foreground/80 leading-relaxed">
                    {desc}
                </p>
            </div>

        </div>
    );
}