import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type EmailInput = z.infer<typeof emailSchema>;
type PasswordInput = z.infer<typeof passwordSchema>;

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const emailForm = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
    mode: "onChange",
  });

  const sendOtpMutation = useMutation({
    mutationFn: (data: EmailInput) =>
      apiRequest("POST", "/api/auth/forgot-password", data),
    onSuccess: () => {
      setSubmittedEmail(emailForm.getValues("email"));
      setOtp("");
      setOtpError("");
      passwordForm.reset();
      setStep("reset");
      toast({
        title: "OTP Sent",
        description: "Check your inbox for the 6-digit code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: (data: { otp: string; newPassword: string }) =>
      apiRequest("POST", "/api/auth/reset-password", {
        email: submittedEmail,
        otp: data.otp,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      toast({
        title: "Password Reset",
        description: "Your password has been updated. Please sign in.",
      });
      setLocation("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Invalid or expired OTP",
        variant: "destructive",
      });
    },
  });

  const handleReset = (data: PasswordInput) => {
    if (otp.length !== 6) {
      setOtpError("Enter the 6-digit code from your email");
      return;
    }
    setOtpError("");
    resetMutation.mutate({ otp, newPassword: data.newPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <div className="flex justify-center items-center cursor-pointer">
              <img src="/logo-light.png" alt="AyurPath" className="h-10 w-auto dark:hidden" />
              <img src="/logo-dark.png" alt="AyurPath" className="h-10 w-auto hidden dark:block" />
            </div>
          </Link>
        </div>

        {step === "email" ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle>Forgot Password</CardTitle>
              </div>
              <CardDescription>
                Enter your registered email and we'll send you a verification code.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit((d) => sendOtpMutation.mutate(d))}
                  className="space-y-4"
                >
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            data-testid="input-forgot-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={sendOtpMutation.isPending}
                    data-testid="button-send-otp"
                  >
                    {sendOtpMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Verification Code"
                    )}
                  </Button>
                </form>
              </Form>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                <Link href="/login">
                  <button className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <ArrowLeft className="h-3 w-3" />
                    Back to Sign In
                  </button>
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="h-5 w-5 text-primary" />
                <CardTitle>Reset Password</CardTitle>
              </div>
              <CardDescription>
                Enter the 6-digit code sent to <strong>{submittedEmail}</strong> and choose a new password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit(handleReset)}
                className="space-y-4"
              >
                {/* OTP field — plain useState, NOT react-hook-form controlled */}
                <div className="space-y-2">
                  <Label htmlFor="otp-input">Verification Code</Label>
                  <input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    data-testid="input-otp"
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtp(digits);
                      if (digits.length > 0) setOtpError("");
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 tracking-widest font-mono"
                  />
                  {otpError && (
                    <p className="text-sm text-destructive">{otpError}</p>
                  )}
                </div>

                <Form {...passwordForm}>
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a strong password"
                              className="pr-10"
                              autoComplete="new-password"
                              data-testid="input-new-password"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirm ? "text" : "password"}
                              placeholder="Repeat your password"
                              className="pr-10"
                              autoComplete="new-password"
                              data-testid="input-confirm-password"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirm(!showConfirm)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                            >
                              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={resetMutation.isPending}
                  data-testid="button-reset-password"
                >
                  {resetMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Didn't receive the code?{" "}
                <button
                  className="text-primary hover:underline text-sm"
                  onClick={() => { setStep("email"); setOtp(""); setOtpError(""); }}
                >
                  Try again
                </button>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
