import type { ReactNode } from "react";

export type ServiceIconName = "general" | "cosmetic" | "whitening" | "implants" | "aligners" | "emergency";

const TOOTH =
  "M8 3.5c-2.6 0-4.5 2-4.5 4.8 0 1.9.7 3.3 1.3 4.9.6 1.7.8 3.5 1.2 5.3.3 1.6.8 2.5 1.8 2.5 1.2 0 1.5-1.5 1.8-3 .3-1.4.7-2.8 2.4-2.8s2.1 1.4 2.4 2.8c.3 1.5.6 3 1.8 3 1 0 1.5-.9 1.8-2.5.4-1.8.6-3.6 1.2-5.3.6-1.6 1.3-3 1.3-4.9 0-2.8-1.9-4.8-4.5-4.8-1.7 0-2.6.9-4 .9s-2.3-.9-4-.9Z";

// Scaled tooth outlines compensate their stroke so every icon keeps the same line weight.
const shapes: Record<ServiceIconName, ReactNode> = {
  general: (
    <>
      <path d={TOOTH} />
      <path d="M7.4 7.2c.5-.9 1.3-1.3 2.2-1.2" />
    </>
  ),
  cosmetic: (
    <>
      <path d={TOOTH} transform="translate(1.2 3.6) scale(.82)" strokeWidth={1.95} />
      <path d="M19.5 1.8v4.4M17.3 4h4.4" />
    </>
  ),
  whitening: (
    <>
      <path d={TOOTH} transform="translate(4.4 3.8) scale(.82)" strokeWidth={1.95} />
      <path d="M3.6 2.6v3.6M1.8 4.4h3.6" />
      <path d="M3.2 9.4v2.2M2.1 10.5h2.2" />
    </>
  ),
  implants: (
    <>
      <path d="M6.6 3.2C4.6 3.2 3.4 4.7 3.4 6.6c0 1.7 1 3.1 2.6 3.8h12c1.6-.7 2.6-2.1 2.6-3.8 0-1.9-1.2-3.4-3.2-3.4-1.5 0-2.4.8-5.4.8s-3.9-.8-5.4-.8Z" />
      <path d="M9.2 10.4v2.2h5.6v-2.2" />
      <path d="M9.4 12.6 10.7 21h2.6l1.3-8.4" />
      <path d="M9.8 15.3h4.4M10.2 18h3.6" />
    </>
  ),
  aligners: (
    <>
      <path d="M4.2 5c0 8.3 3.4 14.5 7.8 14.5S19.8 13.3 19.8 5" />
      <path d="M8.4 5c0 5.8 1.6 10 3.6 10s3.6-4.2 3.6-10" />
      <path d="M4.2 5h4.2M15.6 5h4.2" />
    </>
  ),
  emergency: (
    <>
      <path d={TOOTH} />
      <path d="M12 7.4v4.6M9.7 9.7h4.6" />
    </>
  ),
};

export function ServiceIcon({ name }: { name: ServiceIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shapes[name]}
    </svg>
  );
}
