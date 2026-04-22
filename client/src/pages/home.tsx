import { Link } from "wouter";
import {
  Search,
  Video,
  Calendar,
  Shield,
  Star,
  ArrowRight,
  ArrowUp,
  CheckCircle,
  Users,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PublicLayout } from "@/components/layout/public-layout";
import { StarRating } from "@/components/ui/star-rating";
import { useState, useEffect } from "react";

const testimonials = [
  {
    id: "1",
    name: "Sanduni Wickramasinghe",
    text: "The booking process was so easy! I found an excellent Ayurvedic doctor near me and got an appointment the same day.",
    rating: 5,
  },
  {
    id: "2",
    name: "Mahesh Jayawardena",
    text: "Online consultations have been a game-changer. I can now get expert Ayurvedic advice from the comfort of my home.",
    rating: 5,
  },
  {
    id: "3",
    name: "Priya Nanayakkara",
    text: "Finally, a platform that makes traditional medicine accessible. The doctors are verified and truly knowledgeable.",
    rating: 5,
  },
];

const stats = [
  { label: "Verified Doctors", value: "500+", icon: Award },
  { label: "Happy Patients", value: "50,000+", icon: Users },
  { label: "Appointments Booked", value: "100,000+", icon: Calendar },
  { label: "Cities Covered", value: "25+", icon: CheckCircle },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/doctors?q=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="container mx-auto px-4 py-10 md:py-14 lg:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 md:mb-6 px-3 py-1 md:px-4 md:py-1.5 text-xs md:text-sm">
              Sri Lanka's #1 Ayurvedic Healthcare Platform
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight mb-4 md:mb-6">
              Find & Book{" "}
              <span className="text-primary">Ayurvedic Doctors</span>{" "}
              Near You
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto px-2">
              Discover trusted Ayurvedic practitioners, book appointments online or in-person,
              and experience holistic healthcare rooted in ancient wisdom.
            </p>

            <form onSubmit={handleSearch} className="max-w-xl mx-auto px-2 sm:px-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search doctors, specializations, or locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base w-full"
                    data-testid="input-hero-search"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-8 w-full sm:w-auto transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:ring-1 hover:ring-primary/50 hover:ring-offset-1" data-testid="button-hero-search">
                  Find Doctors
                </Button>
              </div>
            </form>

            <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground px-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Verified Doctors</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                <span>Online Consultations</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-12 bg-card border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center px-2">
                <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 mb-2 md:mb-3">
                  <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold">{stat.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold mb-3 md:mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              Book your Ayurvedic consultation in just a few simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {[
              {
                step: 1,
                title: "Search & Discover",
                description: "Browse through verified Ayurvedic doctors by specialization, location, or availability.",
                icon: Search,
              },
              {
                step: 2,
                title: "Book Appointment",
                description: "Select your preferred date, time, and consultation type - online or in-person.",
                icon: Calendar,
              },
              {
                step: 3,
                title: "Get Consultation",
                description: "Meet your doctor, receive personalized treatment, and access your prescriptions digitally.",
                icon: Video,
              },
            ].map((item) => (
              <div key={item.step} className="text-center rounded-2xl p-4 md:p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:bg-primary/5 hover:border hover:border-primary/20">
                <div className="relative inline-flex mb-4 md:mb-6">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary flex items-center justify-center">
                    <item.icon className="h-7 w-7 md:h-8 md:w-8 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 md:w-7 md:h-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xs md:text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-base md:text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm md:text-base">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold mb-3 md:mb-4">
              What Our Patients Say
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              Join thousands of satisfied patients who trust AyurvedicDoctor
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="relative transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/40">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    <StarRating rating={testimonial.rating} size="sm" />
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {testimonial.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{testimonial.name}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold mb-3 md:mb-4 text-white drop-shadow-sm">
            Are You an Ayurvedic Practitioner?
          </h2>
          <p className="text-white/65 max-w-2xl mx-auto mb-6 md:mb-8 text-sm md:text-base px-2">
            Join our platform to reach thousands of patients, manage your practice efficiently,
            and grow your Ayurvedic practice online.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 md:gap-8 justify-center px-4 sm:px-0">
            <Link href="/doctor/register" className="sm:mr-6 md:mr-8">
              <Button size="lg" variant="secondary" className="transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:ring-1 hover:ring-white/25 hover:ring-offset-1">
                Register as a Doctor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-[#2e9e2e] bg-[#2e9e2e] text-white hover:bg-[#238a23] hover:border-[#238a23] transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:ring-1 hover:ring-white/25 hover:ring-offset-1">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl hover:brightness-110 ${
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </PublicLayout>
  );
}
