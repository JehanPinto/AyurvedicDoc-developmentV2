import { 
  Heart, 
  Leaf, 
  Shield, 
  Award, 
  Target,
  Globe
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/public-layout";

const values = [
  {
    icon: Heart,
    title: "Patient-Centered Care",
    description: "We prioritize the well-being of every patient, ensuring personalized treatment plans that address individual health needs.",
  },
  {
    icon: Leaf,
    title: "Holistic Approach",
    description: "We preserve and promote the ancient knowledge of Ayurveda, passed down through generations of Sri Lankan healers.",
  },
  {
    icon: Shield,
    title: "Personalized Care",
    description: "All doctors on our platform are verified professionals with proper certifications and credentials.",
  },
  {
    icon: Globe,
    title: "Preventive Focus",
    description: "Making quality Ayurvedic healthcare accessible to everyone, anywhere in Sri Lanka through online consultations.",
  },
];

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="container mx-auto mt-20 relative">
          <div className="mx-auto text-center">
            <h1 className="text-[32px] font-bold leading-tight mb-6 text-white">
              About Ayurvedic Doctor
            </h1>
            
            <p className="text-[23px] ">
              Bridging ancient Ayurvedic wisdom with modern healthcare accessibility. 
              <br />
              We connect patients with verified Ayurvedic practitioners across Sri Lanka.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="pb-10">
        <div className="container mx-auto px-4 w-[1097px]">
          <div className="grid grid-cols-2 gap-32 mt-[64px]">
            <Card className="bg-[#1F2E28] max-w-[483px]">
              <CardContent className="p-11">
                <div className="flex w-full justify-center items-center gap-7">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#30A66F] mb-6">
                    <Target className="h-7 w-7 text-primary" />
                    <img src="" alt="" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">Our Mission</h2>
                </div>
                <p className="text-white text-justify text-[18px] leading-relaxed">
                  To make quality Ayurvedic healthcare accessible to every Sri Lankan by connecting 
                  them with verified practitioners through a seamless digital platform. We believe 
                  in preserving the rich heritage of traditional medicine while embracing technology 
                  to serve patients better.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1F2E28] w-[483px]">
              <CardContent className="p-11">
                <div className="flex w-full justify-center items-center gap-7">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#30A66F] mb-6">
                    <Award className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">Our Vision</h2>
                </div>
                <p className="text-white leading-relaxed text-justify text-[18px]">
                  To become Sri Lanka's most trusted platform for Ayurvedic healthcare, where 
                  patients can find the right practitioner for their needs and doctors can grow 
                  their practice while delivering exceptional care. We envision a future where 
                  traditional medicine thrives alongside modern healthcare.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-10 bg-[#1F2E28]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-[32px] font-bold leading-tight mb-3 text-white">Our Story</h2>
            <p className="text-[20px]">
              How we started and where we're heading
            </p>
          </div>

          <div className="mx-auto">
            <p className="text-white leading-relaxed text-[18px] mb-7 text-justify">
              AyurvedicDoctor was born from a simple observation: while Sri Lanka has a rich 
              tradition of Ayurvedic medicine with thousands of skilled practitioners, patients 
              often struggled to find the right doctor for their specific needs. The gap between 
              traditional healers and modern patients was growing.
            </p>
            <p className="text-white leading-relaxed text-[18px] mb-7 text-justify">
              In 2020, our founder Dr. Anura Jayasinghe, with over three decades of experience in 
              Ayurvedic medicine, partnered with technology experts to create a platform that would 
              bridge this gap. The goal was simple: make it easy for anyone in Sri Lanka to find, 
              book, and consult with verified Ayurvedic practitioners.
            </p>
            <p className="text-white leading-relaxed text-[18px] text-justify">
              Today, AyurvedicDoctor serves over 50,000 patients with a network of 500+ verified 
              doctors across 25+ cities. We've facilitated over 100,000 appointments and continue 
              to grow, driven by our commitment to making traditional healthcare accessible to all.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-[32px] font-bold leading-tight mb-3 text-white">
              Our Values
            </h2>
            <p className="text-[20px] mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-4 gap-11">
            {values.map((value) => (
              <Card key={value.title} className="border-[#F4F3F0A8]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-start gap-3 mb-3">
                    <div className="shrink-0 bg-[#30A66F]/20 border border-[#30A66F] w-12 h-12 rounded-full flex items-center justify-center">
                      <value.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-[20px] font-semibold text-wrap">{value.title}</h3>
                  </div>
                  <p className="text-[18px] text-[#F4F3F0] text-center mt-5">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="pt-9 bg-[#C38322] text-primary-foreground pb-14">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-[32px] font-bold leading-tight mb-3 text-white">
              Impact in Numbers
            </h2>
            <p className="text-[20px] mx-auto">
              The difference we're making in Sri Lankan healthcare
            </p>
          </div>

          <div className="flex justify-between mx-auto">
            {[
              { value: "500+", label: "Verified Doctors" },
              { value: "50,000+", label: "Happy Patients" },
              { value: "100,000+", label: "Appointments" },
              { value: "25+", label: "Cities Covered" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center justify-center gap-4">
                <p className="text-[56px] font-bold mb-2">{stat.value}</p>
                <p className="text-[20px] text-[#F4F3F099]/60 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
