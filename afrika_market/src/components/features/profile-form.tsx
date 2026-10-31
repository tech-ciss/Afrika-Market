"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/fields";
import { Alert } from "@/components/ui/surfaces";

export function ProfileForm({
  profile,
}: {
  profile: { firstName: string; lastName: string; email: string; phone: string | null };
}) {
  const [state, action, pending] = useActionState(updateProfileAction, {});
  const [pwState, pwAction, pwPending] = useActionState(changePasswordAction, {});

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-earth-200 bg-white p-5">
        <h2 className="text-base font-bold text-earth-900">Informations personnelles</h2>

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
          <Field label="Prénom" htmlFor="firstName" required error={state.fieldErrors?.firstName?.[0]}>
            <Input id="firstName" name="firstName" required defaultValue={profile.firstName} />
          </Field>
          <Field label="Nom" htmlFor="lastName" required error={state.fieldErrors?.lastName?.[0]}>
            <Input id="lastName" name="lastName" required defaultValue={profile.lastName} />
          </Field>
          <Field label="E-mail" htmlFor="email" hint="L'adresse e-mail ne peut pas être modifiée.">
            <Input id="email" name="email" type="email" value={profile.email} disabled readOnly />
          </Field>
          <Field label="Téléphone" htmlFor="phone" error={state.fieldErrors?.phone?.[0]}>
            <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} placeholder="+225 07 07 07 07 07" />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer les modifications"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-earth-200 bg-white p-5">
        <h2 className="text-base font-bold text-earth-900">Changer mon mot de passe</h2>

        {pwState.success ? (
          <Alert tone="success" className="mt-3">
            {pwState.success}
          </Alert>
        ) : null}
        {pwState.error ? (
          <Alert tone="error" className="mt-3">
            {pwState.error}
          </Alert>
        ) : null}

        <form action={pwAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Mot de passe actuel" htmlFor="currentPassword" required>
            <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
          </Field>
          <Field label="Nouveau mot de passe" htmlFor="newPassword" required hint="8 caractères minimum">
            <Input id="newPassword" name="newPassword" type="password" required autoComplete="new-password" />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" variant="dark" disabled={pwPending}>
              {pwPending ? "Modification…" : "Modifier le mot de passe"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
