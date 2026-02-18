import { PERSPECTIVE_STYLE } from "./shared-styles";

/** Slight perspective tilt to suggest depth in the browser chrome mockup. */
const BROWSER_TRANSFORM_STYLE = { transform: "rotateX(2deg) rotateY(-1deg)" } as const;

/**
 * macOS traffic light button colors (used as static Tailwind arbitrary values below):
 * - Close:    #ff5f57  -> bg-[#ff5f57]
 * - Minimize: #febc2e  -> bg-[#febc2e]
 * - Maximize: #28c840  -> bg-[#28c840]
 *
 * Tailwind requires complete class strings at build time,
 * so these hex values are inlined in the JSX rather than interpolated from constants.
 */

const WEB_ITEMS = ["App Router", "React Compiler", "shadcn/ui", "Tailwind CSS v4"] as const;
const MOBILE_ITEMS = [
  "React Native 0.81",
  "UniWind",
  "react-native-reusables",
  "iOS, Android, Web",
] as const;
const API_ITEMS = [
  "Type-safe RPC",
  "Zod validation",
  "End-to-end types",
  "Typed client SDK",
] as const;
const INFRA_PACKAGES = ["api-client", "navigation", "ui", "ui-web", "utils", "ts-config"] as const;
const TOOLING = ["Turborepo", "pnpm", "Biome", "Vitest", "Playwright"] as const;
const BADGE_SECTIONS = [
  { label: "Shared Infrastructure", items: INFRA_PACKAGES },
  { label: "Tooling", items: TOOLING },
] as const;
const QUICK_START_CMDS = ["pnpm install", "pnpm dev", "pnpm build", "pnpm test"] as const;

/** Desktop browser chrome mockup showing a miniature web dashboard. */
export function BrowserFrame() {
  return (
    <div style={PERSPECTIVE_STYLE}>
      <div
        className="overflow-hidden rounded-xl bg-card shadow-2xl ring-1 ring-foreground/5"
        style={BROWSER_TRANSFORM_STYLE}
      >
        {/* Chrome bar */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
          {/* macOS traffic light close/minimize/maximize buttons */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="ml-3 flex-1">
            <div className="mx-auto max-w-xs rounded-md bg-background/60 px-3 py-1 text-center text-[10px] text-muted-foreground">
              localhost:3000
            </div>
          </div>
          {/* Spacer: balances the traffic-light dots (3 x 10px + 2 x 6px gap) + ml-3 (12px) on the left */}
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
            <AppCard title="Web" subtitle="Next.js 16" items={WEB_ITEMS} />
            <AppCard title="Mobile" subtitle="Expo SDK 54" items={MOBILE_ITEMS} />
            <AppCard title="API" subtitle="Hono + oRPC" items={API_ITEMS} />
          </div>

          {/* Infrastructure + Tooling row */}
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {BADGE_SECTIONS.map((section) => (
              <div key={section.label} className="rounded-lg border border-border/60 bg-card p-2.5">
                <div className="mb-1.5 text-[10px] font-semibold text-foreground">
                  {section.label}
                </div>
                <div className="flex flex-wrap gap-1">
                  {section.items.map((name) => (
                    <span
                      key={name}
                      className="rounded bg-muted px-1.5 py-0.5 text-[8px] text-muted-foreground"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Start bar */}
          <div className="mt-2.5 rounded-lg border border-border/60 bg-card p-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold text-foreground">Quick Start</span>
              {QUICK_START_CMDS.map((cmd) => (
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

interface AppCardProps {
  title: string;
  subtitle: string;
  items: readonly string[];
}

/** Renders a single app card within the browser frame dashboard. */
function AppCard({ title, subtitle, items }: AppCardProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-2.5">
      <div className="text-[11px] font-semibold text-foreground">{title}</div>
      <div className="text-[8px] text-muted-foreground">{subtitle}</div>
      <div className="mt-1.5 flex flex-col gap-0.5">
        {items.map((item) => (
          <div key={item} className="text-[8px] text-muted-foreground/70">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
