import { 
  LogIn, 
  MousePointerSquareDashed, 
  UserCheck, 
  CalendarSearch, 
  PhoneCall, 
  Mail 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/public-layout";

import { HelpStepCard } from "@/components/ui/help-step-card"; 

export default function HelpDetailsPage() {
  const steps = [
    {
      id: 1,
      title: "Log into your account",
      desc: "Log into your account using your registered credentials.",
      icon: LogIn,
    },
    {
      id: 2,
      title: 'Select "Consultations"',
      desc: "Log into your account using your registered credentials.",
      icon: MousePointerSquareDashed,
    },
    {
      id: 3,
      title: "Choose your preferred doctor",
      desc: "Log into your account using your registered credentials.",
      icon: UserCheck,
    },
    {
      id: 4,
      title: "Review availability",
      desc: "Log into your account using your registered credentials.",
      icon: CalendarSearch,
    },
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background flex flex-col">
        
        {/* =====================================
            TOP SECTION (Content & Steps)
            ===================================== */}
        <section className="flex-grow container mx-auto max-w-6xl mt-8 px-4">
          
          {/* Main Heading & Text */}
          <div className="max-w-5xl mb-12">
            <h1 className="text-center text-[32px] md:text-[40px] lg:text-[56px] font-bold text-foreground mb-6 tracking-tight">
              How do I book an Ayurvedic Consultation?
            </h1>
            <p className="text-[16px] md:text-[18px] lg:text-[20px] text-foreground leading-relaxed mb-6">
              Follow the steps below to book an Ayurvedic Consultation. During your initial evaluation, our specialists will complete a comprehensive assessment and associate a personalized treatment plan for you. We will manage your wellness journey, ensuring each step of the process is tailored to your specific health needs.
            </p>
            <p className="text-[16px] md:text-[18px] lg:text-[20px] text-foreground leading-relaxed mb-10">
              You can use our online platform to manage your account and store your medical information securely. Providing detailed information regarding your health concerns helps our doctors offer a more accurate diagnosis and a better experience for your mind and body.
            </p>
            <h2 className="text-[16px] md:text-[18px] lg:text-[20px] font-semibold text-foreground">
              To book your appointment, follow the steps outlined below:
            </h2>
          </div>

          {/* Steps Timeline Grid */}
          <div className="relative mt-8">
            
            <div className="hidden lg:block absolute top-[16px] left-[10%] right-[10%] h-[2px] bg-foreground z-0" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6">
              {steps.map((step) => (
                <HelpStepCard 
                  key={step.id}
                  id={step.id}
                  title={step.title}
                  desc={step.desc}
                  Icon={step.icon}
                />
              ))}
            </div>
          </div>
        </section>

        {/* =====================================
            BOTTOM CTA SECTION
            ===================================== */}
        <section className="w-full bg-primary py-6 px-4 mt-9">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-[30px] md:text-[40px] lg:text-[56px] font-bold text-primary-foreground mb-4 tracking-tight">
              Still need help?
            </h2>
            <p className="text-[16px] md:text-[20px] lg:text-[24px] text-primary-foreground/90 mb-10 font-medium">
              Our dedicated support team is always ready to help you with any questions or concerns. Don't hesitate to reach out!
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 font-semibold px-8 rounded-xl h-14 text-base w-full sm:w-auto"
              >
                Call Us Now
                <PhoneCall className="w-5 h-5 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary font-semibold px-8 rounded-xl h-14 text-base w-full sm:w-auto"
              >
                Email Support
                <Mail className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}