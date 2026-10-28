"use client";

import { useActionState } from "react";
import { saveCategoryAction, saveCountryAction, savePromoAction, saveZoneAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/fields";
import { Alert } from "@/components/ui/surfaces";

function Feedback({ state }: { state: { error?: string; success?: string } }) {
  if (state.success) return <Alert tone="success">{state.success}</Alert>;
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  return null;
}

export function CategoryForm({
  categories,
  category,
}: {
  categories: { id: string; name: string }[];
  category?: { id: string; name: string; slug: string; description: string | null; imageUrl: string | null; parentId: string | null; position: number };
}) {
  const [state, action, pending] = useActionState(saveCategoryAction, {});

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-earth-200 bg-white p-5">
      {category?.id ? <input type="hidden" name="id" value={category.id} /> : null}
      <Feedback state={state} />
      <h3 className="text-base font-bold text-earth-900">{category ? "Modifier la catégorie" : "Nouvelle catégorie"}</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nom" htmlFor="cat-name" required>
          <Input id="cat-name" name="name" required defaultValue={category?.name ?? ""} />
        </Field>
        <Field label="Slug" htmlFor="cat-slug" hint="Généré automatiquement si vide.">
          <Input id="cat-slug" name="slug" defaultValue={category?.slug ?? ""} placeholder="epices-condiments" />
        </Field>
        <Field label="Catégorie parente" htmlFor="cat-parent">
          <Select id="cat-parent" name="parentId" defaultValue={category?.parentId ?? ""}>
            <option value="">— Catégorie racine —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Position" htmlFor="cat-position">
          <Input id="cat-position" name="position" type="number" min={0} defaultValue={category?.position ?? 0} />
        </Field>
        <Field label="URL de l'image" htmlFor="cat-image" className="sm:col-span-2">
          <Input id="cat-image" name="imageUrl" defaultValue={category?.imageUrl ?? ""} />
        </Field>
        <Field label="Description" htmlFor="cat-desc" className="sm:col-span-2">
          <Textarea id="cat-desc" name="description" defaultValue={category?.description ?? ""} className="min-h-20" />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-earth-700">
        <Checkbox name="isActive" defaultChecked /> Catégorie visible
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer la catégorie"}
      </Button>
    </form>
  );
}

export function PromoForm({
  categories,
  products,
}: {
  categories: { id: string; name: string }[];
  products: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(savePromoAction, {});

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-earth-200 bg-white p-5">
      <Feedback state={state} />
      <h3 className="text-base font-bold text-earth-900">Nouveau code promotionnel</h3>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Code" htmlFor="promo-code" required hint="Ex. BIENVENUE10">
          <Input id="promo-code" name="code" required placeholder="BIENVENUE10" />
        </Field>
        <Field label="Type" htmlFor="promo-type" required>
          <Select id="promo-type" name="type" defaultValue="PERCENTAGE">
            <option value="PERCENTAGE">Pourcentage (%)</option>
            <option value="FIXED">Montant fixe (FCFA)</option>
            <option value="FREE_SHIPPING">Livraison offerte</option>
          </Select>
        </Field>
        <Field label="Valeur" htmlFor="promo-value" required hint="10 = 10 % ou 1 000 FCFA">
          <Input id="promo-value" name="value" type="number" min={0} required defaultValue={10} />
        </Field>

        <Field label="Portée" htmlFor="promo-scope">
          <Select id="promo-scope" name="scope" defaultValue="GLOBAL">
            <option value="GLOBAL">Toute la boutique</option>
            <option value="CATEGORY">Une catégorie</option>
            <option value="PRODUCT">Un produit</option>
          </Select>
        </Field>
        <Field label="Catégorie" htmlFor="promo-category">
          <Select id="promo-category" name="categoryId" defaultValue="">
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Produit" htmlFor="promo-product">
          <Select id="promo-product" name="productId" defaultValue="">
            <option value="">—</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Montant minimum (FCFA)" htmlFor="promo-min">
          <Input id="promo-min" name="minimumAmount" type="number" min={0} defaultValue={0} />
        </Field>
        <Field label="Utilisations max." htmlFor="promo-max" hint="Vide = illimité">
          <Input id="promo-max" name="maximumUses" type="number" min={1} />
        </Field>
        <Field label="Utilisations / client" htmlFor="promo-max-user">
          <Input id="promo-max-user" name="maximumUsesPerUser" type="number" min={1} />
        </Field>
        <Field label="Début" htmlFor="promo-start" required>
          <Input id="promo-start" name="startsAt" type="date" required />
        </Field>
        <Field label="Fin (optionnel)" htmlFor="promo-end">
          <Input id="promo-end" name="endsAt" type="date" />
        </Field>
        <Field label="Description" htmlFor="promo-desc">
          <Input id="promo-desc" name="description" placeholder="-10 % sur la première commande" />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-earth-700">
        <Checkbox name="isActive" defaultChecked /> Code actif
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer le code"}
      </Button>
    </form>
  );
}

export function ZoneForm({ countries }: { countries: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(saveZoneAction, {});

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-earth-200 bg-white p-5">
      <Feedback state={state} />
      <h3 className="text-base font-bold text-earth-900">Nouvelle zone de livraison</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nom de la zone" htmlFor="zone-name" required hint="Abidjan, Bouaké, Korhogo…">
          <Input id="zone-name" name="name" required />
        </Field>
        <Field label="Pays" htmlFor="zone-country" required>
          <Select id="zone-country" name="countryId" required>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tarif de base (FCFA)" htmlFor="zone-price" required>
          <Input id="zone-price" name="basePrice" type="number" min={0} required defaultValue={1500} />
        </Field>
        <Field label="Livraison offerte à partir de (FCFA)" htmlFor="zone-free" hint="Vide = jamais offerte.">
          <Input id="zone-free" name="freeFrom" type="number" min={0} />
        </Field>
        <Field label="Délai (jours)" htmlFor="zone-days">
          <Input id="zone-days" name="estimatedDays" type="number" min={0} defaultValue={2} />
        </Field>
        <Field label="Communes desservies" htmlFor="zone-districts" hint="Séparées par des virgules.">
          <Input id="zone-districts" name="districts" placeholder="Cocody, Yopougon, Marcory" />
        </Field>
        <Field label="Description" htmlFor="zone-desc" className="sm:col-span-2">
          <Input id="zone-desc" name="description" />
        </Field>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-earth-700">
          <Checkbox name="allowCashOnDelivery" defaultChecked /> Paiement à la livraison accepté
        </label>
        <label className="flex items-center gap-2 text-sm text-earth-700">
          <Checkbox name="isActive" defaultChecked /> Zone active
        </label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer la zone"}
      </Button>
    </form>
  );
}

export function CountryForm() {
  const [state, action, pending] = useActionState(saveCountryAction, {});

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-earth-200 bg-white p-5">
      <Feedback state={state} />
      <h3 className="text-base font-bold text-earth-900">Ajouter un pays (multi-pays)</h3>
      <div className="grid gap-3 sm:grid-cols-3">
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
    </form>
  );
}
