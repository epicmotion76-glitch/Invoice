import { m } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
  as?: "div" | "li" | "article" | "figure";
  className?: string;
  delay?: number;
  children: ReactNode;
};

/** Fades content up once as it scrolls into view. Motion is reduced automatically via MotionConfig. */
export function Reveal({ as = "div", className, delay = 0, children }: RevealProps) {
  const Component = m[as] as typeof m.div;

  return (
    <Component
      className={className}
      data-reveal=""
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </Component>
  );
}
