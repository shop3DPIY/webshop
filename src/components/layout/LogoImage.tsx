import Image from "next/image";

/**
 * The 3DPIY logo, in three artworks: the purple/green one for the Shop in
 * light mode, the gradient one for Serious Games in light mode, and the
 * dark-mode one for both tracks. All three are rendered and toggled with
 * CSS (.logo-shop-light / .logo-sg-light in globals.css follow the same
 * track selectors as the rest of the theme), so the right one shows on
 * first paint with no client JS.
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
        src="/images/logo/Logo_3DPIY_color-transparent.png"
        alt="3DPIY"
        width={345}
        height={237}
        priority={priority}
        className={`logo-shop-light ${className}`}
      />
      <Image
        src="/images/logo/Logo_3DPIY_v2-transparent.png"
        alt="3DPIY"
        width={345}
        height={237}
        priority={priority}
        className={`logo-sg-light ${className}`}
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
