const footerLinks = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Changelog", "Roadmap"],
  },
  {
    title: "Resources",
    links: ["Documentation", "Guides", "Examples", "Blog"],
  },
  {
    title: "Connect",
    links: ["GitHub", "Discord", "Twitter", "Contact"],
  },
];

/** Multi-column footer with logo, link groups, and legal. */
export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Logo & tagline */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 font-semibold tracking-tight">
              <svg
                width="20"
                height="20"
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
              <span>Monorepo Template</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Ship web, mobile, and API from a single codebase.
            </p>
          </div>

          {/* Link columns */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="mb-4 text-sm font-semibold">{group.title}</h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="/placeholder"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-6 text-xs text-muted-foreground md:flex-row">
          <span>MIT License</span>
          <div className="flex gap-6">
            <a href="/placeholder" className="transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href="/placeholder" className="transition-colors hover:text-foreground">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
