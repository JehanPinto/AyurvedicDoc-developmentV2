import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { cn } from "@/lib/utils";

// ─── Short-version checkmarks ─────────────────────────────────────────────────
const SHORT_POINTS = [
  "We do not sell, rent, or trade your medical data to any third party, ever.",
  "Your health and appointment records are stored securely in Sri Lanka.",
  "You can request full deletion of your account and data at any time — no questions asked.",
  "We collect only what is necessary to provide you with Ayurvedic care and appointment services.",
  "We use cookies solely for functionality and analytics — never for targeted advertising.",
];

// ─── Section helpers ──────────────────────────────────────────────────────────
function SectionDivider() {
  return <div className="h-px bg-primary/40 mx-6 my-4" />;
}

function BulletList({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-sm leading-relaxed">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

// ─── Section content components ───────────────────────────────────────────────
function IntroContent() {
  return (
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <p>
        Welcome to Ayurpath — Sri Lanka's premier gateway to authentic Ayurvedic healing and holistic
        wellness. Rooted in the rich heritage of Hela Wedakama and traditional Ayurveda, we are
        dedicated to connecting you with certified practitioners while safeguarding your personal health
        data with the utmost integrity.
      </p>
      <p>
        This Privacy Policy outlines how Ayurpath (Pvt) Ltd. ("Ayurpath", "we", "us", or "our")
        collects, utilizes, manages, and protects your personal information across our website, mobile
        platforms, and wellness services (collectively, the "Services").
      </p>
      <p>
        By accessing or engaging with our Services, you acknowledge and consent to the practices
        detailed in this Policy. Your privacy is a cornerstone of the trust we build with our
        community. If you do not agree with these terms, please refrain from using our platform.
      </p>
    </div>
  );
}

function InformationContent() {
  return (
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <p>
        We collect information you provide directly and certain data generated automatically when you
        use our Services. We collect only what is strictly necessary to deliver safe, personalised
        Ayurvedic care.
      </p>
      <div>
        <h4 className="font-semibold text-base text-foreground mb-2">Patient Data</h4>
        <p>
          When you register or book an appointment, we collect your full name, gender, email address
          and phone number. This core identity data enables us to create your patient profile and link
          appointments to your account.
        </p>
      </div>
      <div>
        <h4 className="font-semibold text-base text-foreground mb-2">Payment Information</h4>
        <p>
          We collect billing address and transaction references for paid consultations. All payment
          card data is processed exclusively by our PCI-DSS Level 1 certified payment partner
          (Razorpay). Vaidya never stores your full card number, CVV, or banking credentials on our
          servers.
        </p>
      </div>
    </div>
  );
}

function HowWeUseContent() {
  return (
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <p>
        Your information is used solely to provide, improve, and secure our Services. We do not use
        your health data for advertising profiling.
      </p>
      <BulletList
        items={[
          "Matching you with qualified Ayurvedic practitioners based on your needs and location",
          "Sending appointment confirmations, reminders, and follow-up care prompts",
          "Processing payments and issuing receipts and invoices",
          "Improving platform features through aggregated, anonymised usage analytics",
        ]}
      />
      <p>We will always seek your explicit consent before using your data for any purpose not listed above.</p>
    </div>
  );
}

function SharingContent() {
  return (
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <p>
        We do not sell, rent, or trade your personal or medical information. We share data only in the
        limited circumstances described below:
      </p>
      <BulletList
        items={[
          <><strong>Your Doctor:</strong> Medical and appointment information is shared with your selected practitioner to provide care.</>,
          <><strong>Payment Processors:</strong> Billing data is shared with Razorpay solely to process your transactions securely.</>,
          <><strong>Cloud Infrastructure:</strong> Data is stored on AWS Mumbai (ap-south-1) under strict data processing agreements.</>,
          <><strong>Legal Compliance:</strong> We may disclose information if required by Indian law or valid court order.</>,
        ]}
      />
      <p>
        Any third-party service provider we engage is contractually bound to process your data only on
        our instructions and to the same security standards we uphold.
      </p>
    </div>
  );
}

function CookiesContent() {
  return (
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <p>
        We use cookies and similar technologies to keep you signed in, remember your preferences, and
        understand how our platform is used. We do not use cookies for targeted advertising or
        cross-site behavioral tracking.
      </p>
      <BulletList
        items={[
          <><strong>Essential Cookies:</strong> Required for authentication and core functionality. Cannot be disabled.</>,
          <><strong>Analytics Cookies:</strong> Used via privacy-first tools (Plausible Analytics) — fully anonymized, no personal data shared.</>,
          <><strong>Preference Cookies:</strong> Store your language, region, and accessibility settings.</>,
        ]}
      />
      <p>
        You can review and update your cookie choices at any time:{" "}
        <span
          className="text-primary font-medium cursor-pointer hover:underline"
          onClick={(e) => e.preventDefault()}
        >
          Manage Cookie Preferences
        </span>
      </p>
    </div>
  );
}

function SecurityContent() {
  return (
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <div className="bg-primary/10 rounded-xl p-5 border border-primary/20">
        <p className="text-foreground">
          Your health data is protected by AES-256 encryption at rest and TLS 1.3 for all data in
          transit. Our infrastructure is hosted on secure, cloud-based servers compliant with
          international security standards and the Personal Data Protection Act, No. 9 of 2022 of Sri
          Lanka.
        </p>
      </div>
      <p>
        We implement a multi-layered security architecture designed for sensitive healthcare data:
      </p>
      <BulletList
        items={[
          <><strong>Advanced Encryption:</strong> We utilize AES-256 field-level encryption for all medical records and consultation notes, ensuring that data is unreadable even in the database.</>,
          <><strong>Secure Transmission:</strong> TLS 1.3 is enforced for all data in transit between your device and our servers, protecting your information from interception.</>,
          <><strong>Access Control:</strong> Multi-factor authentication (MFA) is available for all patient accounts, and we strictly enforce Role-Based Access Control (RBAC)—ensuring only you, your assigned doctor, and authorized clinical staff can access your records.</>,
          <><strong>Proactive Monitoring:</strong> We conduct regular vulnerability assessments and continuous monitoring to stay ahead of emerging digital threats.</>,
        ]}
      />
    </div>
  );
}

function YourRightsContent() {
  return (
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <p>
        Under the Digital Personal Data Protection Act 2023 and applicable Indian law, you have the
        following rights regarding your personal data:
      </p>
      <BulletList
        items={[
          <><strong>Right to Access:</strong> Request a full copy of all personal data we hold about you.</>,
          <><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete information.</>,
          <><strong>Right to Erasure:</strong> Request deletion of your account and all associated data within 30 days.</>,
          <><strong>Right to Portability:</strong> Receive your data in a structured, machine-readable format (JSON or CSV).</>,
        ]}
      />
      <p>
        To exercise any of these rights, email us at{" "}
        <a
          href="mailto:support@ayurvedicdoctor.lk"
          className="text-primary font-medium hover:underline"
        >
          support@ayurvedicdoctor.lk
        </a>{" "}
        or use the Privacy Dashboard in your account settings. We respond to all requests within 24 hours.
      </p>
    </div>
  );
}

// ─── Section definitions ──────────────────────────────────────────────────────
const SECTIONS = [
  { id: "intro",       icon: "/icons/pp-introduction.png", title: "Introduction",          Content: IntroContent },
  { id: "info",        icon: "/icons/pp-information.png",  title: "Information We Collect", Content: InformationContent },
  { id: "how",         icon: "/icons/pp-how.png",          title: "How We Use Information", Content: HowWeUseContent },
  { id: "sharing",     icon: "/icons/pp-sharing.png",      title: "Sharing of Information", Content: SharingContent },
  { id: "cookies",     icon: "/icons/pp-cookies.png",      title: "Cookies & Tracking",     Content: CookiesContent },
  { id: "security",    icon: "/icons/pp-security.png",     title: "Data Security",          Content: SecurityContent },
  { id: "rights",      icon: "/icons/pp-your-rights.png",  title: "Your Rights",            Content: YourRightsContent },
];

// ─── Collapsible section card ─────────────────────────────────────────────────
function SectionCard({ icon, title, Content }: { icon: string; title: string; Content: () => React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-card border border-primary/30 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <img src={icon} alt="" className="w-7 h-7 object-contain" />
          <span className="font-semibold text-base text-foreground">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 text-primary shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <>
          <SectionDivider />
          <div className="px-6 pb-6">
            <Content />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PrivacyPolicyPage() {
  return (
    <PublicLayout>
      {/* Title */}
      <section className="bg-background py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
          Privacy Policy
        </h1>
      </section>

      <div className="bg-background pb-20">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">

          {/* Short version box */}
          <div className="bg-primary/10 border border-primary/25 rounded-2xl p-8">
            <h2 className="font-bold text-lg text-foreground mb-6">
              The short version — what matters most
            </h2>
            <div className="space-y-4">
              {SHORT_POINTS.map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <img
                    src="/icons/pp-tick.png"
                    alt="✓"
                    className="w-5 h-5 mt-0.5 shrink-0 object-contain"
                  />
                  <span className="text-sm text-muted-foreground leading-relaxed">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7 collapsible sections inside a light green outer wrapper */}
          <div className="bg-primary/10 rounded-2xl p-6 md:p-8 space-y-4">
            {SECTIONS.map((s) => (
              <SectionCard key={s.id} icon={s.icon} title={s.title} Content={s.Content} />
            ))}
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
