import { Link } from "wouter";
import { useState } from "react";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  X,
  Copy,
  Check,
  PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const footerLinks = {
  platform: [
    { label: "Find Doctors", href: "/doctors", key: "find-doctors" },
    { label: "Specializations", href: "/specializations", key: "specializations" },
    { label: "Book Appointment", href: "/book", key: "book-appointment" },
    { label: "For Doctors", href: "/doctor/register", key: "for-doctors" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
    { label: "Blog", href: "/blog" },
  ],
  support: [
    { label: "Help Center", href: "/help" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "FAQs", href: "/faqs" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

const PHONE = "+94 11 234 5678";
const PHONE_TEL = "+94112345678";

function PhoneModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PHONE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <PhoneCall className="h-7 w-7 text-primary" />
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Call us at</p>
          <p className="text-2xl font-bold tracking-wide">{PHONE}</p>
          <p className="text-xs text-muted-foreground mt-1">Mon – Sat, 8 AM – 6 PM</p>
        </div>

        <div className="flex gap-3 w-full mt-1">
          <a href={`tel:${PHONE_TEL}`} className="flex-1">
            <Button className="w-full gap-2">
              <Phone className="h-4 w-4" />
              Call Now
            </Button>
          </a>
          <Button variant="outline" className="flex-1 gap-2" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl">A</span>
                </div>
                <span className="font-heading font-bold text-xl">AyurvedicDoctor</span>
              </div>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm text-sm md:text-base">
              Sri Lanka's premier platform for discovering and booking trusted Ayurvedic
              practitioners. Experience holistic healthcare at your fingertips.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span>support@ayurvedicdoctor.lk</span>
              </div>
              <div
                className="flex items-center gap-3 text-sm text-muted-foreground cursor-pointer group w-fit"
                onClick={() => setShowPhoneModal(true)}
              >
                <Phone className="h-4 w-4 shrink-0 group-hover:text-primary transition-colors" />
                <span className="group-hover:text-primary group-hover:underline transition-colors">
                  {PHONE}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>Colombo, Sri Lanka</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm md:text-base">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm md:text-base">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm md:text-base">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="my-6 md:my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            &copy; {new Date().getFullYear()} AyurvedicDoctor. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={social.label}
                data-testid={`link-social-${social.label.toLowerCase()}`}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {showPhoneModal && <PhoneModal onClose={() => setShowPhoneModal(false)} />}
    </footer>
  );
}
