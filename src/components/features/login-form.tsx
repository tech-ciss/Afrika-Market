"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/fields";
import { Alert } from "@/components/ui/surfaces";

export function LoginForm({ callbackUrl = "/compte" }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(loginAction, {});

  return (
    <div className="rounded-3xl border border-earth-200 bg-white p-6 shadow-card sm:p-8">
      <h1 className="text-2xl font-bold text-earth-900">Bon retour parmi nous</h1>
      <p className="mt-1 text-sm text-earth-600">
        Connectez-vous pour retrouver votre panier, vos commandes et vos adresses.
      </p>

      {state.error ? (
        <Alert tone="error" className="mt-4">
          {state.error}
        </Alert>
      ) : null}

      <form action={action} className="mt-5 space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <Field label="Adresse e-mail" htmlFor="email" required error={state.fieldErrors?.email?.[0]}>
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="vous@mail.ci" />
        </Field>

        <Field label="Mot de passe" htmlFor="password" required error={state.fieldErrors?.password?.[0]}>
          <Input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      {process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? (
      <div className="mt-4 rounded-xl bg-earth-50 p-3 text-xs text-earth-600">
        <p className="font-semibold text-earth-800">Comptes de démonstration</p>
        <ul className="mt-1.5 space-y-0.5">
          <li>Client : aya.kouassi0@mail.ci</li>
          <li>Vendeur : vendeur@afrikamarket.ci</li>
          <li>Admin : admin@afrikamarket.ci</li>
          <li>Super-admin : superadmin@afrikamarket.ci</li>
          <li className="pt-1 text-earth-500">Mot de passe : Afrika2026!</li>
        </ul>
      </div>
      ) : null}

      <p className="mt-5 text-center text-sm text-earth-600">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-brand-700 underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
