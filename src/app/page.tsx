import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ExperiencesSection } from "@/components/ExperiencesSection";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <ExperiencesSection />
        <Features />
        <HowItWorks />
        <CTA />
        <Footer />
      </main>
    </div>
  );
}
