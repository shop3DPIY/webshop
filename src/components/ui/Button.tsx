import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "primaryAlt"
  | "secondaryAlt"
  | "accentAlt";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "border border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover backdrop-blur-lg",
  secondary:
    "bg-paper text-ink border border-white hover:bg-brand-purple/45 hover:border-brand-purple hover:text-white",
  ghost: "bg-transparent text-ink hover:bg-brand-purple/10",
  // Purple-led variants for the Serious Games track (cyan/purple/white only).
  primaryAlt:
    "border border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover backdrop-blur-lg",
  secondaryAlt:
    "bg-paper text-ink border border-white hover:bg-brand-cyan hover:border-brand-cyan hover:text-white",
  accentAlt:
    "border border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover backdrop-blur-lg",
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
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
