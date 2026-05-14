import { useState, useEffect } from "react";
import { Leaf, Sparkles, Plus, Flame, Sprout, ShieldPlus, HeartPulse, Droplets, } from "lucide-react";

import img_1 from "@/assets/image/Ellipse 41.svg";
import img_2 from "@/assets/image/Ellipse 40.svg";
import img_3 from "@/assets/image/Ellipse 39.svg";
import img_4 from "@/assets/image/Ellipse 38.svg";
import img_5 from "@/assets/image/Ellipse 37.svg";
import img_6 from "@/assets/image/Ellipse 42.svg";
import img_7 from "@/assets/image/Ellipse 34.svg";

const orbitItems = [
  { id: 0, img: img_1, Icon: Sprout, iconColor: "text-green-600", bg: "bg-green-100" },
  { id: 1, img: img_2, Icon: Flame, iconColor: "text-blue-600", bg: "bg-blue-100" },
  { id: 2, img: img_3, Icon: Leaf, iconColor: "text-pink-600", bg: "bg-pink-100" },
  { id: 3, img: img_4, Icon: Sparkles, iconColor: "text-amber-600", bg: "bg-amber-100" },
  { id: 4, img: img_5, Icon: ShieldPlus, iconColor: "text-orange-600", bg: "bg-orange-100" },
  { id: 5, img: img_6, Icon: HeartPulse, iconColor: "text-teal-600", bg: "bg-teal-100" },
];

