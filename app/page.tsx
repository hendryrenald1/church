import { Hero } from "@/components/ui/animated-hero";
import { FeatureSection } from "@/components/ui/feature-section";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <FeatureSection />
    </main>
  );
}
