import { cn } from "@/lib/utils";

export default function DotBackgroundDemo() {
  return (
    <>
      {/* Dot Grid */}
      <div
        className={cn(
          "absolute inset-0 z-0 pointer-events-none",
          "[background-size:20px_20px]",
          "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]",
          "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]"
        )}
      />

      {/* Fade */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-zinc-50 dark:bg-black [mask-image:radial-gradient(circle_at_center,transparent_20%,black)]" />
    </>
  );
}