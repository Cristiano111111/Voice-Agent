interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      {eyebrow && (
        <span
          className={`text-sm font-semibold uppercase tracking-widest ${
            dark ? "text-emberLight" : "text-ember"
          }`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`mt-3 text-balance font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-5xl ${
          dark ? "text-stone" : "text-charcoal"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-lg ${dark ? "text-mud" : "text-charcoal/70"}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
