import { LogoImage } from "./LogoImage";
import { Link } from "@/i18n/navigation";

export function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    // The logo always leads back to the start screen (the track chooser).
    <Link href="/" className="flex items-center">
      <LogoImage priority className={className} />
    </Link>
  );
}
