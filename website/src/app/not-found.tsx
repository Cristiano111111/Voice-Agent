import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] items-center bg-charcoal text-stone">
      <Container className="text-center">
        <div className="mx-auto w-32">
          <Logo variant="full" />
        </div>
        <h1 className="mt-8 font-display text-5xl font-extrabold uppercase tracking-tight md:text-6xl">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-mud">
          That page got washed away. Let&apos;s get you back on track.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-ember px-8 py-4 text-base font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          Back to home
        </Link>
      </Container>
    </main>
  );
}
