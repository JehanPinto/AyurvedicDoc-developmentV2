import { useState, useEffect, useRef } from "react";
import { LucideIcon } from "lucide-react";

interface AnimatedStatProps {
  value: string;
  label: string;
  icon: LucideIcon;
}

export function AnimatedStat({ value, label, icon: Icon }: AnimatedStatProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPopping, setIsPopping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const targetNumber = parseInt(value.replace(/,/g, "").replace("+", ""));
  const hasPlus = value.includes("+");

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const duration = 2000;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * targetNumber));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsPopping(true);
        setTimeout(() => setIsPopping(false), 250);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, targetNumber]);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-3">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      
      <p
        className={`text-3xl font-bold transition-all duration-300 ease-out ${
          isPopping 
            ? "scale-[1.3] text-primary drop-shadow-md" 
            : "scale-100 text-foreground"
        }`}
      >
        {count.toLocaleString()}
        {hasPlus ? "+" : ""}
      </p>
      
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}