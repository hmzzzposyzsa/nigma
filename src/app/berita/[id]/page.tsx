import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Pin } from "lucide-react";
import { getNewsById } from "@/lib/queries";
import { Container, Badge, Card } from "@/components/ui";
import { SocialLinks } from "@/components/SocialLinks";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getNewsById(id);
  return { title: article?.title ?? "Berita" };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getNewsById(id);
  if (!article) notFound();

  return (
    <Container className="py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/berita" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Semua Berita
        </Link>

        <div className="mb-3 flex items-center gap-2">
          <Badge tone="primary">{article.category}</Badge>
          {article.pinned && (
            <Badge tone="gold"><Pin size={11} /> Disematkan</Badge>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar size={12} /> {formatDate(article.createdAt)}
          </span>
        </div>

        <h1 className="text-2xl font-bold sm:text-3xl">{article.title}</h1>
        {article.excerpt && <p className="mt-2 text-sm text-muted-foreground">{article.excerpt}</p>}

        {article.imageUrl && (
          <div className="relative mt-5 h-64 overflow-hidden rounded-lg sm:h-80">
            <Image src={article.imageUrl} alt={article.title} fill priority sizes="(max-width:768px) 100vw, 768px" className="object-cover" />
          </div>
        )}

        <Card className="mt-6 p-6">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-foreground">
            {article.content}
          </div>
        </Card>

        <div className="mt-8 rounded-lg border border-border bg-card p-5">
          <p className="mb-2 text-sm font-bold">Bagikan berita ini:</p>
          <SocialLinks size="sm" />
        </div>
      </div>
    </Container>
  );
}
