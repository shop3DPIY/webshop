import Image from "next/image";

/**
 * The 3DPIY logo, swapped for the dark-mode artwork when <html class="dark">
 * is set. Both are rendered and toggled with CSS so the right one shows on
 * first paint (the theme comes from a cookie, no client JS needed).
 */
export function LogoImage({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <>
      <Image
        src="/images/logo/Logo_3DPIY-transparent.png"
        alt="3DPIY"
        width={334}
        height={216}
        priority={priority}
        className={`dark:hidden ${className}`}
      />
      <Image
        src="/images/logo/Logo_3dpiy_dark_v2-transparent.png"
        alt="3DPIY"
        width={349}
        height={237}
        priority={priority}
        className={`hidden dark:block ${className}`}
      />
    </>
  );
}
