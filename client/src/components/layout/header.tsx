import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  Calendar, 
  FileText,
  Bell,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@shared/schema";

const publicNavItems = [
  { label: "Find Doctors", href: "/doctors" },
  { label: "Specializations", href: "/specializations" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    switch (user.role) {
      case UserRole.ADMIN:
        return "/admin";
      case UserRole.DOCTOR:
        return "/doctor";
      default:
        return "/patient";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4 gap-2 md:gap-4">
        <div className="flex items-center gap-4 md:gap-6 lg:gap-8">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">A</span>
              </div>
              <span className="font-heading font-bold text-xl hidden lg:block">
                AyurvedicDoctor
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {publicNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant="ghost" 
                  className={location === item.href ? "text-orange-500 bg-orange-500/10" : ""}
                  data-testid={`link-nav-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <>
              <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-2xs">
                  3
                </Badge>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImage} alt={user.fullName} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:block text-sm font-medium max-w-32 truncate">
                      {user.fullName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/appointments" className="flex items-center cursor-pointer">
                      <Calendar className="mr-2 h-4 w-4" />
                      My Appointments
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                    data-testid="button-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden lg:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" data-testid="button-login">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button data-testid="button-register">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden border-t bg-background animate-slide-in-from-top">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {publicNavItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                >
                  {item.label}
                </Button>
              </Link>
            ))}
            {!user && (
              <>
                <hr className="my-2" />
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
