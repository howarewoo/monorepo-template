/** Desktop browser chrome mockup showing a miniature web dashboard. */
export function BrowserFrame() {
  return (
    <div style={{ perspective: "1200px" }}>
      <div
        className="overflow-hidden rounded-xl bg-card shadow-2xl ring-1 ring-foreground/5"
        style={{ transform: "rotateX(2deg) rotateY(-1deg)" }}
      >
        {/* Chrome bar */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <div className="ml-3 flex-1">
            <div className="mx-auto max-w-xs rounded-md bg-background/60 px-3 py-1 text-center text-[10px] text-muted-foreground">
              localhost:3000
            </div>
          </div>
          <div className="w-[62px]" />
        </div>

        {/* Dashboard content — 16:10 MacBook aspect ratio */}
        <div className="bg-background p-5 aspect-[16/10]">
          {/* Header */}
          <div className="mb-4 text-center">
            <div className="text-[13px] font-bold text-foreground">Monorepo Template</div>
            <div className="mt-0.5 text-[9px] text-muted-foreground">
              A production-ready monorepo with Next.js, Expo, and Hono
            </div>
          </div>

          {/* 3-column card grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <AppCard
              title="Web"
              subtitle="Next.js 16"
              items={["App Router", "React Compiler", "shadcn/ui", "Tailwind CSS v4"]}
            />
            <AppCard
              title="Mobile"
              subtitle="Expo SDK 54"
              items={[
                "React Native 0.81",
                "UniWind",
                "react-native-reusables",
                "iOS, Android, Web",
              ]}
            />
            <AppCard
              title="API"
              subtitle="Hono + oRPC"
              items={["Type-safe RPC", "Zod validation", "End-to-end types", "Typed client SDK"]}
            />
          </div>

          {/* Infrastructure + Tooling row */}
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <div className="rounded-lg border border-border/60 bg-card p-2.5">
              <div className="mb-1.5 text-[10px] font-semibold text-foreground">
                Shared Infrastructure
              </div>
              <div className="flex flex-wrap gap-1">
                {["api-client", "navigation", "ui", "ui-web", "utils", "ts-config"].map((name) => (
                  <span
                    key={name}
                    className="rounded bg-muted px-1.5 py-0.5 text-[8px] text-muted-foreground"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-card p-2.5">
              <div className="mb-1.5 text-[10px] font-semibold text-foreground">Tooling</div>
              <div className="flex flex-wrap gap-1">
                {["Turborepo", "pnpm", "Biome", "Vitest", "Playwright"].map((name) => (
                  <span
                    key={name}
                    className="rounded bg-muted px-1.5 py-0.5 text-[8px] text-muted-foreground"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Start bar */}
          <div className="mt-2.5 rounded-lg border border-border/60 bg-card p-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold text-foreground">Quick Start</span>
              {["pnpm install", "pnpm dev", "pnpm build", "pnpm test"].map((cmd) => (
                <span
                  key={cmd}
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-[8px] text-muted-foreground"
                >
                  {cmd}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppCard({ title, subtitle, items }: { title: string; subtitle: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-2.5">
      <div className="text-[11px] font-semibold text-foreground">{title}</div>
      <div className="text-[8px] text-muted-foreground">{subtitle}</div>
      <div className="mt-1.5 space-y-0.5">
        {items.map((item) => (
          <div key={item} className="text-[8px] text-muted-foreground/70">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
