import { getSetting } from "./settings";
import { SITE } from "./constants";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";

/**
 * Site-wide configuration, stored in the `settings` table under the `site` key
 * (as JSON) so the separately-hosted admin panel can edit branding, contact,
 * SEO, and social links without a redeploy. `getSiteConfig()` reads the DB and
 * merges with DEFAULT_SITE so any missing field falls back to a sane value.
 */

export type SocialConfig = {
  instagram: string;
  tiktok: string;
  twitter: string;
  facebook: string;
  youtube: string;
  discord: string;
  whatsapp: string; // international format, e.g. 62812xxxx
};

export type WelcomePopup = {
  enabled: boolean;
  imageUrl: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
};

export type SiteConfig = {
  name: string; // website name
  tagline: string;
  description: string; // SEO meta description
  keywords: string[]; // SEO keywords
  faviconUrl: string;
  ogImageUrl: string; // social share image
  logoUrl: string | null; // optional custom logo image (null = use built-in mark)
  supportEmail: string;
  whatsapp: string;
  phone: string;
  address: string;
  currency: string;
  locale: string;
  themeColor: string;
  social: SocialConfig;
  welcomePopup: WelcomePopup;
};

export const DEFAULT_SITE: SiteConfig = {
  name: SITE.name,
  tagline: SITE.tagline,
  description:
    "Top up game favoritmu dalam hitungan detik. Proses otomatis 24/7 dengan harga terbaik, loyalty tier, dan event menarik. Bayar dengan QRIS, e-wallet, Virtual Account, atau saldo dompet.",
  keywords: [
    "top up game",
    "top up game termurah",
    "diamond mobile legends",
    "diamond free fire",
    "uc pubg mobile",
    "genshin impact crystals",
    "valorant vp",
    "nexustop",
    "top up saldo",
    "voucher game",
  ],
  faviconUrl: "/favicon.svg",
  ogImageUrl: "/banners/flash-sale.jpg",
  logoUrl: null,
  supportEmail: SITE.supportEmail,
  whatsapp: SITE.whatsapp,
  phone: "",
  address: "",
  currency: "IDR",
  locale: "id-ID",
  themeColor: "#2563EB",
  social: {
    instagram: SITE.instagram,
    tiktok: SITE.tiktok,
    twitter: SITE.twitter,
    facebook: SITE.facebook,
    youtube: SITE.youtube,
    discord: SITE.discord,
    whatsapp: SITE.whatsapp,
  },
  welcomePopup: {
    enabled: true,
    imageUrl: "/banners/flash-sale.jpg",
    title: "Selamat Datang di NexusTop!",
    subtitle: "Top up game favoritmu lebih cepat & dapat Spin Credit di setiap transaksi. Cek Flash Sale kami sekarang!",
    ctaText: "Lihat Flash Sale",
    ctaLink: "/#flash-sale",
  },
};

/** Read the site config from the dedicated `site_settings` table. */
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const rows = await db.select().from(siteSettings).limit(1);
    const s = rows[0];
    if (!s) return DEFAULT_SITE;
    return {
      name: s.name,
      tagline: s.tagline,
      description: s.description || DEFAULT_SITE.description,
      keywords: s.keywords ? s.keywords.split(",").map((k: string) => k.trim()).filter(Boolean) : DEFAULT_SITE.keywords,
      faviconUrl: s.faviconUrl,
      ogImageUrl: s.ogImageUrl,
      logoUrl: s.logoUrl,
      supportEmail: s.supportEmail,
      whatsapp: s.whatsapp,
      phone: s.phone ?? "",
      address: s.address ?? "",
      currency: s.currency,
      locale: s.locale,
      themeColor: s.themeColor,
      social: {
        instagram: s.socialInstagram ?? DEFAULT_SITE.social.instagram,
        tiktok: s.socialTiktok ?? DEFAULT_SITE.social.tiktok,
        twitter: s.socialTwitter ?? DEFAULT_SITE.social.twitter,
        facebook: s.socialFacebook ?? DEFAULT_SITE.social.facebook,
        youtube: s.socialYoutube ?? DEFAULT_SITE.social.youtube,
        discord: s.socialDiscord ?? DEFAULT_SITE.social.discord,
        whatsapp: s.socialWhatsapp ?? s.whatsapp,
      },
      welcomePopup: {
        enabled: s.popupEnabled,
        imageUrl: s.popupImageUrl ?? DEFAULT_SITE.welcomePopup.imageUrl,
        title: s.popupTitle ?? DEFAULT_SITE.welcomePopup.title,
        subtitle: s.popupSubtitle ?? DEFAULT_SITE.welcomePopup.subtitle,
        ctaText: s.popupCtaText ?? DEFAULT_SITE.welcomePopup.ctaText,
        ctaLink: s.popupCtaLink ?? DEFAULT_SITE.welcomePopup.ctaLink,
      },
    };
  } catch {
    return DEFAULT_SITE;
  }
}
