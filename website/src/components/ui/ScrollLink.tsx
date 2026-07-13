"use client";

import type { ReactNode } from "react";
import { useLenis } from "@/components/providers/SmoothScrollProvider";

interface ScrollLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  offset?: number;
}

export function ScrollLink({
  href,
  className,
  children,
  offset,
}: ScrollLinkProps) {
  const { scrollTo } = useLenis();

  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        scrollTo(href, offset);
      }}
    >
      {children}
    </a>
  );
}
