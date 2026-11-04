import { notFound } from "next/navigation";

/** Any URL no other page matches → the site's own 404 (./../not-found.tsx). */
export default function CatchAll() {
  notFound();
}
