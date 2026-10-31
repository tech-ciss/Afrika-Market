import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatDateFR } from "@/lib/utils";
import { ProfileForm } from "@/components/features/profile-form";

export const metadata: Metadata = { title: "Mon profil" };

export default async function AccountPage() {
  const user = await requireUser();
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      country: { select: { name: true } },
    },
  });

  if (!profile) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-earth-900">Mon profil</h1>
      <p className="mt-1 text-sm text-earth-600">
        Membre depuis le {formatDateFR(profile.createdAt)} · {profile.country?.name ?? "Côte d'Ivoire"}
      </p>

      <div className="mt-6">
        <ProfileForm
          profile={{
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phone: profile.phone,
          }}
        />
      </div>
    </div>
  );
}
