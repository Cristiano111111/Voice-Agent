import { Container } from "@/components/ui/Container";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="bg-charcoal pb-16 pt-36 text-stone md:pb-20 md:pt-44">
      <Container>
        <span className="text-sm font-semibold uppercase tracking-widest text-emberLight">
          {eyebrow}
        </span>
        <h1 className="mt-3 max-w-3xl text-balance font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-xl text-lg text-mud">{description}</p>
        )}
      </Container>
    </section>
  );
}
