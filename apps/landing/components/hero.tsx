import { Button } from "@infrastructure/ui-web";

const DOT_GRID_STYLE = {
  backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
  backgroundSize: "24px 24px",
} as const;

/** Hero section with headline, subtitle, and a stylized terminal visual. */
export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/40">
      {/* Subtle dot grid background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={DOT_GRID_STYLE} />

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 md:pb-28 md:pt-32">
        {/* Announcement badge */}
        <div className="mb-8 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Now with Next.js 16, Expo SDK 54, and Hono
          </span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-3xl text-center text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
          The modern monorepo
          <br />
          <span className="text-muted-foreground">template</span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-muted-foreground md:text-lg">
          Ship web, mobile, and API from a single codebase. Type-safe from database to device, with
          shared packages that keep your team moving fast.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button size="lg">Get Started</Button>
          <Button variant="outline" size="lg">
            View on GitHub
          </Button>
        </div>

        {/* Terminal visual */}
        <div className="mx-auto mt-16 max-w-2xl">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/30 shadow-sm">
            {/* Terminal header */}
            <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="ml-3 text-xs text-muted-foreground">~/monorepo-template</span>
            </div>
            {/* Terminal body */}
            <div className="p-5 font-mono text-[13px] leading-relaxed">
              <div className="text-muted-foreground">
                <span className="text-primary">$</span> pnpm dev
              </div>
              <div className="mt-3 space-y-1.5 text-muted-foreground/70">
                <div>
                  <span className="text-muted-foreground">@repo/web</span>
                  {"    "}dev → Next.js on{" "}
                  <span className="text-primary">http://localhost:3000</span>
                </div>
                <div>
                  <span className="text-muted-foreground">@repo/api</span>
                  {"    "}dev → Hono on <span className="text-primary">http://localhost:3001</span>
                </div>
                <div>
                  <span className="text-muted-foreground">@repo/mobile</span> dev → Expo on{" "}
                  <span className="text-primary">http://localhost:8081</span>
                </div>
              </div>
              <div className="mt-3 text-muted-foreground">
                <span className="text-primary">$</span> <span className="animate-pulse">▌</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
