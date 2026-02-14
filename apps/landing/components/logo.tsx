interface LogoProps {
  /** Width and height of the SVG in pixels. */
  size?: number;
}

/** Brand logo SVG used in the navbar and footer. */
export function Logo({ size = 22 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      className="text-primary"
    >
      <rect width="22" height="22" rx="5" fill="currentColor" />
      <path
        d="M6 11h4l2-4 2 8 2-4h2"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
