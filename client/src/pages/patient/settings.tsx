import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  Save,
  AlertCircle,
  Check,
  Lock,
  Camera
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingPage, LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  preferredLanguages: z.array(z.string()).default(["english"]),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function PatientSettings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      gender: user?.gender || "",
      dateOfBirth: user?.dateOfBirth || "",
      address: user?.address || "",
      city: user?.city || "",
      preferredLanguages: user?.preferredLanguages || ["english"],
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const result = await apiRequest("PUT", "/api/users/profile", data);
      return result as UserType;
    },
    onSuccess: (updatedUser: UserType) => {
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordFormData) =>
      apiRequest("PUT", "/api/users/password", { 
        currentPassword: data.currentPassword, 
        newPassword: data.newPassword 
      }),
    onSuccess: () => {
      passwordForm.reset();
      toast({ title: "Password changed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to change password. Please check your current password.", variant: "destructive" });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: "Invalid file type", 
        description: "Please upload a JPEG, PNG, GIF, or WebP image.",
        variant: "destructive" 
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: "File too large", 
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive" 
      });
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    const token = localStorage.getItem("token");
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch("/api/users/profile-image", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profile picture updated successfully" });
    } catch (error) {
      toast({ 
        title: "Failed to upload image", 
        description: "Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsUploadingImage(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  if (!user) {
    return <LoadingPage message="Loading settings..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold" data-testid="text-page-title">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.profileImage} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploadingImage ? (
                      <LoadingSpinner className="h-6 w-6 text-white" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    data-testid="input-profile-image"
                  />
                </div>
                <div>
                  <h3 className="font-medium">{user.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    {user.isEmailVerified ? (
                      <Badge variant="secondary" className="gap-1">
                        <Check className="h-3 w-3" />
                        Email verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-amber-600">
                        <AlertCircle className="h-3 w-3" />
                        Email not verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                className="pl-10"
                                data-testid="input-full-name"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                className="pl-10"
                                placeholder="+94 77 123 4567"
                                data-testid="input-phone"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-gender">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                type="date"
                                className="pl-10"
                                data-testid="input-dob"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Textarea 
                                {...field} 
                                className="pl-10 min-h-[80px]"
                                placeholder="Your street address"
                                data-testid="input-address"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-city">
                                <SelectValue placeholder="Select city" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="colombo">Colombo</SelectItem>
                              <SelectItem value="kandy">Kandy</SelectItem>
                              <SelectItem value="galle">Galle</SelectItem>
                              <SelectItem value="jaffna">Jaffna</SelectItem>
                              <SelectItem value="negombo">Negombo</SelectItem>
                              <SelectItem value="anuradhapura">Anuradhapura</SelectItem>
                              <SelectItem value="matara">Matara</SelectItem>
                              <SelectItem value="kurunegala">Kurunegala</SelectItem>
                              <SelectItem value="batticaloa">Batticaloa</SelectItem>
                              <SelectItem value="trincomalee">Trincomalee</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="preferredLanguages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Language</FormLabel>
                          <Select 
                            onValueChange={(val) => field.onChange([val])} 
                            value={field.value?.[0] || "english"}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-language">
                                <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="english">English</SelectItem>
                              <SelectItem value="sinhala">Sinhala</SelectItem>
                              <SelectItem value="tamil">Tamil</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose your preferred language for the platform
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? (
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              {...field} 
                              type="password"
                              className="pl-10"
                              data-testid="input-current-password"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              {...field} 
                              type="password"
                              className="pl-10"
                              data-testid="input-new-password"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Password must be at least 8 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              {...field} 
                              type="password"
                              className="pl-10"
                              data-testid="input-confirm-password"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={changePasswordMutation.isPending}
                    data-testid="button-change-password"
                  >
                    {changePasswordMutation.isPending ? (
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    Change Password
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>
                Additional security settings for your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Email Verification</h4>
                  <p className="text-sm text-muted-foreground">
                    {user.isEmailVerified 
                      ? "Your email is verified" 
                      : "Verify your email to secure your account"}
                  </p>
                </div>
                {user.isEmailVerified ? (
                  <Badge variant="secondary" className="gap-1" data-testid="badge-email-verified">
                    <Check className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" data-testid="button-verify-email">
                    Verify Email
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Phone Verification</h4>
                  <p className="text-sm text-muted-foreground">
                    {user.isPhoneVerified 
                      ? "Your phone is verified" 
                      : "Verify your phone for SMS notifications"}
                  </p>
                </div>
                {user.isPhoneVerified ? (
                  <Badge variant="secondary" className="gap-1" data-testid="badge-phone-verified">
                    <Check className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" data-testid="button-verify-phone" onClick={() => navigate("/patient/verify-phone")}>
                    Verify Phone
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
