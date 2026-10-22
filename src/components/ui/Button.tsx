import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "primaryAlt" | "secondaryAlt" | "accentAlt";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-brand-cyan text-night hover:bg-brand-purple hover:text-white",
  secondary:
    "bg-paper text-ink border border-white hover:bg-brand-periwinkle hover:text-white hover:border-brand-cyan",
  ghost: "bg-transparent text-ink hover:bg-brand-purple/10",
  // Purple-led variants for the Serious Games track (cyan/periwinkle/purple/white only).
  primaryAlt: "bg-brand-purple text-white hover:bg-brand-cyan hover:text-night",
  secondaryAlt:
    "bg-paper text-ink border border-brand-purple/40 hover:bg-brand-purple hover:text-white",
  accentAlt: "bg-brand-cyan text-night hover:bg-brand-purple hover:text-white",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

interface ButtonProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  href?: string;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  className = "",
  type = "button",
  onClick,
  disabled,
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
