import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, MapPin, Package, Sprout, Star } from "lucide-react";
import { getProducerBySlug, getProducerPublicStats } from "@/lib/services/producer.service";
import { searchProducts } from "@/lib/services/catalog.service";
import { prisma } from "@/lib/db/prisma";
import { ProductCard } from "@/components/features/product-card";
import { formatDateFR } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const producer = await getProducerBySlug(slug);
  if (!producer) return { title: "Producteur introuvable" };
  return { title: `${producer.name} — producteur`, description: producer.description };
}

export default async function ProducerPage({ params }: Props) {
  const { slug } = await params;
  const producer = await getProducerBySlug(slug);
  if (!producer || producer.status !== "APPROVED" || !producer.isActive) notFound();

  const [products, stats, productsOfProducer] = await Promise.all([
    searchProducts({ producer: slug, perPage: 48, sort: "newest" }),
    getProducerPublicStats(producer.id),
    prisma.product.findMany({ where: { producerId: producer.id, isActive: true }, select: { id: true } }),
  ]);

  const ids = productsOfProducer.map((p) => p.id);
  const reviewCount = ids.length
    ? await prisma.review.count({ where: { status: "APPROVED", productId: { in: ids } } })
    : 0;

  return (
    <div className="container-page py-10">
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-earth-500">
        <Link href="/" className="hover:text-brand-700">Accueil</Link> /{" "}
        <Link href="/producteurs" className="hover:text-brand-700">Producteurs</Link> /{" "}
        <span className="text-earth-800">{producer.name}</span>
      </nav>

      {/* En-tête du profil */}
      <div className="overflow-hidden rounded-3xl border border-earth-200 bg-white shadow-card">
        <div className="h-36 bg-gradient-to-r from-brand-500 via-brand-600 to-earth-700" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end gap-4">
            {producer.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={producer.logoUrl} alt="" className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-lg" />
            ) : null}
            <div className="flex-1">
              <h1 className="flex items-center gap-2 text-2xl font-bold text-earth-900">
                {producer.name}
                <BadgeCheck className="h-5 w-5 text-forest-600" aria-label="Producteur vérifié" />
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-earth-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" aria-hidden /> {producer.city}, {producer.region} · {producer.country.name}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" aria-hidden /> Inscrit depuis {formatDateFR(producer.createdAt, { month: "long", year: "numeric" })}
                </span>
              </p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-earth-50 p-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-earth-500">Produits</dt>
              <dd className="mt-0.5 flex items-center gap-1 text-lg font-bold text-earth-900">
                <Package className="h-4 w-4 text-brand-600" aria-hidden /> {stats.productCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-earth-500">Note moyenne</dt>
              <dd className="mt-0.5 flex items-center gap-1 text-lg font-bold text-earth-900">
                <Star className="h-4 w-4 text-amber-500" aria-hidden /> {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-earth-500">Avis</dt>
              <dd className="mt-0.5 text-lg font-bold text-earth-900">{reviewCount}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-earth-500">Unités vendues</dt>
              <dd className="mt-0.5 flex items-center gap-1 text-lg font-bold text-earth-900">
                <Sprout className="h-4 w-4 text-forest-600" aria-hidden /> {stats.unitsSold}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Histoire */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-xl font-bold text-earth-900">Notre histoire</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-earth-700">{producer.story ?? producer.description}</p>

          <h3 className="mt-8 text-xl font-bold text-earth-900">Nos produits ({products.total})</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
            {products.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-40 lg:h-fit">
          <div className="rounded-2xl border border-earth-200 bg-white p-5">
            <h3 className="text-sm font-bold text-earth-900">Présentation</h3>
            <p className="mt-2 text-sm leading-relaxed text-earth-600">{producer.description}</p>
          </div>

          {producer.specialties ? (
            <div className="rounded-2xl border border-earth-200 bg-white p-5">
              <h3 className="text-sm font-bold text-earth-900">Spécialités</h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {producer.specialties.split(",").map((s) => (
                  <li key={s} className="rounded-full bg-forest-50 px-2.5 py-1 text-xs text-forest-700 ring-1 ring-inset ring-forest-200">
                    {s.trim()}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {producer.certifications ? (
            <div className="rounded-2xl border border-forest-200 bg-forest-50 p-5">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-forest-900">
                <BadgeCheck className="h-4 w-4" /> Certifications &amp; labels
              </h3>
              <p className="mt-2 text-sm text-forest-800">{producer.certifications}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 text-sm text-earth-700">
            <p className="font-semibold text-earth-900">Acheter en confiance</p>
            <p className="mt-1">
              En achetant chez {producer.name}, vous soutenez directement l&apos;économie locale de {producer.region}.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
