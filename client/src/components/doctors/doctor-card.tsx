import { Link } from "wouter";
import { MapPin, Clock, Award, Languages } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { ConsultationTypeBadges } from "@/components/ui/status-badge";
import type { DoctorWithDetails } from "@shared/schema";

interface DoctorCardProps {
  doctor: DoctorWithDetails;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatFee = (fee: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(fee);
  };

  const primarySpecialization = doctor.specializations[0];
  const primaryHospital = doctor.hospitals[0];

  return (
    <Card 
      className="overflow-hidden hover-elevate transition-all duration-200"
      data-testid={`card-doctor-${doctor.id}`}
    >
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 rounded-lg border-2 border-primary/10">
              <AvatarImage 
                src={doctor.user.profileImage} 
                alt={doctor.user.fullName}
                className="object-cover"
              />
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xl font-semibold">
                {getInitials(doctor.user.fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-lg truncate">
                    Dr. {doctor.user.fullName}
                  </h3>
                  {primarySpecialization && (
                    <p className="text-sm text-primary font-medium">
                      {primarySpecialization.name}
                    </p>
                  )}
                </div>
                {doctor.status === "verified" && (
                  <Badge variant="secondary" className="shrink-0 gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <Award className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <StarRating 
                  rating={doctor.averageRating} 
                  showValue 
                  reviewCount={doctor.totalReviews}
                  size="sm"
                />
              </div>

              <div className="mt-3 space-y-1.5">
                {primaryHospital && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{primaryHospital.name}, {primaryHospital.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>{doctor.experienceYears} years experience</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Languages className="h-3.5 w-3.5 shrink-0" />
                  <span>{doctor.languagesSpoken.map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(", ")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Consultation Fee</p>
                <p className="text-lg font-bold text-primary">
                  {formatFee(doctor.consultationFee)}
                </p>
              </div>
              <ConsultationTypeBadges 
                types={doctor.consultationTypes} 
                size="sm"
              />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <Link href={`/doctors/${doctor.id}`}>
            <Button className="w-full" data-testid={`button-book-doctor-${doctor.id}`}>
              View Profile & Book
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
