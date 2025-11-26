// import HeroSection from "@/components/ui/HeroSection/page";

import HeroSection from "@/components/HeroSection/page";

export default function HomePage() {
  return(
    <div style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(236, 72, 153, 0.25), transparent 70%), #000000",
      }} className="w-full mx-auto h-screen flex flex-col items-center justify-center text-center">
      <HeroSection/>
    </div>
  )
}