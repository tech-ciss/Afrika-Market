"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { saveCategoryAction, saveCountryAction, savePromoAction, saveZoneAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/fields";
import { Alert } from "@/components/ui/surfaces";
import { ImagePreviewField } from "@/components/features/image-preview-field";

function Feedback({ state }: { state: { error?: string; success?: string } }) {
  if (state.success) return <Alert tone="success">{state.success}</Alert>;
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  return null;
}

/** Cadre commun des formulaires d'administration : titre, retour au mode « création » en édition. */
function FormShell({
  title,
  editing,
  resetHref,
  children,
}: {
  title: string;
  editing: boolean;
  resetHref: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-earth-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-brand-950">{title}</h2>
        {editing ? (
          <Link href={resetHref} className="shrink-0 py-2 text-xs font-semibold text-brand-700 hover:underline">
            Annuler la modification
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function CategoryForm({
  categories,
  category,
}: {
  categories: { id: string; name: string }[];
  category?: { id: string; name: string; slug: string; description: string | null; imageUrl: string | null; parentId: string | null; position: number; isActive?: boolean };
}) {
  const [state, action, pending] = useActionState(saveCategoryAction, {});

  return (
    <form action={action}>
      <FormShell title={category ? "Modifier la catégorie" : "Nouvelle catégorie"} editing={!!category} resetHref="/admin/catalogue">
        {category?.id ? <input type="hidden" name="id" value={category.id} /> : null}
        <Feedback state={state} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" htmlFor="cat-name" required error={state.fieldErrors?.name?.[0]}>
            <Input id="cat-name" name="name" required defaultValue={category?.name ?? ""} />
          </Field>
          <Field label="Slug" htmlFor="cat-slug" hint="Généré automatiquement si vide." error={state.fieldErrors?.slug?.[0]}>
            <Input id="cat-slug" name="slug" defaultValue={category?.slug ?? ""} placeholder="epices-condiments" />
          </Field>
          <Field label="Catégorie parente" htmlFor="cat-parent">
            <Select id="cat-parent" name="parentId" defaultValue={category?.parentId ?? ""}>
              <option value="">— Catégorie racine —</option>
              {categories
                .filter((c) => c.id !== category?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Position" htmlFor="cat-position" hint="Plus petit = affiché en premier.">
            <Input id="cat-position" name="position" type="number" min={0} defaultValue={category?.position ?? 0} />
          </Field>
          <div className="sm:col-span-2">
            <ImagePreviewField
              id="cat-image"
              name="imageUrl"
              label="Photo de la catégorie"
              hint="Photo verticale (3:4) : elle s'affiche dans une arche sur l'accueil."
              defaultValue={category?.imageUrl ?? ""}
              error={state.fieldErrors?.imageUrl?.[0]}
            />
          </div>
          <Field label="Description" htmlFor="cat-desc" className="sm:col-span-2">
            <Textarea id="cat-desc" name="description" defaultValue={category?.description ?? ""} className="min-h-20" />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-earth-700">
          <Checkbox name="isActive" defaultChecked={category?.isActive ?? true} /> Catégorie visible dans la boutique
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer la catégorie"}
        </Button>
      </FormShell>
    </form>
  );
}

export interface PromoFormValues {
  code: string;
  description: string | null;
  type: string;
  scope: string;
  value: number;
  minimumAmount: number;
  maximumUses: number | null;
  maximumUsesPerUser: number | null;
  productId: string | null;
  categoryId: string | null;
  startsAt: string; // AAAA-MM-JJ
  endsAt: string | null;
  isActive: boolean;
}

export function PromoForm({
  categories,
  products,
  promo,
}: {
  categories: { id: string; name: string }[];
  products: { id: string; name: string }[];
  promo?: PromoFormValues;
}) {
  const [state, action, pending] = useActionState(savePromoAction, {});

  return (
    <form action={action}>
      <FormShell title={promo ? `Modifier ${promo.code}` : "Nouveau code promotionnel"} editing={!!promo} resetHref="/admin/promotions">
        <Feedback state={state} />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Code" htmlFor="promo-code" required hint={promo ? "Le code ne change pas." : "Ex. BIENVENUE10"} error={state.fieldErrors?.code?.[0]}>
            <Input id="promo-code" name="code" required readOnly={!!promo} defaultValue={promo?.code ?? ""} placeholder="BIENVENUE10" />
          </Field>
          <Field label="Type" htmlFor="promo-type" required>
            <Select id="promo-type" name="type" defaultValue={promo?.type ?? "PERCENTAGE"}>
              <option value="PERCENTAGE">Pourcentage (%)</option>
              <option value="FIXED">Montant fixe (FCFA)</option>
              <option value="FREE_SHIPPING">Livraison offerte</option>
            </Select>
          </Field>
          <Field label="Valeur" htmlFor="promo-value" required hint="10 = 10 % ou 1 000 FCFA" error={state.fieldErrors?.value?.[0]}>
            <Input id="promo-value" name="value" type="number" min={0} required defaultValue={promo?.value ?? 10} />
          </Field>

          <Field label="Portée" htmlFor="promo-scope">
            <Select id="promo-scope" name="scope" defaultValue={promo?.scope ?? "GLOBAL"}>
              <option value="GLOBAL">Toute la boutique</option>
              <option value="CATEGORY">Une catégorie</option>
              <option value="PRODUCT">Un produit</option>
            </Select>
          </Field>
          <Field label="Catégorie" htmlFor="promo-category" hint="Si la portée est « catégorie ».">
            <Select id="promo-category" name="categoryId" defaultValue={promo?.categoryId ?? ""}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Produit" htmlFor="promo-product" hint="Si la portée est « produit ».">
            <Select id="promo-product" name="productId" defaultValue={promo?.productId ?? ""}>
              <option value="">—</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Montant minimum (FCFA)" htmlFor="promo-min">
            <Input id="promo-min" name="minimumAmount" type="number" min={0} defaultValue={promo?.minimumAmount ?? 0} />
          </Field>
          <Field label="Utilisations max." htmlFor="promo-max" hint="Vide = illimité">
            <Input id="promo-max" name="maximumUses" type="number" min={1} defaultValue={promo?.maximumUses ?? ""} />
          </Field>
          <Field label="Utilisations / client" htmlFor="promo-max-user">
            <Input id="promo-max-user" name="maximumUsesPerUser" type="number" min={1} defaultValue={promo?.maximumUsesPerUser ?? ""} />
          </Field>
          <Field label="Début" htmlFor="promo-start" required>
            <Input id="promo-start" name="startsAt" type="date" required defaultValue={promo?.startsAt ?? ""} />
          </Field>
          <Field label="Fin (optionnel)" htmlFor="promo-end">
            <Input id="promo-end" name="endsAt" type="date" defaultValue={promo?.endsAt ?? ""} />
          </Field>
          <Field label="Description" htmlFor="promo-desc">
            <Input id="promo-desc" name="description" defaultValue={promo?.description ?? ""} placeholder="-10 % sur la première commande" />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-earth-700">
          <Checkbox name="isActive" defaultChecked={promo?.isActive ?? true} /> Code actif
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer le code"}
        </Button>
      </FormShell>
    </form>
  );
}

export interface ZoneFormValues {
  id: string;
  name: string;
  description: string | null;
  countryId: string;
  basePrice: number;
  freeFrom: number | null;
  estimatedDays: number;
  allowCashOnDelivery: boolean;
  isActive: boolean;
  districts: string[];
}

export function ZoneForm({ countries, zone }: { countries: { id: string; name: string }[]; zone?: ZoneFormValues }) {
  const [state, action, pending] = useActionState(saveZoneAction, {});

  return (
    <form action={action}>
      <FormShell title={zone ? `Modifier ${zone.name}` : "Nouvelle zone de livraison"} editing={!!zone} resetHref="/admin/zones">
        {zone ? <input type="hidden" name="id" value={zone.id} /> : null}
        <Feedback state={state} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom de la zone" htmlFor="zone-name" required hint="Abidjan, Bouaké, Korhogo…" error={state.fieldErrors?.name?.[0]}>
            <Input id="zone-name" name="name" required defaultValue={zone?.name ?? ""} />
          </Field>
          <Field label="Pays" htmlFor="zone-country" required>
            <Select id="zone-country" name="countryId" required defaultValue={zone?.countryId}>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tarif de base (FCFA)" htmlFor="zone-price" required>
            <Input id="zone-price" name="basePrice" type="number" min={0} required defaultValue={zone?.basePrice ?? 1500} />
          </Field>
          <Field label="Livraison offerte à partir de (FCFA)" htmlFor="zone-free" hint="Vide = jamais offerte.">
            <Input id="zone-free" name="freeFrom" type="number" min={0} defaultValue={zone?.freeFrom ?? ""} />
          </Field>
          <Field label="Délai (jours)" htmlFor="zone-days">
            <Input id="zone-days" name="estimatedDays" type="number" min={0} defaultValue={zone?.estimatedDays ?? 2} />
          </Field>
          <Field label="Communes desservies" htmlFor="zone-districts" hint="Séparées par des virgules.">
            <Input id="zone-districts" name="districts" defaultValue={zone?.districts.join(", ") ?? ""} placeholder="Cocody, Yopougon, Marcory" />
          </Field>
          <Field label="Description" htmlFor="zone-desc" className="sm:col-span-2">
            <Input id="zone-desc" name="description" defaultValue={zone?.description ?? ""} />
          </Field>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-earth-700">
            <Checkbox name="allowCashOnDelivery" defaultChecked={zone?.allowCashOnDelivery ?? true} /> Paiement à la livraison accepté
          </label>
          <label className="flex items-center gap-2 text-sm text-earth-700">
            <Checkbox name="isActive" defaultChecked={zone?.isActive ?? true} /> Zone active
          </label>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer la zone"}
        </Button>
      </FormShell>
    </form>
  );
}

export function CountryForm() {
  const [state, action, pending] = useActionState(saveCountryAction, {});

  return (
    <form action={action}>
      <FormShell title="Ajouter un pays" editing={false} resetHref="/admin/parametres">
        <Feedback state={state} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nom" htmlFor="country-name" required>
            <Input id="country-name" name="name" required placeholder="Sénégal" />
          </Field>
          <Field label="Code ISO" htmlFor="country-code" required hint="2 lettres">
            <Input id="country-code" name="code" required maxLength={2} placeholder="SN" />
          </Field>
          <Field label="Devise" htmlFor="country-currency">
            <Input id="country-currency" name="currency" defaultValue="XOF" />
          </Field>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Ajout…" : "Ajouter le pays"}
        </Button>
      </FormShell>
    </form>
  );
}
