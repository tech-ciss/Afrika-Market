import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock, Factory, MapPin, Package, Repeat, ShieldCheck, Sprout, Truck } from "lucide-react";
import { getProductBySlug, getSimilarProducts } from "@/lib/services/catalog.service";
import { getCurrentUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatFCFA, formatDateFR, parseJsonArray } from "@/lib/utils";
import { ProductCard } from "@/components/features/product-card";
import { AddToCart } from "@/components/features/add-to-cart";
import { Stars } from "@/components/ui/feedback";
import { Alert, Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/surfaces";
import { ReviewForm } from "@/components/features/review-form";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produit introuvable" };
  const images = (JSON.parse(product.images || "[]") as string[])[0];

  return {
    title: product.name,
    description: product.shortDescription,
    keywords: product.tags.split(","),
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: images ? [images] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.isActive) notFound();

  const user = await getCurrentUser();
  const images = parseJsonArray<string>(product.images, ["/images/products/placeholder.svg"]);
  const characteristics = parseJsonArray<{ label: string; value: string }>(product.characteristics);
  const similar = await getSimilarProducts(product.id, product.categoryId);
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const discount = onSale ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;

  const [purchased, wishlistItem] = user
    ? await Promise.all([
        prisma.orderItem.findFirst({
          where: {
            productId: product.id,
            order: { userId: user.id, status: { notIn: ["CANCELLED", "REFUNDED", "PENDING_PAYMENT"] } },
          },
          select: { orderId: true },
        }),
        prisma.wishlistItem.findUnique({
          where: { userId_productId: { userId: user.id, productId: product.id } },
        }),
      ])
    : [null, null];

  const approvedReviews = product.reviews.filter((r) => r.status === "APPROVED");

  return (
    <div className="container-page py-6">
      <nav aria-label="Fil d'Ariane" className="mb-5 text-sm text-earth-500">
        <Link href="/" className="hover:text-brand-700">
          Accueil
        </Link>{" / "}
        <Link href="/produits" className="hover:text-brand-700">
          Boutique
        </Link>{" / "}
        <Link href={`/categories/${product.category.slug}`} className="hover:text-brand-700">
          {product.category.name}
        </Link>{" / "}
        <span className="text-earth-800">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Galerie */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-earth-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
              width={800}
              height={800}
            />
            {onSale ? (
              <span className="badge-sale !left-5 !top-5 !text-sm">-{discount}%</span>
            ) : product.isNew ? (
              <span className="badge-new !left-5 !top-5 !text-sm">Nouveau</span>
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {images.slice(1, 5).map((src) => (
                <div key={src} className="aspect-square overflow-hidden rounded-xl border border-earth-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${product.name} — vue ${src}`} className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Informations */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/categories/${product.category.slug}`}>
              <Badge tone="brand">{product.category.name}</Badge>
            </Link>
            {product.isNew ? <Badge tone="success">Nouveau</Badge> : null}
            {product.stock === 0 ? <Badge tone="danger">Rupture de stock</Badge> : null}
          </div>

          <h1 className="mt-3 text-3xl font-bold leading-tight text-earth-900">{product.name}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            {product.reviewCount > 0 ? (
              <span className="flex items-center gap-2">
                <Stars value={product.averageRating} size={15} />
                <span className="font-medium text-earth-700">{product.averageRating.toFixed(1)}</span>
                <span className="text-earth-500">({product.reviewCount} avis)</span>
              </span>
            ) : (
              <span className="text-earth-500">Aucun avis pour le moment</span>
            )}
            <span className="text-earth-300">•</span>
            <span className="text-earth-500">SKU : {product.sku ?? product.id.slice(-8).toUpperCase()}</span>
          </div>

          {/* Bloc origine — toujours visible (§8) */}
          <div className="mt-5 rounded-2xl border border-forest-200 bg-forest-50 p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-forest-700">
              <BadgeCheck className="h-4 w-4" /> Origine &amp; traçabilité
            </p>
            <ul className="space-y-1.5 text-sm text-forest-900">
              <li className="flex items-center gap-2">
                <span aria-hidden>🇨🇮</span> {product.country.name}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-forest-600" aria-hidden />
                {[product.region, product.city].filter(Boolean).join(" · ") || "Région non renseignée"}
              </li>
              <li className="flex items-center gap-2">
                <Factory className="h-4 w-4 text-forest-600" aria-hidden />
                <Link href={`/producteurs/${product.producer.slug}`} className="font-semibold underline hover:text-brand-700">
                  {product.producer.name}
                </Link>
              </li>
              {product.originMethod ? (
                <li className="flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-forest-600" aria-hidden /> {product.originMethod}
                </li>
              ) : null}
              {product.harvestPeriod ? (
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-forest-600" aria-hidden /> Récolte : {product.harvestPeriod}
                </li>
              ) : null}
            </ul>
          </div>

          <div className="mt-6">
            <AddToCart
              isLoggedIn={!!user}
              inWishlist={!!wishlistItem}
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                image: images[0] ?? "",
                unit: product.unit,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                stock: product.stock,
                lowStockThreshold: product.lowStockThreshold,
                producerName: product.producer.name,
              }}
              variants={product.variants.map((v) => ({ id: v.id, name: v.name, price: v.price, stock: v.stock }))}
            />
          </div>

          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-earth-700">{product.description}</p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Truck, label: "Livraison par zone" },
              { icon: ShieldCheck, label: "Paiement sécurisé" },
              { icon: Package, label: "Stock à jour" },
              { icon: Repeat, label: "Suivi de commande" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 rounded-xl bg-earth-50 px-3 py-2.5 text-xs font-medium text-earth-700">
                <f.icon className="h-4 w-4 text-brand-600" aria-hidden />
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Caractéristiques */}
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques</CardTitle>
          </CardHeader>
          <CardContent>
            {characteristics.length > 0 ? (
              <dl className="divide-y divide-earth-100 text-sm">
                {characteristics.map((c) => (
                  <div key={c.label} className="flex justify-between gap-4 py-2">
                    <dt className="text-earth-500">{c.label}</dt>
                    <dd className="text-right font-medium text-earth-800">{c.value}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 py-2">
                  <dt className="text-earth-500">Unité de vente</dt>
                  <dd className="font-medium text-earth-800">{product.unit}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-earth-500">Aucune caractéristique renseignée.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conservation</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-earth-700">
            <p>{product.conservation ?? "Conserver dans un endroit frais et sec, à l'abri de la lumière."}</p>
            <p className="mt-3 text-earth-500">
              Poids indicatif : {product.weight ? `${product.weight} g` : "non renseigné"}.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Producteur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-earth-900">{product.producer.name}</p>
            <p className="mt-1 text-sm text-earth-600">
              {product.producer.city} · {product.producer.region}
            </p>
            <Link
              href={`/producteurs/${product.producer.slug}`}
              className="btn-secondary btn-md mt-4 w-full text-sm"
            >
              Voir la fiche producteur
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Avis */}
      <section id="avis" className="mt-12">
        <h2 className="text-2xl font-bold text-earth-900">Avis clients</h2>
        <p className="mt-1 text-sm text-earth-600">
          Seuls les clients ayant réellement acheté ce produit peuvent publier un avis (modéré par notre équipe).
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <Card>
              <CardContent className="text-center">
                <p className="text-4xl font-extrabold text-earth-900">
                  {product.reviewCount > 0 ? product.averageRating.toFixed(1) : "—"}
                </p>
                <div className="mt-2 flex justify-center">
                  <Stars value={product.averageRating} size={18} />
                </div>
                <p className="mt-1 text-xs text-earth-500">{product.reviewCount} avis publiés</p>
              </CardContent>
            </Card>

            {user && purchased ? (
              <ReviewForm productId={product.id} orderId={purchased.orderId} />
            ) : (
              <Alert tone="info">
                {user
                  ? "Vous ne pouvez paser d'avis : ce produit n'apparaît dans aucune de vos commandes."
                  : "Connectez-vous après achat pour laisser un avis."}
              </Alert>
            )}
          </div>

          <div className="space-y-4">
            {approvedReviews.length === 0 ? (
              <Alert tone="info">Aucun avis publié pour l&apos;instant. Soyez le premier à donner votre avis après achat.</Alert>
            ) : (
              approvedReviews.map((r) => (
                <Card key={r.id}>
                  <CardContent>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-earth-900">
                        {r.user.firstName} {r.user.lastName.charAt(0)}.
                      </p>
                      <Stars value={r.rating} size={13} />
                    </div>
                    <p className="mt-1 text-xs text-earth-500">{formatDateFR(r.createdAt)}</p>
                    <p className="mt-2 text-sm leading-relaxed text-earth-700">{r.comment}</p>
                    {r.reply ? (
                      <div className="mt-3 rounded-xl bg-earth-50 p-3 text-sm">
                        <p className="font-semibold text-earth-800">Réponse du producteur</p>
                        <p className="mt-1 text-earth-600">{r.reply}</p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Suggestions */}
      {similar.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-earth-900">Produits similaires</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      <p className="mt-10 text-xs text-earth-400">
        Dernière mise à jour : {formatDateFR(product.updatedAt)} · Prix en {formatFCFA(product.price)}.
      </p>
    </div>
  );
}
