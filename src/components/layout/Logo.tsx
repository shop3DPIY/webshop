import { LogoImage } from "./LogoImage";
import { Link } from "@/i18n/navigation";

export function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    // The logo always leads back to the start screen (the track chooser).
    // The link carries the name; the logo images (a light and a dark
    // variant, one hidden) are decorative, so it isn't read out twice.
    <Link href="/" aria-label="3DPIY" className="flex items-center">
      <LogoImage priority className={className} />
    </Link>
  );
}
