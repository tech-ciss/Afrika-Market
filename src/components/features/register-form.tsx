"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/fields";
import { Alert } from "@/components/ui/surfaces";

export function RegisterForm({ intent = "client" }: { intent?: "client" | "producteur" }) {
  const [state, action, pending] = useActionState(registerAction, {});

  return (
    <div className="rounded-3xl border border-earth-200 bg-white p-6 shadow-card sm:p-8">
      <h1 className="text-2xl font-bold text-earth-900">
        {intent === "producteur" ? "Devenir producteur" : "Créer mon compte"}
      </h1>
      <p className="mt-1 text-sm text-earth-600">
        {intent === "producteur"
          ? "Présentez votre activité, publiez vos produits après validation administrative."
          : "Achetez en FCFA, suivez vos commandes et retrouvez vos adresses."}
      </p>

      {state.error ? (
        <Alert tone="error" className="mt-4">
          {state.error}
        </Alert>
      ) : null}

      <form action={action} className="mt-5 space-y-4">
        <input type="hidden" name="intent" value={intent} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" htmlFor="firstName" required error={state.fieldErrors?.firstName?.[0]}>
            <Input id="firstName" name="firstName" required autoComplete="given-name" placeholder="Aya" />
          </Field>
          <Field label="Nom" htmlFor="lastName" required error={state.fieldErrors?.lastName?.[0]}>
            <Input id="lastName" name="lastName" required autoComplete="family-name" placeholder="Kouassi" />
          </Field>
        </div>

        <Field label="Adresse e-mail" htmlFor="email" required error={state.fieldErrors?.email?.[0]}>
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="vous@mail.ci" />
        </Field>

        <Field
          label="Téléphone"
          htmlFor="phone"
          required
          error={state.fieldErrors?.phone?.[0]}
          hint="Format ivoirien : +225 07 07 07 07 07"
        >
          <Input id="phone" name="phone" required autoComplete="tel" placeholder="+225 07 07 07 07 07" />
        </Field>

        <Field
          label="Mot de passe"
          htmlFor="password"
          required
          error={state.fieldErrors?.password?.[0]}
          hint="8 caractères minimum, avec au moins une lettre et un chiffre"
        >
          <Input id="password" name="password" type="password" required autoComplete="new-password" placeholder="••••••••" />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Création du compte…" : "Créer mon compte"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-earth-600">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-semibold text-brand-700 underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
