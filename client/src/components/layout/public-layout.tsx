import type { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";

interface PublicLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  showHeader?: boolean;
}

export function PublicLayout({ children, showFooter = true, showHeader = true }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
