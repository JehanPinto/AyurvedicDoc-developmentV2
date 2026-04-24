import { Link } from "wouter";
import {
  Search,
  Video,
  Calendar,
  Shield,
  ArrowRight,
  CheckCircle,
  Users,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PublicLayout } from "@/components/layout/public-layout";
import { StarRating } from "@/components/ui/star-rating";
import { useState, useEffect } from "react";

const testimonials = [
  {
    id: "1",
    name: "Sanduni Wickramasinghe",
    initials: "SW",
    text: "The booking process was so easy! I found an excellent Ayurvedic doctor near me and got an appointment the same day.",
    rating: 5,
  },
  {
    id: "2",
    name: "Mahesh Jayawardena",
    initials: "MJ",
    text: "Online consultations have been a game-changer. I can now get expert Ayurvedic advice from the comfort of my home.",
    rating: 5,
  },
  {
    id: "3",
    name: "Priya Nanayakkara",
    initials: "PN",
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

const steps = [
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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#111815] min-h-[580px] flex items-center">
        {/* Full-width background image */}
        <img
          src="/hero-doctor.png"
          alt="Ayurvedic doctor consultation"
          className="absolute inset-0 w-full h-full object-cover object-left"
        />
        {/* Dark gradient overlay on right so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#111815]/60 to-[#111815]" />

        {/* Text content — right side */}
        <div className="relative z-10 ml-auto w-full max-w-xl px-6 md:px-12 py-16 text-white">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight mb-4 md:mb-6 leading-tight">
            Find & Book Ayurvedic<br />
            <span className="text-primary">Doctors</span> Near You
          </h1>

          <p className="text-white/70 text-base md:text-lg mb-6 md:mb-8 max-w-lg">
            Discover trusted Ayurvedic practitioners, book appointments online or
            in-person, and experience holistic healthcare rooted in ancient wisdom.
          </p>

          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex items-center bg-[#0d1410] border border-primary/50 rounded-xl overflow-hidden">
              <input
                placeholder="Search doctors, specializations, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-12 px-4 bg-transparent text-white placeholder:text-white/40 outline-none text-sm"
                data-testid="input-hero-search"
              />
              <button
                type="submit"
                className="h-12 w-12 bg-primary flex items-center justify-center shrink-0 hover:bg-primary/90 transition-colors"
                data-testid="button-hero-search"
              >
                <Search className="h-5 w-5 text-white" />
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-white/60">
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
      </section>

      {/* Stats bar */}
      <div className="bg-primary/20">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <section className="py-12 md:py-16 lg:py-24 bg-[#111815]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold mb-3 text-white">
              How It Works
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto text-base">
              Book your Ayurvedic consultation in just a few simple steps
            </p>
          </div>

          {/* Desktop: flex row with connectors between cards */}
          <div className="hidden md:flex items-center gap-0">
            {steps.map((item, index) => (
              <>
                {/* Card */}
                <div
                  key={item.step}
                  className="flex-1 text-center rounded-xl p-8 border border-white/10 bg-card group transition-all duration-300 hover:-translate-y-2 hover:border-primary/50 hover:shadow-[0_8px_32px_rgba(46,158,46,0.15)]"
                >
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(46,158,46,0.4)]">
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors duration-300">{item.title}</h3>
                  <p className="text-muted-foreground text-base transition-colors duration-300">{item.description}</p>
                </div>

                {/* Connector between cards (only between, not after last) */}
                {index < steps.length - 1 && (
                  <div key={`connector-${index}`} className="flex items-center shrink-0 w-20">
                    <div className="flex-1 h-px bg-white/30" />
                    <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                      {index + 1}
                    </div>
                    <div className="flex-1 h-px bg-white/30" />
                  </div>
                )}
              </>
            ))}
          </div>

          {/* Mobile: stacked cards */}
          <div className="grid grid-cols-1 gap-6 md:hidden">
            {steps.map((item) => (
              <div
                key={item.step}
                className="text-center rounded-xl p-8 border border-white/10 bg-card"
              >
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-base">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-16 lg:py-24 bg-primary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold mb-3 text-foreground">
              What Our Patients Say
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base">
              Join thousands of satisfied patients who trust AyurvedicDoctor
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card
                key={testimonial.id}
                className="rounded-xl border border-white/10 bg-card group cursor-default transition-all duration-300 hover:-translate-y-2 hover:border-primary/50 hover:shadow-[0_8px_32px_rgba(46,158,46,0.2)]"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="ring-2 ring-primary/30 group-hover:ring-primary transition-all duration-300">
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                  </div>
                  <div className="flex mb-3">
                    <StarRating rating={testimonial.rating} size="sm" />
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed transition-colors duration-300">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Are You a Practitioner */}
      <section className="py-12 md:py-16 lg:py-24 bg-[#c8860a]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold mb-3 md:mb-4 text-white">
            Are You an Ayurvedic Practitioner?
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-6 md:mb-8 text-sm md:text-base px-2">
            Join our platform to reach thousands of patients, manage your practice efficiently,
            and grow your Ayurvedic practice online.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/doctor/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto">
                Register as a Doctor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white bg-transparent hover:bg-white/10 w-full sm:w-auto"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Scroll to top */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl ${
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ArrowRight className="h-5 w-5 rotate-[-90deg]" />
      </button>
    </PublicLayout>
  );
}
