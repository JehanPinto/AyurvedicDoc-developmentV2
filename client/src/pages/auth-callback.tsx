import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@shared/schema";

export default function AuthCallbackPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const userJson = urlParams.get("user");
    const error = urlParams.get("error");

    if (error) {
      toast({
        title: "Authentication failed",
        description: "There was a problem signing in with Google. Please try again.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    if (token && userJson) {
      try {
        const user = JSON.parse(decodeURIComponent(userJson));
        login(user, token);
        
        toast({
          title: "Welcome!",
          description: "You have successfully signed in with Google.",
        });
        
        setTimeout(() => {
          switch (user.role) {
            case UserRole.ADMIN:
              setLocation("/admin");
              break;
            case UserRole.DOCTOR:
              setLocation("/doctor");
              break;
            default:
              setLocation("/patient");
          }
        }, 100);
      } catch {
        toast({
          title: "Authentication failed",
          description: "There was a problem processing your login. Please try again.",
          variant: "destructive",
        });
        setLocation("/login");
      }
    } else {
      setLocation("/login");
    }
  }, [login, setLocation, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
