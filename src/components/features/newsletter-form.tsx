"use client";

import { useActionState, useEffect, useState } from "react";
import { subscribeNewsletterAction } from "@/actions/newsletter";
import { Button } from "@/components/ui/button";

export function NewsletterForm({ source = "footer" }: { source?: string }) {
  const [state, action, pending] = useActionState(subscribeNewsletterAction, {});
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (state.ok) setDone(true);
  }, [state.ok]);

  if (done) {
    return (
      <p role="status" className="rounded-xl border border-forest-200 bg-white px-4 py-3 text-sm font-medium text-forest-700">
        ✅ Merci ! Votre inscription est confirmée.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="source" value={source} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`nl-${source}`} className="sr-only">
          Votre adresse e-mail
        </label>
        <input
          id={`nl-${source}`}
          type="email"
          name="email"
          required
          placeholder="votre@email.ci"
          className="w-full rounded-xl border border-earth-300 bg-white px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <Button type="submit" disabled={pending} size="lg" className="shrink-0">
          {pending ? "Inscription…" : "S'inscrire"}
        </Button>
      </div>
      {state.error ? (
        <p role="alert" className="text-xs font-medium text-red-600">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
