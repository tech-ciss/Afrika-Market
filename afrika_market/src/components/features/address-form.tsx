"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { saveAddressAction } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/fields";
import { Alert } from "@/components/ui/surfaces";

export interface AddressRow {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  city: string;
  district: string;
  neighborhood: string | null;
  street: string;
  additionalInfo: string | null;
  isDefault: boolean;
}

export function AddressForm({ address, districts }: { address?: AddressRow; districts: string[] }) {
  const [state, action, pending] = useActionState(saveAddressAction, {});
  const [open, setOpen] = useState(!address);

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Modifier cette adresse
      </Button>
    );
  }

  return (
    <div className="rounded-2xl border border-earth-200 bg-white p-5">
      <h3 className="text-base font-bold text-earth-900">{address ? "Modifier l'adresse" : "Nouvelle adresse"}</h3>

      {state.success ? (
        <Alert tone="success" className="mt-3">
          {state.success}
        </Alert>
      ) : null}
      {state.error ? (
        <Alert tone="error" className="mt-3">
          {state.error}
        </Alert>
      ) : null}

      <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
        {address?.id ? <input type="hidden" name="id" value={address.id} /> : null}

        <Field label="Libellé" htmlFor="label" required hint="Domicile, Bureau…">
          <Input id="label" name="label" required defaultValue={address?.label ?? "Domicile"} />
        </Field>
        <Field label="Téléphone" htmlFor="phone" required error={state.fieldErrors?.phone?.[0]}>
          <Input id="phone" name="phone" required defaultValue={address?.phone ?? ""} placeholder="+225 07 07 07 07 07" />
        </Field>
        <Field label="Prénom" htmlFor="firstName" required error={state.fieldErrors?.firstName?.[0]}>
          <Input id="firstName" name="firstName" required defaultValue={address?.firstName ?? ""} />
        </Field>
        <Field label="Nom" htmlFor="lastName" required error={state.fieldErrors?.lastName?.[0]}>
          <Input id="lastName" name="lastName" required defaultValue={address?.lastName ?? ""} />
        </Field>
        <Field label="Ville" htmlFor="city" required error={state.fieldErrors?.city?.[0]}>
          <Input id="city" name="city" required defaultValue={address?.city ?? "Abidjan"} />
        </Field>
        <Field label="Commune / quartier" htmlFor="district" required error={state.fieldErrors?.district?.[0]}>
          <Input id="district" name="district" required list="districts" defaultValue={address?.district ?? ""} />
          <datalist id="districts">
            {districts.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </Field>
        <Field label="Rue / repère" htmlFor="street" required className="sm:col-span-2" error={state.fieldErrors?.street?.[0]}>
          <Input id="street" name="street" required defaultValue={address?.street ?? ""} />
        </Field>
        <Field label="Quartier (optionnel)" htmlFor="neighborhood">
          <Input id="neighborhood" name="neighborhood" defaultValue={address?.neighborhood ?? ""} />
        </Field>
        <Field label="Indications (optionnel)" htmlFor="additionalInfo">
          <Input id="additionalInfo" name="additionalInfo" defaultValue={address?.additionalInfo ?? ""} />
        </Field>

        <label className="flex items-center gap-2 text-sm text-earth-700 sm:col-span-2">
          <Checkbox name="isDefault" defaultChecked={address?.isDefault ?? false} />
          Définir comme adresse par défaut
        </label>

        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer l'adresse"}
          </Button>
          {address ? (
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
