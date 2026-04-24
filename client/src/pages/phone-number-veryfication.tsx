import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Phone, CheckCircle2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";

const verificationSchema = z.object({
    code: z.string().length(5, "Please enter the 5-digit verification code"),
});

type VerificationInput = z.infer<typeof verificationSchema>;

export default function EmailVerificationPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<VerificationInput>({
        resolver: zodResolver(verificationSchema),
        defaultValues: {
            code: "",
        },
    });

    const onSubmit = (data: VerificationInput) => {
        setIsSubmitting(true);
        console.log("Verification Code Submitted:", data.code);
        setTimeout(() => setIsSubmitting(false), 2000);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#FDFDFD] p-4 sm:p-8 lg:py-11 lg:px-30">
            <div className="relative w-full max-w-[1488px] min-h-[calc(100vh-2rem)] sm:min-h-[600px] lg:min-h-[708px] bg-[#E1ECE3] rounded-[24px] sm:rounded-[32px] flex flex-col xl:flex-row items-center justify-center overflow-hidden py-10 lg:py-16 px-4 sm:px-10">
                <div className="w-full xl:w-auto flex justify-center xl:absolute xl:top-10 xl:left-10 mb-8 xl:mb-0 z-10">
                    <Link href="/" data-testid="link-home">
                        <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                            <div className="w-[45px] h-[52px] md:w-[60px] md:h-[70px] lg:w-[67px] lg:h-[77.33px] rounded-lg bg-primary flex items-center justify-center">
                                <span className="text-primary-foreground font-semibold text-[24px] md:text-[42px] lg:text-[44px]">A</span>
                            </div>
                            <span className="font-heading font-semibold text-[22px] md:text-[24px] lg:text-[32px] text-[#111714]">
                                AyurvedicDoctor
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Center Verification Card */}
                <Card className="w-full max-w-[490px] bg-white border-none shadow-sm rounded-[15px] flex flex-col justify-center z-10">
                    <CardContent className="flex flex-col items-center px-4 sm:px-8 lg:px-10 py-10 sm:py-12">

                        {/* Icon */}
                        <div className="mb-5 sm:mb-6 relative w-[54px] h-[54px] sm:w-[64px] sm:h-[64px]">
                            <Phone 
                                className="absolute bottom-0 left-0 w-[42px] h-[42px] sm:w-[50px] sm:h-[50px] text-[#30A66F]" 
                                strokeWidth={1.5} 
                            />
                            <div className="absolute top-2 right-2 bg-white rounded-full p-[2px]">
                                <CheckCircle2 
                                className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] text-[#30A66F]" 
                                strokeWidth={2} 
                                />
                            </div>
                            </div>

                        {/* Titles */}
                        <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-[#111714] mb-3 sm:mb-4 text-center">
                            Verify Your Phone Number
                        </h2>

                        <p className="text-center text-[#111815] text-[13px] sm:text-[15px] lg:text-[16px] mb-2 leading-relaxed px-2">
                            We've sent a 5-digit verification code to your Phone <br className="hidden sm:block" />
                            <span className="text-[#11181599]">(+94 •••• •••89)</span> <CheckCircle2 className="inline-block w-[14px] h-[14px] sm:w-4 sm:h-4 text-[#11181599] ml-1 mb-0.5" />
                        </p>

                        {/* Form & OTP Input */}
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col items-center">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col items-center mb-8 w-full">
                                            <FormControl>
                                                <InputOTP maxLength={5} {...field}>
                                                    {/* OTP Group with responsive gaps */}
                                                    <InputOTPGroup className="gap-2 sm:gap-3 lg:gap-4 flex-wrap justify-center">
                                                        {[0, 1, 2, 3, 4].map((index) => (
                                                            <InputOTPSlot
                                                                key={index}
                                                                index={index}
                                                                // Responsive slot sizes to fit all mobile screens
                                                                className="text-black/50 w-[42px] h-[46px] sm:w-[50px] sm:h-[54px] lg:w-[50px] lg:h-[50px] text-lg sm:text-xl lg:text-2xl rounded-[8px] lg:rounded-[12px] border border-[#30A66F]/40 first:border-l first:rounded-l-[8px] lg:first:rounded-l-[12px] last:rounded-r-[8px] lg:last:rounded-r-[12px] focus-visible:ring-[#30A66F]"
                                                            />
                                                        ))}
                                                    </InputOTPGroup>
                                                </InputOTP>
                                            </FormControl>
                                            <FormMessage className="mt-2 text-center text-xs sm:text-sm" />
                                        </FormItem>
                                    )}
                                />

                                {/* Resend Code & Timer */}
                                <div className="text-center text-[13px] sm:text-[15px] lg:text-[18px] text-[#111815] mb-8">
                                    Didn't receive a code?{" "}
                                    <button type="button" className="text-[#C38322] font-semibold hover:underline">
                                        Resend Code
                                    </button>
                                    <div className="mt-1.5 sm:mt-2 text-[13px] sm:text-[15px] lg:text-[18px]">(00 : 59)</div>
                                </div>

                                {/* Verify Button */}
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || form.watch("code").length !== 5}
                                    className="w-full"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        "Verify"
                                    )}
                                </Button>

                                {/* Back to Phone Number link */}
                                <Link href="/login">
                                    <button type="button" className="mt-5 sm:mt-6 text-[#30A66F] font-semibold text-[14px] sm:text-[16px] lg:text-[18px] hover:underline">
                                        Back to Phone Number entry
                                    </button>
                                </Link>
                            </form>
                        </Form>

                    </CardContent>
                </Card>

            </div>
        </div>
    );
}