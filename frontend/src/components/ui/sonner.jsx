import { useTheme } from "../../context/ThemeContext";
import { Toaster as Sonner } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position="top-center"
      duration={5000}
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-zinc-900 group-[.toaster]:border-zinc-200 group-[.toaster]:shadow-xl dark:group-[.toaster]:bg-[#131313] dark:group-[.toaster]:text-zinc-100 dark:group-[.toaster]:border-zinc-800 group-[.toaster]:rounded-xl group-[.toaster]:border font-sans",
          description: "group-[.toast]:text-zinc-500 dark:group-[.toast]:text-zinc-400",
          actionButton: "group-[.toast]:bg-zinc-900 group-[.toast]:text-zinc-50 dark:group-[.toast]:bg-zinc-100 dark:group-[.toast]:text-zinc-900 group-[.toast]:font-medium group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:rounded-md",
          cancelButton: "group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-500 dark:group-[.toast]:bg-zinc-800 dark:group-[.toast]:text-zinc-400 group-[.toast]:font-medium group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:rounded-md",
        },
      }}
      {...props} />
  );
}

export { Toaster }
