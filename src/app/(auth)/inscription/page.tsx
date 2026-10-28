import type { Metadata } from "next";
import { RegisterForm } from "@/components/features/register-form";

export const metadata: Metadata = { title: "Inscription" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const sp = await searchParams;
  return <RegisterForm intent={sp.intent === "producteur" ? "producteur" : "client"} />;
}
