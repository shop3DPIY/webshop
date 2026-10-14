import Image from "next/image";
import { Link } from "@/i18n/navigation";

export function Logo() {
  return (
    // ?pick=1 forces the track chooser instead of the usual auto-redirect
    // to the visitor's last-picked track (see src/app/[locale]/page.tsx) —
    // the logo is always "go back to the start", not "go to my track".
    <Link href="/?pick=1" className="flex items-center">
      <Image
        src="/images/logo/Logo_3DPIY-transparent.png"
        alt="3DPIY"
        width={334}
        height={216}
        priority
        className="h-12 w-auto"
      />
    </Link>
  );
}
