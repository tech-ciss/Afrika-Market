"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

type Facets = Awaited<ReturnType<typeof import("@/lib/services/catalog.service").getCatalogFacets>>;

interface Props {
  facets: Facets;
  current: {
    q?: string;
    category?: string;
    country?: string;
    region?: string;
    producer?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    isNew?: boolean;
    onSale?: boolean;
    minRating?: number;
  };
  query: Record<string, string | undefined>;
}

function Section({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-earth-100 py-3 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-earth-800"
        aria-expanded={open}
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4 text-earth-500" /> : <ChevronDown className="h-4 w-4 text-earth-500" />}
      </button>
      {open ? <div className="mt-3 space-y-2">{children}</div> : null}
    </div>
  );
}

/** Filtres du catalogue (§7 A3) — formulaire GET, donc partageable et indexable. */
export function CatalogFiltersPanel({ facets, current, query }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    prix_min: current.minPrice?.toString() ?? "",
    prix_max: current.maxPrice?.toString() ?? "",
    cat: current.category ?? "",
    pays: current.country ?? "",
    region: current.region ?? "",
    vendeur: current.producer ?? "",
    stock: current.inStock ? "1" : "",
    nouveau: current.isNew ? "1" : "",
    promo: current.onSale ? "1" : "",
    note: current.minRating?.toString() ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v && !Object.hasOwn(form, k)) params.set(k, v);
    }
    if (query.q) params.set("q", query.q);
    for (const [k, v] of Object.entries(form)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("page");
    router.push(`/produits?${params.toString()}`);
    setOpen(false);
  }

  function reset() {
    router.push(query.q ? `/produits?q=${encodeURIComponent(query.q)}` : "/produits");
    setForm({ prix_min: "", prix_max: "", cat: "", pays: "", region: "", vendeur: "", stock: "", nouveau: "", promo: "", note: "" });
  }

  const panel = (
    <form onSubmit={submit} className="rounded-2xl border border-earth-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-earth-900">
          <SlidersHorizontal className="h-4 w-4 text-brand-600" /> Filtres
        </h2>
        <button type="button" onClick={reset} className="text-xs font-semibold text-earth-500 hover:text-brand-700">
          Réinitialiser
        </button>
      </div>

      <div className="mt-2">
        <Section title="Catégorie">
          <select
            value={form.cat}
            onChange={(e) => set("cat", e.target.value)}
            className="field"
            aria-label="Filtrer par catégorie"
          >
            <option value="">Toutes les catégories</option>
            {facets.categories.map((c) => (
              <optgroup key={c.id} label={c.name}>
                <option value={c.slug}>{c.name}</option>
                {c.children.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    — {s.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Section>

        <Section title="Prix (FCFA)">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Min"
              value={form.prix_min}
              onChange={(e) => set("prix_min", e.target.value)}
              className="field"
              aria-label="Prix minimum"
            />
            <span className="text-earth-500">—</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Max"
              value={form.prix_max}
              onChange={(e) => set("prix_max", e.target.value)}
              className="field"
              aria-label="Prix maximum"
            />
          </div>
          <p className="text-xs text-earth-500">
            Fourchette disponible : {facets.minPrice.toLocaleString("fr-FR")} – {facets.maxPrice.toLocaleString("fr-FR")} FCFA
          </p>
        </Section>

        <Section title="Pays & région" defaultOpen={false}>
          <select value={form.pays} onChange={(e) => set("pays", e.target.value)} className="field" aria-label="Filtrer par pays">
            <option value="">Tous les pays</option>
            {facets.countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c._count.products})
              </option>
            ))}
          </select>
          <select value={form.region} onChange={(e) => set("region", e.target.value)} className="field" aria-label="Filtrer par région">
            <option value="">Toutes les régions</option>
            {facets.regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Section>

        <Section title="Producteur" defaultOpen={false}>
          <select value={form.vendeur} onChange={(e) => set("vendeur", e.target.value)} className="field" aria-label="Filtrer par producteur">
            <option value="">Tous les producteurs</option>
            {facets.producers.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} ({p._count.products})
              </option>
            ))}
          </select>
        </Section>

        <Section title="Disponibilité">
          {[
            { key: "stock" as const, label: "En stock uniquement" },
            { key: "nouveau" as const, label: "Nouveautés" },
            { key: "promo" as const, label: "En promotion" },
          ].map((opt) => (
            <label key={opt.key} className="flex cursor-pointer items-center gap-2 text-sm text-earth-700">
              <input
                type="checkbox"
                checked={form[opt.key] === "1"}
                onChange={(e) => set(opt.key, e.target.checked ? "1" : "")}
                className="h-4 w-4 rounded border-earth-300 text-brand-600 focus:ring-brand-500"
              />
              {opt.label}
            </label>
          ))}
        </Section>

        <Section title="Note minimale" defaultOpen={false}>
          <div className="flex gap-2">
            {[0, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => set("note", n === 0 ? "" : String(n))}
                className={
                  form.note === (n === 0 ? "" : String(n))
                    ? "rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white"
                    : "rounded-lg border border-earth-300 px-3 py-1.5 text-xs font-semibold text-earth-700 hover:bg-earth-50"
                }
              >
                {n === 0 ? "Toutes" : `${n}★+`}
              </button>
            ))}
          </div>
        </Section>
      </div>

      <Button type="submit" className="mt-4 w-full">
        Appliquer les filtres
      </Button>
    </form>
  );

  return (
    <>
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn-secondary btn-md w-full"
          aria-expanded={open}
        >
          <SlidersHorizontal className="h-4 w-4" /> {open ? "Masquer les filtres" : "Afficher les filtres"}
        </button>
      </div>
      <div className={open ? "block" : "hidden lg:block"}>{panel}</div>
    </>
  );
}
