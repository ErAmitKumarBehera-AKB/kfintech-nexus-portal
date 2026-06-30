import React from 'react';
import { CometCard } from "@/components/ui/comet-card";

export default function CometCardDemo() {
  return (
    <CometCard>
      <div
        className="my-10 flex w-[300px] sm:w-[350px] cursor-pointer flex-col items-stretch rounded-2xl border-0 bg-white/5 dark:bg-[#1F2121]/50 backdrop-blur-md p-2 shadow-2xl md:my-0 md:p-4 border-white/20 dark:border-white/10"
        style={{
          transformStyle: "preserve-3d",
          transform: "none",
          opacity: 1,
        }}
      >
        <div className="mx-2 flex-1">
          <div className="relative mt-2 aspect-[3/4] w-full">
            <img
              loading="lazy"
              className="absolute inset-0 h-full w-full rounded-2xl bg-black object-cover contrast-100"
              alt="FinnovaX VIP Access"
              src="https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2064&auto=format&fit=crop"
              style={{
                boxShadow: "rgba(0, 0, 0, 0.2) 0px 10px 30px 0px",
                opacity: 1,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-2xl pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-lg font-bold tracking-tight">FinnovaX Early Access</h3>
                <p className="text-xs text-white/70 mt-1">Join the next generation of enterprise grievance resolution.</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-shrink-0 items-center justify-between p-2 font-mono text-white/80 dark:text-white">
          <div className="text-xs font-semibold">VIP Pass</div>
          <div className="text-xs text-kfintech-primary dark:text-blue-400 font-bold tracking-widest">#FNX-2026</div>
        </div>
      </div>
    </CometCard>
  );
}
