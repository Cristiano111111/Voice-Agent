import Image from "next/image";

interface LogoProps {
  variant?: "icon" | "full";
  className?: string;
  priority?: boolean;
}

// Swap the src values here if a new logo file is dropped into /public later.
export function Logo({ variant = "icon", className, priority }: LogoProps) {
  if (variant === "full") {
    return (
      <Image
        src="/logo-full.webp"
        alt="Rabbit Pressure Washing"
        width={900}
        height={900}
        priority={priority}
        unoptimized
        className={className ?? "h-auto w-full max-w-md"}
      />
    );
  }

  return (
    <Image
      src="/logo-icon.webp"
      alt="Rabbit Pressure Washing"
      width={500}
      height={348}
      priority={priority}
      unoptimized
      className={className ?? "h-14 w-auto"}
    />
  );
}
