"use client";

import { useActionState, useState, type ReactNode } from "react";
import { saveProductAction } from "@/actions/producer";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/fields";
import { Alert } from "@/components/ui/surfaces";
import { ImagePreviewField } from "@/components/features/image-preview-field";

export interface ProductFormValue {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  unit: string;
  weight: number | null;
  sku: string | null;
  tags: string | null;
  images: string[];
  countryId: string;
  region: string | null;
  city: string | null;
  originMethod: string | null;
  harvestPeriod: string | null;
  conservation: string | null;
  isActive: boolean;
  isFeatured: boolean;
}

function FormSection({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-earth-200 bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-3 font-display text-xl font-bold text-brand-950">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-800 text-sm font-bold text-sun-400">
          {n}
        </span>
        {title}
      </h2>
      {hint ? <p className="mt-1 text-sm text-earth-600">{hint}</p> : null}
      {children}
    </section>
  );
}

export function ProductForm({
  product,
  categories,
  countries,
}: {
  product?: ProductFormValue;
  categories: { id: string; name: string }[];
  countries: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(saveProductAction, {});
  const [name, setName] = useState(product?.name ?? "");

  return (
    <form action={action} className="space-y-5">
      {product?.id ? <input type="hidden" name="id" value={product.id} /> : null}

      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <FormSection n={1} title="Informations générales">
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nom du produit" htmlFor="name" required className="sm:col-span-2" error={state.fieldErrors?.name?.[0]}>
            <Input id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Noix de cajou premium 500 g" />
          </Field>
          <Field label="Catégorie" htmlFor="categoryId" required error={state.fieldErrors?.categoryId?.[0]}>
            <Select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""} required>
              <option value="">Sélectionnez…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pays d'origine" htmlFor="countryId" required error={state.fieldErrors?.countryId?.[0]}>
            <Select id="countryId" name="countryId" defaultValue={product?.countryId ?? countries[0]?.id ?? ""} required>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description courte" htmlFor="shortDescription" required className="sm:col-span-2" error={state.fieldErrors?.shortDescription?.[0]}>
            <Textarea id="shortDescription" name="shortDescription" required defaultValue={product?.shortDescription ?? ""} className="min-h-16" maxLength={220} />
          </Field>
          <Field label="Description détaillée" htmlFor="description" required className="sm:col-span-2" error={state.fieldErrors?.description?.[0]}>
            <Textarea id="description" name="description" required defaultValue={product?.description ?? ""} className="min-h-32" />
          </Field>
        </div>
      </FormSection>

      <FormSection n={2} title="Photo, prix et stock">
        <div className="mt-4">
          <ImagePreviewField
            id="imageUrl"
            name="imageUrl"
            label="Photo principale"
            hint={`Lien vers votre photo (Cloudinary, Vercel Blob, UploadThing, Unsplash, Pexels).${product?.id ? " Laisser vide pour conserver l'actuelle." : ""}`}
            defaultValue={product?.images?.[0] ?? ""}
            error={state.fieldErrors?.images?.[0]}
          />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field label="Prix (FCFA)" htmlFor="price" required error={state.fieldErrors?.price?.[0]}>
            <Input id="price" name="price" type="number" min={1} required defaultValue={product?.price ?? ""} />
          </Field>
          <Field label="Prix barré (optionnel)" htmlFor="compareAtPrice" hint="Affiché barré si supérieur au prix.">
            <Input id="compareAtPrice" name="compareAtPrice" type="number" min={0} defaultValue={product?.compareAtPrice ?? ""} />
          </Field>
          <Field label="Unité de vente" htmlFor="unit" required error={state.fieldErrors?.unit?.[0]}>
            <Input id="unit" name="unit" required defaultValue={product?.unit ?? "pièce"} placeholder="kg, pot, sachet…" />
          </Field>
          <Field label="Stock" htmlFor="stock" required error={state.fieldErrors?.stock?.[0]}>
            <Input id="stock" name="stock" type="number" min={0} required defaultValue={product?.stock ?? 0} />
          </Field>
          <Field label="Seuil d'alerte" htmlFor="lowStockThreshold" hint="Alerte sous ce seuil.">
            <Input id="lowStockThreshold" name="lowStockThreshold" type="number" min={0} defaultValue={product?.lowStockThreshold ?? 5} />
          </Field>
          <Field label="Poids (g, optionnel)" htmlFor="weight">
            <Input id="weight" name="weight" type="number" min={0} defaultValue={product?.weight ?? ""} />
          </Field>
          <Field label="Référence (SKU)" htmlFor="sku">
            <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} placeholder="AM-0001" />
          </Field>
          <Field label="Tags (séparés par des virgules)" htmlFor="tags">
            <Input id="tags" name="tags" defaultValue={product?.tags ?? ""} placeholder="cajou, snacking, séché" />
          </Field>

        </div>
      </FormSection>

      <FormSection
        n={3}
        title="Origine et traçabilité"
        hint="Ce que le client voit sur la fiche produit : c'est ce qui fait la différence de AFRIKA MARKET."
      >
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Région" htmlFor="region">
            <Input id="region" name="region" defaultValue={product?.region ?? ""} placeholder="Savanes" />
          </Field>
          <Field label="Ville / zone de production" htmlFor="city">
            <Input id="city" name="city" defaultValue={product?.city ?? ""} placeholder="Korhogo" />
          </Field>
          <Field label="Méthode de production" htmlFor="originMethod" className="sm:col-span-2">
            <Input id="originMethod" name="originMethod" defaultValue={product?.originMethod ?? ""} placeholder="Séchage solaire sur claies" />
          </Field>
          <Field label="Période de récolte" htmlFor="harvestPeriod">
            <Input id="harvestPeriod" name="harvestPeriod" defaultValue={product?.harvestPeriod ?? ""} placeholder="Octobre – Mars" />
          </Field>
          <Field label="Conservation" htmlFor="conservation">
            <Input id="conservation" name="conservation" defaultValue={product?.conservation ?? ""} placeholder="Lieu frais et sec" />
          </Field>
        </div>
      </FormSection>

      <div className="flex flex-wrap gap-x-8 gap-y-3 rounded-2xl border border-earth-200 bg-white p-5 sm:p-6">
        <label className="flex items-center gap-2 text-sm text-earth-700">
          <Checkbox name="isActive" defaultChecked={product?.isActive ?? true} /> Produit visible dans la boutique
        </label>
        <label className="flex items-center gap-2 text-sm text-earth-700">
          <Checkbox name="isFeatured" defaultChecked={product?.isFeatured ?? false} /> Mettre en avant sur l&apos;accueil
        </label>
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Enregistrement…" : product?.id ? "Enregistrer les modifications" : "Publier le produit"}
      </Button>
    </form>
  );
}