export default function HomeAnimation() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => prev + 60);
    }, 3000); 
    return () => clearInterval(interval);
  }, []);

  const activeIndex = (6 - ((rotation / 60) % 6)) % 6;

  return (
    // 100% Mobile Responsive Container (Sizes scale perfectly)
    <div className="relative w-full max-w-[300px] xs:max-w-[360px] sm:max-w-[450px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[700px] aspect-square mx-auto flex items-center justify-center pointer-events-none mt-8 lg:mt-0 p-4 xs:p-6 sm:p-10 lg:p-14">
      
      {/* Premium Background Glows */}
      <div className="absolute w-[90%] h-[90%] bg-primary/10 rounded-full blur-[40px] md:blur-[60px] xl:blur-[80px] animate-pulse" />
      <div className="absolute w-[60%] h-[60%] bg-amber-400/10 rounded-full blur-[30px] xl:blur-[60px]" style={{ animation: 'pulse 4s infinite reverse' }} />
      
      {/* Outer Rings with Orbiting Satellites */}
      <div className="absolute w-[95%] h-[95%] border border-primary/20 rounded-full border-dashed animate-[spin_50s_linear_infinite]">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full shadow-[0_0_10px_#2e9e2e]" />
      </div>
      
      <div className="absolute w-[70%] h-[70%] border-[1.5px] border-primary/15 rounded-full animate-[spin_35s_linear_infinite_reverse]">
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-amber-400 rounded-full shadow-[0_0_12px_#fbbf24]" />
      </div>

      {/* Floating Background Particles */}
      <Leaf className="absolute top-[8%] right-[15%] text-primary/40 w-5 h-5 sm:w-8 sm:h-8 xl:w-10 xl:h-10 animate-bounce" style={{ animationDuration: '4s' }} />
      <Leaf className="absolute bottom-[15%] right-[20%] text-primary/20 w-4 h-4 sm:w-6 sm:h-6 rotate-45" style={{ animation: 'pulse 3s infinite' }} />
      <Sparkles className="absolute top-[22%] left-[10%] text-amber-500/40 w-5 h-5 sm:w-8 sm:h-8 xl:w-9 xl:h-9" style={{ animation: 'pulse 3s infinite' }} />
      <Droplets className="absolute bottom-[20%] left-[5%] text-blue-500/30 w-4 h-4 sm:w-7 sm:h-7 animate-bounce" style={{ animationDuration: '5s' }} />
      <Plus className="absolute top-[40%] right-[5%] text-primary/30 w-3 h-3 sm:w-5 sm:h-5 xl:w-6 xl:h-6" />

      {/* Center Main Image */}
      <div className="relative z-20 w-[45%] h-[45%] rounded-full p-1.5 sm:p-2 xl:p-3 bg-gradient-to-tr from-primary to-green-200 shadow-[0_0_30px_rgba(46,158,46,0.35)] lg:shadow-[0_0_50px_rgba(46,158,46,0.35)] flex items-center justify-center">
         <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] animate-[spin_4s_linear_infinite] opacity-50" />
         <div className="relative w-full h-full rounded-full border-[3px] sm:border-4 border-white dark:border-transparent overflow-hidden bg-muted group z-10 shadow-inner">
           <img 
              src={img_7} 
              alt="Ayurvedic Treatment" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
           />
           <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent mix-blend-overlay"></div>
         </div>
      </div>

      {/* Rotating Orbit Wheel */}
      <div
        className="absolute inset-4 xs:inset-5 sm:inset-8 md:inset-10 lg:inset-12 z-10 transition-transform duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
         {orbitItems.map((item, index) => {
            const angle = index * 60;
            const isActive = index === activeIndex;

            return (
              <div
                key={item.id}
                className="absolute inset-y-0 left-1/2 w-0 flex flex-col items-center"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                {/* Individual Orbiting Image (Responsive Sizes & Margins) */}
                <div
                  className={`relative w-[55px] h-[55px] xs:w-[65px] xs:h-[65px] sm:w-[90px] sm:h-[90px] lg:w-[110px] lg:h-[110px] xl:w-[130px] xl:h-[130px] -mt-[27.5px] xs:-mt-[32.5px] sm:-mt-[45px] lg:-mt-[55px] xl:-mt-[65px] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    isActive 
                      ? 'scale-[1.25] sm:scale-[1.3] z-50 drop-shadow-[0_10px_20px_rgba(46,158,46,0.4)] lg:drop-shadow-[0_15px_30px_rgba(46,158,46,0.5)]' 
                      : 'scale-90 z-10 opacity-75 grayscale-[30%] hover:grayscale-0 hover:opacity-100'
                  }`}
                >
                  {/* Teardrop Pointer */}
                  <div className={`absolute -bottom-[6px] sm:-bottom-[10px] xl:-bottom-[12px] left-1/2 -translate-x-1/2 w-4 h-4 sm:w-6 sm:h-6 xl:w-8 xl:h-8 rotate-45 border-r-[3px] border-b-[3px] sm:border-r-[4px] sm:border-b-[4px] xl:border-r-[5px] xl:border-b-[5px] rounded-br-sm transition-colors duration-500 bg-primary ${isActive ? 'border-primary' : 'border-primary/50,'}`} />

                  {/* Circular Frame for Image */}
                  <div className={`relative w-full h-full rounded-full border-[2px] sm:border-[3px] xl:border-[4px] transition-colors duration-500 bg-white z-10 flex items-center justify-center overflow-hidden ${isActive ? 'border-primary shadow-[0_0_15px_rgba(46,158,46,0.3)]' : 'border-primary/50'}`}>
                    
                    <div
                      className="w-full h-full transition-transform duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                      style={{ transform: `rotate(${-angle - rotation}deg)` }}
                    >
                       <img src={item.img} alt={`Item ${index}`} className="w-full h-full object-cover scale-110" />
                    </div>
                  </div>

                  {/* Unique Icon Badge */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-20 transition-transform duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                    style={{ transform: `rotate(${-angle - rotation}deg)` }}
                  >
                    <div className={`absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 xl:w-10 xl:h-10 rounded-full border-[1.5px] sm:border-2 xl:border-[3px] border-white flex items-center justify-center shadow-lg transition-transform duration-500 ${item.bg} ${isActive ? 'scale-110' : 'scale-100'}`}>
                        <item.Icon className={`w-2.5 h-2.5 sm:w-4 sm:h-4 xl:w-5 xl:h-5 ${item.iconColor}`} />
                    </div>
                  </div>

                </div>
              </div>
            );
         })}
      </div>
    </div>
  );
}