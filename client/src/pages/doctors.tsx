import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Users } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { DoctorCard } from "@/components/doctors/doctor-card";
import { DoctorSearchFilters } from "@/components/doctors/doctor-search-filters";
import { LoadingCard, LoadingPage } from "@/components/ui/loading-spinner";
import type { DoctorWithDetails, Specialization, Hospital } from "@shared/schema";

const cities = ["Colombo", "Kandy", "Galle", "Jaffna", "Negombo", "Matara"];

export default function DoctorsPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  
  const [searchQuery, setSearchQuery] = useState(params.get("q") || "");
  const [selectedSpecialization, setSelectedSpecialization] = useState(params.get("specialization") || "all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedConsultationType, setSelectedConsultationType] = useState("all");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState("rating");

  const { data: specializations = [], isError: specError } = useQuery<Specialization[]>({
    queryKey: ["/api/specializations"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: doctors = [], isLoading, isError: docsError } = useQuery<DoctorWithDetails[]>({
    queryKey: ["/api/doctors"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const filteredDoctors = useMemo(() => {
    if (!doctors || doctors.length === 0) return [];
    
    let filtered = [...doctors];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.user?.fullName.toLowerCase().includes(query) ||
        d.specializations?.some(s => s.name.toLowerCase().includes(query))
      );
    }
    
    if (selectedSpecialization !== "all") {
      filtered = filtered.filter(d => 
        d.specializationIds?.includes(selectedSpecialization)
      );
    }
    
    if (selectedCity !== "all") {
      filtered = filtered.filter(d => 
        d.hospitals?.some(h => h.city === selectedCity) ||
        d.user?.city === selectedCity
      );
    }
    
    if (selectedConsultationType !== "all") {
      filtered = filtered.filter(d => 
        d.consultationTypes?.includes(selectedConsultationType as any)
      );
    }
    
    if (selectedLanguages.length > 0) {
      filtered = filtered.filter(d => 
        selectedLanguages.some(lang => d.languagesSpoken?.includes(lang as any))
      );
    }
    
    if (minRating > 0) {
      filtered = filtered.filter(d => (d.averageRating || 0) >= minRating);
    }
    
    filtered = filtered.filter(d => 
      d.consultationFee >= priceRange[0] && d.consultationFee <= priceRange[1]
    );
    
    switch (sortBy) {
      case "rating":
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case "fee_asc":
        filtered.sort((a, b) => a.consultationFee - b.consultationFee);
        break;
      case "fee_desc":
        filtered.sort((a, b) => b.consultationFee - a.consultationFee);
        break;
      case "experience":
        filtered.sort((a, b) => b.experienceYears - a.experienceYears);
        break;
    }
    
    return filtered;
  }, [doctors, searchQuery, selectedSpecialization, selectedCity, selectedConsultationType, selectedLanguages, minRating, priceRange, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedSpecialization !== "all") count++;
    if (selectedCity !== "all") count++;
    if (selectedConsultationType !== "all") count++;
    if (selectedLanguages.length > 0) count += selectedLanguages.length;
    if (minRating > 0) count++;
    if (priceRange[0] > 0 || priceRange[1] < 10000) count++;
    return count;
  }, [selectedSpecialization, selectedCity, selectedConsultationType, selectedLanguages, minRating, priceRange]);

  const clearFilters = () => {
    setSelectedSpecialization("all");
    setSelectedCity("all");
    setSelectedConsultationType("all");
    setSelectedLanguages([]);
    setMinRating(0);
    setPriceRange([0, 10000]);
  };

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-primary/5 to-background py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
            Find Ayurvedic Doctors
          </h1>
          <p className="text-muted-foreground">
            Discover trusted practitioners for your healthcare needs
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <DoctorSearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedSpecialization={selectedSpecialization}
          onSpecializationChange={setSelectedSpecialization}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          selectedConsultationType={selectedConsultationType}
          onConsultationTypeChange={setSelectedConsultationType}
          selectedLanguages={selectedLanguages}
          onLanguagesChange={setSelectedLanguages}
          minRating={minRating}
          onMinRatingChange={setMinRating}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          specializations={specializations}
          cities={cities}
          onClearFilters={clearFilters}
          activeFilterCount={activeFilterCount}
        />

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredDoctors.length}</span> doctors
          </p>
        </div>

        {isLoading ? (
          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <LoadingCard key={`loading-${i}`} />
            ))}
          </div>
        ) : docsError ? (
          <div className="mt-12 text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <Users className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Unable to load doctors</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              There was an error loading the doctors list. Please try again later.
            </p>
          </div>
        ) : filteredDoctors.length > 0 ? (
          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No doctors found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try adjusting your search filters or browse all available doctors.
            </p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
