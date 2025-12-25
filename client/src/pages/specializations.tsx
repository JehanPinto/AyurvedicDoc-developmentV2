import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Leaf, 
  Baby, 
  Stethoscope, 
  Heart, 
  Users,
  Sparkles,
  Activity,
  Brain,
  ArrowRight,
  Search
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PublicLayout } from "@/components/layout/public-layout";
import { LoadingCard } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Specialization } from "@shared/schema";

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

const specializationDescriptions: Record<string, string> = {
  panchakarma: "Traditional five-fold purification therapy for deep detoxification and rejuvenation of body and mind.",
  pediatrics: "Specialized Ayurvedic care for infants, children, and adolescents focusing on natural growth and immunity.",
  general: "Comprehensive Ayurvedic consultations for overall health assessment and personalized treatment plans.",
  womens_health: "Holistic care addressing women's health concerns including hormonal balance, fertility, and menopause.",
  geriatrics: "Age-specific treatments focusing on healthy aging, joint care, and maintaining vitality in senior years.",
  wellness: "Preventive care and lifestyle guidance for maintaining optimal health and preventing diseases.",
  chronic: "Long-term management of chronic conditions through traditional Ayurvedic protocols and therapies.",
  mental: "Mind-body wellness treatments addressing stress, anxiety, depression, and sleep disorders naturally.",
};

const commonConditions: Record<string, string[]> = {
  panchakarma: ["Toxin accumulation", "Digestive disorders", "Skin conditions", "Chronic fatigue"],
  pediatrics: ["Immunity issues", "Growth concerns", "Digestive problems", "Respiratory conditions"],
  general: ["General wellness", "Preventive care", "Health checkups", "Lifestyle guidance"],
  womens_health: ["PCOS/PCOD", "Menstrual disorders", "Fertility issues", "Menopausal symptoms"],
  geriatrics: ["Arthritis", "Memory care", "Joint pain", "Age-related conditions"],
  wellness: ["Stress management", "Weight management", "Detox programs", "Immunity boosting"],
  chronic: ["Diabetes management", "Hypertension", "Thyroid disorders", "Autoimmune conditions"],
  mental: ["Anxiety", "Depression", "Insomnia", "Stress-related disorders"],
};

export default function SpecializationsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: specializations = [], isLoading, isError } = useQuery<Specialization[]>({
    queryKey: ["/api/specializations"],
    staleTime: 5 * 60 * 1000,
  });

  const filteredSpecializations = specializations.filter(spec =>
    spec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    spec.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIconKey = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("panchakarma")) return "panchakarma";
    if (lowerName.includes("pediatric") || lowerName.includes("child")) return "pediatrics";
    if (lowerName.includes("women") || lowerName.includes("gynec")) return "womens_health";
    if (lowerName.includes("geriatric") || lowerName.includes("elder")) return "geriatrics";
    if (lowerName.includes("wellness") || lowerName.includes("preventive")) return "wellness";
    if (lowerName.includes("chronic") || lowerName.includes("disease")) return "chronic";
    if (lowerName.includes("mental") || lowerName.includes("psych")) return "mental";
    return "default";
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5">
              Explore Ayurvedic Treatments
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight mb-6">
              Ayurvedic{" "}
              <span className="text-primary">Specializations</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover the diverse branches of Ayurvedic medicine and find the right 
              specialist for your health needs.
            </p>

            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search specializations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Ayurvedic Specializations */}
      <section className="py-12 bg-card border-y">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
              What is Ayurvedic Medicine?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Ayurveda, meaning "science of life" in Sanskrit, is an ancient Indian medical system 
              that has been practiced for over 5,000 years. It focuses on maintaining health through 
              balance of mind, body, and spirit using natural treatments, herbal medicines, dietary 
              changes, and lifestyle modifications. Our specialists are trained in various branches 
              of this holistic healing tradition.
            </p>
          </div>
        </div>
      </section>

      {/* Specializations Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Browse by Specialization
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Select a specialization to find doctors who can help with your specific health concerns
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <LoadingCard key={`loading-${i}`} />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                <Stethoscope className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Unable to load specializations</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                There was an error loading the specializations. Please try again later.
              </p>
            </div>
          ) : filteredSpecializations.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpecializations.map((spec) => {
                const iconKey = getIconKey(spec.name);
                const Icon = iconMap[iconKey] || iconMap.default;
                const colorClass = colorMap[iconKey] || colorMap.default;
                const description = spec.description || specializationDescriptions[iconKey] || "Specialized Ayurvedic treatment and care.";
                const conditions = commonConditions[iconKey] || ["General treatment", "Consultation"];

                return (
                  <Card key={spec.id} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className={cn(
                        "inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4",
                        colorClass
                      )}>
                        <Icon className="h-7 w-7" />
                      </div>
                      
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {spec.name}
                      </h3>
                      
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {conditions.slice(0, 3).map((condition) => (
                          <Badge key={condition} variant="secondary" className="text-xs">
                            {condition}
                          </Badge>
                        ))}
                      </div>

                      <Link href={`/doctors?specialization=${spec.id}`}>
                        <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          Find Doctors
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No specializations found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Try adjusting your search query or browse all specializations.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Ayurveda */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Why Choose Ayurvedic Treatment?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Benefits of choosing traditional Ayurvedic healthcare
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Leaf,
                title: "Natural Healing",
                description: "Treatments use natural herbs and therapies without harmful side effects.",
              },
              {
                icon: Heart,
                title: "Holistic Approach",
                description: "Addresses root causes, not just symptoms, for complete healing.",
              },
              {
                icon: Users,
                title: "Personalized Care",
                description: "Treatments tailored to your unique body constitution (Prakriti).",
              },
              {
                icon: Sparkles,
                title: "Preventive Focus",
                description: "Emphasizes disease prevention and maintaining optimal health.",
              },
            ].map((benefit) => (
              <Card key={benefit.title} className="text-center">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Ready to Start Your Healing Journey?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Connect with verified Ayurvedic practitioners and experience the benefits of 
            traditional medicine combined with modern convenience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/doctors">
              <Button size="lg" variant="secondary">
                Find a Doctor Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
