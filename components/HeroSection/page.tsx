"use client";

import { FireworksBackground } from "@/components/ui/fireworks";
import GlitchText from "@/components/ui/GlitchText";
import GradientText from "@/components/ui/GradientText";

export default function HeroSection() {
    return (
        <div className="w-full h-screen relative flex flex-col justify-center items-center bg-black overflow-hidden">

            {/* Fireworks Background */}
            <FireworksBackground
                population={2}
                className="absolute bottom-0"
                color={["#ffcc00", "#ff0066", "#00ccff", "#ffffff"]}
                canvasProps={{ className: "pointer-events-none" }}
            />

            {/* Main Content */}
            <div className="relative w-full max-w-5xl z-10 flex flex-col justify-center items-center gap-2">

                {/* GLITCH TEXT — center aligned */}
                <GlitchText speed={1.8} className="text-7xl font-bold text-white">
                    HAPPY NEW
                </GlitchText>
                <GlitchText speed={1.8} className="text-7xl font-bold text-white">
                    YEAR
                </GlitchText>

                <GradientText
                    colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
                    animationSpeed={3}
                    showBorder={false}
                    className="custom-class text-5xl font-bold mt-4"
                >
                    Welcome to 2026 
                </GradientText>
            </div>
        </div>
    );
}
