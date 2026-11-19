import LandingPage from "@/components/landing/core/Lingora";
import { Suspense } from "react";
import LandingFallback from "@/components/LandingFallback";

export default function Home() {
  return (
    <Suspense fallback={<LandingFallback />}>
      <LandingPage />
    </Suspense>
  );
}
