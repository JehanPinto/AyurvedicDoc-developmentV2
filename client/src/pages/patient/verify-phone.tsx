import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { PhoneCall, CheckCircle, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

function MaskedPhone({ phone }: { phone: string }) {
  const digits = phone.replace(/\D/g, "");
  const last3 = digits.slice(-3) || "890";
  return (
    <span className="inline-flex items-center gap-0.5">
      <span>(+94</span>
      <span className="inline-flex items-center gap-[3px] mx-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="inline-block w-[5px] h-[5px] rounded-full bg-foreground align-middle" />
        ))}
      </span>
      <span>{last3})</span>
    </span>
  );
}

export default function VerifyPhonePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [countdown, setCountdown] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    if (paste.length === 5) {
      setOtp(paste.split(""));
      inputRefs.current[4]?.focus();
    }
    e.preventDefault();
  };

  const handleResend = () => {
    setCountdown(59);
    setCanResend(false);
    setOtp(["", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const handleVerify = () => {
    const code = otp.join("");
    if (code.length < 5) return;
    // Mock: any 5-digit code works for now
    setVerified(true);
    setTimeout(() => navigate("/patient/settings"), 2000);
  };

  return (
    <div className="min-h-screen bg-[#e8f0eb] dark:bg-background flex flex-col">
      {/* Top left logo */}
      <div className="p-6">
        <Link href="/patient">
          <div className="flex items-center gap-2 cursor-pointer w-fit">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </div>
            <span className="font-heading font-bold text-xl text-foreground">AyurvedicDoctor</span>
          </div>
        </Link>
      </div>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-card rounded-2xl shadow-lg w-full max-w-md p-6 sm:p-10 text-center border border-border">

          {verified ? (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Phone Verified!</h2>
              <p className="text-muted-foreground text-sm">Redirecting you back to settings...</p>
            </>
          ) : (
            <>
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <PhoneCall className="h-10 w-10 text-primary" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Verify Your Phone Number
              </h2>

              {/* Subtitle */}
              <p className="text-sm text-muted-foreground mb-1">
                We've sent a 5-digit verification code to your Phone
              </p>
              <p className="text-sm font-medium text-foreground mb-6 flex items-center justify-center gap-1.5">
                <MaskedPhone phone={user?.phone || ""} />
                <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </p>

              {/* OTP boxes */}
              <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-10 h-10 sm:w-12 sm:h-12 text-center text-base sm:text-lg font-semibold border-2 border-primary/30 rounded-xl outline-none focus:border-primary transition-colors text-foreground bg-card"
                  />
                ))}
              </div>

              {/* Resend */}
              <div className="flex flex-wrap items-center justify-center gap-1 mb-2 text-sm">
                <span className="text-muted-foreground">Didn't receive a code?</span>
                <button
                  onClick={handleResend}
                  disabled={!canResend}
                  className={`font-semibold transition-colors ${canResend ? "text-orange-500 hover:text-orange-600 cursor-pointer" : "text-orange-300 cursor-not-allowed"}`}
                >
                  Resend Code
                </button>
              </div>

              {/* Countdown */}
              <p className="text-sm text-muted-foreground mb-6">
                ({String(0).padStart(2, "0")} : {String(countdown).padStart(2, "0")})
              </p>

              {/* Verify button */}
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white mb-4"
                onClick={handleVerify}
                disabled={otp.join("").length < 5}
              >
                Verify
              </Button>

              {/* Back link */}
              <Link href="/patient/settings">
                <span className="text-sm text-primary font-semibold cursor-pointer hover:underline">
                  Back to Account Security
                </span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
