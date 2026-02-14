/** Props for a numbered feature section with a code/visual panel. */
interface FeatureSectionProps {
  /** Section number (e.g. "1.0"). */
  number: string;
  /** Section heading. */
  title: string;
  /** Section description. */
  description: string;
  /** Sub-feature labels displayed as pills. */
  features: string[];
  /** Code snippet or terminal content for the visual panel. */
  code: string;
  /** File label shown in the code panel header. */
  codeLabel: string;
  /** Reverse the layout (visual on left, text on right). */
  reverse?: boolean;
}

/** Reusable numbered feature section with text + code visual. */
export function FeatureSection({
  number,
  title,
  description,
  features,
  code,
  codeLabel,
  reverse = false,
}: FeatureSectionProps) {
  return (
    <section className="border-b border-border/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className={`flex flex-col items-start gap-12 lg:flex-row lg:items-center lg:gap-16 ${reverse ? "lg:flex-row-reverse" : ""}`}
        >
          {/* Text side */}
          <div className="flex-1">
            <span className="mb-4 block font-mono text-sm font-medium text-muted-foreground/60">
              {number}
            </span>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{description}</p>

            {/* Feature pills */}
            <div className="mt-8 flex flex-wrap gap-2">
              {features.map((feature) => (
                <span
                  key={feature}
                  className="rounded-md border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Code visual */}
          <div className="w-full flex-1">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/30 shadow-sm">
              <div className="flex items-center border-b border-border/40 px-4 py-2.5">
                <span className="text-xs font-medium text-muted-foreground/60">{codeLabel}</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-muted-foreground">
                <code>{code}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
