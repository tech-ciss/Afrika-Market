import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getProducerByUserId } from "@/lib/services/producer.service";
import { updateProducerProfileAction } from "@/actions/producer";
import { PRODUCER_STATUS_LABELS, type ProducerStatus } from "@/lib/validations/enums";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/fields";
import { Alert, Badge } from "@/components/ui/surfaces";
import { ImagePreviewField } from "@/components/features/image-preview-field";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Ma fiche producteur" };

async function updateProducerProfileFormAction(formData: FormData) {
  "use server";
  await updateProducerProfileAction({}, formData);
}

export default async function ProducerProfilePage() {
  const user = await requireRole("PRODUCER", "ADMIN", "SUPER_ADMIN");
  const producer = await getProducerByUserId(user.id);
  if (!producer) return null;

  const countries = await prisma.country.findMany({ where: { isActive: true }, orderBy: { position: "asc" } });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Ma fiche publique"
        description={`Visible par tous les visiteurs sur /producteurs/${producer.slug}. C'est votre vitrine : racontez qui vous êtes.`}
        actions={
          <Badge tone={producer.status === "APPROVED" ? "success" : "warning"}>
            {PRODUCER_STATUS_LABELS[producer.status as ProducerStatus]}
          </Badge>
        }
      />

      <form action={updateProducerProfileFormAction} className="space-y-5 rounded-2xl border border-earth-200 bg-white p-5 sm:p-6">
        <Field label="Nom de la structure" htmlFor="name" required>
          <Input id="name" name="name" required defaultValue={producer.name} />
        </Field>
        <Field label="Présentation" htmlFor="description" required hint="Visible sur la fiche producteur.">
          <Textarea id="description" name="description" required defaultValue={producer.description} className="min-h-24" />
        </Field>
        <Field label="Notre histoire" htmlFor="story" hint="Parcours, savoir-faire, dates clés…">
          <Textarea id="story" name="story" defaultValue={producer.story ?? ""} className="min-h-32" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Pays" htmlFor="countryId" required>
            <select id="countryId" name="countryId" defaultValue={producer.countryId} className="field">
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Région" htmlFor="region" required>
            <Input id="region" name="region" required defaultValue={producer.region} />
          </Field>
          <Field label="Ville" htmlFor="city" required>
            <Input id="city" name="city" required defaultValue={producer.city} />
          </Field>
        </div>

        <Field label="Spécialités (virgules)" htmlFor="specialties">
          <Input id="specialties" name="specialties" defaultValue={producer.specialties} placeholder="cacao, karité, vannerie" />
        </Field>
        <Field label="Certifications & labels" htmlFor="certifications">
          <Input id="certifications" name="certifications" defaultValue={producer.certifications} placeholder="Rainforest Alliance…" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <ImagePreviewField
            id="logoUrl"
            name="logoUrl"
            label="Logo ou portrait"
            hint="Image carrée de préférence."
            defaultValue={producer.logoUrl ?? ""}
            shape="square"
          />
          <ImagePreviewField
            id="coverUrl"
            name="coverUrl"
            label="Bandeau de la page producteur"
            hint="Photo en paysage : plantation, atelier, coopérative."
            defaultValue={producer.coverUrl ?? ""}
            shape="wide"
          />
        </div>

        <Button type="submit">Enregistrer la fiche</Button>
      </form>

      {producer.status === "PENDING" ? (
        <Alert tone="info" className="mt-4">
          Votre fiche est en attente de validation par l&apos;équipe AFRIKA MARKET. Vous pouvez la modifier librement
          en attendant.
        </Alert>
      ) : null}
    </div>
  );
}
