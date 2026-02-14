import { Logo } from "@/components/logo";

const PLACEHOLDER_HREF = "#" as const;

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
              <Logo size={20} />
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
                      href={PLACEHOLDER_HREF}
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
            <a href={PLACEHOLDER_HREF} className="transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href={PLACEHOLDER_HREF} className="transition-colors hover:text-foreground">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
