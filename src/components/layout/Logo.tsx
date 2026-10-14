import { Link } from "@/i18n/navigation";

export function Logo() {
  return (
    <Link href="/" className="font-display flex items-baseline gap-1 text-xl font-bold">
      <span>3D</span>
      <span className="text-accent">PIY</span>
    </Link>
  );
}
