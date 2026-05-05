import { useState } from "react";
import { Search, Filter, X, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ConsultationType, Language } from "@shared/schema";
import type { Specialization } from "@shared/schema";

interface DoctorSearchFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedSpecialization: string;
  onSpecializationChange: (value: string) => void;
  selectedCity: string;
  onCityChange: (value: string) => void;
  selectedConsultationType: string;
  onConsultationTypeChange: (value: string) => void;
  selectedLanguages: string[];
  onLanguagesChange: (value: string[]) => void;
  minRating: number;
  onMinRatingChange: (value: number) => void;
  priceRange: [number, number];
  onPriceRangeChange: (value: [number, number]) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  specializations: Specialization[];
  cities: string[];
  onClearFilters: () => void;
  activeFilterCount: number;
}

export function DoctorSearchFilters({
  searchQuery,
  onSearchChange,
  selectedSpecialization,
  onSpecializationChange,
  selectedCity,
  onCityChange,
  selectedConsultationType,
  onConsultationTypeChange,
  selectedLanguages,
  onLanguagesChange,
  minRating,
  onMinRatingChange,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortByChange,
  specializations,
  cities,
  onClearFilters,
  activeFilterCount,
}: DoctorSearchFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const languages = [
    { value: Language.ENGLISH, label: "English" },
    { value: Language.SINHALA, label: "Sinhala" },
    { value: Language.TAMIL, label: "Tamil" },
  ];

  const consultationTypes = [
    { value: ConsultationType.IN_PERSON, label: "In Person" },
    { value: ConsultationType.ONLINE, label: "Online" },
    { value: ConsultationType.HOME_VISIT, label: "Home Visit" },
  ];

  const sortOptions = [
    { value: "rating", label: "Highest Rated" },
    { value: "fee_asc", label: "Price: Low to High" },
    { value: "fee_desc", label: "Price: High to Low" },
    { value: "experience", label: "Most Experienced" },
  ];

  const toggleLanguage = (language: string) => {
    if (selectedLanguages.includes(language)) {
      onLanguagesChange(selectedLanguages.filter(l => l !== language));
    } else {
      onLanguagesChange([...selectedLanguages, language]);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Single toolbar containing all pill-shaped filters */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl border border-[#47836c]/30 bg-[#47836c]/10 backdrop-blur-md">

        {/* Search pill */}
        <div className="relative flex items-center bg-[#47836c]/25 backdrop-blur-sm rounded-full px-4 h-9 gap-2 flex-1 min-w-[200px]">
          <Search className="h-3.5 w-3.5 text-[#47836c] shrink-0" />
          <input
            placeholder="Search doctors by name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent outline-none text-sm text-foreground placeholder:text-foreground w-full"
            data-testid="input-search-doctors"
          />
        </div>

        {/* All Specializations pill */}
        <Select value={selectedSpecialization} onValueChange={onSpecializationChange}>
          <SelectTrigger className="bg-[#47836c]/25 backdrop-blur-sm border-0 rounded-full h-9 px-4 text-sm focus:ring-0 shadow-none w-auto gap-1 text-foreground" data-testid="select-specialization">
            <SelectValue placeholder="All Specializations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specializations</SelectItem>
            {specializations.map((spec) => (
              <SelectItem key={spec.id} value={spec.id}>{spec.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* All Cities pill */}
        <Select value={selectedCity} onValueChange={onCityChange}>
          <SelectTrigger className="bg-[#47836c]/25 backdrop-blur-sm border-0 rounded-full h-9 px-4 text-sm focus:ring-0 shadow-none w-auto gap-1 text-foreground" data-testid="select-city">
            <MapPin className="h-3.5 w-3.5 text-[#47836c] shrink-0" />
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filters pill */}
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <button
              className="relative bg-[#47836c]/25 backdrop-blur-sm rounded-full h-9 px-4 flex items-center gap-2 text-sm text-foreground shrink-0"
              data-testid="button-filters"
            >
              <Filter className="h-3.5 w-3.5 text-[#47836c]" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </button>
          </SheetTrigger>
            <SheetContent className="w-[340px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  Filters
                  {activeFilterCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onClearFilters}
                      className="text-muted-foreground"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear all
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="space-y-3">
                  <Label>Consultation Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {consultationTypes.map((type) => (
                      <Badge
                        key={type.value}
                        variant={selectedConsultationType === type.value ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => onConsultationTypeChange(
                          selectedConsultationType === type.value ? "all" : type.value
                        )}
                      >
                        {type.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Languages</Label>
                  <div className="space-y-2">
                    {languages.map((lang) => (
                      <div key={lang.value} className="flex items-center gap-2">
                        <Checkbox
                          id={lang.value}
                          checked={selectedLanguages.includes(lang.value)}
                          onCheckedChange={() => toggleLanguage(lang.value)}
                        />
                        <label htmlFor={lang.value} className="text-sm cursor-pointer">
                          {lang.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Minimum Rating: {minRating > 0 ? minRating.toFixed(1) : "Any"}
                  </Label>
                  <Slider
                    value={[minRating]}
                    onValueChange={([value]) => onMinRatingChange(value)}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label>
                    Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => onPriceRangeChange(value as [number, number])}
                    min={0}
                    max={10000}
                    step={500}
                    className="w-full"
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => setIsFilterOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

        {/* Highest Rated pill */}
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="bg-[#47836c]/25 backdrop-blur-sm border-0 rounded-full h-9 px-4 text-sm focus:ring-0 shadow-none w-auto gap-1 text-foreground" data-testid="select-sort">
            <SelectValue placeholder="Highest Rated" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

      </div>

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedSpecialization !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {specializations.find(s => s.id === selectedSpecialization)?.name}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onSpecializationChange("all")}
              />
            </Badge>
          )}
          {selectedCity !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {selectedCity}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onCityChange("all")}
              />
            </Badge>
          )}
          {selectedConsultationType !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {consultationTypes.find(c => c.value === selectedConsultationType)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onConsultationTypeChange("all")}
              />
            </Badge>
          )}
          {selectedLanguages.map((lang) => (
            <Badge key={lang} variant="secondary" className="gap-1">
              {languages.find(l => l.value === lang)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleLanguage(lang)}
              />
            </Badge>
          ))}
          {minRating > 0 && (
            <Badge variant="secondary" className="gap-1">
              {minRating}+ stars
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onMinRatingChange(0)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
