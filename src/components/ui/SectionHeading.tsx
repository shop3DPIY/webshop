export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /** Use "h1" when this is a page's main heading (there is no other h1 on the page). */
  as?: "h1" | "h2";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      {eyebrow && (
        <p className="text-accent mb-2 text-sm font-semibold tracking-wide uppercase">
          {eyebrow}
        </p>
      )}
      <Heading className="font-display text-3xl font-semibold sm:text-4xl">{title}</Heading>
      {description && (
        <p className="text-ink/70 mt-3 max-w-2xl text-base sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
