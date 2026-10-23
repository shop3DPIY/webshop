import Image from "next/image";

const MAIN = "/images/logo/logo-3dpiy-v3.png";
const DARK_SG = "/images/logo/logo-3dpiy-dark-sg-v4.png";

/**
 * The 3DPIY logo. The purple artwork is used everywhere (Shop light and
 * dark, Serious Games light); Serious Games in dark mode gets the
 * gradient artwork. Both are rendered and toggled with CSS (.logo-main /
 * .logo-sg-dark in globals.css, using the same track selectors as the
 * rest of the theme), so the right one shows on first paint with no JS.
 *
 * `variant="chooser"` is the start screen, which always shows the
 * gradient artwork.
 */
export function LogoImage({
  className = "",
  priority = false,
  variant = "site",
}: {
  className?: string;
  priority?: boolean;
  variant?: "site" | "chooser";
}) {
  if (variant === "chooser") {
    return (
      <Image
        src={DARK_SG}
        alt="3DPIY"
        width={345}
        height={237}
        priority={priority}
        className={className}
      />
    );
  }
  return (
    <>
      <Image
        src={MAIN}
        alt="3DPIY"
        width={345}
        height={237}
        priority={priority}
        className={`logo-main ${className}`}
      />
      <Image
        src={DARK_SG}
        alt="3DPIY"
        width={345}
        height={237}
        priority={priority}
        className={`logo-sg-dark ${className}`}
      />
    </>
  );
}
