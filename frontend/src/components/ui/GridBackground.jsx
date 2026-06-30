import { cn } from "@/lib/utils";

export default function GridBackground() {
  return (
    <>
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
        )}
      />

      <div className="absolute inset-0 bg-white/90 dark:bg-black/90 [mask-image:radial-gradient(circle_at_center,transparent_15%,black)]" />
    </>
  );
}