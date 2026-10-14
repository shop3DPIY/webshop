import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware Link/router/pathname helpers. Use these instead of the
 * plain next/navigation or next/link exports anywhere a URL might need a
 * locale prefix.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
