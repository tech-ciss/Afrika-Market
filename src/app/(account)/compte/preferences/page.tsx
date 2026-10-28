import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { subscribeNewsletterAction } from "@/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/surfaces";

export const metadata: Metadata = { title: "Préférences" };

async function subscribeNewsletterFormAction(formData: FormData) {
  "use server";
  await subscribeNewsletterAction({}, formData);
}

export default async function PreferencesPage() {
  const user = await requireUser();
  const subscription = await prisma.newsletterSubscriber.findUnique({ where: { email: user.email ?? "" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-earth-900">Préférences</h1>
      <p className="mt-1 text-sm text-earth-600">
        Gérez vos abonnements et vos consentements (§17 — préférences du compte).
      </p>

      <section className="mt-6 rounded-2xl border border-earth-200 bg-white p-5">
        <h2 className="text-base font-bold text-earth-900">Newsletter</h2>
        <p className="mt-1 text-sm text-earth-600">
          Nouveautés, récoltes et offres réservées aux abonnés. Un envoi par mois maximum.
        </p>

        {subscription?.isActive ? (
          <Alert tone="success" className="mt-4">
            Vous êtes abonné(e) avec {subscription.email} depuis le{" "}
            {subscription.createdAt.toLocaleDateString("fr-FR")}.
          </Alert>
        ) : (
          <form action={subscribeNewsletterFormAction} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="source" value="account" />
            <div className="min-w-64 flex-1">
              <label htmlFor="nl-email" className="mb-1.5 block text-sm font-medium text-earth-800">
                Adresse d&apos;abonnement
              </label>
              <input
                id="nl-email"
                type="email"
                name="email"
                required
                defaultValue={user.email ?? ""}
                className="w-full rounded-xl border border-earth-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <Button type="submit">S&apos;abonner</Button>
          </form>
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-earth-200 bg-white p-5">
        <h2 className="text-base font-bold text-earth-900">Données personnelles</h2>
        <p className="mt-1 text-sm text-earth-600">
          Vos données sont utilisées uniquement pour le traitement de vos commandes et ne sont jamais revendues.
          Consultez notre{" "}
          <a href="/confidentialite" className="font-semibold text-brand-700 underline">
            politique de confidentialité
          </a>
          .
        </p>
      </section>
    </div>
  );
}
