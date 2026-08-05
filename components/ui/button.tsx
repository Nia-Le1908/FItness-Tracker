import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition ease-spring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background hover:-translate-y-0.5";
  const variantClasses =
    variant === "primary"
      ? "bg-brand text-primary-foreground shadow-glow hover:opacity-95"
      : "border border-border bg-card text-card-foreground hover:border-primary/40 hover:bg-muted";

  return <button className={cn(baseClasses, variantClasses, className)} {...props} />;
}
