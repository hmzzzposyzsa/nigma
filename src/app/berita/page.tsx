import Link from "next/link";
import Image from "next/image";
import { Calendar, Pin, ArrowLeft, ChevronRight } from "lucide-react";
import { getPublishedNews } from "@/lib/queries";
import { Container, SectionHeading, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Berita" };

export default async function BeritaPage() {
  const articles = await getPublishedNews(50);
  const pinned = articles.filter((a) => a.pinned);
  const rest = articles.filter((a) => !a.pinned);

  return (
    <Container className="py-8">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary">
        <ArrowLeft size={16} /> Beranda
      </Link>
      <SectionHeading
        eyebrow="Update"
        title="Berita & Info"
        description="Info terbaru, promo, dan pengumuman dari NexusTop."
      />

      {articles.length === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed border-border py-20 text-center">
          <p className="text-base font-bold">Belum ada berita</p>
          <p className="mt-1 text-sm text-muted-foreground">Berita dan pengumuman akan muncul di sini.</p>
        </div>
      ) : (
        <>
          {/* Pinned / featured */}
          {pinned.length > 0 && (
            <div className="mb-8 grid gap-4 md:grid-cols-2">
              {pinned.slice(0, 2).map((a) => (
                <Link
                  key={a.id}
                  href={`/berita/${a.id}`}
                  className="group relative overflow-hidden rounded-lg border border-border bg-card transition hover:border-primary/40"
                >
                  {a.imageUrl && (
                    <div className="relative h-48 overflow-hidden">
                      <Image src={a.imageUrl} alt={a.title} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-gold px-2 py-0.5 text-xs font-bold text-black">
                        <Pin size={11} /> Disematkan
                      </span>
                      <div className="absolute bottom-3 left-3 right-3">
                        <Badge tone="primary" className="mb-1.5">{a.category}</Badge>
                        <h3 className="text-lg font-bold text-white">{a.title}</h3>
                      </div>
                    </div>
                  )}
                  {!a.imageUrl && (
                    <div className="p-5">
                      <Badge tone="primary" className="mb-2">{a.category}</Badge>
                      <h3 className="text-lg font-bold">{a.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{a.excerpt}</p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Regular articles */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((a) => (
              <Link
                key={a.id}
                href={`/berita/${a.id}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition hover:border-primary/40"
              >
                {a.imageUrl && (
                  <div className="relative h-36 overflow-hidden">
                    <Image src={a.imageUrl} alt={a.title} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge tone="primary">{a.category}</Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar size={11} /> {formatDate(a.createdAt).split(",")[0]}
                    </span>
                  </div>
                  <h3 className="font-bold leading-snug">{a.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Baca selengkapnya <ChevronRight size={14} className="transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </Container>
  );
}
