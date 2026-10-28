"use client";

import { useActionState } from "react";
import { contactAction } from "@/actions/contact";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/fields";
import { Alert } from "@/components/ui/surfaces";

export function ContactForm() {
  const [state, action, pending] = useActionState(contactAction, {});

  if (state.ok) {
    return (
      <Alert tone="success">
        Merci ! Votre message a bien été transmis à notre équipe. Nous répondons sous 48 h ouvrées.
      </Alert>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom complet" htmlFor="name" required>
          <Input id="name" name="name" required autoComplete="name" placeholder="Aya Kouassi" />
        </Field>
        <Field label="Adresse e-mail" htmlFor="email" required>
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="vous@mail.ci" />
        </Field>
      </div>
      <Field label="Objet" htmlFor="subject" required>
        <Input id="subject" name="subject" required placeholder="Question sur ma commande" />
      </Field>
      <Field label="Message" htmlFor="message" required>
        <Textarea id="message" name="message" required className="min-h-36" placeholder="Décrivez votre demande…" />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Envoi en cours…" : "Envoyer le message"}
      </Button>
    </form>
  );
}
