import Image from "next/image";
import { Link } from "@/i18n/navigation";

export function Logo() {
  return (
    <Link href="/" className="flex items-center">
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
