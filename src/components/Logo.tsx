import { cn } from "./ui";

export function Logo({
  className = "",
  mark = false,
  name = "NexusTop",
}: {
  className?: string;
  mark?: boolean;
  name?: string;
}) {
  const isDefault = name === "NexusTop";
  return (
    <span className={cn("inline-flex items-center gap-2 font-display", className)}>
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden className="shrink-0">
        <rect x="3" y="3" width="34" height="34" rx="9" fill="var(--primary)" />
        <path d="M13 28V12l14 16V12" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="28" cy="13" r="2.2" fill="var(--gold)" />
      </svg>
      {!mark &&
        (isDefault ? (
          <span className="text-base font-bold tracking-tight">
            Nexus<span className="text-primary">Top</span>
          </span>
        ) : (
          <span className="text-base font-bold tracking-tight">{name}</span>
        ))}
    </span>
  );
}
