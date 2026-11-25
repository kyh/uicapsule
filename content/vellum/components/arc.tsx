/** The pending arc: the only loop Vellum draws besides the progress sweep. */
export const Arc = ({ small = false }: { small?: boolean }) => (
  <svg aria-hidden className={small ? "v-arc v-arc-sm" : "v-arc"} fill="none" viewBox="0 0 16 16">
    <circle cx="8" cy="8" opacity="0.25" r="6" stroke="currentColor" strokeWidth="1.75" />
    <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" />
  </svg>
);
