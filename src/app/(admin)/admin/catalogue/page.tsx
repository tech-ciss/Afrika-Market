import type { Metadata } from "next";
import Link from "next/link";
import { CornerDownRight, Pencil } from "lucide-react";
import { getCategories } from "@/lib/services/catalog.service";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { CategoryForm } from "@/components/features/admin-forms";
import { PLACEHOLDER_IMAGE } from "@/lib/images";
import { Badge } from "@/components/ui/surfaces";
import { PageHeader } from "@/components/ui/page-header";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Catégories" };

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const { edit } = await searchParams;

  const [categories, details] = await Promise.all([
    getCategories(true),
    prisma.category.findMany({
      select: { id: true, imageUrl: true, isActive: true, description: true, position: true, parentId: true, slug: true, name: true },
    }),
  ]);
  const byId = new Map(details.map((d) => [d.id, d]));
  const editing = edit ? byId.get(edit) : undefined;

  const flat = categories.flatMap((c) => [
    { id: c.id, name: c.name, level: 0, slug: c.slug, count: c.productCount },
    ...c.children.map((s) => ({ id: s.id, name: s.name, level: 1, slug: s.slug, count: s.productCount })),
  ]);

  return (
    <div>
      <PageHeader title="Catégories" description={`${flat.length} catégories. Une catégorie peut avoir des sous-catégories ; les photos des six premières s'affichent en arches sur l'accueil.`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_440px] lg:items-start">
        <ul className="divide-y divide-earth-100 overflow-hidden rounded-2xl border border-earth-200 bg-white">
          {flat.map((c) => {
            const d = byId.get(c.id);
            return (
              <li key={c.id} className={cn("flex items-center gap-3 px-4 py-3", editing?.id === c.id && "bg-sun-50")}>
                {c.level > 0 ? <CornerDownRight className="ml-3 h-4 w-4 shrink-0 text-earth-500" aria-hidden /> : null}
                <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-brand-100">
                  <SmartImage src={d?.imageUrl || PLACEHOLDER_IMAGE} alt="" fill sizes="40px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm text-earth-900", c.level === 0 ? "font-semibold" : "font-medium")}>{c.name}</p>
                  <p className="truncate text-xs text-earth-500">
                    {c.slug} · {c.count} produit{c.count > 1 ? "s" : ""}
                  </p>
                </div>
                {d && !d.isActive ? <Badge tone="neutral">Masquée</Badge> : null}
                <Link href={`/admin/catalogue?edit=${c.id}`} className="btn-secondary btn-sm shrink-0" aria-label={`Modifier ${c.name}`}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden /> Modifier
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="lg:sticky lg:top-28">
          <CategoryForm
            key={editing?.id ?? "new"}
            category={editing}
            categories={categories.flatMap((c) => [{ id: c.id, name: c.name }, ...c.children.map((s) => ({ id: s.id, name: `— ${s.name}` }))])}
          />
        </div>
      </div>
    </div>
  );
}
