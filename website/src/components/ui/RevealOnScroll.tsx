"use client";

import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

interface RevealOnScrollProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}

export function RevealOnScroll({
  children,
  delay = 0,
  className,
  y = 24,
}: RevealOnScrollProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Server-rendered / pre-hydration output is fully visible so content
  // never depends on JS running (resilient to script failures, crawlable).
  // The reveal animation only kicks in once mounted client-side.
  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
