const PERSPECTIVE_STYLE = { perspective: "1200px" } as const;
const PHONE_TRANSFORM_STYLE = { transform: "rotateX(2deg)" } as const;

/** Phone bezel mockup showing a miniature mobile app. */
export function PhoneFrame() {
  return (
    <div className="flex justify-center" style={PERSPECTIVE_STYLE}>
      <div
        className="w-full max-w-[260px] rounded-[2.5rem] border-[3px] border-foreground/10 bg-foreground/5 p-2"
        style={PHONE_TRANSFORM_STYLE}
      >
        {/* Screen — iPhone 15/16 aspect ratio (9:19.5) */}
        <div className="flex flex-col overflow-hidden rounded-[2rem] bg-background aspect-[9/19.5]">
          {/* Dynamic Island */}
          <div className="flex justify-center pt-2.5">
            <div className="h-5 w-24 rounded-full bg-foreground/10" />
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-1 pb-2">
            {/* iOS default marketing screenshot time */}
            <span className="text-[9px] font-medium text-foreground">9:41</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5 items-end">
                <div className="h-1.5 w-0.5 rounded-sm bg-foreground/40" />
                <div className="h-2 w-0.5 rounded-sm bg-foreground/40" />
                <div className="h-2.5 w-0.5 rounded-sm bg-foreground/40" />
                <div className="h-3 w-0.5 rounded-sm bg-foreground/40" />
              </div>
              <div className="ml-0.5 h-2 w-4 rounded-sm border border-foreground/40">
                <div className="m-px h-1 w-2.5 rounded-sm bg-foreground/40" />
              </div>
            </div>
          </div>

          {/* App header */}
          <div className="border-b border-border/60 px-4 pb-2">
            <div className="text-[11px] font-semibold text-foreground">Monorepo Template</div>
          </div>

          {/* App content */}
          <div className="p-3">
            {/* Title */}
            <div className="mb-3 text-center">
              <div className="text-[14px] font-bold text-foreground">Monorepo Template</div>
              <div className="mt-0.5 text-[8px] text-muted-foreground">
                A modern monorepo with Next.js, Expo, Hono, and oRPC
              </div>
            </div>

            {/* Stacked cards */}
            <div className="space-y-2">
              <PhoneCard title="Next.js" subtitle="Web application" />
              <PhoneCard title="Expo" subtitle="Mobile application" />
              <PhoneCard title="Hono + oRPC" subtitle="Type-safe API" />
            </div>
          </div>

          {/* Home indicator */}
          <div className="mt-auto flex justify-center pb-2 pt-3">
            <div className="h-1 w-24 rounded-full bg-foreground/15" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
      <div className="text-[10px] font-semibold text-foreground">{title}</div>
      <div className="text-[8px] text-muted-foreground">{subtitle}</div>
    </div>
  );
}
