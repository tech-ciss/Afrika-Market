import type { Metadata } from "next";
import { LoginForm } from "@/components/features/login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return <LoginForm callbackUrl={sp.callbackUrl ?? "/compte/commandes"} />;
}
