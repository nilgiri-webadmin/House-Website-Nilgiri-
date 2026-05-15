import React from "react";
import Globe from "./globe";
import { cn } from "@/lib/utils";

export default function GlobeSection({
  title = "Explore",
  subtitle = "Nilgiri House",
  description = "Welcome to Nilgiri House – your home away from home at IIT Madras. Just like the breathtaking Nilgiri mountains known for their emerald tea plantations, misty valleys, and rich biodiversity, our community offers a refreshing escape from the hustle of campus life. Experience the warmth of a close-knit community, forge lifelong friendships, and create unforgettable memories in the lap of nature's serenity.",
  actions = [
    { label: "Begin Journey", variant: "primary", onClick: () => {} },
    { label: "Learn More", variant: "secondary", onClick: () => {} },
  ],
  className,
}) {
  return (
    <section
      className={cn(
        "relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-background text-foreground px-6 sm:px-10 md:px-16 lg:px-20",
        className
      )}
    >
      {/* Globe - centered in background */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <div className="scale-100 sm:scale-125 md:scale-150">
          <Globe />
        </div>
      </div>

      {/* Text content - centered on top */}
      <div className="relative z-10 w-full max-w-md md:max-w-lg lg:max-w-xl text-center">
        <h2 className="font-bold leading-[1.05] tracking-tight mb-6 text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
          <div className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            {title}
          </div>
          {subtitle && (
            <div className="text-muted-foreground/70 text-[0.6em] font-medium tracking-wider mt-1">
              {subtitle}
            </div>
          )}
        </h2>

        <p className="text-muted-foreground/80 leading-relaxed text-base sm:text-lg md:text-xl font-light mb-8">
          {description}
        </p>
      </div>
    </section>
  );
}
