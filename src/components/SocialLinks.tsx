import type { SVGProps } from "react";
import { SITE } from "@/lib/constants";
import type { SocialConfig } from "@/lib/site";
import { cn } from "./ui";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Instagram({ size = 18, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
function XIcon({ size = 18, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L4.8 22H1.54l8.02-9.17L1.5 2h6.76l4.66 6.16L18.244 2Zm-1.16 18h1.83L7.01 3.9H5.05L17.084 20Z" />
    </svg>
  );
}
function Facebook({ size = 18, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}
function Youtube({ size = 18, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M23 12s0-3.2-.41-4.74a2.5 2.5 0 0 0-1.76-1.77C19.27 5.08 12 5.08 12 5.08s-7.27 0-8.83.41A2.5 2.5 0 0 0 1.41 7.26C1 8.8 1 12 1 12s0 3.2.41 4.74a2.5 2.5 0 0 0 1.76 1.77c1.56.41 8.83.41 8.83.41s7.27 0 8.83-.41a2.5 2.5 0 0 0 1.76-1.77C23 15.2 23 12 23 12Zm-13 3.02V8.98L15.5 12 10 15.02Z" />
    </svg>
  );
}
function Tiktok({ size = 18, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M16.5 3c.3 2.2 1.5 3.5 3.6 3.7v2.4c-1.2.1-2.4-.2-3.5-.8v6.1c0 4.1-3 6.1-5.9 5.5-2.7-.5-4.3-2.9-3.9-5.6.4-2.5 2.7-4.1 5.2-3.7v2.5c-.4-.1-.8-.2-1.2-.1-1.1.1-1.9 1-1.8 2.1.1 1.1 1 1.9 2.1 1.8 1.1-.1 1.8-.9 1.8-2V3h3.6Z" />
    </svg>
  );
}
function Whatsapp({ size = 18, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.24-8.24Zm-3.2 4.43c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.03 0 1.2.87 2.36.99 2.52.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.43-.58 1.63-1.15.2-.57.2-1.05.14-1.15-.06-.1-.22-.16-.46-.28-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.31-.74-1.79-.2-.47-.4-.4-.54-.41h-.46Z" />
    </svg>
  );
}

export function SocialLinks({
  className = "",
  size = "md",
  links,
}: {
  className?: string;
  size?: "sm" | "md";
  links?: SocialConfig;
}) {
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const ic = size === "sm" ? 15 : 18;
  const s: SocialConfig = links ?? {
    instagram: SITE.instagram,
    tiktok: SITE.tiktok,
    twitter: SITE.twitter,
    facebook: SITE.facebook,
    youtube: SITE.youtube,
    discord: SITE.discord,
    whatsapp: SITE.whatsapp,
  };
  const items = [
    { href: s.instagram, label: "Instagram", Icon: Instagram },
    { href: s.tiktok, label: "TikTok", Icon: Tiktok },
    { href: s.twitter, label: "X (Twitter)", Icon: XIcon },
    { href: s.facebook, label: "Facebook", Icon: Facebook },
    { href: s.youtube, label: "YouTube", Icon: Youtube },
    { href: `https://wa.me/${s.whatsapp}`, label: "WhatsApp", Icon: Whatsapp },
  ];
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {items.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className={cn(
            "inline-flex items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary",
            dim
          )}
        >
          <Icon size={ic} />
        </a>
      ))}
    </div>
  );
}
