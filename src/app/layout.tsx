import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";
import { Header, type SafeUser } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Chatbot } from "@/components/Chatbot";
import { WelcomePopup } from "@/components/WelcomePopup";
import { getCurrentUser } from "@/lib/auth";
import { getSiteConfig } from "@/lib/site";

const themeScript = `(function(){try{var t=localStorage.getItem('nx-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F7FA" },
    { media: "(prefers-color-scheme: dark)", color: "#020C24" },
  ],
};

// SEO metadata is generated from the database `site` config (name, description,
// keywords, favicon, social image). Edit those in the admin panel — no redeploy.
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const fullTitle = `${site.name} — ${site.tagline}`;
  return {
    metadataBase: new URL(base),
    title: { default: fullTitle, template: `%s · ${site.name}` },
    description: site.description,
    keywords: site.keywords,
    applicationName: site.name,
    authors: [{ name: site.name }],
    creator: site.name,
    publisher: site.name,
    icons: {
      icon: [{ url: site.faviconUrl }],
      shortcut: site.faviconUrl,
      apple: site.faviconUrl,
    },
    openGraph: {
      type: "website",
      locale: site.locale,
      siteName: site.name,
      title: fullTitle,
      description: site.description,
      images: [{ url: site.ogImageUrl, width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: site.description,
      images: [site.ogImageUrl],
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [user, site] = await Promise.all([getCurrentUser(), getSiteConfig()]);
  const safeUser: SafeUser | null = user
    ? { id: user.id, name: user.name, email: user.email, role: user.role }
    : null;

  return (
    <html lang={site.locale?.split("-")[0] || "id"} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Space+Grotesk:wght@600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <Header user={safeUser} siteName={site.name} />
          <main className="min-h-[60vh]">{children}</main>
          <Footer site={site} />
          <Chatbot />
          <WelcomePopup config={site.welcomePopup} />
        </Providers>
      </body>
    </html>
  );
}
