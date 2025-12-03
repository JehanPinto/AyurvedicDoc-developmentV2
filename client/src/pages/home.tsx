import { Link } from "wouter";
import { 
  Search, 
  Video, 
  Calendar, 
  Shield, 
  Star,
  ArrowRight,
  CheckCircle,
  Users,
  Award,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PublicLayout } from "@/components/layout/public-layout";
import { SpecializationCard } from "@/components/doctors/specialization-card";
import { StarRating } from "@/components/ui/star-rating";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Specialization, DoctorWithDetails } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

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

  const { 
    data: specializations = [], 
    isLoading: specLoading,
    isError: specError 
  } = useQuery<Specialization[]>({
    queryKey: ["/api/specializations"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { 
    data: featuredDoctors = [], 
    isLoading: docsLoading,
    isError: docsError 
  } = useQuery<DoctorWithDetails[]>({
    queryKey: ["/api/doctors/featured"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/doctors?q=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5">
              Sri Lanka's #1 Ayurvedic Healthcare Platform
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight mb-6">
              Find & Book{" "}
              <span className="text-primary">Ayurvedic Doctors</span>{" "}
              Near You
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover trusted Ayurvedic practitioners, book appointments online or in-person, 
              and experience holistic healthcare rooted in ancient wisdom.
            </p>

            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search doctors, specializations, or locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base"
                    data-testid="input-hero-search"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-8" data-testid="button-hero-search">
                  Find Doctors
                </Button>
              </div>
            </form>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
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

      <section className="py-12 bg-card border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Browse by Specialization
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find the right Ayurvedic specialist for your specific health needs
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {specLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={`spec-skel-${i}`} className="h-32 rounded-lg" />
              ))
            ) : specError ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">Unable to load specializations. Please try again later.</p>
              </div>
            ) : specializations.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No specializations available at the moment.</p>
              </div>
            ) : (
              specializations.slice(0, 6).map((spec) => (
                <SpecializationCard
                  key={spec.id}
                  id={spec.id}
                  name={spec.name}
                  description={spec.description || ""}
                  icon={spec.icon || "Leaf"}
                  doctorCount={0}
                />
              ))
            )}
          </div>

          <div className="text-center mt-8">
            <Link href="/specializations">
              <Button variant="outline" size="lg">
                View All Specializations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Top Rated Doctors
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Connect with our highest-rated Ayurvedic practitioners
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {docsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={`doc-skel-${i}`} className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-16 w-16 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full mt-4" />
                </Card>
              ))
            ) : docsError ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">Unable to load featured doctors. Please try again later.</p>
              </div>
            ) : featuredDoctors.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No featured doctors available at the moment.</p>
              </div>
            ) : (
              featuredDoctors.map((doctor) => (
                <Card 
                  key={doctor.id} 
                  className="hover-elevate transition-all duration-200"
                  data-testid={`card-featured-doctor-${doctor.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 rounded-xl border-2 border-primary/10">
                        <AvatarImage src={doctor.user?.profileImage} alt={doctor.user?.fullName} />
                        <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold">
                          {doctor.user?.fullName?.split(" ").map(n => n[0]).join("") || "DR"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{doctor.user?.fullName}</h3>
                        <p className="text-sm text-primary">
                          {doctor.specializations?.[0]?.name || "Ayurvedic Specialist"}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <StarRating rating={doctor.averageRating || 0} size="sm" showValue />
                          <span className="text-xs text-muted-foreground">
                            ({doctor.totalReviews || 0} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{doctor.experienceYears || 0} yrs exp</span>
                      </div>
                      <span>{doctor.user?.city || doctor.hospitals?.[0]?.city || "Sri Lanka"}</span>
                      <span className="font-semibold text-foreground">
                        Rs. {(doctor.consultationFee || 0).toLocaleString()}
                      </span>
                    </div>

                    <Link href={`/doctors/${doctor.id}`}>
                      <Button className="w-full mt-4" variant="outline">
                        View Profile
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="text-center mt-8">
            <Link href="/doctors">
              <Button size="lg">
                Browse All Doctors
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Book your Ayurvedic consultation in just a few simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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
              <div key={item.step} className="text-center">
                <div className="relative inline-flex mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                    <item.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              What Our Patients Say
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied patients who trust AyurvedicDoctor
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="relative">
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

      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Are You an Ayurvedic Practitioner?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join our platform to reach thousands of patients, manage your practice efficiently, 
            and grow your Ayurvedic practice online.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/doctor/register">
              <Button size="lg" variant="secondary">
                Register as a Doctor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
