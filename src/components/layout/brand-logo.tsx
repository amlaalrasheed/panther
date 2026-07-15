import { cn } from "@/lib/utils";

export function BrandLogo({ size = "default", className }: { size?: "default" | "lg"; className?: string }) {
  return (
    <span
      className={cn(
        "font-serif font-semibold tracking-tight text-primary",
        size === "lg" ? "text-3xl" : "text-lg",
        className
      )}
    >
      Saudi Panther
    </span>
  );
}
